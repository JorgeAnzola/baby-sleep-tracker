'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguageStore } from '@/lib/i18n/language-store';
import { useThemeStore } from '@/lib/theme-store';
import { Edit3, Moon, Square, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NightWakingLogger } from '@/components/NightWakingLogger';
import { NightSleepSummary } from '@/components/NightSleepSummary';

interface SleepTimerProps {
  isActive: boolean;
  startTime: Date | null;
  sleepType: 'NAP' | 'NIGHTTIME';
  sessionId?: string;
  onStartSleep: (type: 'NAP' | 'NIGHTTIME') => void;
  onEndSleep: () => void;
  onEditStartTime?: (newStartTime: Date) => void;
  className?: string;
}

export function SleepTimer({
  isActive,
  startTime,
  sleepType,
  sessionId,
  onStartSleep,
  onEndSleep,
  onEditStartTime,
  className = ''
}: SleepTimerProps) {
  const { t } = useLanguageStore();
  const { getThemeConfig } = useThemeStore();
  const themeConfig = getThemeConfig();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTime, setEditTime] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && startTime) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, startTime]);

  const formatTime = () => {
    if (!isActive || !startTime) return '00:00';
    
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const totalSeconds = Math.floor((currentTime.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEditStartTime = () => {
    if (startTime) {
      const timeString = startTime.toTimeString().slice(0, 5); // HH:MM format
      setEditTime(timeString);
      setShowEditDialog(true);
    }
  };

  const handleSaveEditedTime = () => {
    if (editTime && onEditStartTime && startTime) {
      const [hours, minutes] = editTime.split(':').map(Number);
      const newStartTime = new Date(startTime);
      newStartTime.setHours(hours, minutes, 0, 0);
      
      onEditStartTime(newStartTime);
      setShowEditDialog(false);
    }
  };

  if (isActive) {
    return (
      <Card className={`w-full max-w-sm mx-auto ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            {sleepType === 'NAP' ? (
              <Sun className="w-8 h-8 text-amber-500 mr-2 animate-pulse" />
            ) : (
              <Moon className="w-8 h-8 text-indigo-500 mr-2 animate-pulse" />
            )}
            <Badge 
              variant="outline"
              className={`${sleepType === 'NAP' ? themeConfig.colors.napBadge : themeConfig.colors.nightBadge} border font-semibold text-sm px-4 py-1 shadow-md`}
            >
              {sleepType === 'NAP' ? t.sleep.nap : t.sleep.nightSleep}
            </Badge>
          </div>
          
          <div className="text-4xl font-mono font-bold text-primary mb-2">
            {formatTime()}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <span>
              {t.sleep.sleepingSince} {startTime?.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {onEditStartTime && (
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={handleEditStartTime}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.sleep.editStartTime}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t.sleep.startTime}
                      </label>
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveEditedTime} 
                        className="flex-1"
                      >
                        {t.common.save}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowEditDialog(false)}
                        className="flex-1"
                      >
                        {t.common.cancel}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <Button 
            onClick={onEndSleep}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            <Square className="w-5 h-5 mr-2" />
            {t.sleep.endSleep}
          </Button>

          {/* Night Waking Components - Only shown during NIGHTTIME sessions */}
          {sleepType === 'NIGHTTIME' && sessionId && startTime && (
            <div className="mt-6 space-y-4">
              <NightWakingLogger 
                sleepSessionId={sessionId}
                onSuccess={() => {
                  // Optional: Add any refresh logic here if needed
                }}
              />
              <NightSleepSummary 
                sleepSessionId={sessionId}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-sm mx-auto ${className}`}>
      <CardContent className="p-6 text-center">
        <div className="text-2xl font-semibold mb-6 text-muted-foreground">
          {t.sleep.sleepTypeQuestion}
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={() => onStartSleep('NAP')}
            variant="default"
            size="lg"
            className={`w-full ${themeConfig.colors.napButton} text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold border-0`}
          >
            <Sun className="w-5 h-5 mr-2" />
            {t.sleep.startNap}
          </Button>
          
          <Button
            onClick={() => onStartSleep('NIGHTTIME')}
            variant="default"
            size="lg"
            className={`w-full ${themeConfig.colors.nightButton} text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold border-0`}
          >
            <Moon className="w-5 h-5 mr-2" />
            {t.sleep.startNight}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}