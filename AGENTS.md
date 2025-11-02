# 🤖 AGENTS.md - AI Agent Development Guide

This document provides guidance for AI agents working on the NapGenius Baby Sleep Tracker codebase.

## 📋 Project Overview

**NapGenius** is a Next.js 16 web application for tracking baby sleep patterns with intelligent predictions and Home Assistant integration.

### Core Technologies
- **Frontend**: Next.js 16 (Turbopack), TypeScript, React, Tailwind CSS
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
│   │   │   ├── baby-settings/ # Baby-specific settings (v1.0.6+)
│   │   │   ├── import-csv/   # Huckleberry CSV import
│   │   │   ├── night-waking/ # Night waking tracking (planned)
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
│   │   ├── SleepTimer.tsx    # Main sleep timer
│   │   └── ScheduleConfig.tsx # Baby schedule configuration
│   ├── lib/
│   │   ├── auth.ts           # JWT utilities + verifyAuth helper
│   │   ├── sleep-predictions.ts # Prediction algorithms
│   │   ├── store.ts          # Zustand global state
│   │   ├── theme-store.ts    # Theme management
│   │   └── language-store.ts # i18n language store
│   └── middleware.ts         # Auth middleware
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
├── scripts/
│   ├── build-and-push.sh    # Docker build/push script
│   ├── docker-entrypoint.sh # Container startup
│   └── migrate-schedule-config.ts # Data migration script (v1.0.6)
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
- `verifyAuth(request)` helper returns userId or null

#### 3. **State Management**
- **Zustand** for client state (sleep sessions, timer, current baby, baby-specific settings)
- **localStorage** persistence for offline capability
- Server state fetched on mount, synced via API
- **Per-baby settings** stored in `babySettings` keyed by babyId (v1.0.6+)

#### 4. **Database Access**
- **Prisma ORM** for all database operations
- Connection pooling handled by Prisma
- Migrations in `prisma/migrations/`
- Schema in `prisma/schema.prisma`

#### 5. **Next.js 16 Route Handlers**
- Dynamic route params are **Promises** that must be `await`ed
- Example: `async function GET(req, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; }`

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
- `predictBedtime()` - Intelligently predicts nighttime sleep with daily pattern analysis
- `predictWakeUp()` - Predicts wake time during active sleep

#### **Nap Prediction Logic**:
1. **Base Pattern**: Age-based or custom schedule
2. **Personal History**: Analyzes last 60 days, blends with base (up to 80% weight)
3. **Wake Window**: Time since last sleep + expected awake window
4. **Confidence**: Based on sample size, consistency, and current timing accuracy

**Example Output**: 
```
"Personalized prediction (42 samples, 78% consistent) based on custom schedule - 81min awake, expecting 120min - Nap 1/2"
```

#### **Bedtime Prediction Logic** (Enhanced in v1.0.5):
1. **Base Blending**: Combines custom bedtime with historical average (up to 70% personal weight)
2. **Nap Count Adjustment**: 
   - Fewer naps than expected → Earlier bedtime (-15min per missing nap)
   - More naps → Later bedtime (+10min per extra nap)
3. **Nap Duration Analysis**: 
   - Total nap time vs expected → Adjusts bedtime accordingly
   - More sleep → Later bedtime (up to +30min)
   - Less sleep → Earlier bedtime (up to -30min)
4. **Last Wake Window**: Checks if last nap ended recently, pushes bedtime if needed
5. **No-Nap Days**: If awake 8+ hours, suggests earlier bedtime (-30min)
6. **Confidence**: 55-95% based on data quality and current day patterns

**Example Output**:
```
"Blended (custom 19:00 + 25 samples, 65% consistent) • 1 fewer nap (-15min) • Last nap recent (+10min)"
"Personalized (42 samples, 78% consistent) • +0.8h naps (+20min)"
```

**Age Patterns**:
```typescript
0-3 months: 4 naps, 45-120min wake windows, bedtime ~19:00-19:30
3-6 months: 3 naps, 120-210min wake windows, bedtime ~19:00
6-12 months: 2 naps, 180-270min wake windows, bedtime ~19:00
12+ months: 1 nap, 300-360min wake windows, bedtime ~19:30-20:00
```

**Key Features**:
- Both nap and bedtime predictions now consider **real-time daily context**
- Adjusts dynamically based on how the day actually went
- Provides detailed reasoning for transparency
- Never blindly follows custom schedules - always blends with reality

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

### 5. Baby-Specific Settings (v1.0.6+)
**Files**: `src/app/api/baby-settings/[babyId]/route.ts`, `src/components/ScheduleConfig.tsx`, `scripts/migrate-schedule-config.ts`

**Critical Architecture Change**: Settings moved from per-user (`User.scheduleConfig`) to per-baby (`BabySettings` table) to ensure all collaborators viewing the same baby see identical schedule settings.

**Key Features**:
- Per-baby schedule configuration (napsPerDay, wakeWindows, napDurations, bedtime)
- All collaborators see the same settings for each baby
- User preferences (theme, language) remain per-user
- Automatic debounced save (1 second delay)
- Fallback to User.scheduleConfig for backward compatibility

**API Endpoints**:
```typescript
// Get baby-specific settings
GET /api/baby-settings/[babyId]
// Returns: { babyId, bedtime, wakeTime, napsPerDay, wakeWindows, napDurations, predictAlerts, quietHours }

// Update baby-specific settings (requires OWNER or EDITOR role)
PUT /api/baby-settings/[babyId]
// Body: { bedtime?, wakeTime?, napsPerDay?, wakeWindows?, napDurations?, predictAlerts?, quietHours? }
```

**Data Migration**:
- Run `npx ts-node scripts/migrate-schedule-config.ts` to migrate existing User.scheduleConfig to BabySettings
- Script copies owner's scheduleConfig to baby's settings table
- User.scheduleConfig kept for backward compatibility but deprecated

**Store Integration**:
```typescript
// In store.ts
babySettings: Record<string, BabySettings>; // Keyed by babyId
fetchBabySettings: (babyId: string) => Promise<void>;
updateBabySettings: (babyId: string, settings: Partial<BabySettings>) => Promise<void>;
getBabySettings: (babyId: string) => BabySettings | null;
```

**Important**: When making predictions, always use baby-specific settings from `babySettings[babyId]`, not user preferences.

### 6. Home Assistant Integration
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

#### 1. **New API Endpoint (Next.js 16)**
```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Note: params is a Promise in Next.js 16
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params; // IMPORTANT: Must await params
  
  // Your logic here
  return NextResponse.json({ data: 'response' });
}
```

#### 2. **New Component**
```typescript
// src/components/YourComponent.tsx
'use client';

import { useState } from 'react';
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
