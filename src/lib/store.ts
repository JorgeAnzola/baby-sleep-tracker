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
  
  // Schedule configuration
  scheduleConfig: ScheduleConfig | null;
  setScheduleConfig: (config: ScheduleConfig) => void;
  
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
      
      // Schedule configuration
      scheduleConfig: null,
      setScheduleConfig: (config) => set({ scheduleConfig: config }),
      
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