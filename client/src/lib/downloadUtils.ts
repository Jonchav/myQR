import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, ImageRun } from 'docx';

// Helper function to convert data URL to blob
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Helper function to convert data URL to array buffer
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const arr = dataUrl.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return u8arr.buffer;
}

// Download functions
export const downloadQR = {
  // PNG download
  png: async (qrDataUrl: string, filename: string = 'qr-code') => {
    try {
      const blob = dataUrlToBlob(qrDataUrl);
      saveAs(blob, `${filename}.png`);
    } catch (error) {
      console.error('Error downloading PNG:', error);
      throw error;
    }
  },

  // JPG download
  jpg: async (qrDataUrl: string, filename: string = 'qr-code') => {
    try {
      // Convert PNG to JPG by drawing on canvas
      const img = new Image();
      img.src = qrDataUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${filename}.jpg`);
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error downloading JPG:', error);
      throw error;
    }
  },

  // SVG download
  svg: async (qrDataUrl: string, filename: string = 'qr-code') => {
    try {
      // Convert PNG data URL to SVG format
      const img = new Image();
      img.src = qrDataUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Create SVG content
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
          <image href="${qrDataUrl}" width="${img.width}" height="${img.height}" />
        </svg>
      `;
      
      // Create blob and download
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      saveAs(blob, `${filename}.svg`);
    } catch (error) {
      console.error('Error downloading SVG:', error);
      throw error;
    }
  },

  // PDF download (Standard)
  pdfStandard: async (qrDataUrl: string, filename: string = 'qr-code') => {
    try {
      const pdf = new jsPDF();
      const img = new Image();
      img.src = qrDataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Calculate dimensions maintaining aspect ratio
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = pageWidth * 0.7; // Use 70% of page width
      const maxHeight = pageHeight * 0.7; // Use 70% of page height
      
      // Get original image dimensions
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;
      const aspectRatio = originalWidth / originalHeight;
      
      // Calculate final dimensions maintaining aspect ratio
      let finalWidth, finalHeight;
      
      if (aspectRatio > 1) {
        // Landscape or square image
        finalWidth = Math.min(maxWidth, maxHeight * aspectRatio);
        finalHeight = finalWidth / aspectRatio;
      } else {
        // Portrait image
        finalHeight = Math.min(maxHeight, maxWidth / aspectRatio);
        finalWidth = finalHeight * aspectRatio;
      }
      
      // Center the image
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;
      
      console.log(`PDF: Original ${originalWidth}x${originalHeight}, Final ${Math.round(finalWidth)}x${Math.round(finalHeight)}`);
      
      pdf.addImage(qrDataUrl, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },

  // PDF download (Print ready)
  pdfPrint: async (qrDataUrl: string, filename: string = 'qr-code') => {
    try {
      const pdf = new jsPDF();
      const img = new Image();
      img.src = qrDataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('Código QR', 105, 30, { align: 'center' });
      
      // Calculate QR dimensions maintaining aspect ratio
      const pageWidth = pdf.internal.pageSize.getWidth();
      const maxWidth = pageWidth * 0.6; // Use 60% of page width for print
      const maxHeight = 120; // Max height to leave space for text
      
      // Get original image dimensions
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;
      const aspectRatio = originalWidth / originalHeight;
      
      // Calculate final dimensions maintaining aspect ratio
      let finalWidth, finalHeight;
      
      if (aspectRatio > 1) {
        // Landscape or square image
        finalWidth = Math.min(maxWidth, maxHeight * aspectRatio);
        finalHeight = finalWidth / aspectRatio;
      } else {
        // Portrait image
        finalHeight = Math.min(maxHeight, maxWidth / aspectRatio);
        finalWidth = finalHeight * aspectRatio;
      }
      
      // Center the QR code
      const x = (pageWidth - finalWidth) / 2;
      const y = 50;
      
      console.log(`PDF Print: Original ${originalWidth}x${originalHeight}, Final ${Math.round(finalWidth)}x${Math.round(finalHeight)}`);
      
      pdf.addImage(qrDataUrl, 'PNG', x, y, finalWidth, finalHeight);
      
      // Add instructions below the QR code
      pdf.setFontSize(12);
      const textY = y + finalHeight + 20;
      pdf.text('Escanea este código QR con tu dispositivo móvil', 105, textY, { align: 'center' });
      pdf.text('para acceder al contenido.', 105, textY + 10, { align: 'center' });
      
      pdf.save(`${filename}-print.pdf`);
    } catch (error) {
      console.error('Error downloading print PDF:', error);
      throw error;
    }
  },

  // DOCX download
  docx: async (qrDataUrl: string, filename: string = 'qr-code') => {
    try {
      const arrayBuffer = dataUrlToArrayBuffer(qrDataUrl);
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Código QR",
              heading: "Heading1",
              alignment: "center",
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: arrayBuffer,
                  transformation: {
                    width: 300,
                    height: 300,
                  },
                }),
              ],
              alignment: "center",
            }),
            new Paragraph({
              text: "Escanea este código QR con tu dispositivo móvil para acceder al contenido.",
              alignment: "center",
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${filename}.docx`);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      throw error;
    }
  },
};

// Main download function
export const downloadQRCode = async (format: string, qrDataUrl: string, filename: string = 'qr-code') => {
  switch (format) {
    case 'png':
      return await downloadQR.png(qrDataUrl, filename);
    case 'jpg':
      return await downloadQR.jpg(qrDataUrl, filename);
    case 'svg':
      return await downloadQR.svg(qrDataUrl, filename);
    case 'pdf-standard':
      return await downloadQR.pdfStandard(qrDataUrl, filename);
    case 'pdf-print':
      return await downloadQR.pdfPrint(qrDataUrl, filename);
    case 'docx':
      return await downloadQR.docx(qrDataUrl, filename);
    default:
      throw new Error(`Formato no soportado: ${format}`);
  }
};