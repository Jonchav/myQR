import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQRCodeSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";

const urlValidationSchema = z.object({
  url: z.string().url("Por favor, ingresa una URL válida")
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate QR code
  app.post("/api/qr/generate", async (req, res) => {
    try {
      const { url } = urlValidationSchema.parse(req.body);
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        height: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Store QR code record
      const qrRecord = await storage.createQRCode({ url });

      res.json({
        success: true,
        qrCode: qrDataUrl,
        url: url,
        id: qrRecord.id
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
          error: "Error al generar el código QR"
        });
      }
    }
  });

  // Get QR code history
  app.get("/api/qr/history", async (req, res) => {
    try {
      const qrCodes = await storage.getQRCodes();
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

  const httpServer = createServer(app);
  return httpServer;
}
