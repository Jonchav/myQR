import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQRCodeSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";
import { setupAuth, isAuthenticated } from "./replitAuth";
import sharp from "sharp";
import * as XLSX from "xlsx";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

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
    // Get the QR code resized to match - ensure proper padding
    const qrImage = await sharp(qrBuffer)
      .resize(size, size, { 
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();
    
    console.log('Creating improved composition...');
    // NEW APPROACH: Use the QR as a stencil to cut out areas from background
    
    // Step 1: Create a grayscale version of QR for thresholding
    const qrGrayscale = await sharp(qrImage)
      .grayscale()
      .png()
      .toBuffer();
    
    // Step 2: Create mask where black QR areas are transparent, white areas are opaque
    const alphaMask = await sharp(qrGrayscale)
      .threshold(128)  // Binary threshold: <128 = black (QR data), >=128 = white (QR background)
      .png()
      .toBuffer();
    
    // Step 3: Apply the mask to the background image
    // This will make the background transparent where QR should be white
    const maskedBackground = await sharp(processedBackground)
      .composite([
        {
          input: alphaMask,
          blend: 'dest-out' // Remove background where mask is white
        }
      ])
      .png()
      .toBuffer();
    
    // Step 4: Create white areas for QR background
    const whiteBase = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    // Step 5: Final composition - white base + masked background
    const compositeBuffer = await sharp(whiteBase)
      .composite([
        {
          input: maskedBackground,
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
      
      // Store QR code record first to get the ID
      const qrRecord = await storage.createQRCode({
        ...validatedData,
        data: validatedData.data || validatedData.url,
        qrDataUrl: '' // Temporary, will be updated after QR generation
      }, userId);

      // Create tracking URL that will redirect to the actual URL
      const trackingUrl = `${req.protocol}://${req.get('host')}/api/scan/${qrRecord.id}`;
      
      // Generate QR code with the tracking URL instead of the original URL
      const qrDataUrl = await generateAdvancedQRCode({
        ...validatedData,
        url: trackingUrl,
        data: trackingUrl
      });

      // Update the QR record with the generated QR code
      await storage.updateQRCode(qrRecord.id, { qrDataUrl });

      res.json({
        success: true,
        qrCode: qrDataUrl,
        url: validatedData.url,
        trackingUrl: trackingUrl,
        id: qrRecord.id,
        settings: validatedData,
        title: qrRecord.title
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

  // Get QR code history (PRO-only)
  app.get("/api/qr/history", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
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

  // Update QR code title
  app.patch("/api/qr/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      const { title } = req.body;
      
      const updatedQR = await storage.updateQRCode(id, { title }, userId);
      
      if (!updatedQR) {
        return res.status(404).json({
          success: false,
          error: "Código QR no encontrado"
        });
      }

      res.json({
        success: true,
        qrCode: updatedQR
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al actualizar el código QR"
      });
    }
  });

  // Get QR code statistics (PRO-only)
  app.get("/api/qr/:id/stats/:range?", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const range = req.params.range || "daily";
      const stats = await storage.getQRScanStats(id);
      
      res.json({
        success: true,
        stats,
        range
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al obtener estadísticas"
      });
    }
  });

  // Get detailed scan records for a QR code (PRO-only)
  app.get("/api/qr/:id/scans", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      
      // Verify QR code belongs to user
      const qrCode = await storage.getQRCode(id);
      if (!qrCode || qrCode.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Código QR no encontrado"
        });
      }
      
      const scans = await storage.getQRScanRecords(id);
      res.json({
        success: true,
        scans
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al obtener los registros de scans"
      });
    }
  });

  // Record QR scan
  app.post("/api/qr/:id/scan", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      
      await storage.recordQRScan(id, userAgent, ipAddress);
      
      res.json({
        success: true,
        message: "Scan registrado exitosamente"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al registrar scan"
      });
    }
  });

  // Public scan redirect endpoint - this is what QR codes should point to
  app.get("/api/scan/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const qrCode = await storage.getQRCode(id);
      
      if (!qrCode) {
        return res.status(404).send("Código QR no encontrado");
      }
      
      // Record the scan
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      await storage.recordQRScan(id, userAgent, ipAddress);
      
      // Redirect to the actual URL
      res.redirect(qrCode.url || qrCode.data);
    } catch (error) {
      console.error("Error processing scan:", error);
      res.status(500).send("Error al procesar el scan");
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

  // Regenerate QR code with tracking
  app.post("/api/qr/:id/regenerate", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      
      // Get existing QR code
      const existingQR = await storage.getQRCode(id);
      
      if (!existingQR || existingQR.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Código QR no encontrado"
        });
      }
      
      // Create new tracking URL
      const trackingUrl = `${req.protocol}://${req.get('host')}/api/scan/${id}`;
      
      // Generate new QR code with tracking URL
      const qrDataUrl = await generateAdvancedQRCode({
        url: trackingUrl,
        data: trackingUrl,
        backgroundColor: existingQR.backgroundColor,
        foregroundColor: existingQR.foregroundColor,
        style: existingQR.style,
        size: existingQR.size,
        pattern: existingQR.pattern,
        frame: existingQR.frame,
        gradient: existingQR.gradient,
        border: existingQR.border,
        logo: existingQR.logo,
        includeText: existingQR.includeText,
        textContent: existingQR.textContent,
        errorCorrection: existingQR.errorCorrection
      });
      
      // Update the QR code record
      const updatedQR = await storage.updateQRCode(id, { qrDataUrl }, userId);
      
      res.json({
        success: true,
        message: "Código QR regenerado con seguimiento automático",
        qrCode: updatedQR
      });
    } catch (error) {
      console.error("Error regenerating QR:", error);
      res.status(500).json({
        success: false,
        error: "Error al regenerar el código QR"
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

  // Export individual QR statistics to Excel
  app.get("/api/qr/:id/export", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      
      const qrCode = await storage.getQRCode(id);
      if (!qrCode || qrCode.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Código QR no encontrado"
        });
      }
      
      const stats = await storage.getQRScanStats(id);
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ["Estadísticas del QR Code", ""],
        ["Título", qrCode.title || "Sin título"],
        ["URL", qrCode.url || qrCode.data],
        ["Tipo", qrCode.type.toUpperCase()],
        ["Fecha de creación", qrCode.createdAt ? new Date(qrCode.createdAt).toLocaleDateString() : "N/A"],
        ["", ""],
        ["Resumen de Escaneos", ""],
        ["Total de escaneos", stats.total],
        ["Escaneos hoy", stats.today],
        ["Escaneos este mes", stats.thisMonth],
        ["Escaneos este año", stats.thisYear],
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen");
      
      // Daily stats sheet
      if (stats.dailyStats && stats.dailyStats.length > 0) {
        const dailyData = [
          ["Fecha", "Escaneos"]
        ];
        
        stats.dailyStats.forEach(day => {
          dailyData.push([day.date, day.count]);
        });
        
        const dailyWs = XLSX.utils.aoa_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(wb, dailyWs, "Estadísticas Diarias");
      }
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      const filename = `qr-${id}-${qrCode.title || 'sin-titulo'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
      
    } catch (error) {
      console.error("Error exporting QR stats:", error);
      res.status(500).json({
        success: false,
        error: "Error al exportar estadísticas"
      });
    }
  });

  // Export all QR statistics to Excel
  app.get("/api/qr/export/all", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const qrCodes = await storage.getQRCodes(userId);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Summary sheet with all QR codes
      const summaryData = [
        ["Resumen General de QR Codes", "", "", "", "", ""],
        ["Título", "URL", "Tipo", "Fecha Creación", "Total Escaneos", "Escaneos Hoy"]
      ];
      
      let totalScans = 0;
      let totalToday = 0;
      
      for (const qr of qrCodes) {
        const stats = await storage.getQRScanStats(qr.id);
        totalScans += stats.total;
        totalToday += stats.today;
        
        summaryData.push([
          qr.title || "Sin título",
          qr.url || qr.data,
          qr.type.toUpperCase(),
          qr.createdAt ? new Date(qr.createdAt).toLocaleDateString() : "N/A",
          stats.total,
          stats.today
        ]);
      }
      
      // Add totals row
      summaryData.push(["", "", "", "", "", ""]);
      summaryData.push(["TOTALES", "", "", "", totalScans, totalToday]);
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen General");
      
      // Individual sheets for each QR code
      for (const qr of qrCodes) {
        const stats = await storage.getQRScanStats(qr.id);
        
        const qrData = [
          [`Estadísticas: ${qr.title || "Sin título"}`, ""],
          ["URL", qr.url || qr.data],
          ["Tipo", qr.type.toUpperCase()],
          ["Fecha creación", qr.createdAt ? new Date(qr.createdAt).toLocaleDateString() : "N/A"],
          ["", ""],
          ["Escaneos", ""],
          ["Total", stats.total],
          ["Hoy", stats.today],
          ["Este mes", stats.thisMonth],
          ["Este año", stats.thisYear],
          ["", ""],
          ["Estadísticas Diarias", ""]
        ];
        
        if (stats.dailyStats && stats.dailyStats.length > 0) {
          qrData.push(["Fecha", "Escaneos"]);
          stats.dailyStats.forEach(day => {
            qrData.push([day.date, day.count]);
          });
        }
        
        const qrWs = XLSX.utils.aoa_to_sheet(qrData);
        const sheetName = `QR${qr.id}-${(qr.title || "Sin título").slice(0, 20)}`;
        XLSX.utils.book_append_sheet(wb, qrWs, sheetName);
      }
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      const filename = `todos-qr-codes-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
      
    } catch (error) {
      console.error("Error exporting all QR stats:", error);
      res.status(500).json({
        success: false,
        error: "Error al exportar todas las estadísticas"
      });
    }
  });

  // Stripe payment endpoints
  
  // Start free trial
  app.post("/api/subscription/trial", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      if (user.trialUsed) {
        return res.status(400).json({ error: "La prueba gratuita ya fue utilizada" });
      }
      
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 3); // 3 days trial
      
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: "trialing",
        subscriptionPlan: "trial",
        subscriptionStartDate: new Date(),
        subscriptionEndDate: trialEndDate,
        trialUsed: true
      });
      
      res.json({
        success: true,
        message: "Prueba gratuita de 3 días activada",
        trialEndDate: trialEndDate.toISOString()
      });
    } catch (error) {
      console.error("Error starting trial:", error);
      res.status(500).json({ error: "Error al iniciar la prueba gratuita" });
    }
  });

  // Create subscription
  app.post("/api/subscription/create", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { plan } = req.body; // 'daily', 'weekly', 'monthly'
      
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ error: "Usuario no encontrado o sin email" });
      }
      
      // Product ID mapping
      const productMap = {
        weekly: "prod_SgbM5d8WfUgLP6", // $3.45
        monthly: "prod_SgbMQxYEXBZ0u5" // $6.45
      };
      
      const productId = productMap[plan as keyof typeof productMap];
      if (!productId) {
        return res.status(400).json({ error: "Plan de suscripción inválido" });
      }
      
      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          metadata: {
            userId: userId
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserSubscription(userId, {
          stripeCustomerId: stripeCustomerId
        });
      }
      
      // Get the default price for the product
      const product = await stripe.products.retrieve(productId);
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 1
      });
      
      if (prices.data.length === 0) {
        return res.status(400).json({ error: "No hay precios disponibles para este producto" });
      }
      
      const priceId = prices.data[0].id;
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: priceId
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update user subscription info
      await storage.updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: "incomplete",
        subscriptionPlan: plan,
        subscriptionStartDate: new Date()
      });
      
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      
      res.json({
        success: true,
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        plan: plan,
        price: prices.data[0].unit_amount ? prices.data[0].unit_amount / 100 : 0
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Error al crear la suscripción" });
    }
  });

  // Get subscription status
  app.get("/api/subscription/status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      const now = new Date();
      const isActive = user.subscriptionStatus === "active" || 
                      (user.subscriptionStatus === "trialing" && 
                       user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now);
      
      res.json({
        success: true,
        isActive,
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        trialUsed: user.trialUsed,
        subscriptionEndDate: user.subscriptionEndDate
      });
    } catch (error) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ error: "Error al obtener el estado de suscripción" });
    }
  });

  // Cancel subscription
  app.post("/api/subscription/cancel", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: "Suscripción no encontrada" });
      }
      
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: "canceled",
        subscriptionEndDate: new Date()
      });
      
      res.json({
        success: true,
        message: "Suscripción cancelada exitosamente"
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Error al cancelar la suscripción" });
    }
  });

  // Webhook endpoint for Stripe
  app.post("/api/webhook/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET || '');
      
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            
            if (customer && !customer.deleted) {
              const userId = customer.metadata?.userId;
              if (userId) {
                await storage.updateUserSubscription(userId, {
                  subscriptionStatus: "active",
                  subscriptionEndDate: new Date(subscription.current_period_end * 1000)
                });
              }
            }
          }
          break;
          
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          if (failedInvoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            
            if (customer && !customer.deleted) {
              const userId = customer.metadata?.userId;
              if (userId) {
                await storage.updateUserSubscription(userId, {
                  subscriptionStatus: "past_due"
                });
              }
            }
          }
          break;
          
        case 'customer.subscription.deleted':
          const deletedSub = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(deletedSub.customer as string);
          
          if (customer && !customer.deleted) {
            const userId = customer.metadata?.userId;
            if (userId) {
              await storage.updateUserSubscription(userId, {
                subscriptionStatus: "canceled",
                subscriptionEndDate: new Date()
              });
            }
          }
          break;
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send('Webhook error');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
