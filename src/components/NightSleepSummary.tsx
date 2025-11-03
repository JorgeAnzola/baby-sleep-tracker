'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Moon, TrendingUp, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NightWaking {
  id: string;
  wakeTime: string;
  sleepTime?: string | null;
  durationMinutes?: number | null;
  interventionType: string;
  selfSoothed: boolean;
}

interface NightSleepSummaryProps {
  sleepSessionId: string;
  sessionEndTime?: Date | string | null;
}

/**
 * Simplified Night Sleep Summary
 * Shows count of wakings and a simple list
 * Minimal UI for nighttime viewing
 */
export function NightSleepSummary({ 
  sleepSessionId, 
  sessionEndTime 
}: NightSleepSummaryProps) {
  const [wakings, setWakings] = useState<NightWaking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWakings = useCallback(async () => {
    try {
      const response = await fetch(`/api/night-waking?sleepSessionId=${sleepSessionId}`);
      if (response.ok) {
        const data = await response.json();
        setWakings(data);
      }
    } catch (error) {
      console.error('Error fetching night wakings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sleepSessionId]);

  useEffect(() => {
    fetchWakings();
    
    // Auto-refresh every 30 seconds if session is active
    if (!sessionEndTime) {
      const interval = setInterval(fetchWakings, 30000);
      return () => clearInterval(interval);
    }
  }, [sleepSessionId, sessionEndTime, fetchWakings]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteWaking = async (wakingId: string) => {
    setDeletingId(wakingId);
    try {
      const response = await fetch(`/api/night-waking/${wakingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete waking');
      }

      toast.success('Despertar eliminado');
      fetchWakings(); // Refresh the list
    } catch (error) {
      console.error('Error deleting night waking:', error);
      toast.error('Error al eliminar despertar');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-purple-50/50 dark:bg-purple-950/20">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Moon className="h-5 w-5 text-purple-600" />
          Resumen de la Noche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border min-w-[120px] text-center">
            <div className="text-3xl font-bold text-purple-600">
              {wakings.length}
            </div>
            <div className="text-sm text-muted-foreground">Despertares</div>
          </div>
        </div>

        {/* Waking List - Simple */}
        {wakings.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Horarios
            </div>
            <div className="space-y-1">
              {[...wakings]
                .sort((a, b) => new Date(b.wakeTime).getTime() - new Date(a.wakeTime).getTime())
                .map((waking) => (
                  <div
                    key={waking.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 rounded px-3 py-2 text-sm border group"
                  >
                    <span className="font-medium">{formatTime(waking.wakeTime)}</span>
                    <div className="flex items-center gap-2">
                      {waking.durationMinutes && (
                        <span className="text-muted-foreground text-xs">
                          {waking.durationMinutes}min
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWaking(waking.id)}
                        disabled={deletingId === waking.id}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {wakings.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Sin despertares registrados
          </div>
        )}
      </CardContent>
    </Card>
  );
}
