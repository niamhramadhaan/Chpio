import { FileText } from 'lucide-react';

export function DocsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/20">
      <FileText className="w-12 h-12 mb-4" />
      <p className="text-lg">Documents</p>
      <p className="text-sm mt-1">Multi-tab editor with AI assist — coming soon</p>
    </div>
  );
}
