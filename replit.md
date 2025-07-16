# myQR - QR Code Generator Application

## Overview

This is a full-stack web application built with React and Express that allows users to generate QR codes from URLs. The application features a clean, modern interface using shadcn/ui components and provides immediate QR code generation with download capabilities. The app is branded as "myQR" with a professional, elegant design.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 2025
- **Optimización de Tamaño de Imagen**: Reducido tamaño de vista previa de imagen QR a 280px manteniendo calidad 4K/2K de descarga
- **Regeneración Automática Inteligente**: Implementada actualización automática con delays diferenciados (150ms para cambios visuales, 300ms para texto)
- **Eliminación de Sección de Logos**: Removida completamente la sección de logos del apartado de diseño para interfaz más limpia
- **Algoritmo de Texto Robusto**: Corregido completamente el problema de texto cortado con multiplicadores conservadores (0.8 base) y buffer del 60%
- **Vista Previa Estilo Canva**: Implementada vista previa en tiempo real con simulación visual del texto final
- **Optimización de Rendimiento**: Reducida calidad de procesamiento Sharp de 100 a 90 y kernel cubic para mayor velocidad
- **Límite de Caracteres Extendido**: Aumentado límite de texto a 50 caracteres para mayor flexibilidad
- **Padding Ultra-Conservador**: Incrementado padding de texto a 80px para prevenir cualquier corte
- **Sistema de Edición de Texto Avanzado**: Implementado control completo sobre el texto en tarjetas QR
- **Posicionamiento de Texto**: Opciones para posicionar texto arriba, centro o abajo del QR
- **Alineación de Texto**: Controles para alinear texto a la izquierda, centro o derecha
- **Personalización Tipográfica**: Amplia selección de fuentes (Arial, Georgia, Times, Verdana, Helvetica, Comic Sans, Impact, Courier, Trebuchet, Palatino)
- **Controles de Formato**: Opciones para negrita, cursiva y sombra de texto
- **Tamaño y Opacidad**: Controles deslizantes para ajustar tamaño (12-48px) y opacidad (25-100%)
- **Selector de Color**: Selector visual de colores para texto con vista previa en tiempo real
- **Vista Previa en Tiempo Real**: Muestra vista previa del texto con todos los estilos aplicados
- **Calidad Profesional 4K**: Mejorado generador QR base con resolución 1200px y configuraciones PNG máximas
- **Kernel Lanczos3**: Implementado reescalado profesional para nitidez superior en todas las composiciones
- **Esquema de BD Expandido**: Agregados campos para textPosition, textAlign, textSize, textColor, textOpacity, textFont, textShadow, textBold, textItalic
- **Mejoras de Contraste y UX**: Reorganizado panel de texto a tarjetas creativas con mejor contraste y sombras profesionales
- **Estilos Predefinidos**: Agregados presets de texto profesionales (SCAN ME, Escaneáme, etc.) para uso rápido
- **Fondo de Texto**: Implementado fondo semitransparente automático para mejor legibilidad en cualquier diseño de tarjeta
- **Eliminación Módulo Avanzado**: Removido completamente el módulo "Avanzado" por inconsistencias en patrones/estilos QR, simplificando la interfaz a 4 pestañas principales

### December 2024
- **Stripe Payment Integration**: Implemented complete payment system with subscription plans and 3-day free trial
- **Subscription Plans**: Added weekly ($3.45) and monthly ($6.45) subscription options with Stripe integration using actual product IDs
- **Stripe Product Integration**: Connected to real Stripe products (prod_SgbM5d8WfUgLP6 for weekly, prod_SgbMQxYEXBZ0u5 for monthly)
- **PRO Feature Gating**: Implemented proper authentication barriers for customization and history features
- **Test Mode Support**: Added test card information display for Stripe test mode payments
- **Enhanced Scan Statistics**: Added detailed scan records endpoint with individual scan timestamps, user agents, and IP addresses
- **Tabbed Statistics Interface**: Organized statistics modal into three tabs (Resumen, Análisis, Detallado) for better navigation
- **Timezone Clarification**: Added UTC timezone indicators to statistics and detailed scan records to prevent confusion
- **Real-time QR Updates**: Implemented automatic QR regeneration when visual settings change, eliminating need to manually click "generar pro"
- **Search Functionality**: Added search capability for QR names, URLs, and types in history tab with real-time filtering
- **PRO Status System**: Created subscription status tracking with badges and upgrade prompts in header
- **Payment Processing**: Integrated Stripe Elements for secure payment processing and subscription management
- **Database Schema Update**: Added subscription fields to users table (stripeCustomerId, subscriptionStatus, subscriptionPlan, etc.)
- **Webhook Integration**: Implemented Stripe webhooks for real-time subscription status updates
- **Subscription Management**: Added trial activation, subscription creation, cancellation, and status endpoints
- **User Interface Updates**: Enhanced header with subscription status display and upgrade prompts
- **Refined Freemium Model**: Removed background image upload option and made history tracking strictly PRO-only, keeping only basic QR generation free
- **PRO-Only Features**: History access, scan statistics, Excel exports, and advanced analytics are now exclusively for authenticated users
- **PRO Customization Model**: Implemented tiered feature system where basic QR generation is free, and advanced customization (colors, styles, logos, patterns) is positioned as a PRO feature
- **Post-Generation Upgrade Flow**: Redesigned UX to show customization options after QR generation, encouraging users to upgrade their basic QR to a professional version
- **Enhanced Landing Page**: Created professional landing page with features showcase for non-authenticated users
- **Dark Mode Support**: Added complete dark/light theme system with toggle functionality
- **Replit Authentication**: Integrated full authentication system with user sessions, profile management, and logout functionality
- **Brand Update**: Changed app name from "QR Pro" to "myQR" across all interfaces and documentation
- **Vibrant Color Transformation**: Replaced green palette with intense, pulsating colors featuring purple primary (HSL 280°, 100%, 70%) and dynamic animations
- **QR Pattern Background**: Added subtle QR-code pattern background texture using SVG with very low opacity (0.015) for authentic theming
- **Dynamic Animations**: Implemented vibrant pulsing effects with hue-rotation, saturation changes, and colorful glow animations for enhanced visual appeal
- **QR Code Title System**: Added ability to add custom titles to QR codes for better organization and identification in history
- **Comprehensive Scan Analytics**: Implemented detailed scan tracking with daily, monthly, and yearly statistics, including visual charts and daily breakdown
- **Advanced Database Schema**: Expanded database with qrScans table for detailed analytics tracking and title field for QR organization
- **Enhanced History Management**: Updated QR history interface with inline title editing, scan count display, and comprehensive statistics modal
- **Creative Card Templates**: Added colorful card templates with different aspect ratios for social media platforms (Instagram, Facebook, Twitter, LinkedIn, YouTube, TikTok)
- **Social Media Optimization**: Created templates with proper dimensions for posts, stories, and thumbnails with automatic QR positioning
- **Card Style Variants**: Implemented 10 different card styles including gradients, neon waves, geometric patterns, and corporate designs
- **Brand Color Integration**: QR codes now automatically use authentic brand colors when logos are selected (YouTube red, Facebook blue, etc.)
- **Improved Logo System**: Simplified logo designs with better contrast and recognition, reduced size for subtle integration

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL via Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Management**: PostgreSQL-backed sessions (connect-pg-simple)
- **API Design**: RESTful endpoints under `/api` prefix

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **TypeScript**: Strict mode enabled with path mapping
- **Environment**: Designed for Replit with specific plugins and configurations

## Key Components

### Frontend Components
- **Home Page**: Main interface for URL input and QR code generation
- **UI Components**: Complete shadcn/ui component library including:
  - Form controls (Input, Button, Label)
  - Feedback components (Alert, Toast, Progress)
  - Layout components (Card, Dialog, Sheet)
  - Data display components (Table, Tabs, Accordion)

### Backend Components
- **Route Handler**: Centralized route registration in `/server/routes.ts`
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **QR Code Generation**: Server-side QR code creation using the `qrcode` library
- **Error Handling**: Global error middleware with proper HTTP status codes

### Shared Components
- **Schema Definitions**: Drizzle schema with Zod validation in `/shared/schema.ts`
- **Type Safety**: Shared TypeScript types between frontend and backend

## Data Flow

### QR Code Generation Flow
1. User enters URL in frontend form
2. Frontend validates URL format using Zod schema
3. POST request sent to `/api/qr/generate` endpoint
4. Backend validates request and generates QR code as data URL
5. QR code record stored in database with timestamp
6. Response includes QR code data URL and metadata
7. Frontend displays QR code with download option

### Database Schema
- **Users Table**: Basic user authentication structure (prepared for future use)
- **QR Codes Table**: Stores generated QR codes with URL and creation timestamp
- **Schema Management**: Drizzle migrations in `/migrations` directory

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **qrcode**: Server-side QR code generation
- **@tanstack/react-query**: Client-side state management
- **zod**: Schema validation and type inference

### UI Dependencies
- **@radix-ui/***: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Utility for creating variant-based component APIs

### Development Dependencies
- **vite**: Frontend build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production backend

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `/dist/public`
2. **Backend Build**: esbuild bundles Express server to `/dist/index.js`
3. **Database Setup**: Drizzle pushes schema changes to PostgreSQL

### Environment Configuration
- **DATABASE_URL**: Required environment variable for PostgreSQL connection
- **NODE_ENV**: Controls development vs production behavior
- **Development**: Uses Vite dev server with Express API proxy
- **Production**: Serves static files from Express with API routes

### Database Management
- **Migrations**: Drizzle Kit handles schema migrations
- **Connection**: Serverless PostgreSQL connection via Neon
- **Session Storage**: PostgreSQL-backed session store for scalability

The application is designed to be easily deployable on Replit with minimal configuration, requiring only a PostgreSQL database connection string.