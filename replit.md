# StackIt - Q&A Platform

## Overview

StackIt is a complete Stack Overflow-inspired Q&A platform that supports collaborative learning and structured knowledge sharing. Built as a modern web application, it allows users to ask questions, provide answers, vote on content, and receive real-time notifications. The platform features a React frontend with rich text editing capabilities, an Express.js backend, PostgreSQL database with Drizzle ORM, and seamless Replit authentication integration.

## Recent Changes (July 12, 2025)

- ✅ Implemented complete user authentication system with role support (Guest/User/Admin)
- ✅ Built rich text editor with full formatting (bold, italic, lists, links, images, emojis, text alignment)
- ✅ Created question posting system with title, description, and multi-tag support
- ✅ Developed answer posting and voting system with upvote/downvote functionality
- ✅ Added question owner answer acceptance feature
- ✅ Implemented real-time notification system with bell icon and unread count
- ✅ Built tag system with search suggestions and color coding
- ✅ Added view tracking and community statistics
- ✅ Created responsive design with sidebar navigation
- ✅ Fixed query client URL parameter handling for proper data fetching
- ✅ Successfully deployed with PostgreSQL database integration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Rich Text Editor**: Tiptap for question/answer content creation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Replit OIDC integration with Passport.js
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations

### Database Schema
The application uses PostgreSQL with the following core entities:
- **Users**: Stores user profiles from Replit auth
- **Questions**: Main content with title, content, votes, views
- **Answers**: Responses to questions with voting and acceptance
- **Tags**: Categorization system with color coding
- **Votes**: User voting on questions and answers
- **Notifications**: Real-time user notifications
- **Sessions**: Authentication session storage

## Key Components

### Authentication System
- **Provider**: Replit OIDC for seamless integration
- **Strategy**: OpenID Connect with automatic user creation
- **Session Storage**: PostgreSQL-backed sessions with 7-day expiry
- **Authorization**: Route-level protection with middleware

### Question & Answer System
- **Rich Content**: Tiptap editor for formatted text, links, images
- **Voting**: Upvote/downvote system for content quality
- **Acceptance**: Question authors can mark best answers
- **Tagging**: Multi-tag system for categorization
- **Search**: Tag-based filtering and sorting options

### Real-time Features
- **Notifications**: Vote, answer, and acceptance notifications
- **Live Updates**: Query invalidation for real-time data sync
- **View Tracking**: Automatic question view counting

### UI/UX Components
- **Design System**: Consistent shadcn/ui components
- **Responsive**: Mobile-first design with Tailwind breakpoints
- **Accessibility**: Radix primitives ensure ARIA compliance
- **Theming**: CSS custom properties for light/dark mode support

## Data Flow

### Question Creation Flow
1. User opens Ask Question modal
2. Form validation with Zod schemas
3. Rich text content processed by Tiptap
4. Tags selected/created with autocomplete
5. Backend creates question with tag associations
6. React Query cache invalidation triggers UI updates

### Authentication Flow
1. User clicks login -> redirects to Replit OIDC
2. Successful auth creates/updates user in database
3. Session stored in PostgreSQL with connect-pg-simple
4. Frontend receives user data via protected API endpoint
5. React Query manages auth state across components

### Voting System
1. User clicks vote buttons on questions/answers
2. Optimistic updates provide immediate feedback
3. Backend validates vote permissions and updates scores
4. Database constraints prevent duplicate voting
5. Real-time notifications sent to content authors

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, TanStack Query
- **Backend**: Express.js, Passport.js for auth, express-session
- **Database**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
- **UI Components**: Radix UI primitives, Lucide icons, Tailwind CSS
- **Rich Text**: Tiptap editor with various extensions
- **Validation**: Zod for schema validation, Hookform resolvers

### Development Tools
- **Build**: Vite with React plugin and TypeScript support
- **Code Quality**: TypeScript for type safety, ESLint configuration
- **Styling**: PostCSS with Tailwind and Autoprefixer
- **Development**: tsx for TypeScript execution, esbuild for production

### External Services
- **Authentication**: Replit OIDC service integration
- **Database**: Neon PostgreSQL serverless platform
- **Hosting**: Optimized for Replit deployment environment

## Deployment Strategy

### Development Environment
- **Server**: Vite dev server with HMR and middleware mode
- **Database**: Neon development database with connection pooling
- **Authentication**: Replit dev environment OIDC configuration
- **Hot Reload**: Full-stack development with automatic restarts

### Production Build
- **Frontend**: Vite builds optimized React bundle to dist/public
- **Backend**: esbuild compiles TypeScript server to dist/index.js
- **Assets**: Static files served by Express in production
- **Environment**: NODE_ENV-based configuration switching

### Database Management
- **Migrations**: Drizzle Kit for schema migrations
- **Schema**: Shared TypeScript definitions between frontend/backend
- **Connection**: Pooled connections with WebSocket support for Neon
- **Sessions**: Automatic session table management with TTL cleanup

The application is architected for scalability with proper separation of concerns, type safety throughout the stack, and modern development practices. The choice of technologies prioritizes developer experience while maintaining production-ready performance and reliability.