import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('baby_id');
    
    if (!babyId) {
      return NextResponse.json({ error: 'baby_id is required' }, { status: 400 });
    }
    
    // Get all sleep sessions for the baby
    const sessions = await prisma.sleepSession.findMany({
      where: {
        babyId: babyId
      },
      orderBy: {
        startTime: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        baby_id: session.babyId,
        start_time: session.startTime.toISOString(),
        end_time: session.endTime?.toISOString() || null,
        duration: session.duration,
        sleep_type: session.sleepType,
        quality: session.quality,
        location: session.location,
        notes: session.notes
      }))
    });
    
  } catch (error) {
    console.error('Get sleep sessions API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baby_id, sleep_type = 'NAP', location, notes } = body;
    
    if (!baby_id) {
      return NextResponse.json({ error: 'baby_id is required' }, { status: 400 });
    }
    
    // Check if there's already an active session
    const existingSession = await prisma.sleepSession.findFirst({
      where: {
        babyId: baby_id,
        endTime: null
      }
    });
    
    if (existingSession) {
      return NextResponse.json(
        { error: 'There is already an active sleep session' },
        { status: 400 }
      );
    }
    
    // Create new sleep session
    const session = await prisma.sleepSession.create({
      data: {
        babyId: baby_id,
        startTime: new Date(),
        sleepType: sleep_type,
        location: location || null,
        notes: notes || null
      }
    });
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        start_time: session.startTime.toISOString(),
        sleep_type: session.sleepType,
        location: session.location,
        notes: session.notes
      }
    });
    
  } catch (error) {
    console.error('Start sleep API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { baby_id, quality, notes } = body;
    
    if (!baby_id) {
      return NextResponse.json({ error: 'baby_id is required' }, { status: 400 });
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
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeSession.startTime.getTime()) / (1000 * 60));
    
    // Update session with end time and duration
    const updatedSession = await prisma.sleepSession.update({
      where: { id: activeSession.id },
      data: {
        endTime,
        duration,
        quality: quality || null,
        notes: notes || activeSession.notes
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
    console.error('End sleep API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}