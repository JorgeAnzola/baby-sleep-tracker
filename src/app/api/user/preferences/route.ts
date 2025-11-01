import { getSession } from '@/lib/auth';
import { Prisma, PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * GET /api/user/preferences
 * Fetch user preferences (theme, language, scheduleConfig)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        theme: true,
        language: true,
        scheduleConfig: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      theme: user.theme || 'default',
      language: user.language || 'en',
      scheduleConfig: user.scheduleConfig || null,
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/preferences
 * Update user preferences (theme, language, scheduleConfig)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;

    const body = await request.json();
    const { theme, language, scheduleConfig } = body;

    // Validate inputs
    const updateData: Prisma.UserUpdateInput = {};

    if (theme !== undefined) {
      updateData.theme = theme;
    }

    if (language !== undefined) {
      updateData.language = language;
    }

    if (scheduleConfig !== undefined) {
      updateData.scheduleConfig = scheduleConfig === null ? Prisma.JsonNull : scheduleConfig;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        theme: true,
        language: true,
        scheduleConfig: true,
      },
    });

    return NextResponse.json({
      theme: updatedUser.theme,
      language: updatedUser.language,
      scheduleConfig: updatedUser.scheduleConfig,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
