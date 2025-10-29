import { getSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: babyId } = await params;

    // Check if user has access to this baby (owner or collaborator)
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        OR: [
          { userId: session.userId },
          { collaborators: { some: { userId: session.userId } } }
        ]
      }
    });

    if (!baby) {
      return NextResponse.json({ error: 'Baby not found or access denied' }, { status: 404 });
    }

    // Get all collaborators
    const collaborators = await prisma.babyCollaborator.findMany({
      where: { babyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // Also get the owner
    const owner = await prisma.user.findUnique({
      where: { id: baby.userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    return NextResponse.json({
      success: true,
      owner,
      collaborators: collaborators.map((c: any) => ({
        id: c.id,
        userId: c.userId,
        email: c.user.email,
        name: c.user.name,
        role: c.role,
        acceptedAt: c.acceptedAt,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: babyId } = await params;
    const body = await request.json();
    const { email, role = 'VIEWER' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if current user is the owner
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        userId: session.userId
      }
    });

    if (!baby) {
      return NextResponse.json(
        { error: 'Only the baby owner can add collaborators' },
        { status: 403 }
      );
    }

    // Find the user to add
    const collaboratorUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!collaboratorUser) {
      return NextResponse.json(
        { error: 'User with that email not found' },
        { status: 404 }
      );
    }

    // Cannot add owner as collaborator
    if (collaboratorUser.id === session.userId) {
      return NextResponse.json(
        { error: 'Cannot add yourself as collaborator' },
        { status: 400 }
      );
    }

    // Check if already a collaborator
    const existing = await prisma.babyCollaborator.findUnique({
      where: {
        babyId_userId: {
          babyId,
          userId: collaboratorUser.id
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a collaborator' },
        { status: 400 }
      );
    }

    // Create collaborator
    const collaborator = await prisma.babyCollaborator.create({
      data: {
        babyId,
        userId: collaboratorUser.id,
        role,
        invitedBy: session.userId,
        acceptedAt: new Date() // Auto-accept for now
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      collaborator: {
        id: collaborator.id,
        userId: collaborator.userId,
        email: collaborator.user.email,
        name: collaborator.user.name,
        role: collaborator.role,
        acceptedAt: collaborator.acceptedAt,
        createdAt: collaborator.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: babyId } = await params;
    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get('collaboratorId');

    if (!collaboratorId) {
      return NextResponse.json(
        { error: 'collaboratorId is required' },
        { status: 400 }
      );
    }

    // Check if current user is the owner
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        userId: session.userId
      }
    });

    if (!baby) {
      return NextResponse.json(
        { error: 'Only the baby owner can remove collaborators' },
        { status: 403 }
      );
    }

    // Delete collaborator
    await prisma.babyCollaborator.delete({
      where: {
        id: collaboratorId,
        babyId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}
