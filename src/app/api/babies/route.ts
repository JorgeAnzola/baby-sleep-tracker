import { getSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get user from session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return babies owned by user OR where user is a collaborator
    const babies = await prisma.baby.findMany({
      where: {
        OR: [
          { userId: session.userId },
          {
            collaborators: {
              some: {
                userId: session.userId
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: { sleepSessions: true }
        },
        collaborators: {
          where: { userId: session.userId }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const response = babies.map(baby => ({
      id: baby.id,
      name: baby.name,
      birth_date: baby.birthDate.toISOString(),
      age_in_days: Math.floor((Date.now() - baby.birthDate.getTime()) / (1000 * 60 * 60 * 24)),
      total_sleep_sessions: baby._count.sleepSessions,
      created_at: baby.createdAt.toISOString(),
      is_owner: baby.userId === session.userId,
      role: baby.userId === session.userId ? 'OWNER' : (baby.collaborators[0]?.role || null)
    }));
    
    return NextResponse.json({ babies: response });
    
  } catch (error) {
    console.error('Get babies API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, birth_date } = body;
    
    if (!name || !birth_date) {
      return NextResponse.json(
        { error: 'name and birth_date are required' },
        { status: 400 }
      );
    }
    
    const baby = await prisma.baby.create({
      data: {
        name,
        birthDate: new Date(birth_date),
        userId: session.userId
      }
    });
    
    return NextResponse.json({
      success: true,
      baby: {
        id: baby.id,
        name: baby.name,
        birth_date: baby.birthDate.toISOString(),
        age_in_days: Math.floor((Date.now() - baby.birthDate.getTime()) / (1000 * 60 * 60 * 24)),
        created_at: baby.createdAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Create baby API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}