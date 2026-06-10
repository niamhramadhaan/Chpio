import { useMemo } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAppStore } from '../../store/appStore';
import { getActiveModels } from '../../utils/models';

export function SettingsPanel() {
  const providers = useSettingsStore((s) => s.providers);
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const setSettingsModalOpen = useAppStore((s) => s.setSettingsModalOpen);

  const models = useMemo(() => getActiveModels(providers), [providers]);
  const enabledProviders = providers.filter((p) => p.enabled);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <SettingsIcon className="w-4 h-4 text-teal-400" />
        <h1 className="text-sm font-medium text-white">Settings</h1>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl bg-white/5 border border-white/5 p-4">
          <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Active Providers</h2>
          {enabledProviders.length === 0 ? (
            <p className="text-white/20 text-xs">No providers enabled</p>
          ) : (
            <div className="space-y-2">
              {enabledProviders.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-white/70">{p.name}</span>
                  <span className="text-white/30">{p.syncedModels.length} models</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white/5 border border-white/5 p-4">
          <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Default Model</h2>
          <p className="text-white/70 text-xs">
            {defaultModelId
              ? models.find((m) => m.id === defaultModelId)?.name || defaultModelId
              : 'Not set'}
          </p>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/5 p-4">
          <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Synced Models</h2>
          <p className="text-white/70 text-xs">{models.length} total</p>
        </div>

        <button
          onClick={() => setSettingsModalOpen(true)}
          className="w-full px-4 py-2.5 rounded-xl bg-teal-400/10 text-teal-400 text-sm font-medium
                     hover:bg-teal-400/20 transition-colors cursor-pointer"
        >
          Open Full Settings
        </button>
      </div>
    </div>
  );
}
