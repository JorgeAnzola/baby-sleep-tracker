'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { APP_VERSION, DEVELOPER_NAME } from '@/lib/app-config';
import { useLanguageStore } from '@/lib/i18n/language-store';
import type { SleepSession } from '@/lib/store';
import { useThemeStore } from '@/lib/theme-store';
import { Baby, Check, Database, Edit3, Globe, Info, LogOut, Palette, Settings as SettingsIcon, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CollaboratorManagement } from './CollaboratorManagement';
import { CsvImport } from './CsvImport';
import ScheduleConfig from './ScheduleConfig';

interface SettingsProps {
  babyId: string;
  babyName: string;  
  babyBirthDate: Date;
  onImportComplete: () => void;
  onBabyUpdate?: (updates: { birthDate?: Date }) => void;
  sessions?: SleepSession[];
  isOwner?: boolean;
}

export function Settings({ babyId, babyName, babyBirthDate, onImportComplete, onBabyUpdate, sessions = [], isOwner = true }: SettingsProps) {
  const router = useRouter();
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [newBirthDate, setNewBirthDate] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { currentTheme, setTheme, getThemeConfig, getAllThemes } = useThemeStore();
  const { language, setLanguage, t, getAvailableLanguages } = useLanguageStore();
  const themeConfig = getThemeConfig();
  const allThemes = getAllThemes();
  const availableLanguages = getAvailableLanguages();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleEditBirthDate = () => {
    setNewBirthDate(formatDateForInput(babyBirthDate));
    setIsEditingBirthDate(true);
  };

  const handleSaveBirthDate = async () => {
    console.log('handleSaveBirthDate called');
    console.log('newBirthDate:', newBirthDate);
    console.log('onBabyUpdate exists:', !!onBabyUpdate);
    
    if (newBirthDate && onBabyUpdate) {
      try {
        const date = new Date(newBirthDate);
        console.log('Calling onBabyUpdate with date:', date);
        await onBabyUpdate({ birthDate: date });
        console.log('onBabyUpdate completed successfully');
      } catch (error) {
        console.error('Error in onBabyUpdate:', error);
      }
    } else {
      console.log('Conditions not met:', { 
        hasNewBirthDate: !!newBirthDate, 
        hasOnBabyUpdate: !!onBabyUpdate 
      });
    }
    setIsEditingBirthDate(false);
  };

  const handleCancelEdit = () => {
    setIsEditingBirthDate(false);
    setNewBirthDate('');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // Redirect to login page
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="cursor-pointer hover:bg-gray-100"
        >
          <SettingsIcon className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-md max-h-[85vh] overflow-y-auto backdrop-blur-sm bg-gradient-to-br ${themeConfig.colors.card} border-0 shadow-2xl animate-in fade-in-0 zoom-in-95`}>
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className={`p-2 rounded-full bg-gradient-to-r ${themeConfig.colors.primary} text-white shadow-lg`}>
              <SettingsIcon className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {t.settings.title}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Baby Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-linear-to-r ${themeConfig.colors.primary} text-white shadow-md`}>
                <Baby className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-lg bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {t.settings.babyInfo}
              </h3>
            </div>
            <Card className={`border-0 shadow-lg bg-linear-to-br ${themeConfig.colors.card} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{t.baby.name}:</span>
                  <span className="font-semibold text-gray-800">{babyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{t.baby.birthDate}:</span>
                  <div className="flex items-center gap-2">
                    {isEditingBirthDate ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={newBirthDate}
                          onChange={(e) => setNewBirthDate(e.target.value)}
                          className="h-8 w-36 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveBirthDate}
                          className={`h-8 w-8 p-0 bg-linear-to-r ${themeConfig.colors.accent} text-white shadow-sm hover:shadow-md transition-all duration-200`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 transition-all duration-200"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{formatDate(babyBirthDate)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleEditBirthDate}
                          className="h-8 w-8 p-0 hover:bg-gray-100 transition-all duration-200"
                        >
                          <Edit3 className="w-3 h-3 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border-t border-gray-200/50 my-6"></div>

          {/* Collaborator Management */}
          <CollaboratorManagement babyId={babyId} isOwner={isOwner} />

          <div className="border-t border-gray-200/50 my-6"></div>

          {/* Theme Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-linear-to-r ${themeConfig.colors.primary} text-white shadow-md`}>
                <Palette className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-lg bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {t.settings.theme}
              </h3>
            </div>
            <Card className={`border-0 shadow-lg bg-linear-to-br ${themeConfig.colors.card} backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {allThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setTheme(theme.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 transform ${
                        currentTheme === theme.id 
                          ? 'border-blue-400 ring-2 ring-blue-200 shadow-xl scale-105' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${theme.colors.primary} mb-2 shadow-md`}></div>
                      <p className="text-xs font-medium text-gray-700 text-center">{theme.name[language]}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  {t.settings.currentTheme}: <span className="font-medium">{themeConfig.name[language]}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="border-t border-gray-200/50 my-6"></div>

          {/* Language Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-linear-to-r ${themeConfig.colors.primary} text-white shadow-md`}>
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-lg bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {t.settings.language}
              </h3>
            </div>
            <Card className={`border-0 shadow-lg bg-linear-to-br ${themeConfig.colors.card} backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        language === lang.code 
                          ? 'border-blue-400 ring-2 ring-blue-200 shadow-lg bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-2xl mb-2">{lang.flag}</div>
                      <p className="text-sm font-medium text-gray-700">{lang.name}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  {t.settings.currentLanguage}: <span className="font-medium">{t._metadata.name}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="border-t border-gray-200/50 my-6"></div>

          {/* Data Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-r ${themeConfig.colors.primary} text-white shadow-md`}>
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-lg bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Gestión de Datos
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* CSV Import */}
              <Card className={`border-0 shadow-lg bg-gradient-to-br ${themeConfig.colors.card} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Importar desde Huckleberry</span>
                    <Badge variant="secondary" className={`text-xs bg-gradient-to-r ${themeConfig.colors.accent} text-white border-0 shadow-sm`}>
                      CSV
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Importa tus datos históricos de sueño desde un archivo CSV exportado de Huckleberry.
                  </p>
                  <CsvImport 
                    babyId={babyId} 
                    onImportComplete={onImportComplete}
                  />
                </CardContent>
              </Card>

              {/* Export Data */}
              <Card className={`border-0 shadow-lg bg-gradient-to-br ${themeConfig.colors.card} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01] opacity-75`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Exportar Datos</span>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Próximamente
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Exporta todos tus datos de sueño en formato CSV para respaldo o análisis.
                  </p>
                  <Button variant="outline" size="sm" disabled className="w-full opacity-60">
                    <Database className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </CardContent>
              </Card>

              {/* Clear Data */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50/80 to-rose-50/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-red-100/50 opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="font-semibold text-red-800">Eliminar Todos los Datos</span>
                    <Badge variant="destructive" className="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-sm">
                      Peligroso
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Elimina permanentemente todos los registros de sueño. Esta acción no se puede deshacer.
                  </p>
                  <Button variant="destructive" size="sm" disabled className="w-full opacity-60">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Todo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="border-t border-gray-200/50 my-6"></div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <ScheduleConfig 
              birthDate={babyBirthDate}
              sessions={sessions}
            />
          </div>

          <div className="border-t border-gray-200/50 my-6"></div>

          {/* App Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-linear-to-r ${themeConfig.colors.primary} text-white shadow-md`}>
                <Info className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-lg bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {t.settings.appInfo}
              </h3>
            </div>
            <Card className={`border-0 shadow-lg bg-linear-to-br ${themeConfig.colors.card} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{t.settings.version}:</span>
                  <span className="text-sm font-mono font-semibold text-gray-800">{APP_VERSION}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{t.settings.developedBy}:</span>
                  <span className="text-sm font-semibold text-gray-800">{DEVELOPER_NAME}</span>
                </div>
                <div className="text-center pt-3 border-t border-gray-200/50">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t.settings.description}
                  </p>
                  <div className={`inline-block px-3 py-1 mt-2 rounded-full bg-linear-to-r ${themeConfig.colors.accent} text-white text-xs font-medium shadow-sm`}>
                    ✨ {t.settings.aiPowered}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border-t border-gray-200/50 my-6"></div>

          {/* Logout Button */}
          <div className="space-y-4">
            <Button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}