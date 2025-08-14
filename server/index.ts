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
    const qrOptions: any = {
      width: data.size === "large" ? 512 : data.size === "small" ? 256 : 400,
      margin: 4,
      color: {
        dark: data.foregroundColor,
        light: data.backgroundColor,
      },
      errorCorrectionLevel: "M",
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

  // Generate QR code - Simplified for production
  app.post("/api/qr/generate", async (req, res) => {
    try {
      console.log("QR generation request received:", req.body);
      
      const { url } = req.body;
      
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

      // Generate QR code using qrcode library
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });

      console.log("QR code generated successfully");

      res.json({
        success: true,
        qrCode: qrDataUrl,
        url: url
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({
        success: false,
        message: "Error generating QR code"
      });
    }
  });

  // Simple endpoints for demo functionality
  app.get("/api/history", isAuthenticated, async (req: any, res) => {
    try {
      // Return empty array for demo
      res.json([]);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ message: "Error fetching QR codes" });
    }
  });

  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      // Return demo stats
      res.json({
        totalQRCodes: 0,
        totalScans: 0,
        topQRCodes: []
      });
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