import { addMinutes, differenceInDays } from 'date-fns';

export interface SleepPattern {
  age: number; // in days
  averageNaps: number;
  napDurations: number[]; // in minutes
  awakeWindows: number[]; // in minutes
  bedtime: string; // HH:MM format
  nightSleep: number; // in minutes
}

// Sleep patterns based on age (data similar to Huckleberry's research)
export const SLEEP_PATTERNS: SleepPattern[] = [
  // Newborn (0-3 months)
  { age: 0, averageNaps: 4, napDurations: [30, 45, 60, 45], awakeWindows: [45, 60, 75, 90], bedtime: '19:00', nightSleep: 480 },
  { age: 30, averageNaps: 4, napDurations: [45, 60, 75, 60], awakeWindows: [60, 75, 90, 105], bedtime: '19:30', nightSleep: 540 },
  { age: 60, averageNaps: 4, napDurations: [60, 75, 90, 60], awakeWindows: [75, 90, 105, 120], bedtime: '20:00', nightSleep: 600 },
  
  // 3-6 months
  { age: 90, averageNaps: 3, napDurations: [90, 120, 90], awakeWindows: [120, 150, 180], bedtime: '19:00', nightSleep: 660 },
  { age: 120, averageNaps: 3, napDurations: [90, 120, 75], awakeWindows: [135, 165, 195], bedtime: '19:00', nightSleep: 660 },
  { age: 150, averageNaps: 3, napDurations: [75, 120, 60], awakeWindows: [150, 180, 210], bedtime: '19:00', nightSleep: 660 },
  
  // 6-12 months
  { age: 180, averageNaps: 2, napDurations: [90, 120], awakeWindows: [180, 210], bedtime: '19:00', nightSleep: 660 },
  { age: 240, averageNaps: 2, napDurations: [75, 105], awakeWindows: [210, 240], bedtime: '19:00', nightSleep: 660 },
  { age: 300, averageNaps: 2, napDurations: [60, 90], awakeWindows: [240, 270], bedtime: '19:00', nightSleep: 660 },
  
  // 12+ months
  { age: 365, averageNaps: 1, napDurations: [90], awakeWindows: [300], bedtime: '19:30', nightSleep: 630 },
  { age: 450, averageNaps: 1, napDurations: [75], awakeWindows: [330], bedtime: '20:00', nightSleep: 600 },
  { age: 540, averageNaps: 1, napDurations: [60], awakeWindows: [360], bedtime: '20:00', nightSleep: 600 },
];

export function calculateBabyAge(birthDate: Date): number {
  return differenceInDays(new Date(), birthDate);
}

export function getSleepPatternForAge(ageInDays: number): SleepPattern {
  // Find the closest age pattern (not exceeding the baby's age)
  const pattern = SLEEP_PATTERNS
    .filter(p => p.age <= ageInDays)
    .sort((a, b) => b.age - a.age)[0];
  
  return pattern || SLEEP_PATTERNS[0];
}

export interface SleepSession {
  startTime: Date;
  endTime?: Date;
  sleepType: 'NAP' | 'NIGHTTIME';
}

// Analyze historical sleep patterns to create personalized predictions
function analyzePersonalSleepPatterns(
  sessions: SleepSession[],
  ageInDays: number,
  napIndex: number
): {
  averageAwakeWindow: number;
  averageNapDuration: number;
  consistency: number;
  sampleSize: number;
} {
  // Get last 60 days of data for more comprehensive analysis
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 60);
  
  const relevantSessions = sessions
    .filter(s => s.endTime && s.startTime > cutoffDate)
    .sort((a, b) => {
      const aTime = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
      const bTime = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
      return aTime.getTime() - bTime.getTime();
    });

  // Group sessions by day and analyze nap patterns
  const dailyPatterns: { [date: string]: SleepSession[] } = {};
  
  relevantSessions.forEach(session => {
    const dateKey = session.startTime.toDateString();
    if (!dailyPatterns[dateKey]) {
      dailyPatterns[dateKey] = [];
    }
    dailyPatterns[dateKey].push(session);
  });

  // Analyze awake windows and nap durations for the specific nap index
  const awakeWindows: number[] = [];
  const napDurations: number[] = [];
  
  Object.values(dailyPatterns).forEach(daySessions => {
    const naps = daySessions
      .filter(s => s.sleepType === 'NAP')
      .sort((a, b) => {
        const aTime = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
        const bTime = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
        return aTime.getTime() - bTime.getTime();
      });
    
    if (naps.length > napIndex) {
      const targetNap = naps[napIndex];
      
      // Calculate awake window before this nap
      let previousSleep: SleepSession | null = null;
      if (napIndex === 0) {
        // First nap - find previous night's sleep
        const previousNight = daySessions.find(s => s.sleepType === 'NIGHTTIME');
        if (previousNight) previousSleep = previousNight;
      } else if (napIndex > 0 && naps[napIndex - 1]) {
        previousSleep = naps[napIndex - 1];
      }
      
      if (previousSleep && previousSleep.endTime && targetNap.endTime) {
        const prevEnd = previousSleep.endTime instanceof Date ? previousSleep.endTime : new Date(previousSleep.endTime);
        const napStart = targetNap.startTime instanceof Date ? targetNap.startTime : new Date(targetNap.startTime);
        const napEnd = targetNap.endTime instanceof Date ? targetNap.endTime : new Date(targetNap.endTime);
        
        const awakeTime = differenceInMinutes(napStart, prevEnd);
        const napDuration = differenceInMinutes(napEnd, napStart);
        
        if (awakeTime > 0 && awakeTime < 600) { // Reasonable awake window (0-10 hours)
          awakeWindows.push(awakeTime);
        }
        if (napDuration > 0 && napDuration < 300) { // Reasonable nap duration (0-5 hours)
          napDurations.push(napDuration);
        }
      }
    }
  });

  // Calculate averages and consistency
  const avgAwakeWindow = awakeWindows.length > 0 
    ? awakeWindows.reduce((sum, w) => sum + w, 0) / awakeWindows.length 
    : 0;
  
  const avgNapDuration = napDurations.length > 0
    ? napDurations.reduce((sum, d) => sum + d, 0) / napDurations.length
    : 0;

  // Consistency score based on standard deviation
  let consistency = 0;
  if (awakeWindows.length > 2) {
    const stdDev = Math.sqrt(
      awakeWindows.reduce((sum, w) => sum + Math.pow(w - avgAwakeWindow, 2), 0) / awakeWindows.length
    );
    // Lower standard deviation = higher consistency (inverted and normalized)
    consistency = Math.max(0, 1 - (stdDev / avgAwakeWindow));
  }

  return {
    averageAwakeWindow: avgAwakeWindow,
    averageNapDuration: avgNapDuration,
    consistency: consistency,
    sampleSize: awakeWindows.length
  };
}

export function predictNextNap(
  birthDate: Date,
  allSessions: SleepSession[],
  currentTime: Date = new Date()
): {
  predictedTime: Date;
  confidence: number;
  predictedDuration: number;
  reasoning: string;
} {
  const ageInDays = calculateBabyAge(birthDate);
  const pattern = getSleepPatternForAge(ageInDays);
  
  // Find the last completed sleep session
  const lastSleep = allSessions
    .filter(s => s.endTime)
    .sort((a, b) => {
      const aTime = a.endTime instanceof Date ? a.endTime.getTime() : new Date(a.endTime!).getTime();
      const bTime = b.endTime instanceof Date ? b.endTime.getTime() : new Date(b.endTime!).getTime();
      return bTime - aTime;
    })[0];
  
  if (!lastSleep || !lastSleep.endTime) {
    // No recent sleep data, use default pattern
    const predictedTime = addMinutes(currentTime, pattern.awakeWindows[0]);
    return {
      predictedTime,
      confidence: 0.4,
      predictedDuration: pattern.napDurations[0],
      reasoning: 'Based on typical sleep pattern for age (no recent data)'
    };
  }
  
  // Calculate time awake since last sleep
  const lastSleepEnd = lastSleep.endTime instanceof Date ? lastSleep.endTime : new Date(lastSleep.endTime!);
  const timeAwake = differenceInMinutes(currentTime, lastSleepEnd);
  
  // Determine which nap this should be based on time of day and recent naps
  const todaysSessions = allSessions.filter(s => 
    s.startTime.toDateString() === currentTime.toDateString() && 
    s.sleepType === 'NAP'
  );
  
  const napIndex = Math.min(todaysSessions.length, pattern.averageNaps - 1);
  const expectedAwakeWindow = pattern.awakeWindows[napIndex] || pattern.awakeWindows[0];
  const expectedNapDuration = pattern.napDurations[napIndex] || pattern.napDurations[0];

  // Analyze personal sleep patterns
  const personalPattern = analyzePersonalSleepPatterns(allSessions, ageInDays, napIndex);
  
  // Use personal patterns if we have enough data, otherwise fall back to age-based patterns
  let finalAwakeWindow = expectedAwakeWindow;
  let finalNapDuration = expectedNapDuration;
  let confidence = 0.5; // Base confidence
  let reasoning = '';
  
  if (personalPattern.sampleSize >= 3) {
    // We have enough personal data to make personalized predictions
    const personalWeight = Math.min(0.8, personalPattern.sampleSize / 20); // Max 80% weight, increasing with sample size
    const ageWeight = 1 - personalWeight;
    
    finalAwakeWindow = Math.round(
      (personalPattern.averageAwakeWindow * personalWeight) + 
      (expectedAwakeWindow * ageWeight)
    );
    
    finalNapDuration = Math.round(
      (personalPattern.averageNapDuration * personalWeight) + 
      (expectedNapDuration * ageWeight)
    );
    
    // Calculate confidence based on multiple factors
    const sampleSizeBonus = Math.min(0.3, personalPattern.sampleSize / 50); // Up to 30% bonus for large sample
    const consistencyBonus = personalPattern.consistency * 0.4; // Up to 40% bonus for consistency
    const awakeWindowAccuracy = Math.max(0, 1 - Math.abs(timeAwake - finalAwakeWindow) / finalAwakeWindow);
    
    confidence = Math.min(0.95, 0.5 + sampleSizeBonus + consistencyBonus + (awakeWindowAccuracy * 0.3));
    
    reasoning = `Personalized prediction (${personalPattern.sampleSize} samples, ${Math.round(personalPattern.consistency * 100)}% consistent) - ${timeAwake}min awake, expecting ${finalAwakeWindow}min`;
  } else if (personalPattern.sampleSize > 0) {
    // Some personal data, but not enough for full personalization
    confidence = 0.6 + (personalPattern.sampleSize * 0.05);
    reasoning = `Limited personal data (${personalPattern.sampleSize} samples) + age pattern - ${timeAwake}min awake, expecting ${finalAwakeWindow}min`;
  } else {
    // No personal data, use age-based patterns only
    const awakeWindowDiff = Math.abs(timeAwake - expectedAwakeWindow);
    confidence = Math.max(0.4, 0.8 - (awakeWindowDiff / expectedAwakeWindow));
    reasoning = `Age-based pattern only - ${timeAwake}min awake, expecting ${expectedAwakeWindow}min`;
  }
  
  // Predict nap time based on last sleep + calculated awake window
  const predictedTime = addMinutes(lastSleep.endTime, finalAwakeWindow);
  
  // If we're past the predicted time, suggest now with adjusted confidence
  const finalPredictedTime = predictedTime < currentTime ? currentTime : predictedTime;
  if (predictedTime < currentTime) {
    const minutesOverdue = differenceInMinutes(currentTime, predictedTime);
    confidence = Math.min(confidence + (minutesOverdue * 0.01), 0.98); // Increase confidence when overdue
    reasoning += ` (${minutesOverdue}min overdue - suggesting now)`;
  }
  
  return {
    predictedTime: finalPredictedTime,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
    predictedDuration: finalNapDuration,
    reasoning: reasoning + ` - Nap ${napIndex + 1}/${pattern.averageNaps}`
  };
}

// Analyze historical bedtime patterns
function analyzePersonalBedtimePatterns(
  sessions: SleepSession[]
): {
  averageBedtime: { hours: number; minutes: number } | null;
  consistency: number;
  sampleSize: number;
} {
  // Get last 60 days of bedtime data
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 60);
  
  const nighttimeSessions = sessions
    .filter(s => 
      s.sleepType === 'NIGHTTIME' && 
      s.startTime > cutoffDate &&
      s.startTime.getHours() >= 17 && // Evening bedtimes only
      s.startTime.getHours() <= 23
    )
    .map(s => {
      const startTime = s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
      return {
        hours: startTime.getHours(),
        minutes: startTime.getMinutes(),
        totalMinutes: startTime.getHours() * 60 + startTime.getMinutes()
      };
    });

  if (nighttimeSessions.length === 0) {
    return { averageBedtime: null, consistency: 0, sampleSize: 0 };
  }

  // Calculate average bedtime
  const avgTotalMinutes = nighttimeSessions.reduce((sum, bt) => sum + bt.totalMinutes, 0) / nighttimeSessions.length;
  const avgHours = Math.floor(avgTotalMinutes / 60);
  const avgMinutes = Math.round(avgTotalMinutes % 60);

  // Calculate consistency (based on standard deviation)
  const stdDev = Math.sqrt(
    nighttimeSessions.reduce((sum, bt) => sum + Math.pow(bt.totalMinutes - avgTotalMinutes, 2), 0) / nighttimeSessions.length
  );
  
  // Convert standard deviation to consistency score (lower stddev = higher consistency)
  const consistency = Math.max(0, 1 - (stdDev / 60)); // Normalize by 60 minutes

  return {
    averageBedtime: { hours: avgHours, minutes: avgMinutes },
    consistency: consistency,
    sampleSize: nighttimeSessions.length
  };
}

export function predictBedtime(
  birthDate: Date,
  allSessions: SleepSession[],
  currentTime: Date = new Date()
): {
  predictedTime: Date;
  confidence: number;
  reasoning: string;
} {
  const ageInDays = calculateBabyAge(birthDate);
  const pattern = getSleepPatternForAge(ageInDays);
  
  // Analyze personal bedtime patterns
  const personalBedtime = analyzePersonalBedtimePatterns(allSessions);
  
  // Create bedtime for today
  let [hours, minutes] = pattern.bedtime.split(':').map(Number);
  
  // Use personal bedtime if available
  if (personalBedtime.averageBedtime && personalBedtime.sampleSize >= 5) {
    const personalWeight = Math.min(0.8, personalBedtime.sampleSize / 30);
    const ageWeight = 1 - personalWeight;
    
    const personalTotalMins = personalBedtime.averageBedtime.hours * 60 + personalBedtime.averageBedtime.minutes;
    const ageTotalMins = hours * 60 + minutes;
    
    const finalTotalMins = Math.round((personalTotalMins * personalWeight) + (ageTotalMins * ageWeight));
    hours = Math.floor(finalTotalMins / 60);
    minutes = finalTotalMins % 60;
  }
  
  const predictedBedtime = new Date(currentTime);
  predictedBedtime.setHours(hours, minutes, 0, 0);
  
  // If bedtime has passed today, predict for tomorrow
  if (predictedBedtime < currentTime) {
    predictedBedtime.setDate(predictedBedtime.getDate() + 1);
  }
  
  // Adjust based on today's nap patterns
  const todaysNaps = allSessions.filter(s => 
    s.startTime.toDateString() === currentTime.toDateString() && 
    s.sleepType === 'NAP' &&
    s.endTime
  );
  
  let confidence = 0.6; // Base confidence
  let adjustment = 0;
  let reasoning = '';
  
  // Calculate confidence based on personal data
  if (personalBedtime.sampleSize >= 5) {
    const sampleBonus = Math.min(0.25, personalBedtime.sampleSize / 40);
    const consistencyBonus = personalBedtime.consistency * 0.3;
    confidence = 0.6 + sampleBonus + consistencyBonus;
    reasoning = `Personalized bedtime (${personalBedtime.sampleSize} samples, ${Math.round(personalBedtime.consistency * 100)}% consistent)`;
  } else if (personalBedtime.sampleSize > 0) {
    confidence = 0.65;
    reasoning = `Limited bedtime data (${personalBedtime.sampleSize} samples) + age pattern`;
  } else {
    confidence = 0.5;
    reasoning = `Age-based bedtime pattern: ${pattern.bedtime}`;
  }
  
  if (todaysNaps.length > 0) {
    const lastNap = todaysNaps.sort((a, b) => {
      const aTime = a.endTime instanceof Date ? a.endTime.getTime() : new Date(a.endTime!).getTime();
      const bTime = b.endTime instanceof Date ? b.endTime.getTime() : new Date(b.endTime!).getTime();
      return bTime - aTime;
    })[0];
    const lastNapEnd = lastNap.endTime instanceof Date ? lastNap.endTime : new Date(lastNap.endTime!);
    const timeSinceLastNap = differenceInMinutes(predictedBedtime, lastNapEnd);
    
    // If last nap was too late or too long, adjust bedtime
    if (timeSinceLastNap < 180) { // Less than 3 hours
      adjustment = 30; // Push bedtime later
      confidence = Math.max(0.4, confidence - 0.1);
      reasoning += ` (adjusted +30min due to late nap)`;
    }
    
    // Check for total nap duration impact
    const totalNapDuration = todaysNaps.reduce((total, nap) => {
      if (nap.endTime) {
        const napStart = nap.startTime instanceof Date ? nap.startTime : new Date(nap.startTime);
        const napEnd = nap.endTime instanceof Date ? nap.endTime : new Date(nap.endTime);
        return total + differenceInMinutes(napEnd, napStart);
      }
      return total;
    }, 0);
    
    if (totalNapDuration > 240) { // More than 4 hours of naps
      adjustment += 15; // Push bedtime later
      confidence = Math.max(0.4, confidence - 0.05);
      reasoning += ` (${Math.round(totalNapDuration/60 * 10)/10}h total naps)`;
    }
  }
  
  return {
    predictedTime: addMinutes(predictedBedtime, adjustment),
    confidence: Math.round(confidence * 100) / 100,
    reasoning
  };
}

export function predictWakeUp(
  birthDate: Date,
  currentSleepSession: SleepSession,
  allSessions: SleepSession[]
): {
  predictedTime: Date;
  confidence: number;
  predictedDuration: number;
  reasoning: string;
} {
  const ageInDays = calculateBabyAge(birthDate);
  const pattern = getSleepPatternForAge(ageInDays);
  const startTime = currentSleepSession.startTime instanceof Date ? currentSleepSession.startTime : new Date(currentSleepSession.startTime);
  const currentTime = new Date();
  const currentDuration = differenceInMinutes(currentTime, startTime);
  
  // Determine if this is a nap or nighttime sleep
  const isNighttime = currentSleepSession.sleepType === 'NIGHTTIME';
  
  let expectedDuration: number;
  let confidence: number;
  let reasoning: string;
  
  if (isNighttime) {
    // Analyze personal nighttime sleep patterns
    const recentNights = allSessions
      .filter(s => s.sleepType === 'NIGHTTIME' && s.endTime && s.startTime > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
      .map(s => {
        const start = s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
        const end = s.endTime instanceof Date ? s.endTime : new Date(s.endTime!);
        return differenceInMinutes(end, start);
      });
    
    if (recentNights.length >= 5) {
      const avgNightSleep = recentNights.reduce((sum, d) => sum + d, 0) / recentNights.length;
      expectedDuration = Math.round(avgNightSleep);
      confidence = Math.min(0.85, 0.6 + (recentNights.length / 50));
      reasoning = `Personal night pattern: avg ${formatDuration(expectedDuration)} (${recentNights.length} nights)`;
    } else {
      expectedDuration = pattern.nightSleep;
      confidence = 0.65;
      reasoning = `Age-based night sleep: ${formatDuration(expectedDuration)}`;
    }
  } else {
    // Nap - determine which nap this is
    const todaysNaps = allSessions.filter(s => 
      s.startTime.toDateString() === startTime.toDateString() && 
      s.sleepType === 'NAP' &&
      s.startTime < startTime
    );
    
    const napIndex = todaysNaps.length;
    expectedDuration = pattern.napDurations[napIndex] || pattern.napDurations[0];
    
    // Analyze personal nap patterns for this nap index
    const personalPattern = analyzePersonalSleepPatterns(allSessions, ageInDays, napIndex);
    
    if (personalPattern.sampleSize >= 3) {
      const personalWeight = Math.min(0.7, personalPattern.sampleSize / 15);
      expectedDuration = Math.round(
        (personalPattern.averageNapDuration * personalWeight) + 
        (expectedDuration * (1 - personalWeight))
      );
      confidence = Math.min(0.8, 0.55 + (personalPattern.sampleSize / 40) + (personalPattern.consistency * 0.25));
      reasoning = `Personal nap ${napIndex + 1} pattern: ${formatDuration(expectedDuration)} (${personalPattern.sampleSize} samples)`;
    } else {
      confidence = 0.5;
      reasoning = `Age-based nap ${napIndex + 1}: ${formatDuration(expectedDuration)}`;
    }
  }
  
  // Calculate predicted wake time
  const predictedWakeTime = addMinutes(startTime, expectedDuration);
  
  // Adjust confidence based on how close we are to expected duration
  if (currentDuration > expectedDuration * 0.8) {
    confidence = Math.min(0.95, confidence + 0.1);
    reasoning += ` (approaching typical duration)`;
  }
  
  return {
    predictedTime: predictedWakeTime,
    confidence: Math.round(confidence * 100) / 100,
    predictedDuration: expectedDuration,
    reasoning
  };
}

// Helper function to get sleep recommendations
export function getSleepRecommendations(birthDate: Date): {
  totalDaySleep: number;
  totalNightSleep: number;
  awakeWindows: number[];
  tips: string[];
} {
  const ageInDays = calculateBabyAge(birthDate);
  const pattern = getSleepPatternForAge(ageInDays);
  
  const totalDaySleep = pattern.napDurations.reduce((sum, duration) => sum + duration, 0);
  
  let tips: string[] = [];
  
  if (ageInDays < 90) {
    tips = [
      'Watch for early sleep cues like yawning and eye rubbing',
      'Keep awake windows short to prevent overtiredness',
      'Consistent bedtime routine helps establish patterns'
    ];
  } else if (ageInDays < 365) {
    tips = [
      'Longer awake windows allow for more activities',
      'Consistent nap schedule helps with night sleep',
      'Room darkening can improve nap quality'
    ];
  } else {
    tips = [
      'Single midday nap should be 1-2 hours',
      'Earlier bedtime if nap was missed or short',
      'Quiet time can replace second nap if needed'
    ];
  }
  
  return {
    totalDaySleep,
    totalNightSleep: pattern.nightSleep,
    awakeWindows: pattern.awakeWindows,
    tips
  };
}

// Utility function for formatting durations
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Helper to calculate minutes between two dates
function differenceInMinutes(date1: Date, date2: Date): number {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60));
}

// Get recommended schedule based on age
export interface RecommendedSchedule {
  averageNaps: number;
  napDurations: number[];
  awakeWindows: number[];
  bedtime: string;
  nightSleep: number;
}

export function getRecommendedScheduleForAge(ageInDays: number): RecommendedSchedule {
  const pattern = getSleepPatternForAge(ageInDays);
  
  return {
    averageNaps: pattern.averageNaps,
    napDurations: [...pattern.napDurations],
    awakeWindows: [...pattern.awakeWindows],
    bedtime: pattern.bedtime,
    nightSleep: pattern.nightSleep
  };
}

// Calculate recommended schedule from historical data
export function calculatePersonalizedSchedule(
  sessions: SleepSession[],
  ageInDays: number
): RecommendedSchedule | null {
  // Need at least 14 days of data
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 60);
  
  const recentSessions = sessions.filter(
    s => s.endTime && s.startTime > cutoffDate
  );
  
  if (recentSessions.length < 30) {
    return null; // Not enough data
  }
  
  // Group by day
  const dailyPatterns: { [date: string]: SleepSession[] } = {};
  recentSessions.forEach(session => {
    const dateKey = session.startTime.toDateString();
    if (!dailyPatterns[dateKey]) {
      dailyPatterns[dateKey] = [];
    }
    dailyPatterns[dateKey].push(session);
  });
  
  // Analyze typical nap count
  const napsPerDay = Object.values(dailyPatterns)
    .map(daySessions => daySessions.filter(s => s.sleepType === 'NAP').length)
    .filter(count => count > 0);
    
  const averageNaps = Math.round(
    napsPerDay.reduce((sum, count) => sum + count, 0) / napsPerDay.length
  );
  
  // Calculate average durations and wake windows for each nap
  const napDurations: number[] = [];
  const awakeWindows: number[] = [];
  
  for (let napIndex = 0; napIndex < averageNaps; napIndex++) {
    const durations: number[] = [];
    const wakeWindows: number[] = [];
    
    Object.values(dailyPatterns).forEach(daySessions => {
      const naps = daySessions
        .filter(s => s.sleepType === 'NAP')
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      if (naps[napIndex] && naps[napIndex].endTime) {
        const duration = differenceInMinutes(
          naps[napIndex].endTime!,
          naps[napIndex].startTime
        );
        durations.push(duration);
        
        // Calculate wake window
        if (napIndex > 0 && naps[napIndex - 1].endTime) {
          const wakeWindow = differenceInMinutes(
            naps[napIndex].startTime,
            naps[napIndex - 1].endTime!
          );
          wakeWindows.push(wakeWindow);
        }
      }
    });
    
    if (durations.length > 0) {
      napDurations.push(
        Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      );
    }
    
    if (wakeWindows.length > 0) {
      awakeWindows.push(
        Math.round(wakeWindows.reduce((sum, w) => sum + w, 0) / wakeWindows.length)
      );
    }
  }
  
  // Get typical bedtime and night sleep from night sessions
  const nightSessions = recentSessions.filter(s => s.sleepType === 'NIGHTTIME' && s.endTime);
  const nightDurations = nightSessions.map(s =>
    differenceInMinutes(s.endTime!, s.startTime)
  );
  const avgNightSleep = nightDurations.length > 0
    ? Math.round(nightDurations.reduce((sum, d) => sum + d, 0) / nightDurations.length)
    : 660;
    
  const bedtimes = nightSessions.map(s => {
    const start = s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
    return start.getHours() * 60 + start.getMinutes();
  });
  const avgBedtimeMinutes = bedtimes.length > 0
    ? Math.round(bedtimes.reduce((sum, t) => sum + t, 0) / bedtimes.length)
    : 19 * 60;
  
  const bedtimeHours = Math.floor(avgBedtimeMinutes / 60);
  const bedtimeMinutes = avgBedtimeMinutes % 60;
  const bedtime = `${bedtimeHours.toString().padStart(2, '0')}:${bedtimeMinutes.toString().padStart(2, '0')}`;
  
  return {
    averageNaps,
    napDurations,
    awakeWindows,
    bedtime,
    nightSleep: avgNightSleep
  };
}
