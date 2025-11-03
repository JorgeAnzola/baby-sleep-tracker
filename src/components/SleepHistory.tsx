'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguageStore } from '@/lib/i18n/language-store';
import { formatDuration } from '@/lib/sleep-predictions';
import { useThemeStore } from '@/lib/theme-store';
import { AlertCircle, Clock, Edit3, Moon, Sun, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NightWaking {
  id: string;
  wakeTime: string;
  sleepTime?: string | null;
  durationMinutes?: number | null;
  interventionType: string;
  selfSoothed: boolean;
}

interface SleepSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  sleepType: 'NAP' | 'NIGHTTIME';
  quality?: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  notes?: string;
  location?: string;
}

interface SleepHistoryProps {
  sessions: SleepSession[];
  onEditSession?: (sessionId: string, updates: Partial<SleepSession>) => void;
  onDeleteSession?: (sessionId: string) => void;
  className?: string;
}

export function SleepHistory({ sessions, onEditSession, onDeleteSession, className = '' }: SleepHistoryProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<SleepSession | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [nightWakings, setNightWakings] = useState<Record<string, NightWaking[]>>({});
  
  const { t } = useLanguageStore();
  const { getThemeConfig } = useThemeStore();
  const themeConfig = getThemeConfig();

  // Deduplicate sessions by ID to prevent duplicate key errors
  const uniqueSessions = sessions.reduce((acc, session) => {
    const existing = acc.find(s => s.id === session.id);
    if (!existing) {
      acc.push(session);
    }
    return acc;
  }, [] as SleepSession[]);

  // Fetch night wakings for NIGHTTIME sessions
  useEffect(() => {
    const fetchNightWakings = async () => {
      const nighttimeSessions = uniqueSessions.filter(s => s.sleepType === 'NIGHTTIME' && s.endTime);
      
      for (const session of nighttimeSessions) {
        try {
          const response = await fetch(`/api/night-waking?sleepSessionId=${session.id}`);
          if (response.ok) {
            const wakings = await response.json();
            setNightWakings(prev => ({ ...prev, [session.id]: wakings }));
          }
        } catch (error) {
          console.error('Error fetching night wakings:', error);
        }
      }
    };

    if (uniqueSessions.length > 0) {
      fetchNightWakings();
    }
  }, [uniqueSessions]);

  const handleEditSession = (session: SleepSession) => {
    setEditingSession(session);
    
    const startTimeString = session.startTime.toTimeString().slice(0, 5);
    const endTimeString = session.endTime?.toTimeString().slice(0, 5) || '';
    
    setEditStartTime(startTimeString);
    setEditEndTime(endTimeString);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingSession || !onEditSession) return;

    const [startHours, startMinutes] = editStartTime.split(':').map(Number);
    const newStartTime = new Date(editingSession.startTime);
    newStartTime.setHours(startHours, startMinutes, 0, 0);

    let newEndTime: Date | undefined;
    let newDuration: number | undefined;

    if (editEndTime && editingSession.endTime) {
      const [endHours, endMinutes] = editEndTime.split(':').map(Number);
      newEndTime = new Date(editingSession.endTime);
      newEndTime.setHours(endHours, endMinutes, 0, 0);
      
      // Calculate new duration
      newDuration = Math.floor((newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60));
    }

    onEditSession(editingSession.id, {
      startTime: newStartTime,
      endTime: newEndTime,
      duration: newDuration
    });

    setShowEditDialog(false);
    setEditingSession(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (onDeleteSession) {
      onDeleteSession(sessionId);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = (sleepType: 'NAP' | 'NIGHTTIME') => {
    return sleepType === 'NAP' ? (
      <Sun className="w-4 h-4 text-amber-500" />
    ) : (
      <Moon className="w-4 h-4 text-indigo-500" />
    );
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'EXCELLENT': return 'text-green-600';
      case 'GOOD': return 'text-blue-600';
      case 'FAIR': return 'text-yellow-600';
      case 'POOR': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getQualityText = (quality?: string) => {
    switch (quality) {
      case 'EXCELLENT': return t.history.excellent;
      case 'GOOD': return t.history.good;
      case 'FAIR': return t.history.fair;
      case 'POOR': return t.history.poor;
      default: return t.history.unrated;
    }
  };

  if (uniqueSessions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t.history.noSessions}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold">{t.history.title}</h3>
      
      {uniqueSessions.slice(0, 5).map((session) => (
        <Card key={session.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getIcon(session.sleepType)}
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={session.sleepType === 'NAP' ? 'default' : 'secondary'}
                      className={`${session.sleepType === 'NAP' ? themeConfig.colors.napBadge : themeConfig.colors.nightBadge} font-semibold text-xs px-3 py-0.5 border-0`}
                    >
                      {session.sleepType === 'NAP' ? t.sleep.nap : t.sleep.nightSleep}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(session.startTime)}
                    </span>
                  </div>
                  
                  <div className="text-sm font-medium">
                    {formatTime(session.startTime)} - {session.endTime ? formatTime(session.endTime) : t.history.inProgress}
                  </div>
                  
                  {session.duration && (
                    <div className="text-sm text-muted-foreground">
                      {t.history.durationLabel}: {formatDuration(session.duration)}
                    </div>
                  )}
                  
                  {session.quality && (
                    <div className={`text-xs ${getQualityColor(session.quality)}`}>
                      {t.history.qualityLabel}: {getQualityText(session.quality)}
                    </div>
                  )}
                  
                  {/* Night Wakings */}
                  {session.sleepType === 'NIGHTTIME' && nightWakings[session.id] && nightWakings[session.id].length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-1 text-xs text-purple-600 font-medium mb-1">
                        <AlertCircle className="w-3 h-3" />
                        {nightWakings[session.id].length} {nightWakings[session.id].length === 1 ? 'despertar' : 'despertares'}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {nightWakings[session.id].slice(0, 3).map((waking) => (
                          <span key={waking.id} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                            {new Date(waking.wakeTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ))}
                        {nightWakings[session.id].length > 3 && (
                          <span className="text-xs text-purple-600">
                            +{nightWakings[session.id].length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {session.endTime && (
                <div className="flex gap-1">
                  {onEditSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSession(session)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {onDeleteSession && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.history.deleteConfirmTitle}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t.history.deleteConfirmMessage}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.history.cancel}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteSession(session.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t.history.delete}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.history.editSession}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.history.startTimeLabel}
              </label>
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.history.endTimeLabel}
              </label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveEdit} 
                className="flex-1"
              >
                {t.history.saveChanges}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                {t.history.cancel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}