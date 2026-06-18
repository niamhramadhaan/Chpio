import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Key, ExternalLink } from 'lucide-react';

interface ResearchInputProps {
  onSubmit: (query: string) => void;
  isRunning: boolean;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

const EXAMPLE_QUERIES = [
  'React 19 new features and migration guide',
  'Best practices for building REST APIs in 2025',
  'Comparing PostgreSQL vs MongoDB for web apps',
  'How to implement OAuth2 in Node.js',
];

export function ResearchInput({ onSubmit, isRunning, hasApiKey, onOpenSettings }: ResearchInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (!query.trim() || isRunning) return;
    onSubmit(query.trim());
  };

  const handleExampleClick = (example: string) => {
    if (isRunning) return;
    setQuery(example);
  };

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
          <Key className="w-5 h-5 text-white/20" />
        </div>
        <p className="text-white/40 text-[11px] mb-2 text-center">Tavily API key required for web search</p>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400/10 text-teal-400/80 text-[10px] hover:bg-teal-400/20 hover:text-teal-400 transition-colors cursor-pointer"
        >
          <Key className="w-3 h-3" />
          Configure in Settings
        </button>
        <a
          href="https://tavily.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-3 text-white/20 text-[9px] hover:text-white/40 transition-colors"
        >
          Get a free API key at tavily.com <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center h-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center rotate-[-4deg] mx-auto mb-3">
            <Search className="w-4 h-4 text-white/15" />
          </div>
          <p className="text-white/40 text-[12px] font-medium mb-1">What would you like to research?</p>
          <p className="text-white/20 text-[10px]">AI-powered multi-step research with source citations</p>
        </div>

        <div className="space-y-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Enter a research topic or question..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-[11px] outline-none placeholder-white/20 focus:border-teal-400/30 transition-colors resize-none leading-relaxed"
            disabled={isRunning}
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isRunning}
            className="w-full px-3 py-2 rounded-lg bg-teal-400/15 text-teal-400 text-[10px] font-medium hover:bg-teal-400/25 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Start Research
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[9px] text-white/20 uppercase tracking-wider">Try an example</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                disabled={isRunning}
                className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer disabled:opacity-30"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
