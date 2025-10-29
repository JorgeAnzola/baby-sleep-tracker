# 🤖 AGENTS.md - AI Agent Development Guide

This document provides guidance for AI agents working on the NapGenius Baby Sleep Tracker codebase.

## 📋 Project Overview

**NapGenius** is a Next.js 15 web application for tracking baby sleep patterns with intelligent predictions and Home Assistant integration.

### Core Technologies
- **Frontend**: Next.js 15, TypeScript, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Authentication**: JWT with jose library, bcryptjs
- **State Management**: Zustand with localStorage persistence
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Deployment**: Docker multi-stage builds

## 🏗️ Architecture

### Directory Structure
```
baby-sleep-tracker/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── babies/       # Baby management
│   │   │   ├── import-csv/   # Huckleberry CSV import
│   │   │   └── sleep-session/ # Sleep tracking
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main application (authenticated)
│   ├── components/
│   │   ├── ui/               # Shadcn/ui components
│   │   ├── CsvImport.tsx     # CSV import dialog
│   │   ├── Settings.tsx      # Settings panel
│   │   ├── SleepHistory.tsx  # Session history
│   │   ├── SleepPredictions.tsx # AI predictions display
│   │   └── SleepTimer.tsx    # Main sleep timer
│   ├── lib/
│   │   ├── i18n/             # Internationalization
│   │   ├── auth.ts           # JWT utilities
│   │   ├── sleep-predictions.ts # Prediction algorithms
│   │   ├── store.ts          # Zustand global state
│   │   └── theme-store.ts    # Theme management
│   └── middleware.ts         # Auth middleware
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
├── scripts/
│   ├── build-and-push.sh    # Docker build/push script
│   └── docker-entrypoint.sh # Container startup
├── docker-compose.yml        # Local development
├── docker-compose.public.yml # Production deployment
├── Dockerfile               # Multi-stage Docker build
└── install.sh               # One-command installer

```

### Key Design Patterns

#### 1. **Server Components + Client Components**
- Use `'use client'` directive only when needed (hooks, state, events)
- Server components by default for better performance
- API routes handle all database operations

#### 2. **Authentication Flow**
- JWT stored in httpOnly cookies
- Middleware protects routes (`/api/*`, `/`, etc.)
- Public routes: `/login`, `/register`
- Token validation on every request

#### 3. **State Management**
- **Zustand** for client state (sleep sessions, timer, current baby)
- **localStorage** persistence for offline capability
- Server state fetched on mount, synced via API

#### 4. **Database Access**
- **Prisma ORM** for all database operations
- Connection pooling handled by Prisma
- Migrations in `prisma/migrations/`
- Schema in `prisma/schema.prisma`

## 🎯 Core Features

### 1. Sleep Tracking
**Files**: `src/components/SleepTimer.tsx`, `src/app/api/sleep-session/route.ts`

- Start/stop sleep sessions (NAP or NIGHTTIME)
- Edit start time during active session
- Edit completed sessions (time, quality, notes)
- Delete sessions with confirmation

**Key Functions**:
```typescript
// Start session
POST /api/sleep-session { baby_id, sleep_type }

// End session
PUT /api/sleep-session { baby_id }

// Edit start time (active)
PATCH /api/sleep-session/edit-start-time { baby_id, new_start_time }

// Edit completed session
PATCH /api/sleep-session/{session-id} { start_time, end_time, quality, notes }

// Delete session
DELETE /api/sleep-session/{session-id}
```

### 2. Predictions Algorithm
**File**: `src/lib/sleep-predictions.ts`

Three prediction functions:
- `predictNextNap()` - Predicts next nap time and duration
- `predictBedtime()` - Predicts nighttime sleep
- `predictWakeUp()` - Predicts wake time during active sleep

**Algorithm Logic**:
1. Age-based sleep patterns (research data)
2. Personal history analysis (last 7-14 days)
3. Wake window calculations
4. Confidence scoring based on data availability

**Age Patterns**:
```typescript
0-3 months: 4 naps, 45-120min wake windows
3-6 months: 3 naps, 120-210min wake windows
6-12 months: 2 naps, 180-270min wake windows
12+ months: 1 nap, 300-360min wake windows
```

### 3. CSV Import (Huckleberry)
**Files**: `src/components/CsvImport.tsx`, `src/app/api/import-csv/route.ts`

- Import historical data from Huckleberry CSV exports
- Automatic sleep type detection (nap vs nighttime based on time)
- Deduplication by start time
- Statistics: total, imported, skipped, errors

**CSV Format Expected**:
```csv
"Type","Start","End","Duration","Start Condition","Start Location","End Condition","Notes"
"Sleep","2025-10-25 13:54","2025-10-25 16:00","02:06",,,,
```

### 4. Multi-User Authentication
**Files**: `src/app/api/auth/`, `src/lib/auth.ts`, `src/middleware.ts`

- JWT-based authentication
- bcrypt password hashing
- httpOnly cookies for token storage
- Protected API routes and pages

**Auth Flow**:
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login` → Sets JWT cookie
3. Middleware validates token on protected routes
4. Logout: `POST /api/auth/logout` → Clears cookie

### 5. Home Assistant Integration
**File**: `src/app/api/sleep-status/route.ts`

REST API for home automation:
```typescript
GET /api/sleep-status?babyId={id}
// Returns:
{
  baby: { id, name, age_in_days },
  current_state: { 
    sleep_state: "awake|sleeping|sleepy_soon|bedtime_soon",
    time_until_next_sleep: number
  },
  predictions: { next_nap, bedtime }
}
```

## 🛠️ Development Guidelines

### Adding New Features

#### 1. **New API Endpoint**
```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Your logic here
  return NextResponse.json({ data: 'response' });
}
```

#### 2. **New Component**
```typescript
// src/components/YourComponent.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function YourComponent() {
  const [state, setState] = useState<string>('');
  
  return (
    <div className="space-y-4">
      {/* Your JSX */}
    </div>
  );
}
```

#### 3. **Database Schema Change**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name your_change_name
# 3. Generate Prisma Client
npx prisma generate
```

### Code Style

- **TypeScript strict mode**: All types must be explicit
- **Functional components**: Use hooks, not class components
- **Tailwind CSS**: Use utility classes, avoid custom CSS
- **Mobile-first**: Start with mobile layout, add desktop with `md:` `lg:`
- **Error handling**: Always try/catch async operations
- **Loading states**: Show skeletons/spinners during fetches

### Testing Changes

```bash
# Development
npm run dev

# Build for production
npm run build
npm start

# Docker build
docker build -t napgenius:test .
docker-compose up

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🐳 Docker Deployment

### Build Process
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy built assets...
ENTRYPOINT ["./docker-entrypoint.sh"]
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@db:5432/napgenius?schema=public
JWT_SECRET=your_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=production
```

### Publishing New Version
```bash
# 1. Update version
./scripts/build-and-push.sh 1.0.3

# 2. Tag release
git tag -a v1.0.3 -m "Release 1.0.3"
git push --tags

# 3. Update Docker Hub description (manual)
# Copy content from DOCKER_HUB_README.md
```

## 🔍 Common Tasks

### Add New Language
See `ADDING_LANGUAGES_AND_THEMES.md` for detailed guide.

**Quick steps**:
1. Create `src/lib/i18n/languages/your-lang.ts`
2. Add to `src/lib/i18n/language-store.ts`
3. Test all UI strings

### Add New Theme
1. Create theme config in `src/lib/theme-store.ts`
2. Define color gradients (Tailwind classes)
3. Add to theme selector in Settings

### Improve Predictions
1. Edit `src/lib/sleep-predictions.ts`
2. Adjust age patterns or confidence calculations
3. Test with various age ranges and data amounts

### Add Database Field
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field_name`
3. Update TypeScript types
4. Update API endpoints that use the model
5. Update UI components

## 🐛 Debugging

### Common Issues

**1. Docker build fails**
- Check Node.js version (must be 20+)
- Verify `.dockerignore` doesn't exclude needed files
- Run `npm ci` locally first to check dependencies

**2. Database connection errors**
- Verify `DATABASE_URL` format
- Check PostgreSQL is running
- Wait for health check in docker-compose

**3. JWT authentication fails**
- Check `JWT_SECRET` is set
- Verify cookie settings (httpOnly, secure in production)
- Check middleware.ts is protecting correct routes

**4. Predictions not updating**
- Verify sessions are saving to database
- Check `generatePredictions()` is called after changes
- Log prediction function inputs for debugging

### Logging
```typescript
// Add strategic console.logs
console.log('State:', { activeSleepSession, sleepSessions });
console.log('Prediction input:', { ageInDays, sessionCount });
```

### Database Inspection
```bash
npx prisma studio
# Opens GUI at http://localhost:5555
```

## 📚 Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Zustand State Management](https://docs.pmnd.rs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing Guidelines

1. **Branch naming**: `feature/feature-name`, `fix/bug-description`
2. **Commit messages**: Use conventional commits
   - `feat: add CSV export`
   - `fix: resolve timer desync`
   - `docs: update API documentation`
3. **Pull requests**: Include description, screenshots if UI change
4. **Testing**: Test on mobile and desktop before PR
5. **TypeScript**: No `any` types, fix all errors

## 🔐 Security Notes

- **Never commit** `.env` files
- **JWT_SECRET** must be strong (32+ characters)
- **Passwords** must be hashed with bcrypt (10+ rounds)
- **SQL injection** prevented by Prisma parameterization
- **XSS** prevented by React's automatic escaping
- **CSRF** mitigated by httpOnly cookies + same-origin

## 📝 Version History

- **v1.0.0**: Initial Docker Hub release
- **v1.0.1**: One-command installation script
- **v1.0.2**: Huckleberry CSV import feature documented
- **v1.0.3**: Generic naming, English README

---

**For AI Agents**: This file provides complete context for understanding and modifying the NapGenius codebase. Always refer to this when making changes or adding features.
