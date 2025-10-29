'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useThemeStore } from '@/lib/theme-store';

export function SleepPredictionsSkeleton() {
  const { getThemeConfig } = useThemeStore();
  const themeConfig = getThemeConfig();

  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i} className={`border-0 shadow-lg bg-linear-to-r ${themeConfig.colors.card} backdrop-blur-sm`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SleepHistorySkeleton() {
  const { getThemeConfig } = useThemeStore();
  const themeConfig = getThemeConfig();

  return (
    <Card className={`border-0 shadow-xl bg-linear-to-br ${themeConfig.colors.card} backdrop-blur-sm`}>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/50">
              <div className="flex items-center space-x-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
