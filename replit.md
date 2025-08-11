# myQR - QR Code Generator Application

## Overview
myQR is a full-stack web application for generating QR codes from URLs. It features a modern interface, immediate QR code generation, and direct download capabilities. The project aims to provide a professional and elegant solution for QR code creation, making advanced customization features universally accessible and free. It focuses on offering a seamless user experience for generating functional and visually appealing QR codes, positioning itself as a go-to tool for personal and business use.

## User Preferences
Preferred communication style: Simple, everyday language.
Dashboard preference: Dashboard should only display graphs and metrics, not detailed QR code lists.

## Recent Changes (August 11, 2025)
### ✅ Render Deployment Fixes - COMPLETED
- **Authentication System**: Complete rewrite with `auth-clean.ts` - zero external dependencies
- **Dependencies Cleanup**: Fully removed passport, openid-client, and all problematic packages
- **Port Configuration**: Dynamic port (`process.env.PORT`) configured for Render
- **Build System**: New simplified routes (`routes-simple.ts`) with zero TypeScript errors
- **Deployment Files**: Complete Render configuration (render.yaml, Procfile, .nvmrc, render-build.sh)
- **Error Resolution**: "clientId must be a non-empty string" error completely eliminated
- **Build Verification**: Build test passes, no openid-client references in compiled output
- **Status**: READY FOR DEPLOYMENT ON RENDER ✅

## System Architecture
### Frontend Architecture
- **Framework**: React 18 with TypeScript, built with Vite.
- **UI/UX**: Utilizes `shadcn/ui` components built on Radix UI primitives, styled with Tailwind CSS for a professional and elegant design. Custom CSS variables enable robust theming.
- **Color Schemes**: Features 16 ultra-vibrant creative styles with dedicated Sharp configurations for intense visual effects (e.g., vibrant rainbow, neon cyber, electric blue). Each style applies unique hue, saturation, brightness, and tint transformations. QR codes are generated with specific base colors for each style, replacing black parts with vibrant hues like #FF0080 (vibrant pink) or #00FFFF (cyan).
- **QR Customization**: Supports custom corners with unique designs (gradients, geometric shapes) and decorative patterns (circles, waves, ellipses) using advanced SVG composition with `blend mode 'multiply'` to preserve scannability.
- **Image Integration**: Allows uploading custom background images (up to 15MB) with intelligent caching and fast processing. Images are independent of QR colors to prevent visual interference.
- **Text Customization**: Provides full control over text on QR cards, including positioning (top, center, bottom), alignment (left, center, right), font selection (10+ options), formatting (bold, italic, shadow), size, opacity, and color. Professional text presets are available.
- **Workflow**: Employs an "Apply Changes" button for manual control over customization, replacing automatic regeneration.
- **Performance**: Optimized Sharp configurations for QR generation (quality 85, compressionLevel 4-6, kernel cubic) to reduce processing times.
- **Download Options**: Supports direct download in 6 formats: PNG, JPG, SVG, PDF (Standard/Print), and DOCX. QR resolution is increased for professional output (medium: 1600px, large: 2000px).
- **Responsiveness**: QR codes dynamically resize and center within the canvas.
- **Style Selection**: Styles are presented in a horizontal carousel with automatic previews and intuitive selection indicators.
- **Form Handling**: React Hook Form with Zod validation.
- **State Management**: React Query for server state.
- **Routing**: Wouter for client-side routing.
- **Theming**: Full dark/light theme support.

### Backend Architecture
- **Runtime**: Node.js with Express.js, written in TypeScript.
- **Database**: PostgreSQL via Drizzle ORM, with Neon Database as the provider.
- **Session Management**: PostgreSQL-backed sessions (`connect-pg-simple`).
- **API Design**: RESTful endpoints under the `/api` prefix.
- **QR Code Generation**: Server-side QR code creation using `qrcode` library.
- **Scan Tracking**: Robust system using tracking URLs (`/api/scan/:id`) that register scans in the database and redirect to the original URL. Includes geolocalization by country using `geoip-lite`.
- **History Management**: Optimized history system with pagination for large datasets (20 items per page) and a limit of 100 QR codes per user, with automatic deletion of older entries.
- **Statistics**: Comprehensive statistics dashboard with QR codes ordered by scan count, date filters, total metrics, and interactive bar charts (`Recharts`) for top 10 QR codes.

### Development Environment
- **Dev Server**: Vite development server with HMR.
- **Build Process**: Vite for frontend, esbuild for backend.
- **TypeScript**: Strict mode enabled with path mapping.
- **Environment**: Optimized for Replit.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection.
- **drizzle-orm**: Type-safe database ORM.
- **qrcode**: Server-side QR code generation.
- **@tanstack/react-query**: Client-side server state management.
- **zod**: Schema validation and type inference.
- **@radix-ui/***: Unstyled, accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Icon library.
- **class-variance-authority**: Utility for creating variant-based component APIs.
- **vite**: Frontend build tool and dev server.
- **tsx**: TypeScript execution for development.
- **esbuild**: Fast JavaScript bundler for production backend.
- **geoip-lite**: For geographical tracking of scans.
- **Recharts**: For interactive data visualization in the dashboard.