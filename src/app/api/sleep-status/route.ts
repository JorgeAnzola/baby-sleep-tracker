import { calculateBabyAge, predictBedtime, predictNextNap } from '@/lib/sleep-predictions';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');
    
    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 });
    }
    
    // Get baby information
    const baby = await prisma.baby.findUnique({
      where: { id: babyId }
    });
    
    if (!baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 });
    }
    
    // Get recent sleep sessions (last 7 days)
    const recentSessions = await prisma.sleepSession.findMany({
      where: {
        babyId,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { startTime: 'desc' }
    });
    
    // Get current active session
    const activeSession = await prisma.sleepSession.findFirst({
      where: {
        babyId,
        endTime: null
      }
    });
    
    // Convert to the format expected by prediction functions
    const sessions = recentSessions.map(session => ({
      startTime: session.startTime,
      endTime: session.endTime || undefined,
      sleepType: session.sleepType as 'NAP' | 'NIGHTTIME'
    }));
    
    // Generate predictions
    const nextNap = predictNextNap(baby.birthDate, sessions);
    const bedtime = predictBedtime(baby.birthDate, sessions);
    
    // Calculate sleep state
    const now = new Date();
    let sleepState = 'awake';
    let timeUntilNextSleep = null;
    let currentSleepDuration = null;
    
    if (activeSession) {
      sleepState = 'sleeping';
      currentSleepDuration = Math.floor((now.getTime() - activeSession.startTime.getTime()) / (1000 * 60));
    } else {
      // Check if baby should be sleeping soon
      const timeUntilNap = Math.floor((nextNap.predictedTime.getTime() - now.getTime()) / (1000 * 60));
      const timeUntilBed = Math.floor((bedtime.predictedTime.getTime() - now.getTime()) / (1000 * 60));
      
      if (timeUntilNap <= 30 && timeUntilNap > 0) {
        sleepState = 'sleepy_soon';
        timeUntilNextSleep = timeUntilNap;
      } else if (timeUntilBed <= 60 && timeUntilBed > 0) {
        sleepState = 'bedtime_soon';
        timeUntilNextSleep = timeUntilBed;
      }
    }
    
    const response = {
      baby: {
        id: baby.id,
        name: baby.name,
        age_in_days: calculateBabyAge(baby.birthDate)
      },
      current_state: {
        sleep_state: sleepState, // 'awake', 'sleeping', 'sleepy_soon', 'bedtime_soon'
        time_until_next_sleep: timeUntilNextSleep, // minutes
        current_sleep_duration: currentSleepDuration, // minutes
        is_nap_time: activeSession?.sleepType === 'NAP',
        is_bedtime: activeSession?.sleepType === 'NIGHTTIME'
      },
      predictions: {
        next_nap: {
          predicted_time: nextNap.predictedTime.toISOString(),
          confidence: nextNap.confidence,
          predicted_duration: nextNap.predictedDuration,
          reasoning: nextNap.reasoning
        },
        bedtime: {
          predicted_time: bedtime.predictedTime.toISOString(),
          confidence: bedtime.confidence,
          reasoning: bedtime.reasoning
        }
      },
      last_updated: now.toISOString()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}