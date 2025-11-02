/**
 * Data Migration Script: User.scheduleConfig → BabySettings
 * 
 * This script migrates schedule configuration from the User model (per-user)
 * to the BabySettings model (per-baby) to ensure all collaborators viewing
 * the same baby see identical schedule settings.
 * 
 * Run with: node scripts/migrate-schedule-config.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
      const ownerScheduleConfig = baby.user.scheduleConfig;
      
      if (!ownerScheduleConfig || typeof ownerScheduleConfig !== 'object') {
        console.log(`⏭️  Baby "${baby.name}" (${baby.id}): Owner has no scheduleConfig, skipping`);
        skippedCount++;
        continue;
      }
      
      // Extract schedule data from owner's config
      const { napsPerDay, wakeWindows, napDurations, bedtime } = ownerScheduleConfig;
      
      // Prepare data for BabySettings
      const settingsData = {
        babyId: baby.id,
        bedtime: bedtime || baby.settings?.bedtime || '19:00',
        wakeTime: baby.settings?.wakeTime || '07:00',
        predictAlerts: baby.settings?.predictAlerts ?? true,
        quietHours: baby.settings?.quietHours ?? true,
      };
      
      // Add optional fields if they exist
      if (napsPerDay !== undefined) {
        settingsData.napsPerDay = napsPerDay;
      }
      if (wakeWindows !== undefined && Array.isArray(wakeWindows)) {
        settingsData.wakeWindows = wakeWindows;
      }
      if (napDurations !== undefined && Array.isArray(napDurations)) {
        settingsData.napDurations = napDurations;
      }
      
      // Upsert BabySettings
      if (baby.settings) {
        // Update existing settings
        await prisma.babySettings.update({
          where: { babyId: baby.id },
          data: settingsData,
        });
        console.log(`✅ Baby "${baby.name}" (${baby.id}): Updated BabySettings`);
        updatedCount++;
      } else {
        // Create new settings
        await prisma.babySettings.create({
          data: settingsData,
        });
        console.log(`✨ Baby "${baby.name}" (${baby.id}): Created BabySettings`);
        createdCount++;
      }
      
      migratedCount++;
      
      // Show migrated data
      console.log(`   ├─ napsPerDay: ${napsPerDay ?? 'not set'}`);
      console.log(`   ├─ wakeWindows: ${wakeWindows ? JSON.stringify(wakeWindows) : 'not set'}`);
      console.log(`   ├─ napDurations: ${napDurations ? JSON.stringify(napDurations) : 'not set'}`);
      console.log(`   └─ bedtime: ${bedtime || baby.settings?.bedtime || '19:00'}\n`);
    }
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MIGRATION COMPLETED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Summary:`);
    console.log(`   Total babies: ${babies.length}`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Verify BabySettings table has data:');
    console.log('      docker exec -it napgenius-app npx prisma studio');
    console.log('   2. Test multi-user settings (both users should see same config)');
    console.log('   3. User.scheduleConfig is now DEPRECATED but kept for backward compatibility');
    console.log('');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateScheduleConfig()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
