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
    "crown", "shield", "rocket", "lightning", "check",
    "instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok",
    "spotify", "netflix", "twitch", "discord", "whatsapp", "telegram"
  ]).default("none"),
  includeText: z.boolean().default(false),
  textContent: z.string().optional(),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
  backgroundImage: z.string().optional(), // Data URL for background image
  cardTemplate: z.enum([
    "none", "instagram_post", "instagram_story", "facebook_post", "facebook_story",
    "twitter_post", "linkedin_post", "youtube_thumbnail", "tiktok_video"
  ]).default("none"),
  cardStyle: z.enum([
    "modern_gradient", "neon_waves", "geometric", "organic_flow", "minimalist",
    "abstract_art", "corporate", "creative_burst", "elegant_lines", "vibrant_blocks"
  ]).default("modern_gradient"),
});

// Function to get QR code size in pixels - Professional quality
function getQRSize(size: string): number {
  switch (size) {
    case "small": return 800;    // 4x resolution
    case "medium": return 1200;  // 4x resolution
    case "large": return 1600;   // 4x resolution
    case "xlarge": return 2000;  // 4x resolution
    default: return 1200;
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





// Function to generate high-quality, recognizable logo SVGs
function generateLogoSVG(logoType: string, size: number = 60, color: string = "#000000"): string {
  const logoMap: { [key: string]: string } = {
    star: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="#FFD700"/>
           <polygon points="${size/2},${size*0.2} ${size*0.6},${size*0.4} ${size*0.8},${size*0.4} ${size*0.65},${size*0.6} ${size*0.75},${size*0.8} ${size/2},${size*0.7} ${size*0.25},${size*0.8} ${size*0.35},${size*0.6} ${size*0.2},${size*0.4} ${size*0.4},${size*0.4}" fill="#FFF"/>`,
    
    heart: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="#FF1744"/>
            <path d="M${size/2} ${size*0.7} C${size*0.3} ${size*0.55} ${size*0.3} ${size*0.35} ${size*0.4} ${size*0.35} C${size*0.45} ${size*0.35} ${size/2} ${size*0.45} ${size/2} ${size*0.45} C${size/2} ${size*0.45} ${size*0.55} ${size*0.35} ${size*0.6} ${size*0.35} C${size*0.7} ${size*0.35} ${size*0.7} ${size*0.55} ${size/2} ${size*0.7} Z" fill="#FFF"/>`,
    
    diamond: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="#00E676"/>
              <polygon points="${size/2},${size*0.25} ${size*0.7},${size/2} ${size/2},${size*0.75} ${size*0.3},${size/2}" fill="#FFF"/>`,
    
    crown: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="#FF9800"/>
            <polygon points="${size*0.25},${size*0.65} ${size*0.75},${size*0.65} ${size*0.7},${size*0.4} ${size*0.6},${size*0.5} ${size/2},${size*0.3} ${size*0.4},${size*0.5} ${size*0.3},${size*0.4}" fill="#FFF"/>`,
    
    check: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="#4CAF50"/>
            <polyline points="${size*0.35},${size*0.5} ${size*0.45},${size*0.6} ${size*0.65},${size*0.4}" stroke="#FFF" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    
    // Logos mega-simplificados con máxima claridad y contraste
    facebook: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#1877F2"/>
               <text x="${size/2}" y="${size*0.75}" text-anchor="middle" fill="#FFF" font-size="${size*0.8}" font-family="Arial, sans-serif" font-weight="bold">f</text>`,

    twitter: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#000"/>
              <text x="${size/2}" y="${size*0.75}" text-anchor="middle" fill="#FFF" font-size="${size*0.7}" font-family="Arial, sans-serif" font-weight="bold">X</text>`,

    instagram: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#E4405F"/>
                <rect x="${size*0.25}" y="${size*0.25}" width="${size*0.5}" height="${size*0.5}" rx="${size*0.1}" fill="none" stroke="#FFF" stroke-width="8"/>
                <circle cx="${size/2}" cy="${size/2}" r="${size*0.12}" fill="none" stroke="#FFF" stroke-width="6"/>
                <circle cx="${size*0.7}" cy="${size*0.3}" r="${size*0.08}" fill="#FFF"/>`,

    tiktok: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#000"/>
             <circle cx="${size*0.4}" cy="${size*0.4}" r="${size*0.15}" fill="#FF0050"/>
             <circle cx="${size*0.6}" cy="${size*0.6}" r="${size*0.12}" fill="#25F4EE"/>`,

    discord: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#5865F2"/>
              <ellipse cx="${size/2}" cy="${size*0.45}" rx="${size*0.3}" ry="${size*0.2}" fill="#FFF"/>
              <circle cx="${size*0.4}" cy="${size*0.4}" r="${size*0.08}" fill="#5865F2"/>
              <circle cx="${size*0.6}" cy="${size*0.4}" r="${size*0.08}" fill="#5865F2"/>`,

    snapchat: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#FFFC00"/>
               <circle cx="${size/2}" cy="${size/2}" r="${size*0.25}" fill="#FFF"/>
               <circle cx="${size*0.4}" cy="${size*0.4}" r="${size*0.05}" fill="#000"/>
               <circle cx="${size*0.6}" cy="${size*0.4}" r="${size*0.05}" fill="#000"/>`,

    youtube: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#FF0000"/>
              <polygon points="${size*0.3},${size*0.3} ${size*0.7},${size/2} ${size*0.3},${size*0.7}" fill="#FFF"/>`,

    whatsapp: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#25D366"/>
               <circle cx="${size/2}" cy="${size/2}" r="${size*0.25}" fill="none" stroke="#FFF" stroke-width="8"/>
               <path d="M${size*0.25} ${size*0.7} L${size*0.35} ${size*0.6} L${size*0.65} ${size*0.6} L${size*0.75} ${size*0.7}" stroke="#FFF" stroke-width="6" fill="none" stroke-linecap="round"/>`,

    behance: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#1769FF"/>
              <text x="${size/2}" y="${size*0.75}" text-anchor="middle" fill="#FFF" font-size="${size*0.4}" font-family="Arial, sans-serif" font-weight="bold">Be</text>`,

    threads: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#000"/>
              <text x="${size/2}" y="${size*0.75}" text-anchor="middle" fill="#FFF" font-size="${size*0.8}" font-family="Arial, sans-serif" font-weight="normal">@</text>`,

    linkedin: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#0A66C2"/>
               <text x="${size/2}" y="${size*0.75}" text-anchor="middle" fill="#FFF" font-size="${size*0.6}" font-family="Arial, sans-serif" font-weight="bold">in</text>`,

    dribbble: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#EA4C89"/>
               <circle cx="${size/2}" cy="${size/2}" r="${size*0.3}" fill="none" stroke="#FFF" stroke-width="6"/>
               <circle cx="${size*0.35}" cy="${size*0.35}" r="${size*0.05}" fill="#FFF"/>`,

    pinterest: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#BD081C"/>
               <text x="${size/2}" y="${size*0.75}" text-anchor="middle" fill="#FFF" font-size="${size*0.8}" font-family="Arial, sans-serif" font-weight="bold">P</text>`,

    twitch: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#9146FF"/>
             <rect x="${size*0.35}" y="${size*0.25}" width="${size*0.12}" height="${size*0.4}" fill="#FFF"/>
             <rect x="${size*0.53}" y="${size*0.25}" width="${size*0.12}" height="${size*0.4}" fill="#FFF"/>
             <rect x="${size*0.4}" y="${size*0.7}" width="${size*0.2}" height="${size*0.1}" fill="#FFF"/>`,

    telegram: `<circle cx="${size/2}" cy="${size/2}" r="${size*0.45}" fill="#0088CC"/>
               <polygon points="${size*0.25},${size*0.65} ${size*0.75},${size*0.35} ${size*0.45},${size*0.5} ${size*0.35},${size*0.75}" fill="#FFF"/>`,
  };

  const logoPath = logoMap[logoType];
  if (!logoPath) return "";

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${logoPath}
  </svg>`;
}

// Function to get brand colors for QR code integration
function getBrandColors(logoType: string): { primary: string; background?: string } | null {
  const brandColors: { [key: string]: { primary: string; background?: string } } = {
    facebook: { primary: "#1877F2", background: "#F0F2F5" },
    twitter: { primary: "#000000", background: "#F7F9FA" },
    instagram: { primary: "#E4405F", background: "#FAFAFA" },
    tiktok: { primary: "#000000", background: "#F1F1F2" },
    discord: { primary: "#5865F2", background: "#F2F3F5" },
    snapchat: { primary: "#FFFC00", background: "#FFF" },
    youtube: { primary: "#FF0000", background: "#F9F9F9" },
    whatsapp: { primary: "#25D366", background: "#F0F2F5" },
    behance: { primary: "#1769FF", background: "#F5F5F5" },
    threads: { primary: "#000000", background: "#F8F9FA" },
    linkedin: { primary: "#0A66C2", background: "#F3F2EF" },
    dribbble: { primary: "#EA4C89", background: "#F8F7F4" },
    pinterest: { primary: "#BD081C", background: "#F0F0F0" },
    twitch: { primary: "#9146FF", background: "#F7F7F8" },
    telegram: { primary: "#0088CC", background: "#F5F5F5" },
  };

  return brandColors[logoType] || null;
}

// Function to get card dimensions for different social media platforms
function getCardDimensions(template: string): { width: number; height: number } {
  // Professional quality dimensions - 4K/2K resolution
  const dimensions: { [key: string]: { width: number; height: number } } = {
    "instagram_post": { width: 2160, height: 2160 }, // 4K Square
    "instagram_story": { width: 1080, height: 1920 }, // Full HD vertical
    "facebook_post": { width: 2400, height: 1260 }, // 4K horizontal
    "facebook_story": { width: 1080, height: 1920 }, // Full HD vertical
    "twitter_post": { width: 2400, height: 1350 }, // 4K horizontal
    "linkedin_post": { width: 2400, height: 1254 }, // 4K horizontal
    "youtube_thumbnail": { width: 2560, height: 1440 }, // 2K resolution
    "tiktok_video": { width: 1080, height: 1920 }, // Full HD vertical
  };
  
  return dimensions[template] || { width: 2160, height: 2160 };
}

// Function to generate card background based on style
function generateCardBackground(style: string, width: number, height: number): string {
  const backgrounds: { [key: string]: string } = {
    "modern_gradient": `
      <defs>
        <linearGradient id="modernGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#modernGrad)"/>
    `,
    
    "neon_waves": `
      <defs>
        <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff006e;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ffbe0b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8338ec;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#neonGrad)"/>
      <path d="M0,${height*0.3} Q${width*0.25},${height*0.2} ${width*0.5},${height*0.3} T${width},${height*0.2} L${width},${height} L0,${height} Z" fill="rgba(255,255,255,0.1)"/>
    `,
    
    "geometric": `
      <defs>
        <linearGradient id="geoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#geoGrad)"/>
      <polygon points="0,0 ${width*0.3},0 0,${height*0.3}" fill="rgba(255,255,255,0.2)"/>
      <polygon points="${width},${height} ${width*0.7},${height} ${width},${height*0.7}" fill="rgba(255,255,255,0.2)"/>
    `,
    
    "organic_flow": `
      <defs>
        <linearGradient id="organicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#a8edea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#fed6e3;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#organicGrad)"/>
      <ellipse cx="${width*0.2}" cy="${height*0.8}" rx="${width*0.3}" ry="${height*0.2}" fill="rgba(255,255,255,0.3)"/>
      <ellipse cx="${width*0.8}" cy="${height*0.2}" rx="${width*0.2}" ry="${height*0.3}" fill="rgba(255,255,255,0.2)"/>
    `,
    
    "minimalist": `
      <rect width="${width}" height="${height}" fill="#f8f9fa"/>
      <rect x="${width*0.1}" y="${height*0.1}" width="${width*0.8}" height="${height*0.8}" fill="none" stroke="#dee2e6" stroke-width="2"/>
    `,
    
    "abstract_art": `
      <defs>
        <linearGradient id="abstractGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffecd2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#fcb69f;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#abstractGrad)"/>
      <circle cx="${width*0.8}" cy="${height*0.2}" r="${width*0.1}" fill="rgba(255,255,255,0.4)"/>
      <circle cx="${width*0.2}" cy="${height*0.8}" r="${width*0.15}" fill="rgba(255,255,255,0.3)"/>
    `,
    
    "corporate": `
      <rect width="${width}" height="${height}" fill="#1e293b"/>
      <rect x="0" y="0" width="${width}" height="${height*0.3}" fill="#334155"/>
      <rect x="0" y="${height*0.7}" width="${width}" height="${height*0.3}" fill="#475569"/>
    `,
    
    "creative_burst": `
      <defs>
        <radialGradient id="burstGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#ff9a9e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#fecfef;stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#burstGrad)"/>
      <polygon points="${width*0.5},${height*0.1} ${width*0.6},${height*0.4} ${width*0.9},${height*0.4} ${width*0.7},${height*0.6} ${width*0.8},${height*0.9} ${width*0.5},${height*0.7} ${width*0.2},${height*0.9} ${width*0.3},${height*0.6} ${width*0.1},${height*0.4} ${width*0.4},${height*0.4}" fill="rgba(255,255,255,0.2)"/>
    `,
    
    "elegant_lines": `
      <defs>
        <linearGradient id="elegantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e3ffe7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#d9e7ff;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#elegantGrad)"/>
      <path d="M0,${height*0.2} Q${width*0.5},${height*0.1} ${width},${height*0.2}" stroke="rgba(255,255,255,0.6)" stroke-width="3" fill="none"/>
      <path d="M0,${height*0.8} Q${width*0.5},${height*0.9} ${width},${height*0.8}" stroke="rgba(255,255,255,0.6)" stroke-width="3" fill="none"/>
    `,
    
    "vibrant_blocks": `
      <rect width="${width}" height="${height}" fill="#ff6b6b"/>
      <rect x="0" y="0" width="${width*0.5}" height="${height*0.5}" fill="#4ecdc4"/>
      <rect x="${width*0.5}" y="${height*0.5}" width="${width*0.5}" height="${height*0.5}" fill="#45b7d1"/>
      <rect x="${width*0.5}" y="0" width="${width*0.5}" height="${height*0.5}" fill="#f9ca24"/>
      <rect x="0" y="${height*0.5}" width="${width*0.5}" height="${height*0.5}" fill="#f0932b"/>
    `,
  };
  
  return backgrounds[style] || backgrounds["modern_gradient"];
}

// Function to generate text SVG with advanced formatting
function generateTextSVG(options: any, cardWidth: number, cardHeight: number, qrX: number, qrY: number, qrSize: number): string {
  const {
    textContent,
    textPosition = "bottom",
    textAlign = "center",
    textSize = 24,
    textColor = "#000000",
    textOpacity = 100,
    textFont = "Arial",
    textShadow = false,
    textBold = false,
    textItalic = false
  } = options;
  
  // Calculate text position
  let textX = cardWidth / 2;
  let textY = cardHeight / 2;
  
  switch (textPosition) {
    case "top":
      textY = qrY - 40;
      break;
    case "center":
      textY = cardHeight / 2;
      break;
    case "bottom":
      textY = qrY + qrSize + 60;
      break;
  }
  
  // Calculate text anchor based on alignment
  let textAnchor = "middle";
  switch (textAlign) {
    case "left":
      textX = 50;
      textAnchor = "start";
      break;
    case "right":
      textX = cardWidth - 50;
      textAnchor = "end";
      break;
    case "center":
      textX = cardWidth / 2;
      textAnchor = "middle";
      break;
  }
  
  // Build font style
  const fontWeight = textBold ? "bold" : "normal";
  const fontStyle = textItalic ? "italic" : "normal";
  const opacity = textOpacity / 100;
  
  // Build text shadow
  const shadowStyle = textShadow ? `filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5))` : "";
  
  return `
    <text x="${textX}" y="${textY}" 
          text-anchor="${textAnchor}" 
          fill="${textColor}" 
          font-size="${textSize}" 
          font-weight="${fontWeight}"
          font-style="${fontStyle}"
          font-family="${textFont}, sans-serif" 
          opacity="${opacity}"
          style="${shadowStyle}">
      ${textContent}
    </text>
  `;
}

// Function to generate creative card with QR code
async function generateCreativeCard(qrDataUrl: string, options: any): Promise<string> {
  try {
    const { cardTemplate, cardStyle } = options;
    
    if (cardTemplate === "none") {
      return qrDataUrl;
    }
    
    const { width, height } = getCardDimensions(cardTemplate);
    const background = generateCardBackground(cardStyle, width, height);
    
    // Calculate QR code size and position - centered and larger
    const qrSize = Math.min(width, height) * 0.45; // Increased to 45% for better visibility
    const qrX = (width - qrSize) / 2; // Center horizontally
    const qrY = (height - qrSize) / 2; // Center vertically
    
    // Create the card background SVG
    const cardBackgroundSVG = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${background}
        
        <!-- QR Code background with subtle shadow -->
        <rect x="${qrX - 25}" y="${qrY - 25}" width="${qrSize + 50}" height="${qrSize + 50}" 
              fill="white" rx="25" opacity="0.95" 
              style="filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3))"/>
        
        <!-- Custom text if enabled -->
        ${options.includeText && options.textContent ? generateTextSVG(options, width, height, qrX, qrY, qrSize) : ''}
      </svg>
    `;
    
    // Convert QR code to buffer
    const qrBase64 = qrDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    
    // Create background from SVG with high quality settings
    const backgroundBuffer = Buffer.from(cardBackgroundSVG);
    const backgroundImage = await sharp(backgroundBuffer)
      .png({
        quality: 100,
        compressionLevel: 0,
        progressive: false,
        force: true
      })
      .resize(width, height, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill'
      })
      .toBuffer();
    
    // Resize QR code with high quality resampling
    const resizedQRBuffer = await sharp(qrBuffer)
      .resize(Math.floor(qrSize), Math.floor(qrSize), {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill'
      })
      .png({
        quality: 100,
        compressionLevel: 0,
        progressive: false,
        force: true
      })
      .toBuffer();
    
    // Composite the background and QR code with higher quality settings
    const result = await sharp(backgroundImage)
      .composite([
        {
          input: resizedQRBuffer,
          top: Math.floor(qrY),
          left: Math.floor(qrX),
        }
      ])
      .png({
        quality: 100,
        compressionLevel: 0,
        progressive: false,
        force: true
      })
      .toBuffer();
    
    return `data:image/png;base64,${result.toString('base64')}`;
  } catch (error) {
    console.error('Error generating creative card:', error);
    return qrDataUrl; // Return original QR if card generation fails
  }
}

// Function to generate advanced QR code
async function generateAdvancedQRCode(options: any): Promise<string> {
  const size = getQRSize(options.size);
  const errorCorrectionLevel = getErrorCorrectionLevel(options.errorCorrection);
  
  // Get brand colors if logo is specified
  let qrForegroundColor = options.foregroundColor;
  let qrBackgroundColor = options.backgroundColor;
  
  if (options.logo && options.logo !== "none") {
    const brandColors = getBrandColors(options.logo);
    if (brandColors) {
      qrForegroundColor = brandColors.primary;
      qrBackgroundColor = brandColors.background || options.backgroundColor;
    }
  }
  
  // Professional QR code options with brand colors
  const qrOptions = {
    width: size,
    margin: 1,
    color: {
      dark: qrForegroundColor,
      light: options.backgroundImage ? '#FFFFFF' : qrBackgroundColor
    },
    errorCorrectionLevel,
    type: 'image/png',
    quality: 1.0,
    rendererOpts: {
      quality: 1.0
    }
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
  
  // Add logo if specified
  if (options.logo && options.logo !== "none") {
    console.log('Adding logo to QR code...');
    qrDataUrl = await addLogoToQR(qrDataUrl, options.logo, size, qrForegroundColor);
    console.log('Logo added successfully');
  }
  
  // Generate creative card if specified
  if (options.cardTemplate && options.cardTemplate !== "none") {
    console.log('Generating creative card...');
    qrDataUrl = await generateCreativeCard(qrDataUrl, options);
    console.log('Creative card generated successfully');
  }
  
  return qrDataUrl;
}

// Function to add logo to QR code
async function addLogoToQR(qrDataUrl: string, logoType: string, qrSize: number, logoColor: string): Promise<string> {
  try {
    const logoSize = Math.floor(qrSize * 0.2); // Logo is 20% of QR size (smaller for subtle integration)
    const logoSVG = generateLogoSVG(logoType, logoSize, logoColor);
    
    if (!logoSVG) return qrDataUrl;
    
    // Convert QR code to buffer
    const qrBase64 = qrDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    
    // Create white circular background for better contrast (smaller)
    const backgroundSize = Math.floor(logoSize * 1.1);
    const backgroundSVG = `<svg width="${backgroundSize}" height="${backgroundSize}" viewBox="0 0 ${backgroundSize} ${backgroundSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${backgroundSize/2}" cy="${backgroundSize/2}" r="${backgroundSize/2}" fill="white" stroke="#E0E0E0" stroke-width="2"/>
    </svg>`;
    
    // Convert SVGs to buffers with higher quality
    const logoBuffer = Buffer.from(logoSVG);
    const backgroundBuffer = Buffer.from(backgroundSVG);
    
    // Create composite image with white background and logo centered
    const result = await sharp(qrBuffer)
      .composite([
        {
          input: backgroundBuffer,
          top: Math.floor((qrSize - backgroundSize) / 2),
          left: Math.floor((qrSize - backgroundSize) / 2),
        },
        {
          input: logoBuffer,
          top: Math.floor((qrSize - logoSize) / 2),
          left: Math.floor((qrSize - logoSize) / 2),
        }
      ])
      .png({
        quality: 100,
        compressionLevel: 0,
        progressive: false,
        force: true
      })
      .toBuffer();
    
    return `data:image/png;base64,${result.toString('base64')}`;
  } catch (error) {
    console.error('Error adding logo to QR:', error);
    return qrDataUrl; // Return original QR if logo fails
  }
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
    // Process the background image to fit QR size with high quality
    const processedBackground = await sharp(bgBuffer)
      .resize(size, size, { 
        fit: 'cover',
        kernel: sharp.kernel.lanczos3
      })
      .png({
        quality: 100,
        compressionLevel: 0,
        progressive: false,
        force: true
      })
      .toBuffer();
    
    console.log('Processing QR code...');
    // Get the QR code resized to match - ensure proper padding with high quality
    const qrImage = await sharp(qrBuffer)
      .resize(size, size, { 
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.lanczos3
      })
      .png({
        quality: 100,
        compressionLevel: 0,
        progressive: false,
        force: true
      })
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
