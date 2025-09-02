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
import sharp from "sharp";
import { setupGoogleAuth, isAuthenticated } from "./googleAuth";
import geoip from "geoip-lite";

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

// Function to get card dimensions for different social media platforms
function getCardDimensions(template: string): { width: number; height: number } {
  const dimensions: { [key: string]: { width: number; height: number } } = {
    "instagram_post": { width: 1080, height: 1080 }, // Square
    "instagram_story": { width: 1080, height: 1920 }, // Vertical Story
    "facebook_post": { width: 1200, height: 630 }, // Horizontal
    "twitter_post": { width: 1200, height: 675 }, // Horizontal
    "linkedin_post": { width: 1200, height: 627 }, // Horizontal
    "youtube_thumbnail": { width: 1280, height: 720 }, // 16:9
    "tiktok_video": { width: 1080, height: 1920 }, // Vertical
  };
  
  return dimensions[template] || { width: 1080, height: 1080 };
}

// Function to generate creative card with QR code
async function generateCreativeCard(qrDataUrl: string, options: any): Promise<string> {
  try {
    const { cardTemplate, cardStyle, customBackgroundImage } = options;
    
    console.log('generateCreativeCard - cardTemplate:', cardTemplate);
    console.log('generateCreativeCard - cardStyle:', cardStyle);
    
    if (cardTemplate === "none" && cardStyle === "none") {
      return qrDataUrl;
    }
    
    const { width, height } = getCardDimensions(cardTemplate);
    console.log('Card dimensions:', width, 'x', height);
    
    // Generate simple colored background for the card
    let background = '#ffffff'; // Default white background
    
    if (cardStyle === "custom_image" && customBackgroundImage) {
      // Use custom background image
      background = customBackgroundImage;
    } else {
      // Use predefined background colors based on cardStyle
      const backgroundColors: { [key: string]: string } = {
        "modern_gradient": '#667eea',
        "neon_waves": '#ff006e',
        "geometric": '#f093fb',
        "minimalist": '#f8f9fa',
        "elegant": '#2c3e50',
        "vibrant": '#e74c3c'
      };
      background = backgroundColors[cardStyle] || '#ffffff';
    }
    
    // Extract QR code data from base64
    const qrBase64 = qrDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    
    // Calculate QR size optimized for each format type
    let qrSize;
    
    if (height > width * 1.5) {
      // Formato vertical (Stories, TikTok) - QR más grande para aprovechar el ancho
      qrSize = width * 0.55;
    } else if (width > height * 1.5) {
      // Formato horizontal (Facebook, Twitter, LinkedIn, YouTube) - QR proporcionado a la altura
      qrSize = height * 0.60;
    } else {
      // Formato cuadrado (Instagram Post) - QR balanceado
      qrSize = Math.min(width, height) * 0.55;
    }
    
    console.log(`QR size calculated: ${Math.round(qrSize)}px for ${width}x${height} format`);
    
    // Create background
    let backgroundBuffer;
    if (customBackgroundImage && cardStyle === "custom_image") {
      // Process custom background image
      const customImageBase64 = customBackgroundImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const customImageBuffer = Buffer.from(customImageBase64, 'base64');
      
      backgroundBuffer = await sharp(customImageBuffer)
        .resize(width, height, { fit: 'cover' })
        .png()
        .toBuffer();
    } else {
      // Create solid color background
      backgroundBuffer = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: background
        }
      })
      .png()
      .toBuffer();
    }
    
    // Resize QR code
    const resizedQrBuffer = await sharp(qrBuffer)
      .resize(Math.round(qrSize), Math.round(qrSize))
      .png()
      .toBuffer();
    
    // Calculate position to center QR code
    const qrX = Math.round((width - qrSize) / 2);
    const qrY = Math.round((height - qrSize) / 2);
    
    // Composite QR code onto background
    const finalBuffer = await sharp(backgroundBuffer)
      .composite([{
        input: resizedQrBuffer,
        left: qrX,
        top: qrY
      }])
      .png()
      .toBuffer();
    
    // Convert back to data URL
    const finalDataUrl = `data:image/png;base64,${finalBuffer.toString('base64')}`;
    
    console.log('Creative card generated successfully');
    return finalDataUrl;
    
  } catch (error) {
    console.error('Error generating creative card:', error);
    return qrDataUrl; // Return original QR if card generation fails
  }
}

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

// Authentication will be handled by googleAuth.ts

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
    
    const qrOptions = {
      width: qrWidth,
      margin: 1, // Mínimo margen para maximizar celdas QR
      scale: 10, // Factor de escala para celdas más grandes
      color: {
        dark: data.foregroundColor,
        light: data.backgroundColor,
      },
      errorCorrectionLevel: "L" as 'L' | 'M' | 'Q' | 'H', // Menor corrección = menos celdas = celdas más grandes
      type: 'image/png' as const
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

// Setup Google OAuth authentication
setupGoogleAuth(app);

  // Google OAuth routes are configured in googleAuth.ts
  
  // Temporary demo login route while Google OAuth is being configured
  app.get("/api/auth/demo-login", (req: any, res) => {
    req.session.user = {
      id: "demo-user",
      email: "demo@myqr.app",
      firstName: "Demo",
      lastName: "User",
      username: "demo"
    };
    res.redirect("/");
  });

  // Generate QR code with customization support
  app.post("/api/qr/generate", isAuthenticated, async (req: any, res) => {
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
        cardTemplate = "none",
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

      const qrSize = sizeMap[size as keyof typeof sizeMap] || 1600;

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

      // Generate QR code with customization - Celdas balanceadas
      const qrOptions = {
        width: qrSize,
        margin: 1, // Mínimo margen para mejor escaneabilidad
        scale: 8, // Factor de escala más moderado para celdas apropiadas
        color: {
          dark: finalForegroundColor,
          light: finalBackgroundColor === 'transparent' ? '#ffffff00' : finalBackgroundColor
        },
        errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H', // Corrección media para balance
        type: 'image/png' as const
      };

      console.log("Generating QR with options:", qrOptions);

      let qrDataUrl = await QRCode.toDataURL(url, qrOptions);

      // Apply card style or template if specified
      if ((cardStyle && cardStyle !== 'none') || (cardTemplate && cardTemplate !== 'none')) {
        console.log("Applying card style:", cardStyle, "with template:", cardTemplate);
        qrDataUrl = await generateCreativeCard(qrDataUrl, {
          cardStyle,
          cardTemplate,
          customBackgroundImage
        });
        console.log("Card style/template applied successfully");
      }

      console.log("QR code generated successfully");

      // Save QR code to history if user is authenticated
      let savedQRCode = null;
      try {
        // Get user ID from authenticated user
        const userId = req.user?.id || null;
        
        if (userId) {
          console.log("Saving QR code to history for user:", userId);
          
          // Ensure user exists in database first
          try {
            let user = await storage.getUser(userId);
            if (!user) {
              console.log("User not found, creating user in database");
              user = await storage.upsertUser({
                id: userId,
                email: req.user?.email || `user_${userId}@myqr.app`,
                firstName: req.user?.firstName || "Usuario",
                lastName: req.user?.lastName || "",
                profileImageUrl: req.user?.profileImageUrl || null,
                username: req.user?.username || `user_${userId}`
              });
              console.log("User created:", user.id);
            }
          } catch (userError) {
            console.error("Error ensuring user exists:", userError);
          }
          
          // Create QR code record
          let title;
          try {
            title = new URL(url).hostname;
          } catch {
            title = url.substring(0, 50);
          }
          
          try {
            // First create the QR code record to get the ID
            savedQRCode = await storage.createQRCode({
              url,
              title,
              userId,
              backgroundColor: finalBackgroundColor,
              foregroundColor: finalForegroundColor,
              size,
              errorCorrection,
              margin,
              style,
              pattern,
              creativeStyle,
              cardStyle,
              data: qrDataUrl,
              qrDataUrl: qrDataUrl,
              scanCount: 0,
              type: 'url'
            }, userId);
            
            console.log("QR code saved to database with ID:", savedQRCode.id);
            
            // Now regenerate the QR code with tracking URL
            const trackingUrl = `${req.protocol}://${req.get('host')}/api/scan/${savedQRCode.id}`;
            console.log("Regenerating QR with tracking URL:", trackingUrl);
            
            // Generate new QR code with tracking URL - Same balanced cell settings
            const trackingQROptions = {
              width: qrSize,
              margin: 1, // Mínimo margen para mejor escaneabilidad
              scale: 8, // Factor de escala más moderado para celdas apropiadas
              color: {
                dark: finalForegroundColor,
                light: finalBackgroundColor,
              },
              errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H', // Corrección media para balance
              type: 'image/png' as const
            };
            
            let finalQRDataUrl = await QRCode.toDataURL(trackingUrl, trackingQROptions);
            
            // Apply creative card style or template if specified
            if ((cardStyle && cardStyle !== 'none') || (cardTemplate && cardTemplate !== 'none')) {
              finalQRDataUrl = await generateCreativeCard(finalQRDataUrl, {
                cardStyle,
                cardTemplate,
                customBackgroundImage
              });
            }
            
            // Update the QR code record with the tracking QR
            await storage.updateQRCode(savedQRCode.id, {
              data: finalQRDataUrl,
              qrDataUrl: finalQRDataUrl
            });
            
            // Use the tracking QR as the response
            qrDataUrl = finalQRDataUrl;
          } catch (dbError) {
            console.error("Error saving QR code to database:", dbError);
          }
        } else {
          console.log("No authenticated user, QR code not saved to history");
        }
      } catch (saveError) {
        console.error("Error saving QR code to history:", saveError);
        // Continue without failing the request
      }

      res.json({
        success: true,
        qrCode: qrDataUrl,
        qrCodeId: savedQRCode?.id || null,
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

      const qrSize = sizeMap[size as keyof typeof sizeMap] || 1600;

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
        margin: 1, // Mínimo margen para maximizar celdas
        scale: 10, // Factor de escala para celdas más grandes  
        color: {
          dark: finalForegroundColor,
          light: finalBackgroundColor === 'transparent' ? '#ffffff00' : finalBackgroundColor
        },
        errorCorrectionLevel: 'L' as 'L' | 'M' | 'Q' | 'H', // Menor corrección = celdas más grandes
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

  // Delete QR Code endpoint
  app.delete("/api/qr/:id", isAuthenticated, async (req: any, res) => {
    try {
      const qrId = parseInt(req.params.id);
      const userId = req.user?.id || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      if (!qrId || isNaN(qrId)) {
        return res.status(400).json({ message: "ID de QR inválido" });
      }
      
      console.log(`Attempting to delete QR ${qrId} for user ${userId}`);
      
      const deleted = await storage.deleteQRCode(qrId, userId);
      
      if (deleted) {
        console.log(`QR ${qrId} deleted successfully`);
        res.json({
          success: true,
          message: "Código QR eliminado correctamente"
        });
      } else {
        console.log(`QR ${qrId} not found or user unauthorized`);
        res.status(404).json({ 
          success: false,
          message: "Código QR no encontrado o sin permisos" 
        });
      }
    } catch (error) {
      console.error("Error deleting QR code:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al eliminar el código QR" 
      });
    }
  });

  // Update QR Code endpoint
  app.patch("/api/qr/:id", isAuthenticated, async (req: any, res) => {
    try {
      const qrId = parseInt(req.params.id);
      const userId = req.user?.id || req.user?.claims?.sub;
      const { title } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      if (!qrId || isNaN(qrId)) {
        return res.status(400).json({ message: "ID de QR inválido" });
      }
      
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: "Título requerido" });
      }
      
      console.log(`Attempting to update QR ${qrId} title to "${title}" for user ${userId}`);
      
      const updatedQR = await storage.updateQRCode(qrId, { title: title.trim() }, userId);
      
      if (updatedQR) {
        console.log(`QR ${qrId} updated successfully`);
        res.json({
          success: true,
          message: "Código QR actualizado correctamente",
          qrCode: updatedQR
        });
      } else {
        console.log(`QR ${qrId} not found or user unauthorized`);
        res.status(404).json({ 
          success: false,
          message: "Código QR no encontrado o sin permisos" 
        });
      }
    } catch (error) {
      console.error("Error updating QR code:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al actualizar el código QR" 
      });
    }
  });

  // QR History endpoint - Works with authentication
  app.get("/api/qr/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub || 'demo-user-1754877958618';
      console.log("QR History request for user:", userId);
      
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      try {
        // Get real QR codes from database
        const realQRCodes = await storage.getQRCodes(userId, limit, offset);
        
        if (realQRCodes && realQRCodes.length > 0) {
          console.log(`Returning ${realQRCodes.length} real QR codes from database for user ${userId}`);
          res.json({
            success: true,
            qrCodes: realQRCodes,
            pagination: {
              limit,
              offset,
              hasMore: realQRCodes.length === limit,
              totalCount: realQRCodes.length + offset,
              maxLimit: 100
            }
          });
          return;
        } else {
          console.log("No QR codes found in database for user:", userId);
        }
      } catch (dbError) {
        console.error("Database error getting QR codes:", dbError);
      }
      
      // No QR codes found - return empty array
      console.log("No QR codes found, returning empty array");
      res.json({
        success: true,
        qrCodes: [],
        pagination: {
          limit,
          offset,
          hasMore: false,
          totalCount: 0,
          maxLimit: 100
        }
      });
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ 
        success: false,
        message: "Error fetching QR codes" 
      });
    }
  });

  // Dashboard stats endpoint - Works with authentication
  app.get("/api/stats/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || null;
      console.log("Dashboard stats request for user:", userId);
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }

      // Get real QR codes from database
      try {
        const allQRCodes = await storage.getQRCodes(userId, 1000, 0); // Get all QR codes for stats
        
        // Calculate real stats
        const totalScans = allQRCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0);
        const totalQRCodes = allQRCodes.length;
        const avgScansPerQR = totalQRCodes > 0 ? Math.round(totalScans / totalQRCodes) : 0;

        // Get top QR codes (sorted by scans)
        const topQRCodes = allQRCodes
          .sort((a, b) => (b.scanCount || 0) - (a.scanCount || 0))
          .slice(0, 10)
          .map(qr => ({
            title: qr.title || qr.url,
            scans: qr.scanCount || 0,
            url: qr.url
          }));

        const stats = {
          totalStats: {
            totalQRCodes,
            totalScans,
            avgScansPerQR
          },
          topQRCodes
        };

        console.log("Returning real dashboard stats for user", userId);
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error("Error getting dashboard stats:", error);
        
        // Return empty stats if database error
        const stats = {
          totalStats: {
            totalQRCodes: 0,
            totalScans: 0,
            avgScansPerQR: 0
          },
          topQRCodes: []
        };

        console.log("Returning empty stats due to database error");
        res.json({
          success: true,
          data: stats
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ 
        success: false,
        error: "Error al obtener estadísticas del dashboard" 
      });
    }
  });

  // QR Code scan tracking endpoint
  app.get("/api/scan/:id", async (req: any, res) => {
    try {
      const qrId = req.params.id;
      console.log("Scan attempt for QR ID:", qrId);
      
      // Get QR code from database
      const qrCode = await storage.getQRCodeById(qrId);
      
      if (!qrCode) {
        console.log("QR code not found:", qrId);
        return res.status(404).json({ message: "QR code not found" });
      }
      
      // Record the scan with detailed tracking
      try {
        const userAgent = req.get('User-Agent') || '';
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const country = 'Unknown'; // Can be enhanced with geoip-lite if needed
        
        await storage.recordQRScan(parseInt(qrId), userAgent, ipAddress, country);
        console.log(`Scan recorded for QR ${qrId} - IP: ${ipAddress}, UA: ${userAgent.substring(0, 50)}`);
      } catch (error) {
        console.error("Error recording scan:", error);
      }
      
      // Redirect to original URL
      console.log("Redirecting to:", qrCode.url);
      res.redirect(302, qrCode.url);
      
    } catch (error) {
      console.error("Error processing scan:", error);
      res.status(500).json({ message: "Error processing scan" });
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