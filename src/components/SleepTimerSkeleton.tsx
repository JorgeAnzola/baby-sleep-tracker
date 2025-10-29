'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useThemeStore } from '@/lib/theme-store';

export function SleepTimerSkeleton() {
  const { getThemeConfig } = useThemeStore();
  const themeConfig = getThemeConfig();

  return (
    <Card className={`border-0 shadow-xl bg-linear-to-br ${themeConfig.colors.card} backdrop-blur-sm`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display Skeleton */}
        <div className="text-center space-y-2">
          <Skeleton className="h-16 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
