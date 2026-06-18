import type { EmailMessage } from '../../types';
import { Star, ArrowLeft } from 'lucide-react';

interface EmailListProps {
  messages: EmailMessage[];
  selectedUid: number | null;
  onSelect: (msg: EmailMessage) => void;
  onToggleStar: (uid: number, current: boolean) => void;
  threadFilter: string | null;
  onThreadFilter: (subject: string) => void;
  onClearFilter: () => void;
}

function relativeDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fw|fwd|aw|wg|rv):\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const triageStyles: Record<string, string> = {
  urgent: 'bg-red-400/15 text-red-400',
  fyi: 'bg-blue-400/15 text-blue-400',
  newsletter: 'bg-white/10 text-white/30',
  spam: 'bg-amber-400/10 text-amber-400/50',
};

export function EmailList({ messages, selectedUid, onSelect, onToggleStar, threadFilter, onThreadFilter, onClearFilter }: EmailListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/20 text-[11px]">
        No messages
      </div>
    );
  }

  // Compute thread counts
  const subjectCounts = new Map<string, number>();
  for (const msg of messages) {
    const norm = normalizeSubject(msg.subject);
    subjectCounts.set(norm, (subjectCounts.get(norm) || 0) + 1);
  }

  // Filter messages if in thread mode
  const displayMessages = threadFilter
    ? messages.filter((m) => normalizeSubject(m.subject) === normalizeSubject(threadFilter))
    : messages;

  return (
    <div className="space-y-px">
      {threadFilter && (
        <button
          onClick={onClearFilter}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-teal-400/60 hover:text-teal-400 transition-colors cursor-pointer w-full"
        >
          <ArrowLeft className="w-3 h-3" />
          All messages
        </button>
      )}
      {displayMessages.map((msg) => {
        const isSelected = selectedUid === msg.uid;
        const senderName = msg.from.name || msg.from.address.split('@')[0];
        const normSubject = normalizeSubject(msg.subject);
        const threadCount = subjectCounts.get(normSubject) || 1;

        return (
          <div
            key={msg.uid}
            onClick={() => onSelect(msg)}
            className={`group flex items-start gap-2 px-3 py-2 cursor-pointer transition-all ${
              isSelected
                ? 'bg-teal-400/[0.08] border-l-2 border-l-teal-400/40'
                : 'border-l-2 border-l-transparent hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] truncate ${msg.isRead ? 'text-white/40' : 'text-white/70 font-medium'}`}>
                  {senderName}
                </span>
                {msg.triage && (
                  <span className={`text-[8px] px-1 py-0.5 rounded ${triageStyles[msg.triage] || ''}`}>
                    {msg.triage}
                  </span>
                )}
                {threadCount > 1 && !threadFilter && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onThreadFilter(msg.subject); }}
                    className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/25 hover:bg-white/[0.1] hover:text-white/40 transition-colors cursor-pointer"
                    title="Show thread"
                  >
                    {threadCount} msgs
                  </button>
                )}
                <span className="text-[9px] text-white/15 ml-auto shrink-0">{relativeDate(msg.date)}</span>
              </div>
              <p className={`text-[10px] truncate ${msg.isRead ? 'text-white/25' : 'text-white/50'}`}>
                {msg.subject}
              </p>
              <p className="text-[9px] text-white/15 truncate mt-0.5">{msg.snippet}</p>
              {msg.tags && msg.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {msg.tags.map((tag) => (
                    <span key={tag} className="text-[8px] px-1 py-0.5 rounded bg-white/[0.06] text-white/25">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStar(msg.uid, msg.isStarred); }}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Star className={`w-3 h-3 ${msg.isStarred ? 'text-amber-400 fill-amber-400' : 'text-white/15'}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
