import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'wouter';
import { ArrowLeft, Trash2, Clock, Loader2 } from 'lucide-react';
import { useResearchStore } from '../store/researchStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDocsStore } from '../store/docsStore';
import { useAppStore } from '../store/appStore';
import { runResearch } from '../services/researchOrchestrator';
import { streamChat } from '../services/providers';
import { getActiveModels, stripProviderPrefix } from '../utils/models';
import { relativeTime } from '../utils/relativeTime';
import { ResearchInput } from '../components/research/ResearchInput';
import { ResearchProgress } from '../components/research/ResearchProgress';
import { ResearchSources } from '../components/research/ResearchSources';
import { ResearchReport } from '../components/research/ResearchReport';
import { buildPath } from '../router';

export default function ResearchPage() {
  const { sessions, activeSessionId, createSession, updateSession, addStep, updateStep, addSource, addFact, setActiveSession, deleteSession, getActiveSession } = useResearchStore();
  const tavilyApiKey = useSettingsStore((s) => s.tavilyApiKey);
  const setSettingsModalOpen = useAppStore((s) => s.setSettingsModalOpen);
  const providers = useSettingsStore((s) => s.providers);
  const models = useMemo(() => getActiveModels(providers), [providers]);
  const selectedModelId = useSettingsStore((s) => s.selectedModelId);
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const createDoc = useDocsStore((s) => s.createDoc);
  const updateDoc = useDocsStore((s) => s.updateDoc);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const [, navigate] = useLocation();

  const [view, setView] = useState<'input' | 'history'>('input');
  const abortRef = useRef<AbortController | null>(null);

  const activeSession = getActiveSession();
  const isRunning = activeSession && !['done', 'error'].includes(activeSession.status);

  const getStreamFn = useCallback(() => {
    const mId = selectedModelId || defaultModelId;
    const m = models.find((x) => x.id === mId);
    const pId = m?.providerId;
    const p = providers.find((x) => x.id === pId);
    const baseUrl = p?.baseUrl || 'https://openrouter.ai/api/v1';
    const apiKey = p?.apiKey || undefined;
    return (msgs: { role: 'system' | 'user' | 'assistant'; content: string }[]) => {
      return streamChat(baseUrl, apiKey, stripProviderPrefix(mId), msgs, pId);
    };
  }, [selectedModelId, defaultModelId, models, providers]);

  const handleStart = useCallback(async (query: string) => {
    const sessionId = createSession(query);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runResearch(
        { ...useResearchStore.getState().sessions.find((s) => s.id === sessionId)!, id: sessionId },
        tavilyApiKey,
        getStreamFn(),
        { updateSession, addStep, updateStep, addSource, addFact },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).message !== 'Research aborted') {
        console.error('[research] Failed:', err);
      }
    } finally {
      abortRef.current = null;
    }
  }, [tavilyApiKey, getStreamFn, createSession, updateSession, addStep, updateStep, addSource, addFact]);

  const handleRetry = useCallback(() => {
    if (!activeSession) return;
    handleStart(activeSession.query);
  }, [activeSession, handleStart]);

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSaveToDocs = useCallback(() => {
    if (!activeSession?.report) return;
    const id = createDoc(`Research: ${activeSession.query}`);
    updateDoc(id, { content: activeSession.report });
    setActiveFeature('docs');
    navigate(buildPath('docs', { docId: id }));
  }, [activeSession, createDoc, updateDoc, setActiveFeature, navigate]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSession(id);
    setView('input');
  }, [setActiveSession]);

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
  }, [deleteSession]);

  const handleSuggestedQuery = useCallback((query: string) => {
    handleStart(query);
  }, [handleStart]);

  const showReport = activeSession?.status === 'done' && activeSession.report;
  const showProgress = activeSession && !showReport;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeSession && (
              <button
                onClick={() => { setActiveSession(null); setView('input'); }}
                className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <p className="text-[11px] text-white/50 font-medium">Deep Research</p>
          </div>
          <div className="flex items-center gap-1">
            {sessions.length > 0 && (
              <button
                onClick={() => setView(view === 'history' ? 'input' : 'history')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  view === 'history' ? 'bg-teal-400/15 text-teal-400' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
                title="Research history"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            )}
            {isRunning && (
              <button
                onClick={handleAbort}
                className="px-2 py-1 rounded-lg bg-red-400/10 text-red-400/70 text-[9px] hover:bg-red-400/20 transition-colors cursor-pointer"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
        <AnimatePresence mode="wait">
          {view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              <p className="text-[10px] text-white/30 uppercase tracking-wider px-0.5 mb-2">Past Research</p>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                    activeSessionId === s.id ? 'bg-teal-400/10 border border-teal-400/30' : 'hover:bg-white/5 border border-transparent'
                  }`}
                  onClick={() => handleSelectSession(s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/60 truncate">{s.query}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] text-white/20">{relativeTime(s.startedAt)}</span>
                      {s.status === 'done' && (
                        <span className="text-[8px] text-teal-400/50">{s.sources.length} sources</span>
                      )}
                      {s.status === 'error' && (
                        <span className="text-[8px] text-red-400/50">Failed</span>
                      )}
                    </div>
                  </div>
                  {s.status !== 'done' && s.status !== 'error' && (
                    <Loader2 className="w-3 h-3 text-teal-400 animate-spin shrink-0" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                    className="p-1 rounded text-white/10 hover:text-red-400/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          ) : showReport ? (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <ResearchReport
                report={activeSession.report}
                query={activeSession.query}
                sourceCount={activeSession.sources.length}
                onSaveToDocs={handleSaveToDocs}
              />

              {/* Suggested follow-up queries */}
              {activeSession.suggestedQueries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Go deeper</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSession.suggestedQueries.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSuggestedQuery(q)}
                        className="px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/35 hover:text-white/55 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ResearchSources sources={activeSession.sources} />
            </motion.div>
          ) : showProgress ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <ResearchProgress
                steps={activeSession.steps}
                status={activeSession.status}
                startedAt={activeSession.startedAt}
                errorMessage={activeSession.errorMessage}
                onRetry={handleRetry}
              />
              {activeSession.sources.length > 0 && (
                <ResearchSources sources={activeSession.sources} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ResearchInput
                onSubmit={handleStart}
                isRunning={!!isRunning}
                hasApiKey={!!tavilyApiKey}
                onOpenSettings={() => setSettingsModalOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
