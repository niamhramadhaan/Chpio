import { Brain } from 'lucide-react';

export function MemoryPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/20">
      <Brain className="w-12 h-12 mb-4" />
      <p className="text-lg">Memory</p>
      <p className="text-sm mt-1">Persistent memory and skills — coming soon</p>
    </div>
  );
}
