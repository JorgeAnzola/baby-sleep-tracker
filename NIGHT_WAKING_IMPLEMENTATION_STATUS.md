# Night Waking Feature - Implementation Status

## ✅ Completed Steps

### 1. Configuration Files
- ✅ Updated `next.config.ts` with next-intl plugin
- ✅ Created `src/i18n/routing.ts` 
- ✅ Created `src/i18n/request.ts`

### 2. Translation Files
- ✅ Created `messages/en.json` with all English translations
- ✅ Created `messages/es.json` with all Spanish translations

### 3. Database Schema
- ✅ Updated `prisma/schema.prisma`:
  - Added `NightWaking` model
  - Added `nightWakings` relation to `SleepSession`

### 4. API Routes
- ✅ Created `src/app/api/night-waking/route.ts` (POST, GET)
- ✅ Created `src/app/api/night-waking/[id]/route.ts` (PATCH, DELETE)
- ✅ Created `src/app/api/night-waking/analytics/route.ts` (GET)

## ⚠️ Next Steps Required

### Step 1: Install Dependencies
```bash
# Run inside Docker container or where npm is available
docker exec -it baby-sleep-tracker-app npm install next-intl recharts
# OR if not using Docker:
npm install next-intl recharts
```

### Step 2: Run Database Migration
```bash
npx prisma migrate dev --name add_night_wakings
npx prisma generate
```

### Step 3: Check Auth Function
The API routes use `verifyAuth` from `@/lib/auth`. Check your `src/lib/auth.ts` file:
- If the function is named differently, update the imports
- The function should return the `userId` string or null

Example if your auth function is different:
```typescript
// If your function returns an object:
const auth = await verifyAuth(request);
const userId = auth?.userId;

// Update all API routes accordingly
```

### Step 4: Create React Components

Create these 3 components (see night-wakings.md for full code):

1. **src/components/NightWakingLogger.tsx** - Form dialog to log night wakings
2. **src/components/NightSleepSummary.tsx** - Summary card showing wakings for active session
3. **src/components/NightWakingAnalytics.tsx** - Analytics dashboard with charts

Key features of each component:
- **NightWakingLogger**: DateTime inputs, intervention selector, feed details, tags
- **NightSleepSummary**: Total wakings, longest stretch, list of wakings
- **NightWakingAnalytics**: 7/30 day views, trend analysis, pie charts

### Step 5: Integrate into SleepTimer

Find your main sleep tracking component (likely `src/components/SleepTimer.tsx`) and add:

```typescript
import { NightWakingLogger } from '@/components/NightWakingLogger';
import { NightSleepSummary } from '@/components/NightSleepSummary';

// Inside the component where night sessions are displayed:
{activeSleepSession && activeSleepSession.sleepType === 'NIGHTTIME' && (
  <div className="space-y-4 mt-4">
    <NightWakingLogger 
      sleepSessionId={activeSleepSession.id}
      onSuccess={() => {
        // Call your refresh function here
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

### Step 6: Create Analytics Page (Optional)

Create a new page or add to your dashboard:
```typescript
import { NightWakingAnalytics } from '@/components/NightWakingAnalytics';

export default function AnalyticsPage() {
  return <NightWakingAnalytics babyId={currentBaby.id} />;
}
```

### Step 7: Add Prediction Enhancement (Optional)

Create `src/lib/sleep-predictions-enhanced.ts` to factor night wakings into predictions.

This file calculates a sleep quality score based on:
- Number of wakings
- Total wake time
- Self-soothing count
- Adjusts next day's wake windows accordingly

## 📝 Component Templates

Since the components are large, here's a minimal structure:

### NightWakingLogger.tsx
```typescript
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export function NightWakingLogger({ sleepSessionId, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [wakeTime, setWakeTime] = useState('');
  const [interventionType, setInterventionType] = useState('COMFORT');
  
  const handleSubmit = async () => {
    const res = await fetch('/api/night-waking', {
      method: 'POST',
      body: JSON.stringify({ sleepSessionId, wakeTime, interventionType }),
    });
    if (res.ok) {
      toast.success('Night waking logged');
      onSuccess();
      setOpen(false);
    }
  };
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Log Night Wake</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {/* Form fields */}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### NightSleepSummary.tsx
```typescript
'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

export function NightSleepSummary({ sleepSessionId }: Props) {
  const [wakings, setWakings] = useState([]);
  
  useEffect(() => {
    fetch(`/api/night-waking?sleepSessionId=${sleepSessionId}`)
      .then(res => res.json())
      .then(setWakings);
  }, [sleepSessionId]);
  
  return (
    <Card>
      <h3>Night Summary</h3>
      <p>Total Wakings: {wakings.length}</p>
      {wakings.map(w => (
        <div key={w.id}>{/* waking details */}</div>
      ))}
    </Card>
  );
}
```

### NightWakingAnalytics.tsx
```typescript
'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, PieChart, Pie } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function NightWakingAnalytics({ babyId }: Props) {
  const [period, setPeriod] = useState(7);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/night-waking/analytics?babyId=${babyId}&days=${period}`)
      .then(res => res.json())
      .then(setData);
  }, [babyId, period]);
  
  return (
    <div>
      <Tabs value={period.toString()} onValueChange={v => setPeriod(+v)}>
        <TabsList>
          <TabsTrigger value="7">7 Days</TabsTrigger>
          <TabsTrigger value="30">30 Days</TabsTrigger>
        </TabsList>
      </Tabs>
      {/* Charts and stats */}
    </div>
  );
}
```

## 🔍 Troubleshooting

### TypeScript Errors
After migration, run:
```bash
npx prisma generate
```

### Missing UI Components
Install any missing shadcn/ui components:
```bash
npx shadcn-ui@latest add dialog select badge card tabs input label textarea button
```

### Auth Function Issues
Check `/src/lib/auth.ts` and ensure `verifyAuth` is exported and returns `userId`

## 📚 Full Component Code

For the complete, production-ready component code with all features (form validation, error handling, charts, etc.), refer to the `night-wakings.md` file, sections starting from "PHASE 6".

Each component is ~200-300 lines with full functionality.

## 🚀 Testing Checklist

After implementation:
- [ ] Create a NIGHTTIME sleep session
- [ ] Click "Log Night Wake" button
- [ ] Fill form and submit
- [ ] Verify waking appears in summary
- [ ] Check analytics page loads
- [ ] Test edit/delete functionality
- [ ] Verify data persists after refresh

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs
3. Verify database migration completed
4. Ensure all dependencies installed
