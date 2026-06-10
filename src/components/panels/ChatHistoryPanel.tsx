import { useState } from 'react';
import { Plus, Search, MessageSquare, Archive, ArchiveRestore, Trash2, FolderKanban, Gamepad2, ArrowLeft, Lightbulb, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';

type Tab = 'playground' | 'projects';
type ProjectView = 'list' | 'inside';

export function ChatHistoryPanel() {
  const { sessions, activeSessionId, setActiveSession, createSession, archiveSession, unarchiveSession, deleteSession } = useChatStore();
  const { projects, activeProjectId, setActiveProject, createProject, updateProject } = useProjectStore();
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);

  const [tab, setTab] = useState<Tab>('playground');
  const [projectView, setProjectView] = useState<ProjectView>('list');
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [inlineConfirm, setInlineConfirm] = useState<{ id: string; action: 'archive' | 'delete' } | null>(null);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [skillsDraft, setSkillsDraft] = useState('');
  const [instructionsDraft, setInstructionsDraft] = useState('');

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const playgroundSessions = sessions.filter((s) => !s.projectId && !s.archived);
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

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-white/30 text-sm">
          <Search className="w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent outline-none flex-1 text-white placeholder-white/30 text-sm"
          />
        </div>
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
        <div className="flex items-center gap-2">
          <span className="truncate">{session.title}</span>
          {projectName && !isArchived && (
            <span className="text-[10px] text-teal-400/50 bg-teal-400/10 px-1.5 py-0.5 rounded shrink-0">
              {projectName}
            </span>
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
