import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth-clean";
import QRCode from "qrcode";
import { z } from "zod";

// Simple QR generation schema
const qrGenerationSchema = z.object({
  url: z.string().url("Por favor, ingresa una URL válida"),
  title: z.string().optional(),
  backgroundColor: z.string().default("#ffffff"),
  foregroundColor: z.string().default("#000000"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
});

// Simple QR code generation
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Generate QR code
  app.post("/api/qr/generate", async (req, res) => {
    try {
      const validatedData = qrGenerationSchema.parse(req.body);
      const userId = (req as any).user ? (req as any).user.id : undefined;
      
      // Store QR code record
      const qrRecord = await storage.createQRCode({
        ...validatedData,
        data: validatedData.url,
        qrDataUrl: '' // Temporary
      }, userId);

      // Create tracking URL
      const trackingUrl = `${req.protocol}://${req.get('host')}/api/scan/${qrRecord.id}`;
      
      // Generate QR code
      const qrDataUrl = await generateQRCode({
        ...validatedData,
        url: trackingUrl
      });

      // Update record with QR code
      await storage.updateQRCode(qrRecord.id, { qrDataUrl });

      res.json({
        success: true,
        qrCode: qrDataUrl,
        url: validatedData.url,
        trackingUrl: trackingUrl,
        id: qrRecord.id
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error generating QR code"
        });
      }
    }
  });

  // Scan tracking endpoint
  app.get("/api/scan/:id", async (req, res) => {
    try {
      const qrCodeId = parseInt(req.params.id);
      const qrCode = await storage.getQRCode(qrCodeId);
      
      if (!qrCode) {
        return res.status(404).send("QR Code not found");
      }

      // Record the scan
      await storage.recordQRScan(qrCodeId, req.get('User-Agent'), req.ip);

      // Redirect to original URL
      res.redirect(qrCode.url);
    } catch (error) {
      console.error("Error processing scan:", error);
      res.status(500).send("Error processing scan");
    }
  });

  // Get QR codes history
  app.get("/api/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const qrCodes = await storage.getQRCodes(userId, limit, offset);
      
      console.log(`📋 QR History - User ${userId}: Found ${qrCodes.length} QR codes`);
      qrCodes.forEach(qr => {
        console.log(`- QR ${qr.id}: ${qr.url} (${qr.scanCount || 0} scans) - Title: ${qr.title || 'No title'}`);
      });
      
      res.json(qrCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ message: "Error fetching QR codes" });
    }
  });

  // Delete QR code
  app.delete("/api/qr/:id", isAuthenticated, async (req: any, res) => {
    try {
      const qrCodeId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const success = await storage.deleteQRCode(qrCodeId, userId);
      
      if (success) {
        res.json({ success: true, message: "QR code deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "QR code not found" });
      }
    } catch (error) {
      console.error("Error deleting QR code:", error);
      res.status(500).json({ success: false, message: "Error deleting QR code" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}