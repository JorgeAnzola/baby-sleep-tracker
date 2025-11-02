import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/baby-settings/[babyId]
 * Fetch baby-specific settings (schedule config, bedtime, etc.)
 * 
 * This endpoint ensures all collaborators viewing the same baby
 * see identical schedule settings (not per-user settings).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { babyId: string } }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { babyId } = params;
    
    // Verify user has access to this baby (owner or collaborator)
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        OR: [
          { userId }, // Owner
          {
            collaborators: {
              some: { userId }, // Collaborator
            },
          },
        ],
      },
      include: {
        settings: true,
      },
    });
    
    if (!baby) {
      return NextResponse.json({ error: 'Baby not found or access denied' }, { status: 404 });
    }
    
    // If no settings exist, return null values (UI will use age-based defaults)
    if (!baby.settings) {
      return NextResponse.json({
        babyId,
        bedtime: null,
        wakeTime: null,
        napsPerDay: null,
        wakeWindows: null,
        napDurations: null,
        predictAlerts: true,
        quietHours: true,
      });
    }
    
    return NextResponse.json({
      babyId: baby.settings.babyId,
      bedtime: baby.settings.bedtime,
      wakeTime: baby.settings.wakeTime,
      napsPerDay: baby.settings.napsPerDay,
      wakeWindows: baby.settings.wakeWindows,
      napDurations: baby.settings.napDurations,
      predictAlerts: baby.settings.predictAlerts,
      quietHours: baby.settings.quietHours,
    });
    
  } catch (error) {
    console.error('Error fetching baby settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch baby settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/baby-settings/[babyId]
 * Update baby-specific settings
 * 
 * Requires OWNER or EDITOR role. VIEWER cannot modify settings.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { babyId: string } }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { babyId } = params;
    const body = await request.json();
    
    // Verify user has EDITOR or OWNER access
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        OR: [
          { userId }, // Owner
          {
            collaborators: {
              some: {
                userId,
                role: { in: ['OWNER', 'EDITOR'] },
              },
            },
          },
        ],
      },
    });
    
    if (!baby) {
      return NextResponse.json(
        { error: 'Baby not found or insufficient permissions' },
        { status: 404 }
      );
    }
    
    const {
      bedtime,
      wakeTime,
      napsPerDay,
      wakeWindows,
      napDurations,
      predictAlerts,
      quietHours,
    } = body;
    
    // Build update data object (only include fields that were provided)
    const updateData: any = {};
    if (bedtime !== undefined) updateData.bedtime = bedtime;
    if (wakeTime !== undefined) updateData.wakeTime = wakeTime;
    if (napsPerDay !== undefined) updateData.napsPerDay = napsPerDay;
    if (wakeWindows !== undefined) updateData.wakeWindows = wakeWindows;
    if (napDurations !== undefined) updateData.napDurations = napDurations;
    if (predictAlerts !== undefined) updateData.predictAlerts = predictAlerts;
    if (quietHours !== undefined) updateData.quietHours = quietHours;
    
    // Upsert baby settings
    const updatedSettings = await prisma.babySettings.upsert({
      where: { babyId },
      create: {
        babyId,
        bedtime: bedtime ?? '19:00',
        wakeTime: wakeTime ?? '07:00',
        napsPerDay: napsPerDay ?? null,
        wakeWindows: wakeWindows ?? null,
        napDurations: napDurations ?? null,
        predictAlerts: predictAlerts ?? true,
        quietHours: quietHours ?? true,
      },
      update: updateData,
    });
    
    return NextResponse.json(updatedSettings);
    
  } catch (error) {
    console.error('Error updating baby settings:', error);
    return NextResponse.json(
      { error: 'Failed to update baby settings' },
      { status: 500 }
    );
  }
}
