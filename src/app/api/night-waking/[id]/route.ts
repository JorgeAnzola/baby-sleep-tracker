import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
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

    // Verify night waking belongs to user
    const existing = await prisma.nightWaking.findFirst({
      where: {
        id: params.id,
        sleepSession: {
          baby: {
            userId: userId
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Night waking not found' }, { status: 404 });
    }

    // Calculate duration if times provided
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
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.nightWaking.findFirst({
      where: {
        id: params.id,
        sleepSession: {
          baby: {
            userId: userId
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
