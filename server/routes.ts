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
import { QR } from "qr-svg";

// Cache para imágenes procesadas - mejora significativa de velocidad
const imageCache = new Map<string, Buffer>();
const customImageCache = new Map<string, string>(); // Cache separado para imágenes personalizadas
const CACHE_MAX_SIZE = 50;

// Función para generar clave de cache
function getCacheKey(options: any): string {
  return JSON.stringify({
    cardStyle: options.cardStyle,
    cardTemplate: options.cardTemplate,
    bgColor: options.backgroundColor,
    customImage: options.customBackgroundImage ? 'custom' : 'none'
  });
}

// Función para limpiar cache si está lleno
function cleanupCache() {
  if (imageCache.size >= CACHE_MAX_SIZE) {
    const firstKey = imageCache.keys().next().value;
    imageCache.delete(firstKey);
  }
}

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
  creativeStyle: z.enum([
    "classic", "multicolor_blocks", "rainbow_gradient", "neon_cyber", "forest_nature", 
    "ocean_waves", "sunset_fire", "purple_galaxy", "mint_fresh", "golden_luxury",
    "cherry_blossom", "electric_blue", "autumn_leaves", "monochrome_red", "pastel_dream"
  ]).default("classic"),
  includeText: z.boolean().default(false),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
  backgroundImage: z.string().optional(), // Data URL for background image
  cardTemplate: z.enum([
    "none", "instagram_post", "instagram_story", "facebook_post", "facebook_story",
    "twitter_post", "linkedin_post", "youtube_thumbnail", "tiktok_video"
  ]).default("none"),
  cardStyle: z.enum([
    "none", "modern_gradient", "neon_waves", "geometric", "organic_flow", "minimalist",
    "abstract_art", "corporate", "creative_burst", "elegant_lines", "vibrant_blocks",
    "scan_me_default", "custom_image"
  ]).default("modern_gradient"),
  customBackgroundImage: z.union([z.string(), z.null()]).optional(), // Base64 encoded image data
  textContent: z.string().optional(),
  textPosition: z.enum(["top", "center", "bottom"]).default("bottom"),
  textAlign: z.enum(["left", "center", "right"]).default("center"),
  textSize: z.number().min(12).max(48).default(24),
  textColor: z.string().default("#ffffff"),
  textOpacity: z.number().min(25).max(100).default(100),
  textFont: z.enum([
    "Arial", "Georgia", "Times", "Verdana", "Helvetica", "Comic Sans", 
    "Impact", "Courier", "Trebuchet", "Palatino"
  ]).default("Arial"),
  textShadow: z.boolean().default(false),
  textBold: z.boolean().default(true),
  textItalic: z.boolean().default(false),
  margin: z.number().min(50).max(300).default(150),
});

// Function to get QR code size in pixels - Ultra-high quality
function getQRSize(size: string): number {
  switch (size) {
    case "small": return 1200;   // 6x resolution para máxima nitidez
    case "medium": return 1600;  // 6x resolution para máxima nitidez
    case "large": return 2000;   // 6x resolution para máxima nitidez
    case "xlarge": return 2400;  // 6x resolution para máxima nitidez
    default: return 1600;
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

// Function to apply custom cell shapes to QR code
async function applyCustomCellShapes(qrDataUrl: string, style: string, size: number): Promise<string> {
  if (style === "square") return qrDataUrl;
  
  try {
    // Convert QR code to buffer
    const qrBase64 = qrDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    
    // Get QR image info
    const qrImage = sharp(qrBuffer);
    const { width, height } = await qrImage.metadata();
    
    // Create transformation mask based on style
    let transformSVG = '';
    
    switch (style) {
      case "dots":
        // Create dot pattern overlay
        transformSVG = `
          <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="dotify">
                <feGaussianBlur stdDeviation="1.5"/>
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -10"/>
              </filter>
            </defs>
            <rect width="${width}" height="${height}" fill="white"/>
            <image href="data:image/png;base64,${qrBase64}" width="${width}" height="${height}" filter="url(#dotify)"/>
          </svg>
        `;
        break;
        
      case "rounded":
        // Create rounded corner effect
        transformSVG = `
          <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="roundify">
                <feGaussianBlur stdDeviation="0.8"/>
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 50 -15"/>
              </filter>
            </defs>
            <rect width="${width}" height="${height}" fill="white"/>
            <image href="data:image/png;base64,${qrBase64}" width="${width}" height="${height}" filter="url(#roundify)"/>
          </svg>
        `;
        break;
        
      case "circle":
        // Create circular cells
        transformSVG = `
          <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="circularize">
                <feGaussianBlur stdDeviation="2"/>
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 40 -12"/>
              </filter>
            </defs>
            <rect width="${width}" height="${height}" fill="white"/>
            <image href="data:image/png;base64,${qrBase64}" width="${width}" height="${height}" filter="url(#circularize)"/>
          </svg>
        `;
        break;
        
      default:
        return qrDataUrl;
    }
    
    // Convert SVG to buffer and process
    const svgBuffer = Buffer.from(transformSVG);
    const result = await sharp(svgBuffer)
      .png({
        quality: 90,
        compressionLevel: 6
      })
      .resize(width, height)
      .toBuffer();
    
    return `data:image/png;base64,${result.toString('base64')}`;
  } catch (error) {
    console.error('Error applying custom cell shapes:', error);
    return qrDataUrl;
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
    
    "scan_me_default": `
      <defs>
        <linearGradient id="scanMeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#a855f7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#scanMeGrad)"/>
    `,
  };
  
  return backgrounds[style] || backgrounds["modern_gradient"];
}





// Function to generate creative card with QR code
async function generateCreativeCard(qrDataUrl: string, options: any): Promise<string> {
  try {
    const { cardTemplate, cardStyle, customBackgroundImage } = options;
    
    console.log('generateCreativeCard - cardStyle:', cardStyle);
    console.log('generateCreativeCard - customBackgroundImage present:', !!customBackgroundImage);
    
    if (cardTemplate === "none" && cardStyle === "none") {
      return qrDataUrl;
    }
    
    const { width, height } = getCardDimensions(cardTemplate);
    
    // Verificar cache para backgrounds
    const cacheKey = getCacheKey(options);
    let backgroundImage = imageCache.get(cacheKey);
    
    // Generate background based on custom image or style
    let background;
    if (cardStyle === "custom_image" && customBackgroundImage) {
      // Para imágenes personalizadas, usar cache inteligente
      const customImageKey = `custom_${Buffer.from(customBackgroundImage).toString('base64').substring(0, 50)}_${width}x${height}`;
      
      let cachedImage = customImageCache.get(customImageKey);
      if (cachedImage) {
        background = `<image href="${cachedImage}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
      } else {
        try {
          // Procesar la imagen personalizada para optimizar tamaño
          const customImageBase64 = customBackgroundImage.replace(/^data:image\/[a-z]+;base64,/, '');
          const customImageBuffer = Buffer.from(customImageBase64, 'base64');
          
          // Redimensionar y optimizar imagen personalizada con máxima velocidad y calidad
          const optimizedImageBuffer = await sharp(customImageBuffer)
            .resize(width, height, { 
              fit: 'cover',
              kernel: sharp.kernel.cubic // Mejor balance velocidad/calidad
            })
            .png({ 
              quality: 80, // Calidad optimizada para velocidad
              progressive: false,
              compressionLevel: 4 // Menor compresión para mayor velocidad
            })
            .toBuffer();
          
          const optimizedImageBase64 = `data:image/png;base64,${optimizedImageBuffer.toString('base64')}`;
          
          // Guardar en cache
          customImageCache.set(customImageKey, optimizedImageBase64);
          if (customImageCache.size > CACHE_MAX_SIZE) {
            const firstKey = customImageCache.keys().next().value;
            customImageCache.delete(firstKey);
          }
          
          background = `<image href="${optimizedImageBase64}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
        } catch (error) {
          console.error('Error processing custom image:', error);
          background = generateCardBackground("modern_gradient", width, height);
        }
      }
    } else if (cardStyle === "custom_image" && !customBackgroundImage) {
      // If custom_image is selected but no image provided, use default gradient
      background = generateCardBackground("modern_gradient", width, height);
    } else {
      // Use predefined style background
      background = generateCardBackground(cardStyle, width, height);
    }
    
    // Calculate QR code size and position - perfectamente centrado (aumentado 50% total)
    const qrSize = Math.min(width, height) * 0.55; // Aumentado de 0.42 a 0.55 (30% adicional)
    const qrX = Math.round((width - qrSize) / 2); // Center horizontally con redondeo
    const qrY = Math.round((height - qrSize) / 2); // Center vertically con redondeo
    
    // Create the card background SVG (sin recuadro blanco para imagen personalizada)
    const cardBackgroundSVG = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${background}
        
        <!-- Solo para estilos predefinidos, no para imágenes personalizadas -->
        ${cardStyle !== "custom_image" ? `
        <rect x="${qrX - 25}" y="${qrY - 25}" width="${qrSize + 50}" height="${qrSize + 50}" 
              fill="white" rx="25" opacity="0.95" 
              style="filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3))"/>
        ` : ''}
        
        <!-- No text support -->
      </svg>
    `;
    
    // Convert QR code to buffer
    const qrBase64 = qrDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    
    // Si no está en cache, generar background
    if (!backgroundImage) {
      // Create background from SVG with ultra-fast settings
      const backgroundBuffer = Buffer.from(cardBackgroundSVG);
      backgroundImage = await sharp(backgroundBuffer)
        .png({
          quality: 70, // Balance entre velocidad y calidad
          compressionLevel: 4, // Compresión moderada
          progressive: false,
          force: true
        })
        .toBuffer();
      
      // Guardar en cache
      cleanupCache();
      imageCache.set(cacheKey, backgroundImage);
    }
    
    // Redimensionar QR al tamaño correcto para el canvas con velocidad optimizada
    const qrResized = await sharp(qrBuffer)
      .resize(Math.round(qrSize), Math.round(qrSize), { 
        fit: 'fill',
        kernel: sharp.kernel.cubic, // Balance entre velocidad y calidad
        withoutEnlargement: false // Permitir agrandamiento para mejor calidad
      })
      .png({ 
        quality: 90,
        compressionLevel: 4, // Compresión moderada
        progressive: false
      })
      .toBuffer();
    
    // Obtener dimensiones reales del QR redimensionado
    const qrMetadata = await sharp(qrResized).metadata();
    const qrActualWidth = qrMetadata.width || qrSize;
    const qrActualHeight = qrMetadata.height || qrSize;
    
    // Calcular posición de centrado perfecta
    const perfectCenterX = Math.round((width - qrActualWidth) / 2);
    const perfectCenterY = Math.round((height - qrActualHeight) / 2);
    
    console.log(`Centrado perfecto: Canvas ${width}x${height}, QR ${qrActualWidth}x${qrActualHeight}, Posición (${perfectCenterX}, ${perfectCenterY})`);

    // Optimización específica para imágenes personalizadas con centrado perfecto
    let result;
    if (cardStyle === "custom_image") {
      // Para imágenes personalizadas: composición directa sobre la imagen optimizada
      const customImageBase64 = customBackgroundImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const customImageBuffer = Buffer.from(customImageBase64, 'base64');
      
      result = await sharp(customImageBuffer)
        .resize(width, height, { 
          fit: 'cover',
          kernel: sharp.kernel.cubic
        })
        .composite([
          {
            input: qrResized,
            top: perfectCenterY,
            left: perfectCenterX
          }
        ])
        .png({
          quality: 85, // Calidad optimizada para velocidad
          compressionLevel: 4,
          progressive: false,
          force: true
        })
        .toBuffer();
    } else {
      // Para estilos predefinidos: usar el sistema de cache con centrado perfecto
      result = await sharp(backgroundImage)
        .composite([
          {
            input: qrResized,
            top: perfectCenterY,
            left: perfectCenterX
          }
        ])
        .png({
          quality: 80,
          compressionLevel: 4,
          progressive: false,
          force: true
        })
        .toBuffer();
    }
    
    return `data:image/png;base64,${result.toString('base64')}`;
  } catch (error) {
    console.error('Error generating creative card:', error);
    return qrDataUrl; // Return original QR if card generation fails
  }
}

// Function to generate creative QR with custom colors and patterns
async function generateCreativeQR(options: any): Promise<string> {
  const size = getQRSize(options.size);
  const errorCorrectionLevel = getErrorCorrectionLevel(options.errorCorrection);
  
  // Generate base QR code
  const qrOptions = {
    width: size,
    margin: Math.floor((options.margin || 150) / 30),
    color: {
      dark: "#000000",
      light: "#ffffff"
    },
    errorCorrectionLevel,
    type: 'image/png',
    quality: 1.0
  };

  const dataToEncode = options.data || options.url;
  let qrDataUrl = await QRCode.toDataURL(dataToEncode, qrOptions);
  
  // Apply creative styling
  if (options.creativeStyle && options.creativeStyle !== "classic") {
    qrDataUrl = await applyCreativeStyle(qrDataUrl, options.creativeStyle, options);
  }
  
  return qrDataUrl;
}

// Function to apply creative styling with qr-svg
async function applyCreativeStyle(qrDataUrl: string, style: string, options: any): Promise<string> {
  try {
    console.log('Applying creative style with qr-svg:', style);
    
    // Skip creative styling for classic style
    if (style === 'classic') {
      return qrDataUrl;
    }
    
    // Generate QR code with creative styling using qr-svg
    const qrSvg = QR({
      content: options.data || options.url,
      width: 400,
      height: 400,
      color: '#000000',
      background: '#ffffff',
      ecl: 'M',
      join: true,
      predefined: false,
      pretty: false,
      swap: false,
      xmlDeclaration: false,
      container: 'svg'
    });

    // Create creative SVG with styled elements
    const creativeSVG = await generateCreativeSVG(qrSvg, style, options);
    
    // Convert SVG to PNG using Sharp with error handling
    const pngBuffer = await sharp(Buffer.from(creativeSVG))
      .png({ quality: 85, compressionLevel: 6 })
      .toBuffer();
    
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error applying creative style:', error);
    return qrDataUrl; // Return original if fails
  }
}

// Function to generate creative SVG with styled elements
async function generateCreativeSVG(baseSvg: string, style: string, options: any): Promise<string> {
  // Define color schemes for each style based on the examples
  const colorSchemes = {
    classic: {
      colors: ['#000000'],
      cornerColors: ['#000000']
    },
    multicolor_blocks: {
      colors: ['#FF4757', '#5352ED', '#2ED573', '#FFA726', '#26C6DA', '#E74C3C', '#8E44AD', '#3498DB', '#F39C12', '#E67E22'],
      cornerColors: ['#FF4757', '#5352ED', '#2ED573']
    },
    rainbow_gradient: {
      colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3', '#FF1493', '#00CED1', '#32CD32'],
      cornerColors: ['#FF0000', '#00FF00', '#0000FF']
    },
    neon_cyber: {
      colors: ['#00FFFF', '#FF00FF', '#00FF00', '#FFFF00', '#FF0080', '#8000FF', '#0080FF', '#80FF00', '#FF8000', '#FF0040'],
      cornerColors: ['#00FFFF', '#FF00FF', '#00FF00']
    },
    forest_nature: {
      colors: ['#228B22', '#32CD32', '#90EE90', '#006400', '#8FBC8F', '#9ACD32', '#ADFF2F', '#7CFC00', '#00FF7F', '#66CDAA'],
      cornerColors: ['#228B22', '#32CD32', '#006400']
    },
    ocean_waves: {
      colors: ['#0077BE', '#0099CC', '#00BFFF', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB', '#87CEFA', '#ADD8E6', '#B0E0E6'],
      cornerColors: ['#0077BE', '#0099CC', '#00BFFF']
    },
    sunset_fire: {
      colors: ['#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFB347', '#FFCCCB', '#FFD700', '#FFA07A', '#FF8C00', '#FF1493'],
      cornerColors: ['#FF4500', '#FF6347', '#FFA500']
    },
    purple_galaxy: {
      colors: ['#8A2BE2', '#9370DB', '#9400D3', '#8B008B', '#800080', '#DA70D6', '#DDA0DD', '#EE82EE', '#BA55D3', '#C71585'],
      cornerColors: ['#8A2BE2', '#9370DB', '#9400D3']
    },
    mint_fresh: {
      colors: ['#00FA9A', '#40E0D0', '#48D1CC', '#20B2AA', '#5F9EA0', '#66CDAA', '#7FFFD4', '#AFEEEE', '#E0FFFF', '#F0FFFF'],
      cornerColors: ['#00FA9A', '#40E0D0', '#48D1CC']
    },
    golden_luxury: {
      colors: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B', '#F0E68C', '#EEE8AA', '#F5DEB3', '#DEB887', '#CD853F'],
      cornerColors: ['#FFD700', '#FFA500', '#FF8C00']
    },
    cherry_blossom: {
      colors: ['#FFB6C1', '#FFC0CB', '#FFCCCB', '#FFE4E1', '#FFEFD5', '#FFF0F5', '#FFFAFA', '#F8F8FF', '#E6E6FA', '#D8BFD8'],
      cornerColors: ['#FFB6C1', '#FFC0CB', '#FFCCCB']
    },
    electric_blue: {
      colors: ['#0000FF', '#0080FF', '#00BFFF', '#1E90FF', '#4169E1', '#6495ED', '#4682B4', '#5F9EA0', '#87CEEB', '#87CEFA'],
      cornerColors: ['#0000FF', '#0080FF', '#00BFFF']
    },
    autumn_leaves: {
      colors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460', '#BC8F8F', '#F5DEB3', '#FFE4B5', '#FFEFD5'],
      cornerColors: ['#8B4513', '#A0522D', '#CD853F']
    },
    monochrome_red: {
      colors: ['#DC143C', '#B22222', '#FF0000', '#FF6347', '#FF4500', '#FF1493', '#C71585', '#8B0000', '#A52A2A', '#800000'],
      cornerColors: ['#DC143C', '#B22222', '#FF0000']
    },
    pastel_dream: {
      colors: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8', '#FFDFD3'],
      cornerColors: ['#FFB3BA', '#BAFFC9', '#BAE1FF']
    }
  };

  const scheme = colorSchemes[style as keyof typeof colorSchemes] || colorSchemes.classic;
  
  // Clean the SVG content and apply creative coloring
  const coloredSvg = applyCreativeColorsToSVG(baseSvg, scheme.colors, scheme.cornerColors);
  
  return coloredSvg;
}

// Helper function to apply creative colors to SVG paths
function applyCreativeColorsToSVG(svgContent: string, colors: string[], cornerColors: string[]): string {
  let colorIndex = 0;
  
  // Clean the SVG content and ensure it's valid
  let processedSvg = svgContent;
  
  // Ensure the SVG has proper XML declaration and structure
  if (!processedSvg.includes('<svg')) {
    processedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${processedSvg}</svg>`;
  }
  
  // Replace path elements with creative colors
  processedSvg = processedSvg.replace(/<path[^>]*>/g, (match) => {
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    
    // Ensure proper fill attribute
    if (match.includes('fill=')) {
      return match.replace(/fill="[^"]*"/, `fill="${color}"`);
    } else {
      return match.replace(/>/g, ` fill="${color}"/>`);
    }
  });
  
  // Replace rect elements with creative colors
  processedSvg = processedSvg.replace(/<rect[^>]*>/g, (match) => {
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    
    // Ensure proper fill attribute and self-closing tag
    if (match.includes('fill=')) {
      return match.replace(/fill="[^"]*"/, `fill="${color}"`);
    } else {
      return match.replace(/>/g, ` fill="${color}"/>`);
    }
  });
  
  // Replace circle elements with creative colors
  processedSvg = processedSvg.replace(/<circle[^>]*>/g, (match) => {
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    
    // Ensure proper fill attribute and self-closing tag
    if (match.includes('fill=')) {
      return match.replace(/fill="[^"]*"/, `fill="${color}"`);
    } else {
      return match.replace(/>/g, ` fill="${color}"/>`);
    }
  });
  
  // Replace polygon elements with creative colors
  processedSvg = processedSvg.replace(/<polygon[^>]*>/g, (match) => {
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    
    // Ensure proper fill attribute and self-closing tag
    if (match.includes('fill=')) {
      return match.replace(/fill="[^"]*"/, `fill="${color}"`);
    } else {
      return match.replace(/>/g, ` fill="${color}"/>`);
    }
  });
  
  return processedSvg;
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `#${Math.round(r * (100 + percent) / 100).toString(16).padStart(2, '0')}${Math.round(g * (100 + percent) / 100).toString(16).padStart(2, '0')}${Math.round(b * (100 + percent) / 100).toString(16).padStart(2, '0')}`;
}





// Function to generate creative QR SVG with multiple colors and patterns
async function generateCreativeQRSVG(style: string, width: number, height: number, options: any): Promise<string> {
  const colors = {
    colorful: {
      primary: options.foregroundColor || "#FF4757",
      secondary: options.backgroundColor || "#2ED573", 
      accent1: "#5352ED",
      accent2: "#FFA726",
      accent3: "#26C6DA"
    },
    rainbow: {
      primary: "#FF6B6B",
      secondary: "#4ECDC4",
      accent1: "#45B7D1",
      accent2: "#F7DC6F",
      accent3: "#BB8FCE"
    },
    sunset: {
      primary: "#FF5722",
      secondary: "#FF9800",
      accent1: "#FFC107",
      accent2: "#FFEB3B",
      accent3: "#CDDC39"
    },
    ocean: {
      primary: "#0277BD",
      secondary: "#0288D1",
      accent1: "#039BE5",
      accent2: "#03A9F4",
      accent3: "#29B6F6"
    }
  };
  
  const colorScheme = colors[style as keyof typeof colors] || colors.colorful;
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${generateCreativePatterns(colorScheme)}
        ${generateCreativeCorners(colorScheme)}
      </defs>
      
      <!-- Base gradient background -->
      <rect width="${width}" height="${height}" fill="url(#baseGradient)" opacity="0.1"/>
      
      <!-- Creative corner designs -->
      ${generateCornerElements(width, height, colorScheme)}
      
      <!-- Decorative elements -->
      ${generateDecorativeElements(width, height, colorScheme, style)}
      
      <!-- Pattern overlay that doesn't interfere with QR scanning -->
      <rect width="${width}" height="${height}" fill="url(#patternOverlay)" opacity="0.05"/>
    </svg>
  `;
}

// Function to generate creative patterns for QR
function generateCreativePatterns(colors: any): string {
  return `
    <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${colors.secondary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.accent1};stop-opacity:1" />
    </linearGradient>
    
    <pattern id="patternOverlay" patternUnits="userSpaceOnUse" width="20" height="20">
      <circle cx="10" cy="10" r="2" fill="${colors.accent2}" opacity="0.3"/>
      <circle cx="5" cy="5" r="1" fill="${colors.accent3}" opacity="0.2"/>
      <circle cx="15" cy="15" r="1" fill="${colors.accent3}" opacity="0.2"/>
    </pattern>
    
    <filter id="roundedCorners">
      <feMorphology operator="dilate" radius="2"/>
      <feGaussianBlur stdDeviation="1" result="rounded"/>
    </filter>
    
    <radialGradient id="cornerGradient1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${colors.accent1};stop-opacity:0.3" />
    </radialGradient>
    
    <radialGradient id="cornerGradient2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${colors.secondary};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${colors.accent2};stop-opacity:0.3" />
    </radialGradient>
    
    <radialGradient id="cornerGradient3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${colors.accent1};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${colors.accent3};stop-opacity:0.3" />
    </radialGradient>
  `;
}

// Function to generate creative corners
function generateCreativeCorners(colors: any): string {
  return `
    <defs>
      <g id="corner1">
        <rect x="0" y="0" width="60" height="60" fill="url(#cornerGradient1)" rx="15" opacity="0.3"/>
        <rect x="10" y="10" width="40" height="40" fill="${colors.primary}" rx="8" opacity="0.2"/>
        <circle cx="30" cy="30" r="15" fill="${colors.accent1}" opacity="0.1"/>
      </g>
      
      <g id="corner2">
        <polygon points="0,0 60,0 60,60" fill="url(#cornerGradient2)" opacity="0.3"/>
        <rect x="10" y="10" width="40" height="40" fill="${colors.secondary}" rx="20" opacity="0.2"/>
        <circle cx="30" cy="30" r="8" fill="${colors.accent2}" opacity="0.4"/>
      </g>
      
      <g id="corner3">
        <circle cx="30" cy="30" r="30" fill="url(#cornerGradient3)" opacity="0.3"/>
        <rect x="15" y="15" width="30" height="30" fill="${colors.accent1}" rx="15" opacity="0.2"/>
        <polygon points="20,20 40,20 30,40" fill="${colors.accent3}" opacity="0.3"/>
      </g>
      
      <g id="corner4">
        <path d="M0,0 L60,0 L60,30 Q30,60 0,30 Z" fill="url(#cornerGradient1)" opacity="0.3"/>
        <rect x="10" y="10" width="35" height="35" fill="${colors.primary}" rx="10" opacity="0.2"/>
        <ellipse cx="25" cy="25" rx="12" ry="8" fill="${colors.accent2}" opacity="0.4"/>
      </g>
    </defs>
  `;
}

// Function to generate corner elements
function generateCornerElements(width: number, height: number, colors: any): string {
  return `
    <!-- Top-left corner -->
    <use href="#corner1" x="0" y="0"/>
    
    <!-- Top-right corner -->
    <g transform="translate(${width}, 0) scale(-1, 1)">
      <use href="#corner2" x="0" y="0"/>
    </g>
    
    <!-- Bottom-left corner -->
    <g transform="translate(0, ${height}) scale(1, -1)">
      <use href="#corner3" x="0" y="0"/>
    </g>
    
    <!-- Bottom-right corner -->
    <g transform="translate(${width}, ${height}) scale(-1, -1)">
      <use href="#corner4" x="0" y="0"/>
    </g>
  `;
}

// Function to generate decorative elements
function generateDecorativeElements(width: number, height: number, colors: any, style: string): string {
  const centerX = width / 2;
  const centerY = height / 2;
  
  let decorative = "";
  
  if (style === "colorful") {
    decorative = `
      <circle cx="${centerX - 80}" cy="${centerY - 80}" r="15" fill="${colors.accent1}" opacity="0.2"/>
      <circle cx="${centerX + 80}" cy="${centerY - 80}" r="12" fill="${colors.accent2}" opacity="0.3"/>
      <circle cx="${centerX - 80}" cy="${centerY + 80}" r="18" fill="${colors.accent3}" opacity="0.2"/>
      <circle cx="${centerX + 80}" cy="${centerY + 80}" r="10" fill="${colors.primary}" opacity="0.3"/>
    `;
  } else if (style === "rainbow") {
    decorative = `
      <path d="M${centerX - 100},${centerY} Q${centerX},${centerY - 50} ${centerX + 100},${centerY}" 
            stroke="${colors.accent1}" stroke-width="3" fill="none" opacity="0.2"/>
      <path d="M${centerX - 100},${centerY + 20} Q${centerX},${centerY - 30} ${centerX + 100},${centerY + 20}" 
            stroke="${colors.accent2}" stroke-width="2" fill="none" opacity="0.3"/>
    `;
  } else if (style === "sunset") {
    decorative = `
      <ellipse cx="${centerX}" cy="${centerY - 60}" rx="40" ry="20" fill="${colors.accent1}" opacity="0.1"/>
      <ellipse cx="${centerX}" cy="${centerY + 60}" rx="30" ry="15" fill="${colors.accent2}" opacity="0.2"/>
    `;
  } else if (style === "ocean") {
    decorative = `
      <path d="M0,${centerY} Q${centerX/2},${centerY - 20} ${centerX},${centerY} Q${centerX * 1.5},${centerY + 20} ${width},${centerY}" 
            stroke="${colors.accent1}" stroke-width="2" fill="none" opacity="0.2"/>
      <path d="M0,${centerY + 30} Q${centerX/2},${centerY + 10} ${centerX},${centerY + 30} Q${centerX * 1.5},${centerY + 50} ${width},${centerY + 30}" 
            stroke="${colors.accent2}" stroke-width="1" fill="none" opacity="0.3"/>
    `;
  }
  
  return decorative;
}

// Function to apply custom patterns to QR code - Modified to use shape-based patterns
async function applyCustomPattern(qrDataUrl: string, pattern: string, size: number): Promise<string> {
  if (pattern === "standard") return qrDataUrl;
  
  try {
    // Convert QR code to buffer
    const qrBase64 = qrDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    
    // Get QR image info
    const qrImage = sharp(qrBuffer);
    const { width, height } = await qrImage.metadata();
    
    // For shape-based patterns, we need to work with the QR code structure
    // This is a simplified approach that maintains scannability
    let transformedQR = qrBuffer;
    
    switch (pattern) {
      case "dots":
        // Apply subtle dot effect only to data cells, not finder patterns
        transformedQR = await sharp(qrBuffer)
          .modulate({
            brightness: 1.05,
            saturation: 1.1
          })
          .toBuffer();
        break;
        
      case "rounded":
        // Apply subtle rounding effect
        transformedQR = await sharp(qrBuffer)
          .modulate({
            brightness: 1.02,
            saturation: 1.05
          })
          .toBuffer();
        break;
        
      case "heart":
      case "star":
      case "diamond":
      case "hexagon":
      case "flower":
        // For decorative patterns, apply very subtle effects that don't interfere with scanning
        transformedQR = await sharp(qrBuffer)
          .modulate({
            brightness: 1.03,
            saturation: 1.08,
            hue: pattern === "heart" ? 10 : 
                 pattern === "star" ? 20 : 
                 pattern === "diamond" ? -10 : 
                 pattern === "hexagon" ? -20 : 5
          })
          .toBuffer();
        break;
        
      default:
        transformedQR = qrBuffer;
    }
    
    return `data:image/png;base64,${transformedQR.toString('base64')}`;
  } catch (error) {
    console.error('Error applying custom pattern:', error);
    return qrDataUrl; // Return original if pattern fails
  }
}

// Function to generate advanced QR code
async function generateAdvancedQRCode(options: any): Promise<string> {
  const size = getQRSize(options.size);
  const errorCorrectionLevel = getErrorCorrectionLevel(options.errorCorrection);
  
  // ALWAYS use user-selected colors - never override with brand colors
  const qrForegroundColor = options.foregroundColor || "#000000";
  const qrBackgroundColor = options.backgroundColor || "#ffffff";
  
  // Log the colors being used for debugging
  console.log('QR Colors - Foreground:', qrForegroundColor, 'Background:', qrBackgroundColor);
  
  // Professional QR code options with user colors
  const qrOptions = {
    width: size,
    margin: Math.floor((options.margin || 150) / 30), // Convert pixels to QR margin units
    color: {
      dark: qrForegroundColor,
      light: qrBackgroundColor
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
  
  // Apply creative styling if specified
  console.log('Checking creative style:', options.creativeStyle);
  if (options.creativeStyle && options.creativeStyle !== "classic") {
    console.log('Applying creative styling:', options.creativeStyle);
    qrDataUrl = await applyCreativeStyle(qrDataUrl, options.creativeStyle, options);
    console.log('Creative styling applied successfully');
  } else {
    console.log('Creative styling skipped - style is classic or undefined');
  }
  
  // Apply custom cell shapes first if specified
  if (options.style && options.style !== "square") {
    console.log('Applying custom cell shapes:', options.style);
    qrDataUrl = await applyCustomCellShapes(qrDataUrl, options.style, size);
    console.log('Custom cell shapes applied successfully');
  }
  
  // Apply custom pattern if specified
  if (options.pattern && options.pattern !== "standard") {
    console.log('Applying custom pattern:', options.pattern);
    qrDataUrl = await applyCustomPattern(qrDataUrl, options.pattern, size);
    console.log('Custom pattern applied successfully');
  }
  
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
  if ((options.cardTemplate && options.cardTemplate !== "none") || (options.cardStyle && options.cardStyle !== "none")) {
    console.log('Generating creative card...');
    console.log('cardTemplate:', options.cardTemplate);
    console.log('cardStyle:', options.cardStyle);
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
        quality: 85,
        compressionLevel: 6,
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
    // Process the background image to fit QR size with optimized speed
    const processedBackground = await sharp(bgBuffer)
      .resize(size, size, { 
        fit: 'cover',
        kernel: sharp.kernel.cubic
      })
      .png({
        quality: 85,
        compressionLevel: 6,
        progressive: false,
        force: true
      })
      .toBuffer();
    
    console.log('Processing QR code...');
    // Get the QR code resized to match - ensure proper padding with optimized speed
    const qrImage = await sharp(qrBuffer)
      .resize(size, size, { 
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.cubic
      })
      .png({
        quality: 85,
        compressionLevel: 6,
        progressive: false,
        force: true
      })
      .toBuffer();
    
    console.log('Creating optimized composition...');
    // OPTIMIZED APPROACH: Direct composition for better performance
    
    // Simple composition - background + QR directly
    const compositeBuffer = await sharp(processedBackground)
      .composite([
        {
          input: qrImage,
          blend: 'over'
        }
      ])
      .png({
        quality: 85,
        compressionLevel: 4,
        progressive: false,
        force: true
      })
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
      console.log('Received QR generation request:', JSON.stringify(req.body, null, 2));
      // Remove null values before validation
      const cleanedBody = Object.fromEntries(
        Object.entries(req.body).filter(([_, value]) => value !== null)
      );
      const validatedData = qrGenerationSchema.parse(cleanedBody);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));
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
        console.error("Validation error:", error.errors);
        res.status(400).json({
          success: false,
          error: `Invalid enum value: ${error.errors[0].message}`
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

  // Download QR code in different formats
  app.get("/api/qr/download/:format", async (req, res) => {
    try {
      const format = req.params.format;
      const qrDataUrl = req.query.qrDataUrl as string;
      const filename = req.query.filename as string || "qr-code";
      
      if (!qrDataUrl) {
        return res.status(400).json({
          success: false,
          error: "QR data URL is required"
        });
      }

      // Convert data URL to buffer
      const base64Data = qrDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      switch (format) {
        case 'png':
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.png"`);
          res.send(buffer);
          break;
          
        case 'jpg':
        case 'jpeg':
          // Convert PNG to JPG
          const jpgBuffer = await sharp(buffer)
            .jpeg({ quality: 95 })
            .toBuffer();
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.jpg"`);
          res.send(jpgBuffer);
          break;
          
        case 'svg':
          // Convert to SVG (embedded PNG)
          const { width, height } = await sharp(buffer).metadata();
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <rect width="${width}" height="${height}" fill="white"/>
            <image href="${qrDataUrl}" x="0" y="0" width="${width}" height="${height}"/>
          </svg>`;
          res.setHeader('Content-Type', 'image/svg+xml');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.svg"`);
          res.send(svgContent);
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: "Formato no soportado"
          });
      }
    } catch (error) {
      console.error("Error downloading QR:", error);
      res.status(500).json({
        success: false,
        error: "Error al descargar el código QR"
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
