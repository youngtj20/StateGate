# LGPOA State Selection Portal

## Overview

This is a state selection landing page for the Local Government Proof of Address (LGPOA) system in Nigeria. The application serves as the entry point where users select their state before being redirected to their state-specific portal. It features a split-screen design with a decorative left panel showing a Nigeria map and a functional right panel with state selection functionality. The system supports all 36 Nigerian states plus the Federal Capital Territory (FCT).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing
- Single-page application (SPA) architecture serving from `/` route

**UI Component System**
- Shadcn/ui component library using Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Design system follows government/institutional portal patterns prioritizing trust, clarity, and accessibility
- Split-screen layout: 45% decorative panel (left) and 55% functional panel (right) on desktop, stacking vertically on mobile

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management and caching
- Local component state with React hooks for UI interactions
- No global state management - application is intentionally simple with minimal state needs

**Key Design Decisions**
- Government-inspired design language (reference: gov.uk, digital.gov.ng) for institutional credibility
- Typography: Inter/DM Sans fonts for modern, highly legible interface
- Tailwind spacing system using consistent units (4, 6, 8, 12, 16, 24) for vertical rhythm
- Mobile-first responsive design with desktop enhancements

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the HTTP server
- HTTP server (not HTTPS in base config) with middleware-based request handling
- Development mode uses Vite middleware for HMR, production serves static files from `dist/public`

**API Design**
- RESTful API endpoint: `GET /api/states` returns list of all Nigerian states
- State data includes name, slug, and path properties for each state
- State routing configured to redirect to state-specific subdomains (e.g., `lagos.lgpoa.ng`)

**Build & Deployment**
- Custom build script using esbuild for server bundling and Vite for client bundling
- Production bundle creates single `dist/index.cjs` server file and `dist/public` client assets
- Server dependencies are bundled (allowlist) to reduce cold start times by minimizing file system calls

**Key Architectural Decisions**
- Separation of client and server concerns with clear directory structure
- Static file serving in production mode falls through to index.html for SPA routing
- Request logging middleware tracks API calls with timing information
- Raw body capture for webhook/payment processing scenarios

### Data Storage

**Database Configuration**
- Drizzle ORM configured for PostgreSQL database access
- Neon serverless PostgreSQL driver (`@neondatabase/serverless`) for database connectivity
- Schema defined in `shared/schema.ts` with a users table (id, username, password)
- Database migrations stored in `./migrations` directory

**Current Implementation**
- In-memory storage implementation (`MemStorage`) for development/testing
- User management with basic CRUD operations (getUser, getUserByUsername, createUser)
- No active database usage in current state selection flow - prepared for future authentication features

**Design Rationale**
- Storage interface pattern allows swapping between in-memory and database implementations
- Shared schema location (`shared/`) enables type sharing between client and server
- Drizzle-zod integration provides runtime validation from database schema

### External Dependencies

**Third-Party UI Libraries**
- Radix UI primitives (@radix-ui/*) for 25+ accessible component foundations (accordion, dialog, dropdown, select, etc.)
- cmdk for command palette/search functionality in state selector
- embla-carousel-react for potential carousel implementations
- lucide-react for consistent icon system

**Development & Build Tools**
- Replit-specific plugins for development banner, error overlay, and cartographer integration
- TypeScript with strict mode enabled for type safety
- PostCSS with Tailwind CSS and Autoprefixer for CSS processing
- tsx for TypeScript execution in development

**State Subdomain Routing**
- Hard-coded mapping of 37 state slugs to subdomain URLs (e.g., "lagos" → "https://lagos.lgpoa.ng")
- Client-side navigation using `window.location.assign()` for state portal redirects
- No proxy middleware configured - direct subdomain redirects from client

**Form & Validation**
- React Hook Form with @hookform/resolvers for form state management
- Zod for schema validation and type inference
- date-fns for date manipulation utilities

**Notable Omissions**
- No authentication system currently active (passport, express-session, jsonwebtoken present but unused)
- No payment processing (Stripe dependency present but not integrated)
- No email service (nodemailer present but not configured)
- No AI integrations (@google/generative-ai, openai present but unused)
- No session storage configured (connect-pg-simple, memorystore available but inactive)