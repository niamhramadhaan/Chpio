import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/20">
      <Calendar className="w-12 h-12 mb-4" />
      <p className="text-lg">Calendar</p>
      <p className="text-sm mt-1">Local-first calendar with CalDAV sync — coming soon</p>
    </div>
  );
}
