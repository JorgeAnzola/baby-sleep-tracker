import { getSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * DELETE /api/sleep-session/delete-all
 * Deletes all sleep sessions for a baby (only if user is owner)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');

    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 });
    }

    // Verify the user owns this baby
    const baby = await prisma.baby.findUnique({
      where: { id: babyId },
      select: { userId: true }
    });

    if (!baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 });
    }

    if (baby.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this baby' }, { status: 403 });
    }

    // Delete all sleep sessions for this baby
    const result = await prisma.sleepSession.deleteMany({
      where: { babyId }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} sleep sessions`
    });
  } catch (error) {
    console.error('Error deleting all sleep sessions:', error);
    return NextResponse.json(
      { error: 'Failed to delete sleep sessions' },
      { status: 500 }
    );
  }
}
