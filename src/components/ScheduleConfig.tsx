'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguageStore } from '@/lib/i18n/language-store';
import {
    calculateBabyAge,
    calculatePersonalizedSchedule,
    getRecommendedScheduleForAge
} from '@/lib/sleep-predictions';
import { type SleepSession, useSleepStore } from '@/lib/store';
import { Calendar, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScheduleConfigProps {
  birthDate: Date;
  sessions: SleepSession[];
  babyId: string; // NEW: Need babyId to fetch/save baby-specific settings
}

export default function ScheduleConfig({ birthDate, sessions, babyId }: ScheduleConfigProps) {
  const { t } = useLanguageStore();
  const { babySettings, fetchBabySettings, updateBabySettings } = useSleepStore();
  const ageInDays = calculateBabyAge(birthDate);
  
  // Fetch baby-specific settings on mount or when babyId changes
  useEffect(() => {
    fetchBabySettings(babyId);
  }, [babyId, fetchBabySettings]);
  
  // Get baby-specific settings (per-baby, not per-user)
  const currentSettings = babySettings[babyId];
  
  // Initialize with age-based recommendations or stored config
  const recommended = getRecommendedScheduleForAge(ageInDays);
  
  const [napsPerDay, setNapsPerDay] = useState(
    currentSettings?.napsPerDay ?? recommended.averageNaps
  );
  const [wakeWindows, setWakeWindows] = useState<number[]>(
    currentSettings?.wakeWindows ?? recommended.awakeWindows
  );
  const [napDurations, setNapDurations] = useState<number[]>(
    currentSettings?.napDurations ?? recommended.napDurations
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [bedtime, setBedtime] = useState(
    currentSettings?.bedtime ?? recommended.bedtime
  );
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Update local state when baby settings are loaded from server (only once)
  useEffect(() => {
    if (currentSettings && !isInitialized) {
      if (currentSettings.napsPerDay !== null) setNapsPerDay(currentSettings.napsPerDay);
      if (currentSettings.wakeWindows) setWakeWindows(currentSettings.wakeWindows);
      if (currentSettings.napDurations) setNapDurations(currentSettings.napDurations);
      if (currentSettings.bedtime) setBedtime(currentSettings.bedtime);
      setIsInitialized(true);
    }
  }, [currentSettings, isInitialized]);
  
  // Save to backend whenever values change (debounced)
  useEffect(() => {
    if (!isInitialized) return; // Don't save during initialization
    
    const saveTimeout = setTimeout(() => {
      updateBabySettings(babyId, {
        napsPerDay,
        wakeWindows,
        napDurations,
        bedtime,
      }).catch((err: unknown) => console.error('Failed to save baby settings:', err));
    }, 1000); // Debounce 1 second
    
    return () => clearTimeout(saveTimeout);
  }, [babyId, napsPerDay, wakeWindows, napDurations, bedtime, updateBabySettings, isInitialized]);
  
  const handleResetToAge = () => {
    const recommended = getRecommendedScheduleForAge(ageInDays);
    setNapsPerDay(recommended.averageNaps);
    setWakeWindows(recommended.awakeWindows);
    setNapDurations(recommended.napDurations);
    setBedtime(recommended.bedtime);
    showSuccessMessage();
  };
  
  const handleResetToHistory = () => {
    const personalized = calculatePersonalizedSchedule(sessions, ageInDays);
    if (!personalized) {
      alert(t.scheduleConfig.notEnoughData);
      return;
    }
    setNapsPerDay(personalized.averageNaps);
    setWakeWindows(personalized.awakeWindows);
    setNapDurations(personalized.napDurations);
    setBedtime(personalized.bedtime);
    showSuccessMessage();
  };
  
  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const handleNapsChange = (value: number) => {
    const newNaps = Math.max(1, Math.min(5, value));
    setNapsPerDay(newNaps);
    
    // Adjust arrays if needed
    if (newNaps > wakeWindows.length) {
      const lastWindow = wakeWindows[wakeWindows.length - 1] || 120;
      setWakeWindows([...wakeWindows, ...Array(newNaps - wakeWindows.length).fill(lastWindow)]);
    } else {
      setWakeWindows(wakeWindows.slice(0, newNaps));
    }
    
    if (newNaps > napDurations.length) {
      const lastDuration = napDurations[napDurations.length - 1] || 90;
      setNapDurations([...napDurations, ...Array(newNaps - napDurations.length).fill(lastDuration)]);
    } else {
      setNapDurations(napDurations.slice(0, newNaps));
    }
  };
  
  const handleWakeWindowChange = (index: number, value: number) => {
    const newWindows = [...wakeWindows];
    newWindows[index] = Math.max(30, Math.min(480, value));
    setWakeWindows(newWindows);
  };
  
  const handleNapDurationChange = (index: number, value: number) => {
    const newDurations = [...napDurations];
    newDurations[index] = Math.max(15, Math.min(240, value));
    setNapDurations(newDurations);
  };
  
  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };
  
  const hasEnoughData = sessions.filter(s => s.endTime).length >= 30;
  
  return (
    <Card className="border-0 shadow-lg backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                {t.scheduleConfig.title}
              </div>
            </CardTitle>
            <CardDescription>{t.scheduleConfig.description}</CardDescription>
          </div>
          {showSuccess && (
            <Badge className="bg-green-100 text-green-800 border-green-300 animate-pulse">
              ✓ {t.scheduleConfig.resetSuccess}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Reset Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleResetToAge}
            variant="outline"
            className="w-full bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t.scheduleConfig.useRecommended}
          </Button>
          
          <Button
            onClick={handleResetToHistory}
            disabled={!hasEnoughData}
            variant="outline"
            className="w-full bg-linear-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-300 disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {t.scheduleConfig.usePersonalized}
          </Button>
        </div>
        
        {/* Naps per day */}
        <div className="space-y-2">
          <Label htmlFor="napsPerDay" className="text-sm font-semibold">
            {t.scheduleConfig.napsPerDay}
          </Label>
          <p className="text-xs text-gray-600 mb-2">{t.scheduleConfig.napsPerDayDescription}</p>
          <Input
            id="napsPerDay"
            type="number"
            min={1}
            max={5}
            value={napsPerDay}
            onChange={(e) => handleNapsChange(parseInt(e.target.value) || 1)}
            className="w-full"
          />
        </div>
        
        {/* Wake Windows */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            {t.scheduleConfig.wakeWindows}
          </Label>
          <p className="text-xs text-gray-600 mb-2">{t.scheduleConfig.wakeWindowsDescription}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wakeWindows.map((window, index) => (
              <div key={index} className="space-y-1">
                <Label className="text-xs text-gray-600">
                  {t.scheduleConfig.napNumber} {index + 1}:
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={30}
                    max={480}
                    value={window}
                    onChange={(e) => handleWakeWindowChange(index, parseInt(e.target.value) || 30)}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-20">
                    {t.scheduleConfig.minutes} ({formatMinutesToHours(window)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
  {/* Nap Durations */}
        {/* Bedtime */}
        <div className="space-y-2">
          <Label htmlFor="bedtime" className="text-sm font-semibold">
            {t.scheduleConfig.bedtimeLabel || 'Bedtime (hora de dormir)'}
          </Label>
          <p className="text-xs text-gray-600 mb-2">{t.scheduleConfig.bedtimeDescription || 'Hora recomendada para acostar al bebé (formato 24h, ej: 19:00)'}</p>
          <Input
            id="bedtime"
            type="time"
            value={bedtime}
            onChange={e => setBedtime(e.target.value)}
            className="w-32"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            {t.scheduleConfig.napDurations}
          </Label>
          <p className="text-xs text-gray-600 mb-2">{t.scheduleConfig.napDurationsDescription}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {napDurations.map((duration, index) => (
              <div key={index} className="space-y-1">
                <Label className="text-xs text-gray-600">
                  {t.scheduleConfig.napNumber} {index + 1}:
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={15}
                    max={240}
                    value={duration}
                    onChange={(e) => handleNapDurationChange(index, parseInt(e.target.value) || 15)}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-20">
                    {t.scheduleConfig.minutes} ({formatMinutesToHours(duration)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Info about data */}
        {!hasEnoughData && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <RefreshCw className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              {t.scheduleConfig.notEnoughData}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
