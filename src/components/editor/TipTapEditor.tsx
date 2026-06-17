import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Heading from '@tiptap/extension-heading';
import { Markdown } from 'tiptap-markdown';
import { useEffect, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar';

interface TipTapEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  placeholder?: string;
}

export function TipTapEditor({ content, onUpdate, placeholder = 'Start writing...' }: TipTapEditorProps) {
  const updateTimer = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-teal-400 hover:underline cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
      Color,
      TextStyle,
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '-',
        linkify: false,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (updateTimer.current) clearTimeout(updateTimer.current);
      updateTimer.current = setTimeout(() => {
        const markdown = editor.storage.markdown.getMarkdown();
        onUpdate(markdown);
      }, 300);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px]',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== undefined) {
      const currentMarkdown = editor.storage.markdown.getMarkdown();
      if (currentMarkdown !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  useEffect(() => {
    return () => {
      if (updateTimer.current) clearTimeout(updateTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 min-h-0">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
