import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Plus, Search, X, Trash2, Pencil } from 'lucide-react';
import { useMemoryStore } from '../store/memoryStore';

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type FormMode = { type: 'create' } | { type: 'edit'; id: string } | null;

export default function MemoryPage() {
  const { memories, createMemory, updateMemory, deleteMemory, searchMemories } = useMemoryStore();
  const [query, setQuery] = useState('');
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  const filtered = query ? searchMemories(query) : memories;

  const handleSave = () => {
    const tags = formTags.split(',').map((t) => t.trim()).filter(Boolean);
    if (!formContent.trim()) return;

    if (formMode?.type === 'edit') {
      updateMemory(formMode.id, { content: formContent, tags });
    } else {
      createMemory(formContent, tags);
    }

    setFormContent('');
    setFormTags('');
    setFormMode(null);
  };

  const handleEdit = (id: string) => {
    const m = memories.find((mem) => mem.id === id);
    if (!m) return;
    setFormContent(m.content);
    setFormTags(m.tags.join(', '));
    setFormMode({ type: 'edit', id });
  };

  const handleAdd = () => {
    setFormContent('');
    setFormTags('');
    setFormMode({ type: 'create' });
  };

  const handleCancel = () => {
    setFormContent('');
    setFormTags('');
    setFormMode(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const isOpen = formMode !== null;
  const isEdit = formMode?.type === 'edit';
  const formKey = formMode?.type === 'edit' ? formMode.id : 'create';

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white/70">Memory</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-400/15 text-teal-400 text-xs hover:bg-teal-400/25 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key={formKey}
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
                onKeyDown={handleKeyDown}
                placeholder="What do you want to remember?"
                rows={3}
                className="w-full bg-transparent text-white/80 text-xs outline-none resize-none placeholder-white/20 mb-2"
                autoFocus
              />
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                onKeyDown={handleKeyDown}
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
                  {isEdit ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <Brain className="w-10 h-10 mb-3" />
            <p className="text-sm">{query ? 'No matches' : 'No memories yet'}</p>
            <p className="text-xs mt-1 text-white/10">{query ? 'Try a different search' : 'Add your first memory'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <div
                key={m.id}
                className={`group p-3 rounded-xl border transition-all ${
                  formMode?.type === 'edit' && formMode.id === m.id
                    ? 'bg-teal-400/10 border-teal-400/30'
                    : 'bg-[#1A201F]/60 border-white/5 hover:border-teal-400/20 hover:bg-white/5'
                }`}
              >
                <p className="text-xs text-white/70 leading-relaxed line-clamp-2 whitespace-pre-wrap">{m.content}</p>
                {m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.tags.map((tag) => (
                      <span key={tag} className="bg-teal-400/15 text-teal-400 text-[10px] px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-white/20">{relativeTime(m.updatedAt)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(m.id)}
                      className="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteMemory(m.id)}
                      className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
