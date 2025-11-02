import { verifyAuth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).nightWaking.findFirst({
      where: {
        id: id,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma as any).nightWaking.update({
      where: { id: id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).nightWaking.findFirst({
      where: {
        id: id,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).nightWaking.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting night waking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
