import { StickyNote } from 'lucide-react';

export function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/20">
      <StickyNote className="w-12 h-12 mb-4" />
      <p className="text-lg">Notes</p>
      <p className="text-sm mt-1">Quick notes with reminders — coming soon</p>
    </div>
  );
}
