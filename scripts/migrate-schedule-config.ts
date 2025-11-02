/**
 * Data Migration Script: User.scheduleConfig → BabySettings
 * 
 * This script migrates schedule configuration from the User model (per-user)
 * to the BabySettings model (per-baby) to ensure all collaborators viewing
 * the same baby see identical schedule settings.
 * 
 * Run with: npx ts-node scripts/migrate-schedule-config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScheduleConfig {
  napsPerDay?: number;
  wakeWindows?: number[];
  napDurations?: number[];
  bedtime?: string;
}

async function migrateScheduleConfig() {
  console.log('🔄 Starting schedule config migration...');
  console.log('   Moving User.scheduleConfig → BabySettings\n');
  
  try {
    // Get all babies with their owner's scheduleConfig
    const babies = await prisma.baby.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            scheduleConfig: true,
          },
        },
        settings: true,
      },
    });
    
    console.log(`📊 Found ${babies.length} babies to process\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const baby of babies) {
      // Check if owner has a scheduleConfig
      const ownerScheduleConfig = baby.user.scheduleConfig as ScheduleConfig | null;
      
      if (!ownerScheduleConfig || Object.keys(ownerScheduleConfig).length === 0) {
        console.log(`⚠️  Baby "${baby.name}" (${baby.id}): Owner ${baby.user.email} has no scheduleConfig, skipping`);
        skippedCount++;
        continue;
      }
      
      console.log(`\n📝 Processing baby "${baby.name}" (${baby.id})`);
      console.log(`   Owner: ${baby.user.email}`);
      console.log(`   Schedule config:`, {
        napsPerDay: ownerScheduleConfig.napsPerDay,
        wakeWindows: ownerScheduleConfig.wakeWindows?.length,
        napDurations: ownerScheduleConfig.napDurations?.length,
        bedtime: ownerScheduleConfig.bedtime,
      });
      
      // Check if BabySettings already exists
      if (baby.settings) {
        // Update existing settings
        const updated = await prisma.babySettings.update({
          where: { babyId: baby.id },
          data: {
            napsPerDay: ownerScheduleConfig.napsPerDay ?? null,
            wakeWindows: ownerScheduleConfig.wakeWindows ?? null,
            napDurations: ownerScheduleConfig.napDurations ?? null,
            bedtime: ownerScheduleConfig.bedtime ?? baby.settings.bedtime,
          },
        });
        console.log(`   ✅ Updated existing BabySettings`);
        updatedCount++;
      } else {
        // Create new settings
        const created = await prisma.babySettings.create({
          data: {
            babyId: baby.id,
            napsPerDay: ownerScheduleConfig.napsPerDay ?? null,
            wakeWindows: ownerScheduleConfig.wakeWindows ?? null,
            napDurations: ownerScheduleConfig.napDurations ?? null,
            bedtime: ownerScheduleConfig.bedtime ?? '19:00',
            wakeTime: '07:00', // Default
            predictAlerts: true,
            quietHours: true,
          },
        });
        console.log(`   ✅ Created new BabySettings with defaults`);
        createdCount++;
      }
      
      migratedCount++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   ✅ Total migrated: ${migratedCount} babies`);
    console.log(`      - Created new: ${createdCount}`);
    console.log(`      - Updated existing: ${updatedCount}`);
    console.log(`   ⚠️  Skipped (no config): ${skippedCount} babies`);
    console.log('='.repeat(60));
    console.log('\n✨ Migration complete!\n');
    
    // Verify migration
    console.log('🔍 Verification:');
    const settingsCount = await prisma.babySettings.count();
    console.log(`   Total BabySettings records: ${settingsCount}`);
    
    const settingsWithSchedule = await prisma.babySettings.count({
      where: {
        OR: [
          { napsPerDay: { not: null } },
          { wakeWindows: { not: null } },
          { napDurations: { not: null } },
        ],
      },
    });
    console.log(`   Settings with schedule config: ${settingsWithSchedule}`);
    
    if (settingsWithSchedule > 0) {
      console.log('\n✅ Verification passed! Settings successfully migrated.');
    } else if (migratedCount === 0) {
      console.log('\nℹ️  No settings to migrate (all users had empty scheduleConfig).');
    } else {
      console.log('\n⚠️  Warning: Expected schedule config data not found in BabySettings.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrateScheduleConfig()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { migrateScheduleConfig };
