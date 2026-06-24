import { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, Check } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';

const STORAGE_KEYS = [
  'chpio-settings',
  'chpio-chat-sessions',
  'chpio-notes',
  'chpio-notes-folders',
  'chpio-docs',
  'chpio-memory',
  'chpio-webllm-custom-models',
];

interface ExportData {
  version: number;
  exportedAt: number;
  data: Record<string, unknown>;
}

export function DataManager() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data: ExportData = {
      version: 1,
      exportedAt: Date.now(),
      data: {},
    };

    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          data.data[key] = JSON.parse(raw);
        } catch {
          data.data[key] = raw;
        }
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chpio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportData;

      if (!parsed.version || !parsed.data) {
        throw new Error('Invalid backup file format');
      }

      let imported = 0;
      for (const [key, value] of Object.entries(parsed.data)) {
        if (STORAGE_KEYS.includes(key)) {
          localStorage.setItem(key, JSON.stringify(value));
          imported++;
        }
      }

      setImportResult({ ok: true, msg: `Imported ${imported} stores. Refresh to see changes.` });
    } catch (e) {
      setImportResult({ ok: false, msg: e instanceof Error ? e.message : 'Import failed' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 space-y-4">
        <h2 className="text-xs font-medium text-white/70 uppercase tracking-wider">Export Data</h2>
        <p className="text-xs text-white/40">
          Download all your ChPio data as a JSON backup file. Includes settings, chats, notes, documents, and memories.
        </p>
        <GlassButton onClick={handleExport} size="sm" className="flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Export Backup
        </GlassButton>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-xs font-medium text-white/70 uppercase tracking-wider">Import Data</h2>
        <p className="text-xs text-white/40">
          Restore from a previously exported backup file. This will overwrite current data.
        </p>
        <div className="flex items-center gap-3">
          <GlassButton
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            size="sm"
            variant="accent"
            className="flex items-center gap-1.5"
          >
            <Upload className={`w-3.5 h-3.5 ${importing ? 'animate-pulse' : ''}`} />
            {importing ? 'Importing...' : 'Import Backup'}
          </GlassButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {importResult && (
          <div className={`flex items-center gap-2 text-xs ${importResult.ok ? 'text-teal-400' : 'text-red-400'}`}>
            {importResult.ok ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {importResult.msg}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
