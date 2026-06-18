import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ExternalLink, Copy, Check } from 'lucide-react';
import type { ResearchSource } from '../../store/researchStore';

interface ResearchSourcesProps {
  sources: ResearchSource[];
}

export function ResearchSources({ sources }: ResearchSourcesProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (sources.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-white/30 uppercase tracking-wider px-0.5 mb-1">
        Sources ({sources.length})
      </p>
      {sources.map((source) => {
        const isExpanded = expandedIds.has(source.id);
        const domain = (() => {
          try { return new URL(source.url).hostname.replace('www.', ''); } catch { return ''; }
        })();
        const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null;

        return (
          <motion.div
            key={source.id}
            layout
            className="rounded-lg bg-white/[0.03] border border-white/[0.05] overflow-hidden"
          >
            <button
              onClick={() => toggleExpand(source.id)}
              className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <ChevronRight className={`w-3 h-3 text-white/25 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
              {faviconUrl ? (
                <img src={faviconUrl} alt="" className="w-3.5 h-3.5 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-3.5 h-3.5 rounded-sm bg-white/[0.06] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/70 truncate leading-tight">{source.title}</p>
                <p className="text-[8px] text-white/25 truncate mt-0.5">{domain}</p>
              </div>
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-2.5 pb-2.5 pt-0 space-y-2">
                    <p className="text-[10px] text-white/40 leading-relaxed">{source.snippet}</p>
                    {source.facts.length > 0 && (
                      <div className="space-y-0.5">
                        <p className="text-[8px] text-white/25 uppercase tracking-wider">Key facts</p>
                        {source.facts.map((fact, i) => (
                          <p key={i} className="text-[10px] text-white/50 leading-relaxed">- {fact}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] text-teal-400/50 hover:text-teal-400/80 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        Open source
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyLink(source.url); }}
                        className="inline-flex items-center gap-1 text-[9px] text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                      >
                        {copiedUrl === source.url ? <Check className="w-2.5 h-2.5 text-teal-400" /> : <Copy className="w-2.5 h-2.5" />}
                        {copiedUrl === source.url ? 'Copied' : 'Copy link'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
