'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, FileText, Upload, X } from 'lucide-react';
import { useState } from 'react';

interface ImportStats {
  totalRecords: number;
  imported: number;
  skipped: number;
  errors: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  stats: ImportStats;
  errors: string[];
}

interface CsvImportProps {
  babyId: string;
  onImportComplete?: () => void;
}

export function CsvImport({ babyId, onImportComplete }: CsvImportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setResult(null);
    } else {
      alert('Por favor selecciona un archivo CSV válido.');
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !babyId) return;

    setIsImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('babyId', babyId);

      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al importar el archivo',
          stats: { totalRecords: 0, imported: 0, skipped: 0, errors: 1 },
          errors: [data.error || 'Error desconocido']
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: 'Error de conexión al importar el archivo',
        stats: { totalRecords: 0, imported: 0, skipped: 0, errors: 1 },
        errors: ['Error de conexión']
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setResult(null);
    setIsImporting(false);
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Importar datos de Huckleberry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          {!result && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Selecciona el archivo CSV exportado desde Huckleberry para importar los registros de sueño.
              </div>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Seleccionar archivo CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Solo archivos .csv
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="ml-auto h-auto p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetDialog}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Procesando archivo...</div>
              <Progress value={50} className="w-full" />
              <div className="text-xs text-muted-foreground">
                Analizando registros de sueño
              </div>
            </div>
          )}

          {/* Import Results */}
          {result && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {result.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{result.message}</span>
              </div>

              {result.stats && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Estadísticas de importación:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total de registros:</span>
                      <span className="font-medium">{result.stats.totalRecords}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Importados:</span>
                      <span className="font-medium text-green-600">{result.stats.imported}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Omitidos:</span>
                      <span className="font-medium text-yellow-600">{result.stats.skipped}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Errores:</span>
                      <span className="font-medium text-red-600">{result.stats.errors}</span>
                    </div>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-800">Errores encontrados:</div>
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded max-h-20 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={resetDialog} className="w-full">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}