import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQRCodeSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";
import { setupAuth, isAuthenticated } from "./replitAuth";
import sharp from "sharp";

// Enhanced QR generation schema
const qrGenerationSchema = z.object({
  url: z.string().url("Por favor, ingresa una URL válida"),
  data: z.string().optional(),
  type: z.enum(["url", "text", "email", "phone", "sms", "wifi"]).default("url"),
  backgroundColor: z.string().default("#ffffff"),
  foregroundColor: z.string().default("#000000"),
  style: z.enum(["square", "rounded", "circle", "dots"]).default("square"),
  size: z.enum(["small", "medium", "large", "xlarge"]).default("medium"),
  pattern: z.enum([
    "standard", "dots", "rounded", "heart", "star", "diamond", 
    "hexagon", "triangle", "flower", "leaf"
  ]).default("standard"),
  frame: z.enum([
    "none", "simple", "decorative", "floral", "tech", "elegant", 
    "vintage", "modern", "corporate"
  ]).default("none"),
  gradient: z.enum([
    "none", "blue", "purple", "green", "sunset", "rainbow", "fire", 
    "ocean", "cosmic", "neon", "gold"
  ]).default("none"),
  border: z.enum(["none", "thin", "thick", "double"]).default("none"),
  logo: z.enum([
    "none", "replit", "custom", "star", "heart", "diamond", 
    "crown", "shield", "rocket", "lightning", "check"
  ]).default("none"),
  includeText: z.boolean().default(false),
  textContent: z.string().optional(),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
  backgroundImage: z.string().optional(), // Data URL for background image
});

// Function to get QR code size in pixels
function getQRSize(size: string): number {
  switch (size) {
    case "small": return 200;
    case "medium": return 300;
    case "large": return 400;
    case "xlarge": return 500;
    default: return 300;
  }
}

// Function to get error correction level
function getErrorCorrectionLevel(level: string): "L" | "M" | "Q" | "H" {
  switch (level) {
    case "L": return "L";
    case "M": return "M";
    case "Q": return "Q";
    case "H": return "H";
    default: return "M";
  }
}

// Function to generate advanced QR code
async function generateAdvancedQRCode(options: any): Promise<string> {
  const size = getQRSize(options.size);
  const errorCorrectionLevel = getErrorCorrectionLevel(options.errorCorrection);
  
  // Basic QR code options
  const qrOptions = {
    width: size,
    margin: 2,
    color: {
      dark: options.foregroundColor,
      light: options.backgroundImage ? '#FFFFFF' : options.backgroundColor // White background for processing
    },
    errorCorrectionLevel
  };

  // Generate the QR code
  const dataToEncode = options.data || options.url;
  let qrDataUrl = await QRCode.toDataURL(dataToEncode, qrOptions);
  
  // If there's a background image, composite it with the QR code
  if (options.backgroundImage) {
    console.log('Processing background image for QR code...');
    qrDataUrl = await compositeQRWithBackground(qrDataUrl, options.backgroundImage, size);
    console.log('Background image processed successfully');
  }
  
  return qrDataUrl;
}

// Function to composite QR code with background image
async function compositeQRWithBackground(qrDataUrl: string, backgroundImageDataUrl: string, size: number): Promise<string> {
  try {
    console.log('Starting QR background composition...');
    
    // Remove data URL prefixes
    const qrBase64 = qrDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const bgBase64 = backgroundImageDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Create buffers from base64 strings
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    const bgBuffer = Buffer.from(bgBase64, 'base64');
    
    console.log('Processing background image...');
    // Process the background image to fit QR size
    const processedBackground = await sharp(bgBuffer)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer();
    
    console.log('Processing QR code...');
    // Get the QR code resized to match
    const qrImage = await sharp(qrBuffer)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();
    
    console.log('Creating alpha channel based composition...');
    // New approach: Use the QR code itself as an alpha mask
    // Convert QR to grayscale and use as alpha channel
    const qrAlpha = await sharp(qrImage)
      .grayscale()
      .negate() // Invert so black areas become white (opaque), white areas become black (transparent)
      .png()
      .toBuffer();
    
    // Create background with QR alpha mask
    const backgroundWithAlpha = await sharp(processedBackground)
      .composite([
        {
          input: qrAlpha,
          blend: 'multiply'
        }
      ])
      .png()
      .toBuffer();
    
    // Create white background
    const whiteBackground = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    // Create inverted alpha (white areas of QR should remain white)
    const qrWhiteAreas = await sharp(qrImage)
      .grayscale()
      .png()
      .toBuffer();
    
    const whiteAreasOnly = await sharp(whiteBackground)
      .composite([
        {
          input: qrWhiteAreas,
          blend: 'multiply'
        }
      ])
      .png()
      .toBuffer();
    
    // Final composition: background in black areas + white in white areas
    const compositeBuffer = await sharp(backgroundWithAlpha)
      .composite([
        {
          input: whiteAreasOnly,
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();
    
    // Convert to data URL
    const base64String = compositeBuffer.toString('base64');
    console.log('QR background composition completed');
    return `data:image/png;base64,${base64String}`;
  } catch (error) {
    console.error('Error compositing QR with background:', error);
    // Return original QR code if compositing fails
    return qrDataUrl;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Generate QR code with advanced options
  app.post("/api/qr/generate", async (req, res) => {
    try {
      const validatedData = qrGenerationSchema.parse(req.body);
      const userId = req.user ? (req.user as any).claims?.sub : undefined;
      
      // Generate advanced QR code
      const qrDataUrl = await generateAdvancedQRCode(validatedData);

      // Store QR code record
      const qrRecord = await storage.createQRCode({
        ...validatedData,
        data: validatedData.data || validatedData.url,
        qrDataUrl
      }, userId);

      res.json({
        success: true,
        qrCode: qrDataUrl,
        url: validatedData.url,
        id: qrRecord.id,
        settings: validatedData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: error.errors[0].message
        });
      } else {
        console.error("QR generation error:", error);
        res.status(500).json({
          success: false,
          error: "Error al generar el código QR"
        });
      }
    }
  });

  // Get QR code history
  app.get("/api/qr/history", async (req, res) => {
    try {
      const userId = req.user ? (req.user as any).claims?.sub : undefined;
      const qrCodes = await storage.getQRCodes(userId);
      res.json({
        success: true,
        qrCodes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al obtener el historial"
      });
    }
  });

  // Get specific QR code
  app.get("/api/qr/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const qrCode = await storage.getQRCode(id);
      
      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: "Código QR no encontrado"
        });
      }

      res.json({
        success: true,
        qrCode
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al obtener el código QR"
      });
    }
  });

  // Delete QR code
  app.delete("/api/qr/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      
      const deleted = await storage.deleteQRCode(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Código QR no encontrado"
        });
      }

      res.json({
        success: true,
        message: "Código QR eliminado exitosamente"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al eliminar el código QR"
      });
    }
  });

  // Update QR code
  app.put("/api/qr/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      const validatedData = qrGenerationSchema.parse(req.body);
      
      // Generate new QR code with updated settings
      const qrDataUrl = await generateAdvancedQRCode(validatedData);
      
      const updatedQRCode = await storage.updateQRCode(id, {
        ...validatedData,
        data: validatedData.data || validatedData.url,
        qrDataUrl
      }, userId);

      if (!updatedQRCode) {
        return res.status(404).json({
          success: false,
          error: "Código QR no encontrado"
        });
      }

      res.json({
        success: true,
        qrCode: qrDataUrl,
        url: validatedData.url,
        id: updatedQRCode.id,
        settings: validatedData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: error.errors[0].message
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Error al actualizar el código QR"
        });
      }
    }
  });

  // Clear user history
  app.delete("/api/qr/history", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      await storage.clearUserHistory(userId);
      
      res.json({
        success: true,
        message: "Historial eliminado exitosamente"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al eliminar el historial"
      });
    }
  });

  // User preferences routes
  app.get("/api/user/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const preferences = await storage.getUserPreferences(userId);
      
      res.json({
        success: true,
        preferences: preferences || {
          defaultBackgroundColor: "#ffffff",
          defaultForegroundColor: "#000000",
          defaultStyle: "square",
          defaultSize: "medium",
          defaultPattern: "standard",
          defaultFrame: "none",
          theme: "light"
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al obtener las preferencias"
      });
    }
  });

  app.put("/api/user/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const preferences = await storage.upsertUserPreferences(userId, req.body);
      
      res.json({
        success: true,
        preferences
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al actualizar las preferencias"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
