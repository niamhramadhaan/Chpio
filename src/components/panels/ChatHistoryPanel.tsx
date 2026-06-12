import { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, MessageSquare, Archive, ArchiveRestore, Trash2, FolderKanban, Gamepad2, ArrowLeft, Lightbulb, FileText, Filter, Check, TextSearch, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useChatStore } from '../../store/chatStore';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useNotesStore } from '../../store/notesStore';
import { PortalDropdown } from '../ui/PortalDropdown';

type Tab = 'playground' | 'projects';
type ProjectView = 'list' | 'inside';

export function ChatHistoryPanel() {
  const { sessions, activeSessionId, setActiveSession, createSession, archiveSession, unarchiveSession, deleteSession } = useChatStore();
  const { projects, activeProjectId, setActiveProject, createProject, updateProject } = useProjectStore();
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const notes = useNotesStore((s) => s.notes);
  const folders = useNotesStore((s) => s.folders);

  const [tab, setTab] = useState<Tab>('playground');
  const [projectView, setProjectView] = useState<ProjectView>('list');
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(true);
  const [inlineConfirm, setInlineConfirm] = useState<{ id: string; action: 'archive' | 'delete' } | null>(null);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [skillsDraft, setSkillsDraft] = useState('');
  const [instructionsDraft, setInstructionsDraft] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const playgroundSessions = sessions.filter((s) => {
    if (s.archived) return false;
    if (!s.projectId) return true;
    return selectedProjectIds.length === 0 || selectedProjectIds.includes(s.projectId);
  });
  const archivedSessions = sessions.filter((s) => s.archived);
  const projectSessions = sessions.filter((s) => s.projectId === activeProjectId && !s.archived);

  const filteredPlayground = playgroundSessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredArchived = archivedSessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProject = projectSessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewChat = () => {
    const modelId = defaultModelId || 'openrouter/auto';
    if (tab === 'projects' && activeProjectId) {
      createSession(modelId, activeProjectId);
    } else {
      createSession(modelId);
    }
  };

  const handleConfirm = () => {
    if (!inlineConfirm) return;
    if (inlineConfirm.action === 'archive') {
      const session = sessions.find((s) => s.id === inlineConfirm.id);
      if (session?.archived) {
        unarchiveSession(inlineConfirm.id);
      } else {
        archiveSession(inlineConfirm.id);
      }
    }
    if (inlineConfirm.action === 'delete') deleteSession(inlineConfirm.id);
    setInlineConfirm(null);
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId)?.name || null;
  };

  const toggleProjectFilter = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Switcher */}
      <div className="p-3 border-b border-white/5">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          <button
            onClick={() => { setTab('playground'); setShowArchived(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === 'playground'
                ? 'bg-teal-400/15 text-teal-400'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Playground
          </button>
          <button
            onClick={() => { setTab('projects'); setProjectView('list'); setActiveProject(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === 'projects'
                ? 'bg-teal-400/15 text-teal-400'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Projects
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b border-white/5">
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer text-sm ${
            tab === 'projects' && activeProjectId
              ? 'bg-violet-400/10 text-violet-400 hover:bg-violet-400/20'
              : 'bg-teal-400/10 text-teal-400 hover:bg-teal-400/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          {tab === 'projects' && activeProjectId ? 'New Project Chat' : 'New Chat'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <AnimatePresence mode="wait">
          {tab === 'playground' && (
            <motion.div
              key="playground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0.5"
            >
              {/* Archived Toggle */}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/50 transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                {showArchived ? 'Hide Archived' : `Archived (${archivedSessions.length})`}
              </button>

              {showArchived ? (
                <>
                  {filteredArchived.length === 0 && (
                    <div className="text-center text-white/20 text-xs py-6">No archived chats</div>
                  )}
                  {filteredArchived.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={activeSessionId === session.id}
                      onSelect={() => setActiveSession(session.id)}
                      isArchived
                      inlineConfirm={inlineConfirm}
                      onArchive={() => setInlineConfirm({ id: session.id, action: 'archive' })}
                      onDelete={() => setInlineConfirm({ id: session.id, action: 'delete' })}
                      onConfirm={handleConfirm}
                      onCancelConfirm={() => setInlineConfirm(null)}
                    />
                  ))}
                </>
              ) : (
                <>
                  {filteredPlayground.length === 0 && (
                    <div className="text-center text-white/20 text-xs py-6">No conversations yet</div>
                  )}
                  {filteredPlayground.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={activeSessionId === session.id}
                      onSelect={() => setActiveSession(session.id)}
                      projectName={getProjectName(session.projectId)}
                      inlineConfirm={inlineConfirm}
                      onArchive={() => setInlineConfirm({ id: session.id, action: 'archive' })}
                      onConfirm={handleConfirm}
                      onCancelConfirm={() => setInlineConfirm(null)}
                    />
                  ))}
                </>
              )}
            </motion.div>
          )}

          {tab === 'projects' && projectView === 'list' && (
            <motion.div
              key="projects-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-2 p-1"
            >
              <button
                onClick={() => createProject('New Project')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/10 text-white/30 hover:text-white/50 hover:border-white/20 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs">Add Project</span>
              </button>

              {projects.map((project) => {
                const chatCount = sessions.filter((s) => s.projectId === project.id && !s.archived).length;
                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      setActiveProject(project.id);
                      setProjectView('inside');
                    }}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer text-left"
                  >
                    <FolderKanban className="w-5 h-5 text-teal-400" />
                    <div>
                      <div className="text-sm font-medium text-white truncate w-full">{project.name}</div>
                      <div className="text-xs text-white/30">{chatCount} chats</div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}

          {tab === 'projects' && projectView === 'inside' && activeProject && (
            <motion.div
              key="project-inside"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Back Button */}
              <button
                onClick={() => { setActiveProject(null); setProjectView('list'); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Projects
              </button>

              {/* Pinned Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-xs font-medium text-white/50">Skills</span>
                  </div>
                  {editingSkills ? (
                    <textarea
                      autoFocus
                      value={skillsDraft}
                      onChange={(e) => setSkillsDraft(e.target.value)}
                      onBlur={() => { if (activeProjectId) updateProject(activeProjectId, { skills: skillsDraft }); setEditingSkills(false); }}
                      onKeyDown={(e) => { if (e.key === 'Escape') setEditingSkills(false); }}
                      placeholder="Define project skills..."
                      className="w-full bg-transparent text-xs text-white/70 outline-none resize-none min-h-[60px] placeholder-white/20"
                    />
                  ) : (
                    <button
                      onClick={() => { if (activeProject) { setSkillsDraft(activeProject.skills); setEditingSkills(true); } }}
                      className="w-full text-left text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer min-h-[40px]"
                    >
                      {activeProject.skills || 'Click to add skills...'}
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-xs font-medium text-white/50">Instructions</span>
                  </div>
                  {editingInstructions ? (
                    <textarea
                      autoFocus
                      value={instructionsDraft}
                      onChange={(e) => setInstructionsDraft(e.target.value)}
                      onBlur={() => { if (activeProjectId) updateProject(activeProjectId, { specialInstructions: instructionsDraft }); setEditingInstructions(false); }}
                      onKeyDown={(e) => { if (e.key === 'Escape') setEditingInstructions(false); }}
                      placeholder="Special instructions..."
                      className="w-full bg-transparent text-xs text-white/70 outline-none resize-none min-h-[60px] placeholder-white/20"
                    />
                  ) : (
                    <button
                      onClick={() => { if (activeProject) { setInstructionsDraft(activeProject.specialInstructions); setEditingInstructions(true); } }}
                      className="w-full text-left text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer min-h-[40px]"
                    >
                      {activeProject.specialInstructions || 'Click to add instructions...'}
                    </button>
                  )}
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {filteredProject.length === 0 && (
                <div className="text-center text-white/20 text-xs py-4">No chats in this project</div>
              )}
              {filteredProject.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id}
                  onSelect={() => setActiveSession(session.id)}
                  inlineConfirm={inlineConfirm}
                  onArchive={() => setInlineConfirm({ id: session.id, action: 'archive' })}
                  onConfirm={handleConfirm}
                  onCancelConfirm={() => setInlineConfirm(null)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Toolbar */}
      {tab === 'playground' && (
        <div className="shrink-0 mx-2 mb-2 relative">
          <div className="flex items-center gap-1.5 px-2 py-1">
            {/* Search chip */}
            <AnimatePresence>
              {searchOpen ? (
                <motion.div
                  key="search-input"
                  layout
                  initial={{ width: 32, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ width: 32, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 overflow-hidden flex-1 min-w-0"
                >
                  <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    autoFocus
                    className="bg-transparent text-white text-[11px] outline-none flex-1 min-w-0 placeholder-white/20"
                  />
                  <button
                    onClick={() => { setSearchOpen(false); setSearch(''); }}
                    className="p-0.5 rounded-full text-white/30 hover:text-white/60 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-btn"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-white/40" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Advanced search button */}
            <button
              onClick={() => setAdvancedOpen(true)}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer shrink-0"
              title="Advanced Search"
            >
              <TextSearch className="w-3.5 h-3.5 text-white/40" />
            </button>

            {/* Filter chip */}
            <button
                ref={filterTriggerRef}
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer shrink-0 ${
                  selectedProjectIds.length > 0
                    ? 'bg-teal-400/15 border border-teal-400/25'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <Filter className={`w-3.5 h-3.5 ${selectedProjectIds.length > 0 ? 'text-teal-400' : 'text-white/40'}`} />
                <span className={`text-[10px] font-medium ${selectedProjectIds.length > 0 ? 'text-teal-400' : 'text-white/50'}`}>
                  Filter{selectedProjectIds.length > 0 ? ` (${selectedProjectIds.length})` : ''}
                </span>
              </button>
          </div>

          {/* Filter dropdown */}
          <PortalDropdown
            isOpen={filterOpen}
            triggerRef={filterTriggerRef}
            align="right"
            direction="up"
            onClose={() => setFilterOpen(false)}
            className="w-56 py-2 rounded-xl bg-[#1A201F]/95 backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            <p className="px-3 pb-1.5 text-[10px] text-white/30 font-medium">Filter by Project</p>
            <button
              onClick={() => setSelectedProjectIds([])}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                selectedProjectIds.length === 0 ? 'bg-teal-400/20 border-teal-400/40' : 'border-white/20'
              }`}>
                {selectedProjectIds.length === 0 && <Check className="w-2.5 h-2.5 text-teal-400" />}
              </div>
              <span className={`text-[11px] ${selectedProjectIds.length === 0 ? 'text-teal-400' : 'text-white/60'}`}>All Projects</span>
            </button>
            <div className="h-px bg-white/5 my-1" />
            <div className="max-h-48 overflow-y-auto">
              {projects.map((project) => {
                const checked = selectedProjectIds.includes(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => toggleProjectFilter(project.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      checked ? 'bg-teal-400/20 border-teal-400/40' : 'border-white/20'
                    }`}>
                      {checked && <Check className="w-2.5 h-2.5 text-teal-400" />}
                    </div>
                    <span className={`text-[11px] truncate ${checked ? 'text-white/80' : 'text-white/50'}`}>{project.name}</span>
                  </button>
                );
              })}
            </div>
          </PortalDropdown>
        </div>
      )}

      {/* Advanced Search Modal */}
      {advancedOpen && (
        <AdvancedSearchModal
          sessions={sessions}
          projects={projects}
          notes={notes}
          folders={folders}
          onClose={() => setAdvancedOpen(false)}
          onSelectSession={(id) => { setActiveSession(id); setAdvancedOpen(false); }}
        />
      )}
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  isArchived = false,
  projectName,
  inlineConfirm,
  onArchive,
  onDelete,
  onConfirm,
  onCancelConfirm,
}: {
  session: { id: string; title: string; updatedAt: number };
  isActive: boolean;
  onSelect: () => void;
  isArchived?: boolean;
  projectName?: string | null;
  inlineConfirm: { id: string; action: 'archive' | 'delete' } | null;
  onArchive: () => void;
  onDelete?: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
}) {
  const isConfirming = inlineConfirm?.id === session.id;

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-sm ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:bg-white/5 hover:text-white/70'
      }`}
      onClick={onSelect}
    >
      <MessageSquare className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate flex-1">{session.title}</span>
          {projectName && !isArchived && (
            <span className="text-[10px] text-white/20 shrink-0">{projectName}</span>
          )}
        </div>
        <div className="text-xs text-white/20 mt-0.5">
          {new Date(session.updatedAt).toLocaleDateString()}
        </div>
      </div>

      {isConfirming ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
              inlineConfirm.action === 'delete'
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
            }`}
          >
            {inlineConfirm.action === 'delete' ? 'Delete' : 'Archive'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCancelConfirm(); }}
            className="px-2 py-1 rounded-md text-[10px] text-white/30 hover:text-white/60 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 shrink-0">
          {isArchived && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all cursor-pointer p-1"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(); }}
            className={`opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-1 ${
              isArchived ? 'text-white/30 hover:text-teal-400' : 'text-white/30 hover:text-amber-400'
            }`}
            title={isArchived ? 'Unarchive' : 'Archive'}
          >
            {isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

type SearchFilter = 'all' | 'chats' | 'docs' | 'links' | 'tasks';

function AdvancedSearchModal({
  sessions,
  projects,
  notes,
  folders,
  onClose,
  onSelectSession,
  onOpenNote,
}: {
  sessions: { id: string; title: string; messages: { role: string; content: string }[]; projectId?: string; archived: boolean; updatedAt: number }[];
  projects: { id: string; name: string }[];
  notes?: { id: string; title: string; content: string; folderId: string; archived: boolean; links?: { url: string }[]; tasks: { text: string; done: boolean }[] }[];
  folders?: { id: string; name: string }[];
  onClose: () => void;
  onSelectSession: (id: string) => void;
  onOpenNote?: (noteId: string, folderId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId)?.name || null;
  };

  const filters: { id: SearchFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'chats', label: 'Chats' },
    { id: 'docs', label: 'Docs' },
    { id: 'links', label: 'Links' },
    { id: 'tasks', label: 'Tasks' },
  ];

  const q = query.toLowerCase().trim();

  const chatResults = query.trim().length < 2 ? [] : sessions.filter((s) => {
    if (s.archived) return false;
    if (filter === 'docs' || filter === 'links' || filter === 'tasks') return false;
    const qq = query.toLowerCase();
    if (s.title.toLowerCase().includes(qq)) return true;
    return s.messages.some((m) => m.content.toLowerCase().includes(qq));
  });

  const noteResults = useMemo(() => {
    if (!notes || q.length < 2 || filter === 'chats') return [];
    return notes.filter((n) => {
      if (n.archived) return false;
      if (filter === 'links') return (n.links || []).some((l) => l.url.toLowerCase().includes(q));
      if (filter === 'tasks') return n.tasks.some((t) => t.text.toLowerCase().includes(q));
      if (n.title.toLowerCase().includes(q)) return true;
      if (n.content.toLowerCase().includes(q)) return true;
      if ((n.links || []).some((l) => l.url.toLowerCase().includes(q))) return true;
      if (n.tasks.some((t) => t.text.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [notes, q, filter]);

  const getSnippet = (session: { title: string; messages: { role: string; content: string }[] }) => {
    const qq = query.toLowerCase();
    if (session.title.toLowerCase().includes(qq)) return null;
    for (const msg of session.messages) {
      const idx = msg.content.toLowerCase().indexOf(qq);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(msg.content.length, idx + qq.length + 40);
        const prefix = start > 0 ? '...' : '';
        const suffix = end < msg.content.length ? '...' : '';
        return prefix + msg.content.slice(start, end) + suffix;
      }
    }
    return null;
  };

  const totalResults = chatResults.length + noteResults.length;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative bg-[#1A201F]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[60vh] pointer-events-auto"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Search className="w-5 h-5 text-white/30 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats, notes, links, tasks..."
            autoFocus
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-white/25"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                filter === f.id
                  ? 'bg-teal-400/15 text-teal-400 border border-teal-400/25'
                  : 'text-white/40 hover:text-white/60 bg-white/5 border border-white/5 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="px-5 py-8 text-sm text-white/20 text-center">Type at least 2 characters to search</p>
          ) : totalResults === 0 ? (
            <p className="px-5 py-8 text-sm text-white/20 text-center">No results found</p>
          ) : (
            <div className="py-1">
              {/* Chat results */}
              {chatResults.map((session) => {
                const snippet = getSnippet(session);
                const projectName = getProjectName(session.projectId);
                return (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className="w-full flex flex-col gap-1 px-5 py-3 text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-white/80 truncate flex-1">{session.title}</span>
                      {projectName && (
                        <span className="text-[10px] text-white/20 shrink-0">{projectName}</span>
                      )}
                    </div>
                    {snippet && (
                      <p className="text-xs text-white/30 line-clamp-2">{snippet}</p>
                    )}
                  </button>
                );
              })}

              {/* Note results */}
              {noteResults.length > 0 && chatResults.length > 0 && (
                <div className="px-5 py-1.5">
                  <p className="text-[10px] text-white/20 font-medium">Notes</p>
                </div>
              )}
              {noteResults.map((note) => {
                const folder = folders?.find((f) => f.id === note.folderId);
                return (
                  <button
                    key={note.id}
                    onClick={() => onOpenNote?.(note.id, note.folderId)}
                    className="w-full flex flex-col gap-1 px-5 py-3 text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-white/80 truncate flex-1">{note.title || 'Untitled'}</span>
                      {folder && (
                        <span className="text-[10px] text-white/20 shrink-0">{folder.name}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
