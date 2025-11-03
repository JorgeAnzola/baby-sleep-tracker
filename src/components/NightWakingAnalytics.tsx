'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Clock, Moon, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  totalWakings: number;
  averageWakingsPerNight: number;
  averageDurationMinutes: number;
  longestStretchMinutes: number;
  improvementTrend: 'improving' | 'stable' | 'worsening';
  dailyBreakdown: Array<{
    date: string;
    wakings: number;
    totalDurationMinutes: number;
  }>;
}

interface NightWakingAnalyticsProps {
  babyId: string;
}

/**
 * Simplified Night Waking Analytics
 * Shows essential stats and trends
 * Clean, minimal design
 */
export function NightWakingAnalytics({ babyId }: NightWakingAnalyticsProps) {
  const [period, setPeriod] = useState<7 | 30>(7);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/night-waking/analytics?babyId=${babyId}&days=${period}`);
        if (response.ok) {
          const analytics = await response.json();
          setData(analytics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [babyId, period]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTrendIcon = () => {
    if (!data) return null;
    
    switch (data.improvementTrend) {
      case 'improving':
        return <TrendingDown className="h-5 w-5 text-green-600" />;
      case 'worsening':
        return <TrendingDown className="h-5 w-5 text-red-600 rotate-180" />;
      default:
        return <div className="h-5 w-5 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendText = () => {
    if (!data) return '';
    
    switch (data.improvementTrend) {
      case 'improving':
        return '¡Mejorando! 📈';
      case 'worsening':
        return 'Más despertares 📉';
      default:
        return 'Estable';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Cargando estadísticas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-600" />
              Análisis de Despertares Nocturnos
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={period === 7 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(7)}
              >
                7 días
              </Button>
              <Button
                variant={period === 30 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(30)}
              >
                30 días
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600">
                  {data.averageWakingsPerNight.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Promedio por noche
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">
                  {formatDuration(data.longestStretchMinutes)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Tramo más largo
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600">
                  {formatDuration(data.averageDurationMinutes)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Duración promedio
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  {getTrendIcon()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {getTrendText()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Breakdown - Simplified Bar Chart */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Despertares por Noche
            </h3>
            <div className="space-y-2">
              {data.dailyBreakdown.map((day) => {
                const maxWakings = Math.max(...data.dailyBreakdown.map(d => d.wakings), 1);
                const percentage = (day.wakings / maxWakings) * 100;
                const date = new Date(day.date);
                const isToday = new Date().toDateString() === date.toDateString();
                
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={isToday ? 'font-bold' : ''}>
                        {date.toLocaleDateString('es-MX', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <span className="font-semibold">
                        {day.wakings} {day.wakings === 1 ? 'vez' : 'veces'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          day.wakings === 0 
                            ? 'bg-green-500' 
                            : day.wakings <= 2 
                            ? 'bg-blue-500' 
                            : day.wakings <= 4
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Encouragement Message */}
          {data.averageWakingsPerNight <= 2 && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Award className="h-5 w-5" />
                <span className="font-semibold">¡Excelente progreso!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Menos de 2 despertares por noche en promedio. Sigue así! 🎉
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
