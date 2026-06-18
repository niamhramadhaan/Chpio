import { motion } from 'motion/react';
import { Inbox, Send, FileText, Trash2, Archive, Star } from 'lucide-react';
import type { EmailFolder } from '../../types';

interface FolderListProps {
  folders: EmailFolder[];
  selected: string;
  onSelect: (path: string) => void;
}

const folderIcons: Record<string, typeof Inbox> = {
  INBOX: Inbox,
  Sent: Send,
  Drafts: FileText,
  Trash: Trash2,
  Archive: Archive,
  Starred: Star,
};

export function FolderList({ folders, selected, onSelect }: FolderListProps) {
  const sorted = [...folders].sort((a, b) => {
    const order = ['INBOX', 'Sent', 'Drafts', 'Starred', 'Archive', 'Trash'];
    const ai = order.indexOf(a.name);
    const bi = order.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-0.5">
      {sorted.map((folder) => {
        const Icon = folderIcons[folder.name] || Inbox;
        const isActive = selected === folder.path;

        return (
          <motion.button
            key={folder.path}
            onClick={() => onSelect(folder.path)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
              isActive
                ? 'bg-teal-400/10 text-teal-400'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] flex-1 truncate">{folder.name}</span>
            {folder.unreadCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-teal-400/20 text-teal-400' : 'bg-white/10 text-white/40'
              }`}>
                {folder.unreadCount}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
