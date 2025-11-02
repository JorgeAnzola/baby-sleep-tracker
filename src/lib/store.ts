import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Baby {
  id: string;
  name: string;
  birthDate: Date;
  isOwner?: boolean;
}

export interface SleepSession {
  id: string;
  babyId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  sleepType: 'NAP' | 'NIGHTTIME';
  quality?: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  notes?: string;
  location?: string;
}

export interface SleepPrediction {
  id: string;
  babyId: string;
  predictedNapTime: Date;
  confidence: number;
  predictedDuration: number;
  timeOfDay: string;
}

export interface ScheduleConfig {
  napsPerDay: number;
  wakeWindows: number[];
  napDurations: number[];
  bedtime?: string; // Optional, e.g. '19:00'
}

// Baby-specific settings (per-baby, not per-user)
export interface BabySettings {
  babyId: string;
  bedtime: string | null;
  wakeTime: string | null;
  napsPerDay: number | null;
  wakeWindows: number[] | null;
  napDurations: number[] | null;
  predictAlerts: boolean;
  quietHours: boolean;
}

interface SleepStore {
  // Current baby
  currentBaby: Baby | null;
  setCurrentBaby: (baby: Baby | null) => void;
  
  // Active sleep session
  activeSleepSession: SleepSession | null;
  setActiveSleepSession: (session: SleepSession | null) => void;
  
  // Sleep sessions
  sleepSessions: SleepSession[];
  addSleepSession: (session: SleepSession) => void;
  updateSleepSession: (id: string, updates: Partial<SleepSession>) => void;
  removeSleepSession: (id: string) => void;
  clearSleepSessions: () => void;
  
  // Predictions
  predictions: SleepPrediction[];
  setPredictions: (predictions: SleepPrediction[]) => void;
  
  // Baby-specific settings (NEW: per-baby instead of per-user)
  babySettings: Record<string, BabySettings>; // Keyed by babyId
  fetchBabySettings: (babyId: string) => Promise<void>;
  updateBabySettings: (babyId: string, settings: Partial<BabySettings>) => Promise<void>;
  getBabySettings: (babyId: string) => BabySettings | null;
  
  // DEPRECATED: Legacy per-user schedule config (kept for backward compatibility)
  scheduleConfig: ScheduleConfig | null;
  setScheduleConfig: (config: ScheduleConfig) => void;
  syncScheduleConfig: () => Promise<void>;
  
  // Timer state
  timerStartTime: Date | null;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  updateTimerStartTime: (startTime: Date) => void;
  setTimerRunning: (running: boolean) => void;
  
  // UI state
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useSleepStore = create<SleepStore>()(
  persist(
    (set) => ({
      // Current baby
      currentBaby: null,
      setCurrentBaby: (baby) => set({ currentBaby: baby }),
      
      // Active sleep session
      activeSleepSession: null,
      setActiveSleepSession: (session) => set({ activeSleepSession: session }),
      
      // Sleep sessions
      sleepSessions: [],
      addSleepSession: (session) => 
        set((state) => {
          // Check if session already exists to prevent duplicates
          const exists = state.sleepSessions.find(s => s.id === session.id);
          if (exists) {
            return state; // Return current state without changes
          }
          return { sleepSessions: [...state.sleepSessions, session] };
        }),
      updateSleepSession: (id, updates) =>
        set((state) => ({
          sleepSessions: state.sleepSessions.map((session) =>
            session.id === id ? { ...session, ...updates } : session
          ),
        })),
      removeSleepSession: (id) =>
        set((state) => ({
          sleepSessions: state.sleepSessions.filter((session) => session.id !== id),
        })),
      clearSleepSessions: () => set({ sleepSessions: [] }),
      
      // Predictions
      predictions: [],
      setPredictions: (predictions) => set({ predictions }),
      
      // Baby-specific settings (NEW: per-baby storage)
      babySettings: {},
      fetchBabySettings: async (babyId: string) => {
        try {
          const response = await fetch(`/api/baby-settings/${babyId}`);
          if (response.ok) {
            const settings = await response.json();
            set((state) => ({
              babySettings: {
                ...state.babySettings,
                [babyId]: settings,
              },
            }));
          }
        } catch (error) {
          console.error('Failed to fetch baby settings:', error);
        }
      },
      updateBabySettings: async (babyId: string, updates: Partial<BabySettings>) => {
        try {
          const response = await fetch(`/api/baby-settings/${babyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (response.ok) {
            const updatedSettings = await response.json();
            set((state) => ({
              babySettings: {
                ...state.babySettings,
                [babyId]: updatedSettings,
              },
            }));
          }
        } catch (error) {
          console.error('Failed to update baby settings:', error);
          throw error;
        }
      },
      getBabySettings: (babyId: string) => {
        const { babySettings } = useSleepStore.getState();
        return babySettings[babyId] || null;
      },
      
      // DEPRECATED: Legacy per-user schedule config
      scheduleConfig: null,
      setScheduleConfig: (config) => {
        set({ scheduleConfig: config });
        // Sync with backend asynchronously
        fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleConfig: config }),
        }).catch(err => console.error('Failed to sync schedule config:', err));
      },
      syncScheduleConfig: async () => {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            if (data.scheduleConfig) {
              set({ scheduleConfig: data.scheduleConfig });
            }
          }
        } catch (error) {
          console.error('Failed to sync schedule config from server:', error);
        }
      },
      
      // Timer state
      timerStartTime: null,
      isTimerRunning: false,
      startTimer: () => set({ timerStartTime: new Date(), isTimerRunning: true }),
      stopTimer: () => set({ timerStartTime: null, isTimerRunning: false }),
      updateTimerStartTime: (startTime) => set({ timerStartTime: startTime }),
      setTimerRunning: (running) => set({ isTimerRunning: running }),
      
      // UI state
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'baby-sleep-storage',
      partialize: (state) => ({
        currentBaby: state.currentBaby,
        sleepSessions: state.sleepSessions,
        scheduleConfig: state.scheduleConfig,
        isDarkMode: state.isDarkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert serialized dates back to Date objects
          if (state.currentBaby && state.currentBaby.birthDate) {
            state.currentBaby.birthDate = new Date(state.currentBaby.birthDate);
          }
          
          if (state.sleepSessions) {
            state.sleepSessions = state.sleepSessions.map(session => ({
              ...session,
              startTime: new Date(session.startTime),
              endTime: session.endTime ? new Date(session.endTime) : undefined,
            }));
          }
        }
      },
    }
  )
);