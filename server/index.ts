import dotenv from "dotenv";
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPg from "connect-pg-simple";
import QRCode from "qrcode";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Session setup
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// Simple authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  try {
    const user = req.session?.user;
    console.log("Auth check for user:", user?.id || "none");
    
    if (!user) {
      console.log("No user in session, returning 401");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = user;
    console.log("User authenticated:", user.id);
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// QR generation schema
const qrGenerationSchema = z.object({
  url: z.string().url("Por favor, ingresa una URL válida"),
  title: z.string().optional(),
  backgroundColor: z.string().default("#ffffff"),
  foregroundColor: z.string().default("#000000"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
});

// QR code generation function
async function generateQRCode(data: any) {
  try {
    // Tamaños ultra-altos para QR más visibles
    let qrWidth = 1600; // medium por defecto
    if (data.size === "small") qrWidth = 1200;
    else if (data.size === "large") qrWidth = 2000; 
    else if (data.size === "xlarge") qrWidth = 2400;
    
    const qrOptions: any = {
      width: qrWidth,
      margin: 2, // Reducido para más espacio al QR
      color: {
        dark: data.foregroundColor,
        light: data.backgroundColor,
      },
      errorCorrectionLevel: "M",
      type: 'image/png'
    };

    const qrDataUrl = await QRCode.toDataURL(data.url, qrOptions);
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

(async () => {
  // Setup session
  app.set("trust proxy", 1);
  app.use(getSession());

  // Auth routes
  app.get("/api/login", async (req: any, res) => {
    try {
      console.log("Login attempt started");
      
      // Use a fixed demo user to avoid unique constraint issues
      const demoUser = {
        id: "demo-user",
        email: "demo@myqr.app",
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null,
      };
      
      console.log("Setting up demo user session");
      
      // Skip database operations for demo user - use session-only approach
      console.log("Using session-only authentication for demo user");
      let savedUser = demoUser;

      // Set session
      req.session.user = savedUser;
      console.log("Session set for user:", savedUser.id);
      
      res.redirect("/");
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Login failed",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/logout", (req: any, res) => {
    try {
      console.log("Logout attempt for user:", req.session?.user?.id);
      req.session.user = null;
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        console.log("Session destroyed successfully");
        res.redirect("/");
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  // Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      console.log("Returning user from session:", user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Generate QR code with customization support
  app.post("/api/qr/generate", async (req, res) => {
    try {
      console.log("QR generation request received:", req.body);
      
      const { 
        url, 
        backgroundColor = "#ffffff", 
        foregroundColor = "#000000",
        size = "medium",
        errorCorrection = "M",
        margin = 2,
        style = "square",
        pattern = "standard",
        creativeStyle = "classic",
        cardStyle = "none",
        customBackgroundImage = null
      } = req.body;
      
      // Validate URL
      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          success: false,
          message: "URL is required"
        });
      }

      // Simple URL validation
      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid URL"
        });
      }

      // Map size to pixels - Ultra-high resolution for better visibility
      const sizeMap = {
        small: 1200,
        medium: 1600,
        large: 2000,
        xlarge: 2400
      };

      const qrSize = sizeMap[size as keyof typeof sizeMap] || 1024;

      // Apply creative styles to colors if specified
      let finalForegroundColor = foregroundColor || '#000000';
      let finalBackgroundColor = backgroundColor || '#ffffff';

      // Creative style color transformations - Extended styles
      if (creativeStyle && creativeStyle !== 'classic') {
        const styleColors = {
          // Original styles
          'vibrant_rainbow': '#FF0080',
          'neon_cyber': '#00FFFF', 
          'electric_blue': '#0066FF',
          'sunset_fire': '#FF4500',
          'forest_nature': '#228B22',
          'ocean_waves': '#4169E1',
          'multicolor_blocks': '#6A1B9A',
          'purple_galaxy': '#8A2BE2',
          'golden_sunset': '#DAA520',
          'mint_fresh': '#00C572',
          'coral_reef': '#FF5722',
          'volcano_red': '#B71C1C',
          'autumn_leaves': '#8B4513',
          'monochrome_red': '#B71C1C',
          'pastel_dream': '#FF8A95',
          // New extended styles
          'cosmic_purple': '#4A148C',
          'laser_green': '#2E7D32',
          'neon_pink': '#C2185B',
          'electric_yellow': '#F57F17',
          'deep_ocean': '#006064',
          'royal_blue': '#1A237E',
          'emerald_shine': '#00695C',
          'crimson_wave': '#B71C1C',
          'cyber_orange': '#E65100',
          'mystic_violet': '#6A1B9A',
          'arctic_blue': '#0277BD',
          'jade_matrix': '#2E7D32',
          'ruby_fire': '#C62828',
          'sapphire_glow': '#1565C0',
          'bronze_metal': '#8D6E63',
          'silver_chrome': '#546E7A',
          'magenta_burst': '#AD1457',
          'teal_storm': '#00796B',
          'amber_lightning': '#FF8F00',
          'indigo_depth': '#303F9F',
          'lime_electric': '#689F38'
        };
        
        if (styleColors[creativeStyle as keyof typeof styleColors]) {
          finalForegroundColor = styleColors[creativeStyle as keyof typeof styleColors];
        }
      }

      // Generate QR code with customization
      const qrOptions = {
        width: qrSize,
        margin: margin || 2,
        color: {
          dark: finalForegroundColor,
          light: finalBackgroundColor === 'transparent' ? '#ffffff00' : finalBackgroundColor
        },
        errorCorrectionLevel: errorCorrection as 'L' | 'M' | 'Q' | 'H',
        type: 'image/png' as const
      };

      console.log("Generating QR with options:", qrOptions);

      const qrDataUrl = await QRCode.toDataURL(url, qrOptions);

      console.log("QR code generated successfully");

      res.json({
        success: true,
        qrCode: qrDataUrl,
        url: url,
        settings: {
          backgroundColor: finalBackgroundColor,
          foregroundColor: finalForegroundColor,
          size,
          errorCorrection,
          margin,
          style,
          pattern,
          creativeStyle,
          cardStyle
        }
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({
        success: false,
        message: "Error generating QR code"
      });
    }
  });

  // Image upload endpoint for custom backgrounds
  app.post("/api/upload/image", async (req, res) => {
    try {
      console.log("Image upload request received");
      
      const { imageData, filename } = req.body;
      
      if (!imageData) {
        return res.status(400).json({
          success: false,
          message: "No image data provided"
        });
      }

      // Validate base64 image data
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          message: "Invalid image format"
        });
      }

      // Check file size (estimate from base64 - approximately 15MB limit)
      const sizeInBytes = (imageData.length * 3) / 4;
      const maxSizeInBytes = 15 * 1024 * 1024; // 15MB
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(400).json({
          success: false,
          message: "Image file too large. Maximum size is 15MB."
        });
      }

      console.log("Image validation passed, size:", Math.round(sizeInBytes / 1024), "KB");

      // For demo purposes, we'll just return the data back
      // In a real implementation, you might want to store it somewhere
      res.json({
        success: true,
        imageUrl: imageData,
        filename: filename || 'uploaded-image',
        size: Math.round(sizeInBytes / 1024)
      });
    } catch (error) {
      console.error("Error processing image upload:", error);
      res.status(500).json({
        success: false,
        message: "Error processing image upload"
      });
    }
  });

  // Preview endpoint for real-time QR updates
  app.post("/api/qr/preview", async (req, res) => {
    try {
      // Use the same logic as generate but don't save to database
      const { 
        url = "https://example.com", 
        backgroundColor = "#ffffff", 
        foregroundColor = "#000000",
        size = "medium",
        errorCorrection = "M",
        margin = 2,
        creativeStyle = "classic"
      } = req.body;

      const sizeMap = {
        small: 1200,
        medium: 1600,
        large: 2000,
        xlarge: 2400
      };

      const qrSize = sizeMap[size as keyof typeof sizeMap] || 1024;

      // Apply creative styles
      let finalForegroundColor = foregroundColor || '#000000';
      let finalBackgroundColor = backgroundColor || '#ffffff';

      if (creativeStyle && creativeStyle !== 'classic') {
        const styleColors = {
          'vibrant_rainbow': '#FF0080',
          'neon_cyber': '#00FFFF', 
          'electric_blue': '#0066FF',
          // Add other styles as needed
        };
        
        if (styleColors[creativeStyle as keyof typeof styleColors]) {
          finalForegroundColor = styleColors[creativeStyle as keyof typeof styleColors];
        }
      }

      const qrOptions = {
        width: qrSize,
        margin: margin || 2,
        color: {
          dark: finalForegroundColor,
          light: finalBackgroundColor === 'transparent' ? '#ffffff00' : finalBackgroundColor
        },
        errorCorrectionLevel: errorCorrection as 'L' | 'M' | 'Q' | 'H',
        type: 'image/png' as const
      };

      const qrDataUrl = await QRCode.toDataURL(url, qrOptions);

      res.json({
        success: true,
        preview: qrDataUrl
      });
    } catch (error) {
      console.error("Error generating preview:", error);
      res.status(500).json({
        success: false,
        message: "Error generating preview"
      });
    }
  });

  // Enhanced endpoints for demo functionality with realistic data
  app.get("/api/history", async (req: any, res) => {
    try {
      const userId = 'demo-user';
      
      // Return demo QR codes with realistic data
      const demoQRCodes = [
        {
          id: 1,
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          scans: 12,
          userId: userId,
          backgroundColor: "#ffffff",
          foregroundColor: "#000000",
          size: "medium",
          creativeStyle: "classic"
        },
        {
          id: 2,
          url: "https://github.com/replit/replit",
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          scans: 8,
          userId: userId,
          backgroundColor: "#000000",
          foregroundColor: "#00FFFF",
          size: "large",
          creativeStyle: "neon_cyber"
        },
        {
          id: 3,
          url: "https://www.google.com",
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          scans: 25,
          userId: userId,
          backgroundColor: "#ffffff",
          foregroundColor: "#FF0080",
          size: "medium",
          creativeStyle: "vibrant_rainbow"
        }
      ];
      
      console.log(`Returning ${demoQRCodes.length} demo QR codes for user ${userId}`);
      res.json(demoQRCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ message: "Error fetching QR codes" });
    }
  });

  app.get("/api/stats", async (req: any, res) => {
    try {
      const userId = 'demo-user';
      
      // Return realistic demo stats
      const demoStats = {
        totalQRCodes: 3,
        totalScans: 45,
        topQRCodes: [
          {
            id: 3,
            url: "https://www.google.com",
            scans: 25,
            createdAt: new Date(Date.now() - 259200000).toISOString()
          },
          {
            id: 1,
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            scans: 12,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 2,
            url: "https://github.com/replit/replit",
            scans: 8,
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ]
      };
      
      console.log(`Returning demo stats for user ${userId}:`, demoStats);
      res.json(demoStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development or serve static in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT from environment or default to 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();