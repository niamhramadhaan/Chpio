import { type ReactNode } from 'react';

interface PageCanvasProps {
  children: ReactNode;
}

export function PageCanvas({ children }: PageCanvasProps) {
  return (
    <div className="flex-1 bg-transparent p-4 sm:p-6">
      <div className="max-w-[816px] mx-auto min-w-0">
        {/* A4 Page */}
        <div
          className="bg-[#1A201F]/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/20"
          style={{
            minHeight: '1056px',
            padding: '40px 60px',
          }}
        >
          <style>{`
            .tiptap-editor .ProseMirror {
              min-height: 976px;
              outline: none;
            }
            .tiptap-editor .ProseMirror p {
              margin-bottom: 0.75em;
              line-height: 1.6;
            }
            .tiptap-editor .ProseMirror h1 {
              font-size: 2em;
              font-weight: 700;
              margin-bottom: 0.5em;
              margin-top: 1em;
              color: white;
            }
            .tiptap-editor .ProseMirror h2 {
              font-size: 1.5em;
              font-weight: 600;
              margin-bottom: 0.5em;
              margin-top: 0.75em;
              color: white;
            }
            .tiptap-editor .ProseMirror h3 {
              font-size: 1.25em;
              font-weight: 600;
              margin-bottom: 0.5em;
              margin-top: 0.5em;
              color: white;
            }
            .tiptap-editor .ProseMirror ul,
            .tiptap-editor .ProseMirror ol {
              padding-left: 1.5em;
              margin-bottom: 0.75em;
            }
            .tiptap-editor .ProseMirror li {
              margin-bottom: 0.25em;
            }
            .tiptap-editor .ProseMirror ul[data-type="taskList"] {
              list-style: none;
              padding-left: 0;
            }
            .tiptap-editor .ProseMirror ul[data-type="taskList"] li {
              display: flex;
              align-items: flex-start;
              gap: 0.5em;
            }
            .tiptap-editor .ProseMirror ul[data-type="taskList"] li label {
              margin-top: 0.25em;
            }
            .tiptap-editor .ProseMirror ul[data-type="taskList"] li input[type="checkbox"] {
              accent-color: #2dd4bf;
              width: 16px;
              height: 16px;
              cursor: pointer;
            }
            .tiptap-editor .ProseMirror blockquote {
              border-left: 3px solid rgba(45, 212, 191, 0.3);
              padding-left: 1em;
              margin-left: 0;
              margin-bottom: 0.75em;
              color: rgba(255, 255, 255, 0.6);
              font-style: italic;
            }
            .tiptap-editor .ProseMirror pre {
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 0.5em;
              padding: 1em;
              margin-bottom: 0.75em;
              overflow-x: auto;
            }
            .tiptap-editor .ProseMirror pre code {
              background: transparent;
              padding: 0;
              border: none;
              font-size: 0.9em;
            }
            .tiptap-editor .ProseMirror code {
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 0.25em;
              padding: 0.1em 0.3em;
              font-size: 0.9em;
              color: #2dd4bf;
            }
            .tiptap-editor .ProseMirror table {
              border-collapse: collapse;
              margin: 1em 0;
              width: 100%;
              display: block;
              overflow-x: auto;
            }
            .tiptap-editor .ProseMirror table td,
            .tiptap-editor .ProseMirror table th {
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 0.5em 0.75em;
              text-align: left;
              min-width: 80px;
            }
            .tiptap-editor .ProseMirror table th {
              background: rgba(255, 255, 255, 0.03);
              font-weight: 600;
            }
            .tiptap-editor .ProseMirror table td.selected,
            .tiptap-editor .ProseMirror table th.selected {
              background: rgba(45, 212, 191, 0.1);
            }
            .tiptap-editor .ProseMirror a {
              color: #2dd4bf;
              text-decoration: underline;
              cursor: pointer;
            }
            .tiptap-editor .ProseMirror a:hover {
              color: #5eead4;
            }
            .tiptap-editor .ProseMirror mark {
              background: rgba(45, 212, 191, 0.3);
              border-radius: 0.15em;
              padding: 0.05em 0.15em;
            }
            .tiptap-editor .ProseMirror hr {
              border: none;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
              margin: 1.5em 0;
            }
            .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
              content: attr(data-placeholder);
              float: left;
              color: rgba(255, 255, 255, 0.2);
              pointer-events: none;
              height: 0;
            }
          `}</style>
          <div className="tiptap-editor">
            {children}
          </div>
        </div>

        {/* Page Separator */}
        <div className="h-8" />

        {/* Second Page Placeholder */}
        <div
          className="bg-[#1A201F]/50 backdrop-blur-sm rounded-lg shadow-lg shadow-black/20"
          style={{
            minHeight: '1056px',
            padding: '40px 60px',
          }}
        >
          <div className="text-white/10 text-sm text-center py-8">
            Next page
          </div>
        </div>
      </div>
    </div>
  );
}
