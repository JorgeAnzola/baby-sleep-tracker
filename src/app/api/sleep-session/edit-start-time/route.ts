import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { baby_id, new_start_time } = body;
    
    if (!baby_id || !new_start_time) {
      return NextResponse.json({ 
        error: 'baby_id and new_start_time are required' 
      }, { status: 400 });
    }
    
    // Find active session
    const activeSession = await prisma.sleepSession.findFirst({
      where: {
        babyId: baby_id,
        endTime: null
      }
    });
    
    if (!activeSession) {
      return NextResponse.json(
        { error: 'No active sleep session found' },
        { status: 404 }
      );
    }
    
    // Update session with new start time
    const updatedSession = await prisma.sleepSession.update({
      where: { id: activeSession.id },
      data: {
        startTime: new Date(new_start_time)
      }
    });
    
    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        start_time: updatedSession.startTime.toISOString(),
        end_time: updatedSession.endTime?.toISOString(),
        duration: updatedSession.duration,
        sleep_type: updatedSession.sleepType,
        quality: updatedSession.quality,
        location: updatedSession.location,
        notes: updatedSession.notes
      }
    });
    
  } catch (error) {
    console.error('Edit start time API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}