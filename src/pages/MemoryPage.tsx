import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Plus, Search, X, Trash2, Pencil } from 'lucide-react';
import { useMemoryStore } from '../store/memoryStore';

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

const TAG_COLORS = [
  'bg-teal-400',
  'bg-violet-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-sky-400',
  'bg-emerald-400',
  'bg-fuchsia-400',
  'bg-orange-400',
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function TagChip({ label, count, active, onClick }: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
        active
          ? 'bg-teal-400/15 text-teal-400 border border-teal-400/25'
          : 'bg-white/5 text-white/40 border border-white/5 hover:text-white/60 hover:bg-white/10'
      }`}
    >
      {label}
      <span className="ml-1 opacity-60">{count}</span>
    </button>
  );
}

function MemoryStreamItem({ memory, isDimmed }: {
  memory: { id: string; content: string; tags: string[]; createdAt: number; updatedAt: number };
  isDimmed: boolean;
}) {
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);
  const setActiveTag = useMemoryStore((s) => s.setActiveTag);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const startEdit = () => {
    setEditContent(memory.content);
    setEditTags(memory.tags.join(', '));
    setEditing(true);
  };

  const handleSave = () => {
    const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    if (editContent.trim()) {
      updateMemory(memory.id, { content: editContent, tags });
    }
    setEditing(false);
  };

  const dotColor = memory.tags.length > 0 ? getTagColor(memory.tags[0]) : 'bg-white/20';

  return (
    <div className={`group relative flex gap-3 py-3 transition-opacity ${isDimmed ? 'opacity-30' : ''}`}>
      {/* Timeline dot */}
      <div className="relative z-10 mt-1.5 shrink-0">
        <div className={`w-[15px] h-[15px] rounded-full border-2 border-white/10 ${dotColor} opacity-60
                        group-hover:opacity-100 group-hover:border-teal-400/50 transition-all`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Time label + connector */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-white/20 font-mono shrink-0">
            {relativeTime(memory.updatedAt)}
          </span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {editing ? (
          /* Inline edit form */
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-full bg-white/5 text-white/80 text-xs p-2 rounded-lg 
                         border border-white/10 outline-none resize-none
                         focus:border-teal-400/30 transition-colors"
              rows={2}
              autoFocus
            />
            <input
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setEditing(false);
              }}
              placeholder="Tags (comma-separated)"
              className="w-full bg-white/5 text-white/60 text-[11px] px-2 py-1.5 rounded-lg 
                         border border-white/10 outline-none placeholder-white/20
                         focus:border-teal-400/30 transition-colors"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="px-2 py-1 rounded-md text-[10px] text-white/40 hover:text-white/60 
                           hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editContent.trim()}
                className="px-2 py-1 rounded-md text-[10px] bg-teal-400/15 text-teal-400 
                           hover:bg-teal-400/25 transition-colors cursor-pointer
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          /* Display mode */
          <>
            <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
              {memory.content}
            </p>

            {/* Tags - secondary, clickable */}
            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {memory.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTag(tag);
                    }}
                    className="text-[10px] text-white/25 hover:text-teal-400/60 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Hover actions */}
            <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={startEdit}
                className="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
                title="Edit"
                aria-label="Edit memory"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => deleteMemory(memory.id)}
                className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                title="Delete"
                aria-label="Delete memory"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MemoryPage() {
  const memories = useMemoryStore((s) => s.memories);
  const activeTag = useMemoryStore((s) => s.activeTag);
  const setActiveTag = useMemoryStore((s) => s.setActiveTag);
  const searchMemories = useMemoryStore((s) => s.searchMemories);
  const createMemory = useMemoryStore((s) => s.createMemory);

  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    memories.forEach((m) => m.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [memories]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    memories.forEach((m) => m.tags.forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    }));
    return counts;
  }, [memories]);

  const filtered = useMemo(() => {
    let result = query ? searchMemories(query) : memories;
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [memories, query, searchMemories]);

  const handleSave = () => {
    const tags = formTags.split(',').map((t) => t.trim()).filter(Boolean);
    if (!formContent.trim()) return;
    createMemory(formContent, tags);
    setFormContent('');
    setFormTags('');
    setShowForm(false);
  };

  const handleCancel = () => {
    setFormContent('');
    setFormTags('');
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white/70">Memory</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-400/15 text-teal-400 text-xs hover:bg-teal-400/25 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
          <Search className="w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories..."
            className="bg-transparent outline-none text-white text-xs flex-1 placeholder-white/30"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-white/30 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
          <TagChip
            label="all"
            count={memories.length}
            active={!activeTag}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              count={tagCounts[tag]}
              active={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      )}

      {/* Add Form (inline) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden shrink-0 px-4"
          >
            <div className="p-3 rounded-xl bg-[#1A201F]/60 border border-teal-400/20 mb-3">
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="What do you want to remember?"
                rows={2}
                className="w-full bg-transparent text-white/80 text-xs outline-none resize-none placeholder-white/20 mb-2"
                autoFocus
              />
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="Tags (comma-separated)"
                className="w-full bg-transparent text-white/60 text-xs outline-none placeholder-white/20 mb-3"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formContent.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs bg-teal-400/15 text-teal-400 hover:bg-teal-400/25 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <Brain className="w-10 h-10 mb-3" />
            <p className="text-sm">{query ? 'No matches' : 'No memories yet'}</p>
            <p className="text-xs mt-1 text-white/10">{query ? 'Try a different search' : 'Add your first memory'}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-white/5" />

            {/* Memory items */}
            <div>
              {filtered.map((memory) => (
                <MemoryStreamItem
                  key={memory.id}
                  memory={memory}
                  isDimmed={!!activeTag && !memory.tags.includes(activeTag)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
