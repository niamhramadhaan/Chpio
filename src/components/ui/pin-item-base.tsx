import { motion, AnimatePresence, MotionConfig, type Transition } from "motion/react";
import { X, StickyNote } from "lucide-react";
import type { Note, NoteFolder } from "@/types";

const springConfig: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
};

type PinItemBaseProps = {
  notes: Note[];
  folders: NoteFolder[];
  onSelect: (noteId: string, folderId: string) => void;
  onUnpin: (noteId: string) => void;
};

export const PinItemBase = ({
  notes,
  folders,
  onSelect,
  onUnpin,
}: PinItemBaseProps) => {
  if (notes.length === 0) {
    return (
      <p className="px-3 py-3 text-[11px] text-white/20 text-center">
        No pinned notes yet
      </p>
    );
  }

  return (
    <div className="w-full space-y-2">
      <MotionConfig transition={springConfig}>
        <AnimatePresence mode="popLayout" initial={false}>
          {notes.map((note) => {
            const folder = folders.find((f) => f.id === note.folderId);
            return (
              <NoteCard
                key={note.id}
                note={note}
                folder={folder}
                onSelect={onSelect}
                onUnpin={onUnpin}
              />
            );
          })}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
};

const NoteCard = ({
  note,
  folder,
  onSelect,
  onUnpin,
}: {
  note: Note;
  folder?: NoteFolder;
  onSelect: (noteId: string, folderId: string) => void;
  onUnpin: (noteId: string) => void;
}) => {
  return (
    <motion.div
      layoutId={`pinned-${note.id}`}
      transition={springConfig}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-white/10 bg-white/5 p-2.5 shadow-sm transition-all hover:bg-white/10 hover:shadow"
      onClick={() => onSelect(note.id, note.folderId)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <motion.div
          layout
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/40"
        >
          <StickyNote size={18} />
        </motion.div>

        <motion.div layout className="min-w-0 flex-1">
          <h4 className="text-[12px] leading-tight font-medium text-white/70 truncate">
            {note.title || "Untitled"}
          </h4>
          {folder && (
            <p className="text-[10px] text-white/30 mt-0.5 truncate">
              {folder.name}
            </p>
          )}
        </motion.div>
      </div>

      <motion.button
        layout
        onClick={(e) => {
          e.stopPropagation();
          onUnpin(note.id);
        }}
        className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/25 opacity-0 transition-all duration-200 hover:text-red-400 hover:bg-red-400/10 group-hover:opacity-100"
      >
        <X size={14} />
      </motion.button>
    </motion.div>
  );
};
