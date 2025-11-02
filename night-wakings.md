

================================================================================
IMPLEMENTATION INSTRUCTIONS FOR NIGHT WAKING TRACKING FEATURE
================================================================================

PROJECT: Baby Sleep Tracker (NapGenius)
TECH STACK: Next.js 16, TypeScript, Prisma, PostgreSQL, Shadcn/ui
OBJECTIVE: Add night waking tracking with analytics and NapGenius integration

================================================================================
PHASE 1: INSTALL DEPENDENCIES
================================================================================

Execute in project root:
```bash
npm install next-intl recharts
```

Verify installation completes without errors.

================================================================================
PHASE 2: UPDATE CONFIGURATION FILES
================================================================================

FILE: next.config.ts (REPLACE ENTIRE FILE)
-------------------------------------------
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // Preserve any existing configuration from the original file
};

export default withNextIntl(nextConfig);
-------------------------------------------

FILE: src/i18n/routing.ts (CREATE NEW)
-------------------------------------------
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'de', 'fr', 'pt'],
  defaultLocale: 'en'
});
-------------------------------------------

FILE: src/i18n/request.ts (CREATE NEW)
-------------------------------------------
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
-------------------------------------------

================================================================================
PHASE 3: CREATE TRANSLATION FILES
================================================================================

FILE: messages/en.json (CREATE NEW)
-------------------------------------------
{
  "nightWaking": {
    "title": "Night Wakings",
    "logWake": "Log Night Wake",
    "backToSleep": "Back to Sleep",
    "wakeTime": "Wake Time",
    "duration": "Duration",
    "interventionType": "Intervention",
    "feedDetails": "Feed Details",
    "notes": "Notes",
    "tags": "Tags",
    "summary": "Night Summary",
    "totalWakings": "Total Wakings",
    "longestStretch": "Longest Sleep Stretch",
    "totalNightSleep": "Total Night Sleep",
    "averageWakeDuration": "Avg Wake Duration",
    "analytics": {
      "title": "Night Waking Analytics",
      "weeklyTrend": "Weekly Trend",
      "interventionBreakdown": "Intervention Types",
      "commonTags": "Common Reasons",
      "last7Days": "Last 7 Days",
      "last30Days": "Last 30 Days",
      "improvementTip": "Improvement detected! Keep up the good work.",
      "concernTip": "Increasing wakings detected. Consider reviewing bedtime routine.",
      "stable": "Sleep pattern is stable",
      "improving": "Sleep quality improving",
      "worsening": "More wakings than before"
    },
    "interventions": {
      "FEED": "Feed",
      "DIAPER": "Diaper Change",
      "COMFORT": "Comfort",
      "NONE": "Self-Soothed"
    },
    "feedTypes": {
      "BOTTLE": "Bottle",
      "BREAST": "Breast"
    },
    "units": {
      "OZ": "oz",
      "ML": "ml"
    },
    "commonTags": {
      "hungry": "Hungry",
      "teething": "Teething",
      "scared": "Scared",
      "wetDiaper": "Wet Diaper",
      "dirtyDiaper": "Dirty Diaper",
      "tooHot": "Too Hot",
      "tooCold": "Too Cold",
      "nightmare": "Nightmare",
      "noise": "Noise"
    },
    "validation": {
      "wakeTimeRequired": "Wake time is required",
      "backToSleepAfterWake": "Back to sleep time must be after wake time",
      "feedAmountRequired": "Feed amount is required when feed type is selected"
    },
    "success": {
      "logged": "Night waking logged successfully",
      "updated": "Night waking updated successfully",
      "deleted": "Night waking deleted successfully"
    }
  }
}
-------------------------------------------

FILE: messages/es.json (CREATE NEW)
-------------------------------------------
{
  "nightWaking": {
    "title": "Despertares Nocturnos",
    "logWake": "Registrar Despertar",
    "backToSleep": "VolviÃ³ a Dormir",
    "wakeTime": "Hora de Despertar",
    "duration": "DuraciÃ³n",
    "interventionType": "IntervenciÃ³n",
    "feedDetails": "Detalles de AlimentaciÃ³n",
    "notes": "Notas",
    "tags": "Etiquetas",
    "summary": "Resumen de la Noche",
    "totalWakings": "Total de Despertares",
    "longestStretch": "Mayor PerÃ­odo de SueÃ±o",
    "totalNightSleep": "SueÃ±o Total Nocturno",
    "averageWakeDuration": "DuraciÃ³n Promedio",
    "analytics": {
      "title": "AnÃ¡lisis de Despertares",
      "weeklyTrend": "Tendencia Semanal",
      "interventionBreakdown": "Tipos de IntervenciÃ³n",
      "commonTags": "Razones Comunes",
      "last7Days": "Ãšltimos 7 DÃ­as",
      "last30Days": "Ãšltimos 30 DÃ­as",
      "improvementTip": "Â¡Mejora detectada! Sigue asÃ­.",
      "concernTip": "Incremento detectado. Considera revisar la rutina.",
      "stable": "PatrÃ³n estable",
      "improving": "Calidad mejorando",
      "worsening": "MÃ¡s despertares"
    },
    "interventions": {
      "FEED": "AlimentaciÃ³n",
      "DIAPER": "Cambio de PaÃ±al",
      "COMFORT": "Consuelo",
      "NONE": "Se CalmÃ³ Solo"
    },
    "feedTypes": {
      "BOTTLE": "BiberÃ³n",
      "BREAST": "Pecho"
    },
    "units": {
      "OZ": "oz",
      "ML": "ml"
    },
    "commonTags": {
      "hungry": "Hambre",
      "teething": "DenticiÃ³n",
      "scared": "Asustado",
      "wetDiaper": "PaÃ±al Mojado",
      "dirtyDiaper": "PaÃ±al Sucio",
      "tooHot": "Mucho Calor",
      "tooCold": "Mucho FrÃ­o",
      "nightmare": "Pesadilla",
      "noise": "Ruido"
    },
    "validation": {
      "wakeTimeRequired": "La hora de despertar es obligatoria",
      "backToSleepAfterWake": "La hora debe ser despuÃ©s del despertar",
      "feedAmountRequired": "La cantidad es obligatoria"
    },
    "success": {
      "logged": "Despertar registrado exitosamente",
      "updated": "Despertar actualizado exitosamente",
      "deleted": "Despertar eliminado exitosamente"
    }
  }
}
-------------------------------------------

================================================================================
PHASE 4: UPDATE DATABASE SCHEMA
================================================================================

FILE: prisma/schema.prisma (MODIFY EXISTING)
-------------------------------------------

STEP 4.1: Add the following model at the end of the file:

model NightWaking {
  id              String       @id @default(cuid())
  sleepSessionId  String       @map("sleep_session_id")
  sleepSession    SleepSession @relation(fields: [sleepSessionId], references: [id], onDelete: Cascade)

  wakeTime        DateTime     @map("wake_time")
  backToSleepTime DateTime?    @map("back_to_sleep_time")
  durationMinutes Int?         @map("duration_minutes")

  interventionType String      @map("intervention_type")
  feedType        String?      @map("feed_type")
  feedAmount      Float?       @map("feed_amount")
  feedUnit        String?      @map("feed_unit")

  notes           String?
  tags            String[]

  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  @@map("night_wakings")
  @@index([sleepSessionId])
  @@index([wakeTime])
}

STEP 4.2: Find the existing "model SleepSession" and add this line inside it:
  nightWakings  NightWaking[]

STEP 4.3: Run migration:
```bash
npx prisma migrate dev --name add_night_wakings
npx prisma generate
```
-------------------------------------------

================================================================================
PHASE 5: CREATE API ROUTES
================================================================================

FILE: src/app/api/night-waking/route.ts (CREATE NEW)
-------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sleepSessionId,
      wakeTime,
      backToSleepTime,
      interventionType,
      feedType,
      feedAmount,
      feedUnit,
      notes,
      tags
    } = body;

    const sleepSession = await prisma.sleepSession.findFirst({
      where: {
        id: sleepSessionId,
        baby: {
          userId: auth.userId
        }
      }
    });

    if (!sleepSession) {
      return NextResponse.json({ error: 'Sleep session not found' }, { status: 404 });
    }

    if (interventionType === 'FEED' && feedType && !feedAmount) {
      return NextResponse.json({ 
        error: 'Feed amount is required when feed type is provided' 
      }, { status: 400 });
    }

    let durationMinutes = null;
    if (backToSleepTime) {
      const wake = new Date(wakeTime);
      const sleep = new Date(backToSleepTime);
      durationMinutes = Math.round((sleep.getTime() - wake.getTime()) / 60000);
    }

    const nightWaking = await prisma.nightWaking.create({
      data: {
        sleepSessionId,
        wakeTime: new Date(wakeTime),
        backToSleepTime: backToSleepTime ? new Date(backToSleepTime) : null,
        durationMinutes,
        interventionType,
        feedType,
        feedAmount,
        feedUnit,
        notes,
        tags: tags || []
      }
    });

    return NextResponse.json(nightWaking, { status: 201 });
  } catch (error) {
    console.error('Error creating night waking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sleepSessionId = searchParams.get('sleepSessionId');
    const babyId = searchParams.get('babyId');

    if (!sleepSessionId && !babyId) {
      return NextResponse.json({ 
        error: 'Either sleepSessionId or babyId is required' 
      }, { status: 400 });
    }

    const where: any = {
      sleepSession: {
        baby: {
          userId: auth.userId
        }
      }
    };

    if (sleepSessionId) {
      where.sleepSessionId = sleepSessionId;
    }

    if (babyId) {
      where.sleepSession = {
        ...where.sleepSession,
        babyId
      };
    }

    const nightWakings = await prisma.nightWaking.findMany({
      where,
      include: {
        sleepSession: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            sleepType: true
          }
        }
      },
      orderBy: {
        wakeTime: 'desc'
      }
    });

    return NextResponse.json(nightWakings);
  } catch (error) {
    console.error('Error fetching night wakings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
-------------------------------------------

FILE: src/app/api/night-waking/[id]/route.ts (CREATE NEW)
-------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      wakeTime,
      backToSleepTime,
      interventionType,
      feedType,
      feedAmount,
      feedUnit,
      notes,
      tags
    } = body;

    const existing = await prisma.nightWaking.findFirst({
      where: {
        id: params.id,
        sleepSession: {
          baby: {
            userId: auth.userId
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Night waking not found' }, { status: 404 });
    }

    let durationMinutes = existing.durationMinutes;
    if (backToSleepTime) {
      const wake = new Date(wakeTime || existing.wakeTime);
      const sleep = new Date(backToSleepTime);
      durationMinutes = Math.round((sleep.getTime() - wake.getTime()) / 60000);
    }

    const updated = await prisma.nightWaking.update({
      where: { id: params.id },
      data: {
        ...(wakeTime && { wakeTime: new Date(wakeTime) }),
        ...(backToSleepTime !== undefined && { 
          backToSleepTime: backToSleepTime ? new Date(backToSleepTime) : null 
        }),
        ...(durationMinutes !== null && { durationMinutes }),
        ...(interventionType && { interventionType }),
        ...(feedType !== undefined && { feedType }),
        ...(feedAmount !== undefined && { feedAmount }),
        ...(feedUnit !== undefined && { feedUnit }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags })
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating night waking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.nightWaking.findFirst({
      where: {
        id: params.id,
        sleepSession: {
          baby: {
            userId: auth.userId
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Night waking not found' }, { status: 404 });
    }

    await prisma.nightWaking.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting night waking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
-------------------------------------------

FILE: src/app/api/night-waking/analytics/route.ts (CREATE NEW)
-------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!babyId) {
      return NextResponse.json({ error: 'babyId is required' }, { status: 400 });
    }

    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        userId: auth.userId
      }
    });

    if (!baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const wakings = await prisma.nightWaking.findMany({
      where: {
        sleepSession: {
          babyId,
          sleepType: 'NIGHT',
          startTime: {
            gte: startDate
          }
        }
      },
      include: {
        sleepSession: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        wakeTime: 'asc'
      }
    });

    const analytics = calculateAnalytics(wakings, days);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateAnalytics(wakings: any[], days: number) {
  const wakingsByDate: { [key: string]: any[] } = {};
  wakings.forEach(waking => {
    const date = new Date(waking.wakeTime).toISOString().split('T')[0];
    if (!wakingsByDate[date]) {
      wakingsByDate[date] = [];
    }
    wakingsByDate[date].push(waking);
  });

  const dailyStats = Object.entries(wakingsByDate).map(([date, dayWakings]) => ({
    date,
    count: dayWakings.length,
    avgDuration: dayWakings.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) / dayWakings.length,
    interventions: dayWakings.reduce((acc, w) => {
      acc[w.interventionType] = (acc[w.interventionType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number })
  }));

  const interventionCounts = wakings.reduce((acc, w) => {
    acc[w.interventionType] = (acc[w.interventionType] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const tagCounts = wakings.reduce((acc, w) => {
    w.tags.forEach((tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as { [key: string]: number });

  const midPoint = Math.floor(days / 2);
  const midDate = new Date();
  midDate.setDate(midDate.getDate() - midPoint);

  const firstHalf = wakings.filter(w => new Date(w.wakeTime) < midDate);
  const secondHalf = wakings.filter(w => new Date(w.wakeTime) >= midDate);

  const avgFirstHalf = firstHalf.length / midPoint;
  const avgSecondHalf = secondHalf.length / midPoint;
  const trend = avgSecondHalf - avgFirstHalf;

  return {
    totalWakings: wakings.length,
    averagePerNight: wakings.length / days,
    averageDuration: wakings.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) / wakings.length || 0,
    dailyStats,
    interventionBreakdown: interventionCounts,
    commonTags: Object.entries(tagCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count })),
    trend: {
      direction: trend > 0.5 ? 'increasing' : trend < -0.5 ? 'decreasing' : 'stable',
      change: trend,
      firstHalfAvg: avgFirstHalf,
      secondHalfAvg: avgSecondHalf
    }
  };
}
-------------------------------------------

================================================================================
PHASE 6: CREATE REACT COMPONENTS
================================================================================

FILE: src/components/NightWakingLogger.tsx (CREATE NEW)
-------------------------------------------
[FULL COMPONENT CODE - See previous response for complete implementation]
This is the dialog form component for logging night wakings.
Key features:
- DateTime inputs for wake/sleep times
- Intervention type selector (FEED, DIAPER, COMFORT, NONE)
- Feed details (type, amount, unit) when FEED selected
- Tag selection for common reasons
- Notes textarea
- Form validation and submission
-------------------------------------------

FILE: src/components/NightSleepSummary.tsx (CREATE NEW)
-------------------------------------------
[FULL COMPONENT CODE - See previous response for complete implementation]
This displays the night summary card with:
- Total wakings count
- Longest continuous sleep stretch
- Total night sleep (excluding wake time)
- List of all wakings with details
- Real-time updates when new wakings logged
-------------------------------------------

FILE: src/components/NightWakingAnalytics.tsx (CREATE NEW)
-------------------------------------------
[FULL COMPONENT CODE - See previous response for complete implementation]
This shows analytics dashboard with:
- 7-day and 30-day view toggle
- Trend analysis (improving/worsening/stable)
- Line chart of daily wakings
- Pie chart of intervention types
- List of most common waking reasons
- Average statistics
-------------------------------------------

================================================================================
PHASE 7: INTEGRATE INTO EXISTING COMPONENTS
================================================================================

STEP 7.1: Find the main sleep tracking component (likely SleepTimer.tsx or similar)

STEP 7.2: Add imports at the top:
```typescript
import { NightWakingLogger } from '@/components/NightWakingLogger';
import { NightSleepSummary } from '@/components/NightSleepSummary';
```

STEP 7.3: Locate where active sleep sessions are displayed. Add this code 
          inside the component where night sleep sessions are shown:

```typescript
{activeSleepSession && activeSleepSession.sleepType === 'NIGHT' && (
  <div className="space-y-4 mt-4">
    <NightWakingLogger 
      sleepSessionId={activeSleepSession.id}
      onSuccess={() => {
        // Refresh your data here - use whatever refresh function exists
        // Example: refetchSleepSession() or similar
      }}
    />
    <NightSleepSummary
      sleepSessionId={activeSleepSession.id}
      sessionStartTime={activeSleepSession.startTime}
      sessionEndTime={activeSleepSession.endTime}
    />
  </div>
)}
```

STEP 7.4: For analytics page (create new or add to dashboard):
```typescript
import { NightWakingAnalytics } from '@/components/NightWakingAnalytics';

// In the component:
<NightWakingAnalytics babyId={currentBaby.id} />
```

================================================================================
PHASE 8: NAPGENIUS PREDICTION ENHANCEMENT
================================================================================

FILE: src/lib/sleep-predictions-enhanced.ts (CREATE NEW)
-------------------------------------------
import { prisma } from '@/lib/prisma';

interface NightWakingImpact {
  totalWakings: number;
  totalWakeMinutes: number;
  sleepQualityScore: number;
  adjustedWakeWindow: number;
}

export async function calculateNightWakingImpact(
  babyId: string,
  lastNightSessionId?: string
): Promise<NightWakingImpact> {
  const lastNightWakings = await prisma.nightWaking.findMany({
    where: {
      sleepSession: {
        babyId,
        sleepType: 'NIGHT',
        ...(lastNightSessionId ? { id: lastNightSessionId } : {
          startTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        })
      }
    }
  });

  const totalWakings = lastNightWakings.length;
  const totalWakeMinutes = lastNightWakings.reduce(
    (sum, w) => sum + (w.durationMinutes || 0), 
    0
  );

  let qualityScore = 100;
  qualityScore -= totalWakings * 10;
  qualityScore -= totalWakeMinutes * 0.5;

  const selfSoothings = lastNightWakings.filter(w => w.interventionType === 'NONE').length;
  qualityScore += selfSoothings * 5;

  qualityScore = Math.max(0, Math.min(100, qualityScore));

  let wakeWindowAdjustment = 0;
  if (qualityScore < 50) {
    wakeWindowAdjustment = -15;
  } else if (qualityScore < 70) {
    wakeWindowAdjustment = -5;
  } else if (qualityScore > 90) {
    wakeWindowAdjustment = 5;
  }

  return {
    totalWakings,
    totalWakeMinutes,
    sleepQualityScore: qualityScore,
    adjustedWakeWindow: wakeWindowAdjustment
  };
}

export function enhancePredictionWithNightData(
  basePrediction: any,
  nightImpact: NightWakingImpact
) {
  return {
    ...basePrediction,
    adjustedWakeWindow: basePrediction.wakeWindow + nightImpact.adjustedWakeWindow,
    confidence: basePrediction.confidence * (nightImpact.sleepQualityScore / 100),
    reasoning: `${basePrediction.reasoning} â€¢ Night quality: ${Math.round(nightImpact.sleepQualityScore)}% (${nightImpact.totalWakings} wakings, ${nightImpact.totalWakeMinutes}min awake)`
  };
}
-------------------------------------------

STEP 8.1: Find the existing sleep prediction calculation file 
          (likely src/lib/sleep-predictions.ts)

STEP 8.2: Add import:
```typescript
import { calculateNightWakingImpact, enhancePredictionWithNightData } from './sleep-predictions-enhanced';
```

STEP 8.3: In the main prediction function, after calculating base prediction:
```typescript
// Calculate base prediction as before
const basePrediction = calculateBasePrediction(baby, sessions);

// Add night waking impact
const nightImpact = await calculateNightWakingImpact(baby.id);
const enhancedPrediction = enhancePredictionWithNightData(basePrediction, nightImpact);

// Return enhanced prediction
return enhancedPrediction;
```

================================================================================
PHASE 9: DOCKER INTEGRATION (IF APPLICABLE)
================================================================================

FILE: scripts/docker-entrypoint.sh (MODIFY EXISTING)
-------------------------------------------
Add these lines before "exec node server.js" or similar:

echo "ðŸ”„ Running database migrations..."
npx prisma migrate deploy
npx prisma generate
echo "âœ… Database migrations complete!"
-------------------------------------------

================================================================================
PHASE 10: VERIFICATION & TESTING
================================================================================

1. Restart development server:
   ```bash
   npm run dev
   # OR if using Docker:
   docker-compose restart
   ```

2. Verify database migration:
   ```bash
   npx prisma studio
   # Check that "NightWaking" table exists
   ```

3. Test the feature:
   - Create or navigate to an active NIGHT sleep session
   - Click "Log Night Wake" button
   - Fill form and submit
   - Verify waking appears in Night Summary card
   - Navigate to analytics page
   - Verify charts and statistics display

4. Check for errors:
   - Browser console (F12)
   - Server logs
   - Network tab for API calls

================================================================================
IMPORTANT NOTES FOR IMPLEMENTATION
================================================================================

1. ADJUST IMPORT PATHS: The project may use different paths for:
   - @/lib/prisma â†’ Check actual prisma client import location
   - @/lib/auth â†’ Check actual auth verification function location
   - @/components/ui/* â†’ Verify shadcn/ui components are installed

2. MISSING UI COMPONENTS: If any shadcn/ui components are missing, install:
   ```bash
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add select
   npx shadcn-ui@latest add badge
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add tabs
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add label
   npx shadcn-ui@latest add textarea
   npx shadcn-ui@latest add button
   ```

3. TOAST NOTIFICATIONS: The code uses 'sonner' for toasts. If not installed:
   ```bash
   npm install sonner
   # And add <Toaster /> to your root layout
   ```

4. VERIFY AUTH FUNCTION: Ensure verifyAuth() returns an object with userId property

5. PRISMA CLIENT: Ensure prisma client is exported from @/lib/prisma

6. TYPE SAFETY: After schema changes, TypeScript types may need regeneration:
   ```bash
   npx prisma generate
   ```

================================================================================
EXPECTED OUTCOMES
================================================================================

âœ… Night sleep sessions have "Log Night Wake" button
âœ… Night Summary card shows total wakings, longest stretch, total sleep
âœ… Analytics page displays 7-day and 30-day trends
âœ… Charts show intervention breakdown and common reasons
âœ… NapGenius predictions factor in night sleep quality
âœ… All text is multi-language ready (EN/ES implemented, DE/FR/PT structured)
âœ… Full CRUD operations for night wakings
âœ… Mobile-responsive UI matching existing design

================================================================================
TROUBLESHOOTING COMMON ISSUES
================================================================================

ERROR: "Cannot find module 'next-intl'"
FIX: Run npm install next-intl

ERROR: "Prisma schema validation failed"
FIX: Ensure nightWakings relation added to SleepSession model

ERROR: "Cannot find module '@/components/ui/dialog'"
FIX: Install missing shadcn components (see note 2 above)

ERROR: "verifyAuth is not defined"
FIX: Check auth import path and function name in existing codebase

ERROR: "toast is not defined"
FIX: Install sonner and add Toaster component to root layout

ERROR: Type errors after schema update
FIX: Run npx prisma generate to regenerate types

================================================================================
END OF INSTRUCTIONS
================================================================================