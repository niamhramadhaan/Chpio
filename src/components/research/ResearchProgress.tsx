import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, Circle, AlertCircle, RotateCcw } from 'lucide-react';
import type { ResearchStep } from '../../store/researchStore';

interface ResearchProgressProps {
  steps: ResearchStep[];
  status: string;
  startedAt: number;
  errorMessage?: string;
  onRetry?: () => void;
}

const stepLabels: Record<ResearchStep['type'], string> = {
  plan: 'Planning',
  search: 'Searching',
  read: 'Reading sources',
  evaluate: 'Evaluating',
  report: 'Writing report',
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ResearchProgress({ steps, status, startedAt, errorMessage, onRetry }: ResearchProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === 'done' || status === 'error') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, startedAt]);

  const completedSteps = steps.filter((s) => s.status === 'done').length;
  const totalExpected = 5;
  const progressPct = Math.min((completedSteps / totalExpected) * 100, 100);

  const isError = status === 'error';

  return (
    <div className="space-y-3">
      {/* Progress bar + timer */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/40">
            {isError ? 'Research failed' : `Researching... ${formatElapsed(elapsed)}`}
          </p>
          <p className="text-[9px] text-white/20">{completedSteps}/{totalExpected}</p>
        </div>
        <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-teal-400/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-0.5">
        {steps.map((step, i) => {
          const isActive = step.status === 'running';
          const isDone = step.status === 'done';
          const isStepError = step.status === 'error';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: Math.min(i * 0.03, 0.15) }}
              className={`flex items-start gap-2 p-1.5 rounded-lg transition-colors ${
                isActive ? 'bg-teal-400/[0.06]' : ''
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                ) : isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400/60" />
                ) : isStepError ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400/60" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-white/15" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] ${isActive ? 'text-teal-400' : isDone ? 'text-white/50' : 'text-white/25'}`}>
                  {step.detail || stepLabels[step.type]}
                </p>
                {step.query && (
                  <p className="text-[9px] text-white/20 truncate mt-0.5">"{step.query}"</p>
                )}
                {step.sourcesFound !== undefined && step.sourcesFound > 0 && (
                  <p className="text-[9px] text-white/20 mt-0.5">{step.sourcesFound} sources found</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error state */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-red-400/[0.06] border border-red-400/[0.1] space-y-2"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400/70 shrink-0" />
            <p className="text-[10px] text-red-400/70">{errorMessage || 'Something went wrong'}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-400/10 text-red-400/60 text-[9px] hover:bg-red-400/20 hover:text-red-400/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
