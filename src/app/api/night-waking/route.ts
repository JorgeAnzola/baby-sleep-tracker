import { verifyAuth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
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

    // Verify sleep session belongs to user's baby
    const sleepSession = await prisma.sleepSession.findFirst({
      where: {
        id: sleepSessionId,
        baby: {
          userId: userId
        }
      }
    });

    if (!sleepSession) {
      return NextResponse.json({ error: 'Sleep session not found' }, { status: 404 });
    }

    // Validate feed data
    if (interventionType === 'FEED' && feedType && !feedAmount) {
      return NextResponse.json({ 
        error: 'Feed amount is required when feed type is provided' 
      }, { status: 400 });
    }

    // Calculate duration if back to sleep time is provided
    let durationMinutes = null;
    if (backToSleepTime) {
      const wake = new Date(wakeTime);
      const sleep = new Date(backToSleepTime);
      durationMinutes = Math.round((sleep.getTime() - wake.getTime()) / 60000);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nightWaking = await (prisma as any).nightWaking.create({
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
    const userId = await verifyAuth(request);
    if (!userId) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      sleepSession: {
        baby: {
          userId: userId
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nightWakings = await (prisma as any).nightWaking.findMany({
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
