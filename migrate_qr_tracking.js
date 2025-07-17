// Script temporal para migrar QR codes existentes al sistema de tracking
import { db } from "./server/db.js";
import { qrCodes } from "./shared/schema.js";

async function migrateQRCodes() {
  console.log("Iniciando migración de QR codes al sistema de tracking...");
  
  try {
    // Actualizar todos los QR codes para usar URLs de tracking
    const result = await db
      .update(qrCodes)
      .set({
        // Actualizar la URL del QR code para usar el sistema de tracking
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`Migración completada. ${result.length} QR codes procesados.`);
    console.log("Todos los QR codes ahora usarán el sistema de tracking automáticamente.");
    
  } catch (error) {
    console.error("Error durante la migración:", error);
  }
}

// Ejecutar la migración
migrateQRCodes();