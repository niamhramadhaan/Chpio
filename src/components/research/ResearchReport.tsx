import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import { Save, Copy, Check, FileText, Globe, BookOpen } from 'lucide-react';

interface ResearchReportProps {
  report: string;
  query: string;
  sourceCount: number;
  onSaveToDocs: () => void;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number): string {
  const mins = Math.ceil(words / 200);
  return mins < 1 ? '< 1 min read' : `${mins} min read`;
}

export function ResearchReport({ report, query, sourceCount, onSaveToDocs }: ResearchReportProps) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const words = wordCount(report);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary header */}
      <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <p className="text-[11px] text-white/60 font-medium leading-relaxed mb-2">{query}</p>
        <div className="flex items-center gap-3 text-[9px] text-white/25">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {words} words</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {readingTime(words)}</span>
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {sourceCount} sources</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 mb-3">
        <button
          onClick={onSaveToDocs}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-400/10 text-teal-400/70 text-[10px] hover:bg-teal-400/20 hover:text-teal-400 transition-colors cursor-pointer"
        >
          <Save className="w-3 h-3" />
          Save to Docs
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/40 text-[10px] hover:bg-white/10 hover:text-white/60 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Report content */}
      <div className="prose prose-invert prose-xs max-w-none
        [&_h1]:text-[16px] [&_h1]:text-white/85 [&_h1]:font-semibold [&_h1]:mb-2.5 [&_h1]:mt-5 first:[&_h1]:mt-0
        [&_h2]:text-[13px] [&_h2]:text-white/75 [&_h2]:font-medium [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-white/[0.06]
        [&_h3]:text-[12px] [&_h3]:text-white/65 [&_h3]:font-medium [&_h3]:mb-1.5 [&_h3]:mt-3
        [&_p]:text-[11px] [&_p]:text-white/55 [&_p]:leading-[1.7] [&_p]:mb-2.5
        [&_li]:text-[11px] [&_li]:text-white/55 [&_li]:leading-[1.7]
        [&_ul]:mb-2.5 [&_ol]:mb-2.5 [&_ul]:space-y-0.5 [&_ol]:space-y-0.5
        [&_a]:text-teal-400/70 [&_a]:no-underline hover:[&_a]:text-teal-400 [&_a]:transition-colors
        [&_strong]:text-white/70 [&_strong]:font-medium
        [&_code]:text-[10px] [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-white/60
        [&_pre]:bg-white/[0.04] [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:mb-2.5
        [&_blockquote]:border-l-2 [&_blockquote]:border-teal-400/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-white/40 [&_blockquote]:my-2.5
        [&_hr]:border-white/[0.06] [&_hr]:my-4
        [&_table]:text-[10px] [&_table]:border-collapse
        [&_th]:text-white/60 [&_th]:font-medium [&_th]:px-2 [&_th]:py-1.5 [&_th]:border-b [&_th]:border-white/10 [&_th]:text-left
        [&_td]:text-white/45 [&_td]:px-2 [&_td]:py-1.5 [&_td]:border-b [&_td]:border-white/[0.04]
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>
    </motion.div>
  );
}
