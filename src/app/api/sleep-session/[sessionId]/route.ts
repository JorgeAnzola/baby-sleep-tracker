import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'sessionId is required' 
      }, { status: 400 });
    }
    
    // Find the session
    const existingSession = await prisma.sleepSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Sleep session not found' },
        { status: 404 }
      );
    }
    
    // Delete the session
    await prisma.sleepSession.delete({
      where: { id: sessionId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Sleep session deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete session API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const body = await request.json();
    const { sessionId } = await params;
    const { start_time, end_time, quality, notes } = body;
    
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'sessionId is required' 
      }, { status: 400 });
    }
    
    // Find the session
    const existingSession = await prisma.sleepSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Sleep session not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: {
      startTime?: Date;
      endTime?: Date;
      duration?: number;
      quality?: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
      notes?: string;
    } = {};
    
    if (start_time) {
      updateData.startTime = new Date(start_time);
    }
    
    if (end_time) {
      updateData.endTime = new Date(end_time);
    }
    
    if (quality) {
      updateData.quality = quality as 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // Calculate new duration if both times are provided
    if (updateData.startTime && updateData.endTime) {
      updateData.duration = Math.floor(
        (updateData.endTime.getTime() - updateData.startTime.getTime()) / (1000 * 60)
      );
    } else if (updateData.startTime && existingSession.endTime) {
      updateData.duration = Math.floor(
        (existingSession.endTime.getTime() - updateData.startTime.getTime()) / (1000 * 60)
      );
    } else if (updateData.endTime && existingSession.startTime) {
      updateData.duration = Math.floor(
        (updateData.endTime.getTime() - existingSession.startTime.getTime()) / (1000 * 60)
      );
    }
    
    // Update session
    const updatedSession = await prisma.sleepSession.update({
      where: { id: sessionId },
      data: updateData
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
    console.error('Edit session API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}