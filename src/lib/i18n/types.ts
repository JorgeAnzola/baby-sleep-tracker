export interface LanguageMetadata {
  code: string;
  name: string; // Native name (e.g., "Español", "English")
  flag: string; // Emoji flag
}

export interface Translation {
  // Language metadata
  _metadata: LanguageMetadata;
  
  // General
  appName: string;
  
  // Baby info
  baby: {
    name: string;
    birthDate: string;
    age: string;
    addBaby: string;
    babyInfo: string;
    createProfile: string;
    firstAddBaby: string;
    addBabyPrompt: string;
    namePlaceholder: string;
    days: string;
    months: string;
    month: string;
  };
  
  // Sleep tracking
  sleep: {
    tracking: string;
    startNap: string;
    startNight: string;
    endSleep: string;
    sleeping: string;
    napping: string;
    nap: string;
    nightSleep: string;
    sleepingSince: string;
    editStartTime: string;
    sleepTypeQuestion: string;
    duration: string;
    startTime: string;
    endTime: string;
    quality: string;
    notes: string;
    editSession: string;
    deleteSession: string;
    confirmDelete: string;
  };
  
  // Predictions
  predictions: {
    title: string;
    nextNap: string;
    bedtime: string;
    wakeup: string;
    confidence: string;
    high: string;
    medium: string;
    low: string;
    noPredictions: string;
    expectedDuration: string;
    timeUntil: string;
    ago: string;
    minutes: string;
    confidenceTooltip: string;
    highConfidenceTooltip: string;
    mediumConfidenceTooltip: string;
    lowConfidenceTooltip: string;
    expectedDurationTooltip: string;
  };
  
  // History
  history: {
    title: string;
    noSessions: string;
    lastNight: string;
    today: string;
    yesterday: string;
    startTracking: string;
    deleteRecord: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: string;
    cancel: string;
    delete: string;
    editSession: string;
    saveChanges: string;
    startTimeLabel: string;
    endTimeLabel: string;
    durationLabel: string;
    qualityLabel: string;
    excellent: string;
    good: string;
    fair: string;
    poor: string;
    unrated: string;
    inProgress: string;
  };
  
  // Settings
  settings: {
    title: string;
    theme: string;
    selectTheme: string;
    currentTheme: string;
    language: string;
    currentLanguage: string;
    babyInfo: string;
    editBirthDate: string;
    dataManagement: string;
    importCSV: string;
    exportCSV: string;
    dangerZone: string;
    clearAllData: string;
    confirmClear: string;
    appInfo: string;
    version: string;
    developedBy: string;
    description: string;
    aiPowered: string;
  };
  
  // Schedule Configuration
  scheduleConfig: {
    title: string;
    description: string;
    napsPerDay: string;
    napsPerDayDescription: string;
    wakeWindows: string;
    wakeWindowsDescription: string;
    napDurations: string;
    napDurationsDescription: string;
    napNumber: string;
    minutes: string;
    resetToAlgorithm: string;
    resetToAlgorithmDescription: string;
    resetSuccess: string;
    notEnoughData: string;
    useRecommended: string;
    usePersonalized: string;
    recommendedByAge: string;
    basedOnHistory: string;
  };
  
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    confirm: string;
    loading: string;
    appName: string;
  };
}

export type LanguageCode = string;
