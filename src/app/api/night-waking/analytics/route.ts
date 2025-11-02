import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!babyId) {
      return NextResponse.json({ error: 'babyId is required' }, { status: 400 });
    }

    // Verify baby belongs to user
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        userId: userId
      }
    });

    if (!baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wakings = await (prisma as any).nightWaking.findMany({
      where: {
        sleepSession: {
          babyId,
          sleepType: 'NIGHTTIME',
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

interface NightWaking {
  wakeTime: Date;
  durationMinutes: number | null;
  interventionType: string;
  tags: string[];
  sleepSession: {
    startTime: Date;
    endTime: Date | null;
  };
}

function calculateAnalytics(wakings: NightWaking[], days: number) {
  // Group wakings by date
  const wakingsByDate: { [key: string]: NightWaking[] } = {};
  wakings.forEach(waking => {
    const date = new Date(waking.wakeTime).toISOString().split('T')[0];
    if (!wakingsByDate[date]) {
      wakingsByDate[date] = [];
    }
    wakingsByDate[date].push(waking);
  });

  // Calculate daily stats
  const dailyStats = Object.entries(wakingsByDate).map(([date, dayWakings]) => ({
    date,
    count: dayWakings.length,
    avgDuration: dayWakings.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) / dayWakings.length || 0,
    interventions: dayWakings.reduce((acc, w) => {
      acc[w.interventionType] = (acc[w.interventionType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number })
  }));

  // Count intervention types
  const interventionCounts = wakings.reduce((acc, w) => {
    acc[w.interventionType] = (acc[w.interventionType] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Count tags
  const tagCounts = wakings.reduce((acc, w) => {
    w.tags.forEach((tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as { [key: string]: number });

  // Calculate trend
  const midPoint = Math.floor(days / 2);
  const midDate = new Date();
  midDate.setDate(midDate.getDate() - midPoint);

  const firstHalf = wakings.filter(w => new Date(w.wakeTime) < midDate);
  const secondHalf = wakings.filter(w => new Date(w.wakeTime) >= midDate);

  const avgFirstHalf = firstHalf.length / midPoint;
  const avgSecondHalf = secondHalf.length / midPoint;
  const trendChange = avgSecondHalf - avgFirstHalf;

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
      direction: trendChange > 0.5 ? 'increasing' : trendChange < -0.5 ? 'decreasing' : 'stable',
      change: trendChange,
      firstHalfAvg: avgFirstHalf,
      secondHalfAvg: avgSecondHalf
    }
  };
}
