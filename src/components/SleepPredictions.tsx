'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguageStore } from '@/lib/i18n/language-store';
import { Clock, Moon, Sun, Sunrise } from 'lucide-react';

interface Prediction {
  predictedTime: Date;
  confidence: number;
  predictedDuration?: number;
  reasoning: string;
  type: 'nap' | 'bedtime' | 'wakeup';
}

interface SleepPredictionsProps {
  predictions: Prediction[];
  className?: string;
}

export function SleepPredictions({ predictions, className = '' }: SleepPredictionsProps) {
  const { t } = useLanguageStore();
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTimeUntil = (date: Date) => {
    const now = new Date();
    const targetDate = date instanceof Date ? date : new Date(date);
    const diff = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60));
    
    if (diff < 0) {
      return `${t.predictions.ago} ` + formatDuration(Math.abs(diff));
    }
    
    if (diff < 60) {
      return `${t.predictions.timeUntil} ${diff} ${t.predictions.minutes}`;
    }
    
    return `${t.predictions.timeUntil} ${formatDuration(diff)}`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'nap':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'bedtime':
        return <Moon className="w-5 h-5 text-indigo-500" />;
      case 'wakeup':
        return <Sunrise className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'nap':
        return t.predictions.nextNap;
      case 'bedtime':
        return t.predictions.bedtime;
      case 'wakeup':
        return t.predictions.wakeup;
      default:
        return t.predictions.title;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return t.predictions.high;
    if (confidence >= 0.6) return t.predictions.medium;
    return t.predictions.low;
  };

  // Filtrar predicciones: eliminar siestas pasadas, pero mantener bedtime y wakeup
  const now = new Date();
  const relevantPredictions = predictions.filter(prediction => {
    const predTime = prediction.predictedTime instanceof Date 
      ? prediction.predictedTime 
      : new Date(prediction.predictedTime);
    
    // Si es una siesta (nap) y ya pasó, no mostrarla
    if (prediction.type === 'nap' && predTime < now) {
      return false;
    }
    
    // Bedtime y wakeup siempre se muestran (son referencias para el día)
    return true;
  });

  if (relevantPredictions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t.predictions.noPredictions}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {relevantPredictions.map((prediction, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center">
                {getIcon(prediction.type)}
                <span className="ml-2">{getTitle(prediction.type)}</span>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {formatTime(prediction.predictedTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getTimeUntil(prediction.predictedTime)}
                  </div>
                </div>
                
                {prediction.predictedDuration && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-muted-foreground">
                      ~{formatDuration(prediction.predictedDuration)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.predictions.expectedDuration}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{t.predictions.confidence}</span>
                    <Badge 
                      variant="outline" 
                      className={getConfidenceColor(prediction.confidence)}
                    >
                      {getConfidenceText(prediction.confidence)}
                    </Badge>
                  </div>
                  <span className={getConfidenceColor(prediction.confidence)}>
                    {Math.round(prediction.confidence * 100)}%
                  </span>
                </div>
                <Progress 
                  value={prediction.confidence * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {prediction.reasoning}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}