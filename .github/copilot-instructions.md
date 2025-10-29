# Baby Sleep Tracker - Copilot Instructions

## Project Overview
A modern web application for tracking baby sleep patterns with predictive analytics and Home Assistant integration.

### Technologies:
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Prisma ORM with SQLite
- Shadcn/ui components
- Mobile-first responsive design
- API routes for Home Assistant integration

### Features:
- Sleep tracking with timer functionality
- Predictive sleep schedule based on age and historical data
- Beautiful, sleek mobile-first UI
- API endpoints for home automation integration
- Sleep analytics and patterns

### Key Files:
- `/src/app/page.tsx` - Main application interface
- `/src/components/SleepTimer.tsx` - Sleep timer component
- `/src/components/SleepPredictions.tsx` - Predictions display
- `/src/lib/store.ts` - Global state management with Zustand
- `/src/lib/sleep-predictions.ts` - Sleep prediction algorithms
- `/src/app/api/` - API routes for external integrations
- `/prisma/schema.prisma` - Database schema

### Development Guidelines:
- Follow mobile-first design principles
- Maintain TypeScript strict mode
- Use Tailwind CSS for styling
- Follow Next.js 14 App Router patterns
- Implement proper error handling
- Keep API responses consistent for Home Assistant integration

### Code Style:
- Use functional components with hooks
- Implement proper TypeScript types
- Use Zustand for state management
- Follow React best practices
- Maintain clean, readable code structure