'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Moon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface NightWakingLoggerProps {
  sleepSessionId: string;
  onSuccess?: () => void;
  onOptimisticUpdate?: () => void;
}

/**
 * Ultra-simplified Night Waking Logger
 * One-tap button to log night wakings with current timestamp
 * Designed for 3am use - no forms, no questions
 */
export function NightWakingLogger({ sleepSessionId, onSuccess, onOptimisticUpdate }: NightWakingLoggerProps) {
  const [isLogging, setIsLogging] = useState(false);

  const handleQuickLog = async () => {
    // Optimistic update - increment count immediately
    if (onOptimisticUpdate) {
      onOptimisticUpdate();
    }

    setIsLogging(true);
    
    // Agregar un pequeño delay para que sea más visible
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const response = await fetch('/api/night-waking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sleepSessionId,
          wakeTime: new Date().toISOString(),
          interventionType: 'COMFORT', // Default simple intervention
          selfSoothed: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log night waking');
      }

      toast.success('Despertar nocturno registrado', {
        description: new Date().toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error logging night waking:', error);
      toast.error('Error al registrar despertar');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Button
      onClick={handleQuickLog}
      disabled={isLogging}
      size="lg"
      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 text-lg transition-all"
    >
      {isLogging ? (
        <>
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Registrando...
        </>
      ) : (
        <>
          <Moon className="mr-2 h-6 w-6" />
          Anotar Interrupción
        </>
      )}
    </Button>
  );
}
