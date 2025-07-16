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
      const response = await fetch(`/api/qr/download/png?qrDataUrl=${encodeURIComponent(qrDataUrl)}&filename=${filename}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      saveAs(blob, `${filename}.png`);
    } catch (error) {
      console.error('Error downloading PNG:', error);
      throw error;
    }
  },

  // JPG download
  jpg: async (qrDataUrl: string, filename: string = 'qr-code') => {
    try {
      const response = await fetch(`/api/qr/download/jpg?qrDataUrl=${encodeURIComponent(qrDataUrl)}&filename=${filename}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      saveAs(blob, `${filename}.jpg`);
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
      
      // Add QR code centered on page
      const imgWidth = 100;
      const imgHeight = 100;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      
      pdf.addImage(qrDataUrl, 'PNG', x, y, imgWidth, imgHeight);
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
      
      // Add QR code
      const imgWidth = 120;
      const imgHeight = 120;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const x = (pageWidth - imgWidth) / 2;
      const y = 50;
      
      pdf.addImage(qrDataUrl, 'PNG', x, y, imgWidth, imgHeight);
      
      // Add instructions
      pdf.setFontSize(12);
      pdf.text('Escanea este código QR con tu dispositivo móvil', 105, 190, { align: 'center' });
      pdf.text('para acceder al contenido.', 105, 200, { align: 'center' });
      
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