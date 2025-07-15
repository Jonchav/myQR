# myQR - QR Code Generator Application

## Overview

This is a full-stack web application built with React and Express that allows users to generate QR codes from URLs. The application features a clean, modern interface using shadcn/ui components and provides immediate QR code generation with download capabilities. The app is branded as "myQR" with a professional, elegant design.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### December 2024
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