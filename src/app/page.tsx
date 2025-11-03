'use client';

import { DarkModeToggle } from '@/components/DarkModeToggle';
import { Settings } from '@/components/Settings';
import { SleepHistorySkeleton, SleepPredictionsSkeleton } from '@/components/SkeletonLoaders';
import { SleepHistory } from '@/components/SleepHistory';
import { SleepPredictions } from '@/components/SleepPredictions';
import { SleepTimer } from '@/components/SleepTimer';
import { SleepTimerSkeleton } from '@/components/SleepTimerSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguageStore } from '@/lib/i18n/language-store';
import { predictBedtime, predictNextNap, predictWakeUp } from '@/lib/sleep-predictions';
import { useSleepStore, type SleepSession } from '@/lib/store';
import { useThemeStore } from '@/lib/theme-store';
import { addMonths, differenceInDays, differenceInMonths } from 'date-fns';
import { Baby, Moon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Prediction {
  predictedTime: Date;
  confidence: number;
  predictedDuration?: number;
  reasoning: string;
  type: 'nap' | 'bedtime' | 'wakeup';
}

interface SessionApiResponse {
  id: string;
  baby_id: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  sleep_type: 'NAP' | 'NIGHTTIME';
  quality: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' | null;
  notes: string | null;
  location: string | null;
}

export default function Home() {
  const router = useRouter();
  const {
    currentUserId,
    setCurrentUserId,
    clearAllData,
    currentBaby,
    setCurrentBaby,
    activeSleepSession,
    setActiveSleepSession,
    sleepSessions,
    addSleepSession,
    updateSleepSession,
    removeSleepSession,
    clearSleepSessions,
    isTimerRunning,
    timerStartTime,
    startTimer,
    stopTimer,
    updateTimerStartTime,
    setTimerRunning,
    scheduleConfig,
    syncScheduleConfig
  } = useSleepStore();

  const { getThemeConfig, syncTheme, currentTheme, setTheme, getAllThemes } = useThemeStore();
  const { t, syncLanguage, language, setLanguage, getAvailableLanguages } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  // Use default theme during SSR to avoid hydration mismatch
  const themeConfig = mounted ? getThemeConfig() : {
    id: 'default' as const,
    name: 'Cielo Azul',
    colors: {
      primary: 'from-blue-400 to-blue-600',
      secondary: 'from-blue-50 to-indigo-100',
      accent: 'from-blue-500 to-indigo-600',
      background: 'from-blue-50 via-indigo-50 to-purple-50',
      card: 'from-white/80 to-blue-50/50',
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }
  };

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showBabyDialog, setShowBabyDialog] = useState(false);
  const [babyName, setBabyName] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Wait for hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user changed and clear store if needed
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          const serverUserId = data.user.id;
          
          // If stored userId is different from server userId, clear all data
          if (currentUserId && currentUserId !== serverUserId) {
            console.log('User changed, clearing store data');
            clearAllData();
          }
          
          // Update current user ID
          setCurrentUserId(serverUserId);
        } else if (response.status === 401) {
          // User not logged in, clear everything
          clearAllData();
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };

    if (mounted) {
      checkUser();
    }
  }, [mounted, currentUserId, setCurrentUserId, clearAllData, router]);

  // Sync user preferences from server on mount
  useEffect(() => {
    if (mounted) {
      syncTheme();
      syncLanguage();
      syncScheduleConfig();
    }
  }, [mounted, syncTheme, syncLanguage, syncScheduleConfig]);

  const loadBabies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/babies');
      
      // Check if unauthorized (user not logged in)
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      
      const data = await response.json();
      
      if (data.babies && data.babies.length > 0) {
        const baby = {
          id: data.babies[0].id,
          name: data.babies[0].name,
          birthDate: new Date(data.babies[0].birth_date),
          isOwner: data.babies[0].is_owner !== false // Default to true for backward compatibility
        };
        setCurrentBaby(baby);
        
        // Load sleep sessions for this baby
        const sessionsResponse = await fetch(`/api/sleep-session?baby_id=${baby.id}`);
        const sessionsData = await sessionsResponse.json();
        
        if (sessionsData.success && sessionsData.sessions) {
          // Clear existing sessions and add new ones
          const sessions = sessionsData.sessions.map((session: SessionApiResponse) => ({
            id: session.id,
            babyId: session.baby_id,
            startTime: new Date(session.start_time),
            endTime: session.end_time ? new Date(session.end_time) : undefined,
            duration: session.duration,
            sleepType: session.sleep_type,
            quality: session.quality,
            notes: session.notes,
            location: session.location
          }));
          
          // Clear all sessions first
          clearSleepSessions();
          
          // Add new sessions
          sessions.forEach((session: SleepSession) => addSleepSession(session));
          
          // Check for active session
          const activeSession = sessions.find((session: SleepSession) => !session.endTime);
          if (activeSession) {
            setActiveSleepSession(activeSession);
            updateTimerStartTime(activeSession.startTime);
            // Set timer running without updating start time
            setTimerRunning(true);
          } else {
            setActiveSleepSession(null);
            stopTimer();
          }
        }
      }
    } catch (error) {
      console.error('Error loading babies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentBaby, clearSleepSessions, addSleepSession, setActiveSleepSession, updateTimerStartTime, setTimerRunning, stopTimer, router]);

  const createBaby = async () => {
    if (!babyName || !babyBirthDate) return;

    try {
      const response = await fetch('/api/babies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: babyName,
          birth_date: babyBirthDate
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const newBaby = {
          id: data.baby.id,
          name: data.baby.name,
          birthDate: new Date(data.baby.birth_date)
        };
        setCurrentBaby(newBaby);
        setShowBabyDialog(false);
        setBabyName('');
        setBabyBirthDate('');
      }
    } catch (error) {
      console.error('Error creating baby:', error);
    }
  };

  const handleStartSleep = async (type: 'NAP' | 'NIGHTTIME') => {
    if (!currentBaby) return;

    try {
      const response = await fetch('/api/sleep-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baby_id: currentBaby.id,
          sleep_type: type
        })
      });

      const data = await response.json();

      if (data.success) {
        const session = {
          id: data.session.id,
          babyId: currentBaby.id,
          startTime: new Date(data.session.start_time),
          sleepType: type
        };
        
        setActiveSleepSession(session);
        addSleepSession(session);
        startTimer();
      }
    } catch (error) {
      console.error('Error starting sleep session:', error);
    }
  };

  const handleEndSleep = async () => {
    if (!currentBaby || !activeSleepSession) return;

    try {
      const response = await fetch('/api/sleep-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baby_id: currentBaby.id
        })
      });

      const data = await response.json();

      if (data.success) {
        updateSleepSession(activeSleepSession.id, {
          endTime: new Date(data.session.end_time),
          duration: data.session.duration
        });
        
        setActiveSleepSession(null);
        stopTimer();
        
        // Regenerate predictions after ending sleep
        generatePredictions();
      }
    } catch (error) {
      console.error('Error ending sleep session:', error);
    }
  };

  const handleEditStartTime = async (newStartTime: Date) => {
    if (!currentBaby || !activeSleepSession) return;

    try {
      const response = await fetch('/api/sleep-session/edit-start-time', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baby_id: currentBaby.id,
          new_start_time: newStartTime.toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the active session and store
        const updatedSession = {
          ...activeSleepSession,
          startTime: new Date(data.session.start_time)
        };
        
        setActiveSleepSession(updatedSession);
        updateSleepSession(activeSleepSession.id, {
          startTime: new Date(data.session.start_time)
        });
        
        // Update timer start time
        updateTimerStartTime(new Date(data.session.start_time));
      }
    } catch (error) {
      console.error('Error editing start time:', error);
    }
  };

  const handleEditSession = async (sessionId: string, updates: Partial<{
    startTime: Date;
    endTime: Date;
    quality: string;
    notes: string;
  }>) => {
    if (!currentBaby) return;

    try {
      const response = await fetch(`/api/sleep-session/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: updates.startTime?.toISOString(),
          end_time: updates.endTime?.toISOString(),
          quality: updates.quality,
          notes: updates.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the session in the store
        updateSleepSession(sessionId, {
          startTime: new Date(data.session.start_time),
          endTime: data.session.end_time ? new Date(data.session.end_time) : undefined,
          duration: data.session.duration,
          quality: data.session.quality,
          notes: data.session.notes
        });
        
        // Regenerate predictions after editing
        generatePredictions();
      }
    } catch (error) {
      console.error('Error editing session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!currentBaby) return;

    try {
      const response = await fetch(`/api/sleep-session/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        // Remove the session from the store
        removeSleepSession(sessionId);
        
        // Regenerate predictions after deleting a session
        generatePredictions();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleImportComplete = () => {
    // Reload sessions from database after import
    loadBabies();
    // Regenerate predictions with new data
    generatePredictions();
  };

  const handleBabyUpdate = async (updates: { birthDate?: Date }) => {
    if (!currentBaby || !updates.birthDate) return;

    console.log('handleBabyUpdate called with:', updates);
    console.log('Current baby before update:', currentBaby);

    try {
      const response = await fetch(`/api/babies/${currentBaby.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_date: updates.birthDate.toISOString().split('T')[0]
        })
      });

      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        const newBirthDate = new Date(data.baby.birth_date);
        const updatedBaby = {
          id: currentBaby.id,
          name: currentBaby.name,
          birthDate: newBirthDate
        };
        
        console.log('Updating baby to:', updatedBaby);
        console.log('New birth date:', newBirthDate);
        console.log('Old birth date:', currentBaby.birthDate);
        
        // Update the current baby in the store
        setCurrentBaby(updatedBaby);
        
        // Regenerate predictions with new birth date
        generatePredictions();
        
        // Force a re-render by logging the change
        console.log('Baby updated, age should be:', formatAge(newBirthDate));
      }
    } catch (error) {
      console.error('Error updating baby:', error);
    }
  };

  const generatePredictions = useCallback(() => {
    if (!currentBaby) return;

    const sessions = sleepSessions
      .filter((s: SleepSession) => s.babyId === currentBaby.id)
      .map((s: SleepSession) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        sleepType: s.sleepType as 'NAP' | 'NIGHTTIME'
      }));

    // If baby is currently sleeping, predict wake-up time instead of next nap/bedtime
    if (activeSleepSession) {
      const currentSession = {
        startTime: activeSleepSession.startTime,
        endTime: activeSleepSession.endTime,
        sleepType: activeSleepSession.sleepType as 'NAP' | 'NIGHTTIME'
      };
      
      const wakeUp = predictWakeUp(currentBaby.birthDate, currentSession, sessions);
      
      const newPredictions = [
        {
          ...wakeUp,
          type: 'wakeup' as const
        }
      ];
      
      setPredictions(newPredictions);
    } else {
      // Baby is awake, predict next nap and bedtime
      const nextNap = predictNextNap(currentBaby.birthDate, sessions, new Date(), scheduleConfig);
      const bedtime = predictBedtime(currentBaby.birthDate, sessions, new Date(), scheduleConfig);

      const newPredictions = [
        {
          ...nextNap,
          type: 'nap' as const
        },
        {
          ...bedtime,
          type: 'bedtime' as const
        }
      ];

      setPredictions(newPredictions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBaby, activeSleepSession, scheduleConfig]);

  // Load initial data
  useEffect(() => {
    loadBabies();
  }, [loadBabies]);

  // Generate predictions when baby changes or when sleep session starts/ends
  useEffect(() => {
    if (currentBaby) {
      generatePredictions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBaby, activeSleepSession]);

  const formatAge = useCallback((birthDate: Date) => {
    const now = new Date();
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    
    // Calcular meses completos
    const months = differenceInMonths(now, birth);
    
    // Calcular días después del último mes completo
    const lastMonthDate = addMonths(birth, months);
    const days = differenceInDays(now, lastMonthDate);
    
    if (months === 0) {
      return `${days} ${t.baby.days}`;
    } else if (days === 0) {
      return `${months} ${months === 1 ? t.baby.month : t.baby.months}`;
    } else {
      return `${months}m ${days}d`;
    }
  }, [t]);

  const currentBabyAge = useMemo(() => {
    if (!currentBaby) return '';
    console.log('Calculating age for birth date:', currentBaby.birthDate);
    const age = formatAge(currentBaby.birthDate);
    console.log('Calculated age:', age);
    return age;
  }, [currentBaby, formatAge]);

  if (!currentBaby) {
    return (
      <div className={`min-h-screen bg-linear-to-br ${themeConfig.colors.background} p-4 flex items-center justify-center`}>
        <Card className={`w-full max-w-md border-0 shadow-xl bg-linear-to-br ${themeConfig.colors.card} backdrop-blur-sm`}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <div className={`p-2 rounded-full bg-linear-to-r ${themeConfig.colors.primary} text-white shadow-lg`}>
                <Baby className="w-6 h-6" />
              </div>
              <span className="bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {t.common.appName}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {t.baby.addBabyPrompt}
            </p>
            <Dialog open={showBabyDialog} onOpenChange={setShowBabyDialog}>
              <DialogTrigger asChild>
                <Button className={`w-full bg-linear-to-r ${themeConfig.colors.primary} hover:opacity-90 text-white shadow-lg transition-all duration-200 hover:scale-105`}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.baby.addBaby}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.baby.babyInfo}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Language & Theme Settings */}
                  <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600">
                        {t.settings?.language || 'Language'}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                        className="w-full p-2 border rounded-md text-sm"
                      >
                        {getAvailableLanguages().map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600">
                        {t.settings?.theme || 'Theme'}
                      </label>
                      <select
                        value={currentTheme}
                        onChange={(e) => setTheme(e.target.value as any)}
                        className="w-full p-2 border rounded-md text-sm"
                      >
                        {getAllThemes().map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.name[language]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.baby.name}
                    </label>
                    <input
                      type="text"
                      value={babyName}
                      onChange={(e) => setBabyName(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder={t.baby.namePlaceholder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.baby.birthDate}
                    </label>
                    <input
                      type="date"
                      value={babyBirthDate}
                      onChange={(e) => setBabyBirthDate(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <Button onClick={createBaby} className={`w-full bg-linear-to-r ${themeConfig.colors.primary} hover:opacity-90 text-white shadow-lg transition-all duration-200 hover:scale-105`}>
                    {t.baby.createProfile}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-linear-to-br ${themeConfig.colors.background} p-4 md:p-8`}>
      {/* Desktop: Max width más amplio */}
      <div className="max-w-md md:max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {currentBaby.name}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {currentBabyAge}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Settings 
              babyId={currentBaby.id}
              babyName={currentBaby.name}
              babyBirthDate={currentBaby.birthDate}
              onImportComplete={handleImportComplete}
              onBabyUpdate={handleBabyUpdate}
              sessions={sleepSessions.filter((s: SleepSession) => s.babyId === currentBaby.id)}
              isOwner={currentBaby.isOwner !== false}
            />
          </div>
        </div>

        {/* Desktop Layout: Grid de 2-3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Columna 1: Timer + Status */}
          <div className="space-y-6">
            {isLoading ? (
              <SleepTimerSkeleton />
            ) : (
              <>
                <SleepTimer
                  isActive={isTimerRunning && !!activeSleepSession}
                  startTime={timerStartTime}
                  sleepType={activeSleepSession?.sleepType || 'NAP'}
                  sessionId={activeSleepSession?.id}
                  onStartSleep={handleStartSleep}
                  onEndSleep={handleEndSleep}
                  onEditStartTime={handleEditStartTime}
                />
                
                {activeSleepSession && (
                  <Card className={`border-0 shadow-lg bg-linear-to-r ${themeConfig.colors.card} backdrop-blur-sm overflow-hidden`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center gap-2 relative">
                        <div className={`p-2 rounded-full bg-linear-to-r ${themeConfig.colors.primary} text-white shadow-md animate-pulse relative`}>
                          <Moon className="w-4 h-4" />
                          {/* Animated Zzz */}
                          <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                            <span className="text-gray-800 text-xs font-bold animate-float-z1 opacity-0">Z</span>
                            <span className="text-gray-800 text-[10px] font-bold animate-float-z2 opacity-0">z</span>
                            <span className="text-gray-800 text-[8px] font-bold animate-float-z3 opacity-0">z</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {activeSleepSession.sleepType === 'NAP' ? t.sleep.napping : t.sleep.sleeping}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Columna 2: Predicciones */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">✨</span>
              <h2 className="text-lg font-semibold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {t.predictions.title}
              </h2>
            </div>
            {isLoading ? (
              <SleepPredictionsSkeleton />
            ) : (
              <SleepPredictions predictions={predictions} />
            )}
          </div>

          {/* Columna 3: Historial + Configuración (desktop lg+) */}
          <div className="hidden lg:block space-y-6">
            {isLoading ? (
              <SleepHistorySkeleton />
            ) : (
              <SleepHistory 
                sessions={sleepSessions
                  .filter((s: SleepSession) => s.babyId === currentBaby.id && s.endTime)
                  .sort((a: SleepSession, b: SleepSession) => {
                    const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime();
                    const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime();
                    return bTime - aTime;
                  })
                }
                onEditSession={handleEditSession}
                onDeleteSession={handleDeleteSession}
              />
            )}
          </div>
        </div>

        {/* Historial + Configuración móvil/tablet (visible en <lg) */}
        <div className="lg:hidden space-y-6">
          {isLoading ? (
            <SleepHistorySkeleton />
          ) : (
            <SleepHistory 
              sessions={sleepSessions
                .filter((s: SleepSession) => s.babyId === currentBaby.id && s.endTime)
                .sort((a: SleepSession, b: SleepSession) => {
                  const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime();
                  const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime();
                  return bTime - aTime;
                })
              }
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
            />
          )}
        </div>
      </div>
    </div>
  );
}
