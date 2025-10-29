import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { birth_date, name } = body;
    const { id: babyId } = await params;
    
    if (!babyId) {
      return NextResponse.json(
        { error: 'Baby ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: { birthDate?: Date; name?: string } = {};
    if (birth_date) {
      updateData.birthDate = new Date(birth_date);
    }
    if (name) {
      updateData.name = name;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field (name or birth_date) is required' },
        { status: 400 }
      );
    }

    // Check if baby exists
    const existingBaby = await prisma.baby.findUnique({
      where: { id: babyId }
    });

    if (!existingBaby) {
      return NextResponse.json(
        { error: 'Baby not found' },
        { status: 404 }
      );
    }

    // Update the baby
    const updatedBaby = await prisma.baby.update({
      where: { id: babyId },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      baby: {
        id: updatedBaby.id,
        name: updatedBaby.name,
        birth_date: updatedBaby.birthDate.toISOString(),
        age_in_days: Math.floor((Date.now() - updatedBaby.birthDate.getTime()) / (1000 * 60 * 60 * 24)),
        updated_at: updatedBaby.updatedAt?.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Update baby API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: babyId } = await params;
    
    const baby = await prisma.baby.findUnique({
      where: { id: babyId },
      include: {
        _count: {
          select: { sleepSessions: true }
        }
      }
    });
    
    if (!baby) {
      return NextResponse.json(
        { error: 'Baby not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      baby: {
        id: baby.id,
        name: baby.name,
        birth_date: baby.birthDate.toISOString(),
        age_in_days: Math.floor((Date.now() - baby.birthDate.getTime()) / (1000 * 60 * 60 * 24)),
        total_sleep_sessions: baby._count.sleepSessions,
        created_at: baby.createdAt.toISOString(),
        updated_at: baby.updatedAt?.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Get baby API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}