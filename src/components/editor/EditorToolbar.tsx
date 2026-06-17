import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Table,
  Code,
  Quote,
  Highlighter,
  Undo,
  Redo,
  RemoveFormatting,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import { useState, useCallback } from 'react';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const addRowBefore = useCallback(() => {
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  const toolbarBtn = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    isActive?: boolean
  ) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        isActive
          ? 'bg-teal-400/15 text-teal-400'
          : 'text-white/30 hover:text-white/60 hover:bg-white/5'
      }`}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="shrink-0 px-3 py-2 flex flex-wrap items-center gap-1 border-b border-white/5 bg-[#1A201F]/40">
      {/* Undo/Redo */}
      {toolbarBtn(<Undo className="w-4 h-4" />, 'Undo', () => editor.chain().focus().undo().run())}
      {toolbarBtn(<Redo className="w-4 h-4" />, 'Redo', () => editor.chain().focus().redo().run())}

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Text Formatting */}
      {toolbarBtn(
        <Bold className="w-4 h-4" />,
        'Bold',
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold')
      )}
      {toolbarBtn(
        <Italic className="w-4 h-4" />,
        'Italic',
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic')
      )}
      {toolbarBtn(
        <Underline className="w-4 h-4" />,
        'Underline',
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive('underline')
      )}
      {toolbarBtn(
        <Strikethrough className="w-4 h-4" />,
        'Strikethrough',
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive('strike')
      )}

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Headings */}
      {toolbarBtn(
        <Heading1 className="w-4 h-4" />,
        'Heading 1',
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        editor.isActive('heading', { level: 1 })
      )}
      {toolbarBtn(
        <Heading2 className="w-4 h-4" />,
        'Heading 2',
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive('heading', { level: 2 })
      )}
      {toolbarBtn(
        <Heading3 className="w-4 h-4" />,
        'Heading 3',
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        editor.isActive('heading', { level: 3 })
      )}

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Lists */}
      {toolbarBtn(
        <List className="w-4 h-4" />,
        'Bullet List',
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList')
      )}
      {toolbarBtn(
        <ListOrdered className="w-4 h-4" />,
        'Numbered List',
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList')
      )}
      {toolbarBtn(
        <ListTodo className="w-4 h-4" />,
        'Task List',
        () => editor.chain().focus().toggleTaskList().run(),
        editor.isActive('taskList')
      )}

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Alignment */}
      {toolbarBtn(
        <AlignLeft className="w-4 h-4" />,
        'Align Left',
        () => editor.chain().focus().setTextAlign('left').run(),
        editor.isActive({ textAlign: 'left' })
      )}
      {toolbarBtn(
        <AlignCenter className="w-4 h-4" />,
        'Align Center',
        () => editor.chain().focus().setTextAlign('center').run(),
        editor.isActive({ textAlign: 'center' })
      )}
      {toolbarBtn(
        <AlignRight className="w-4 h-4" />,
        'Align Right',
        () => editor.chain().focus().setTextAlign('right').run(),
        editor.isActive({ textAlign: 'right' })
      )}
      {toolbarBtn(
        <AlignJustify className="w-4 h-4" />,
        'Align Justify',
        () => editor.chain().focus().setTextAlign('justify').run(),
        editor.isActive({ textAlign: 'justify' })
      )}

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Block Elements */}
      {toolbarBtn(
        <Code className="w-4 h-4" />,
        'Code Block',
        () => editor.chain().focus().toggleCodeBlock().run(),
        editor.isActive('codeBlock')
      )}
      {toolbarBtn(
        <Quote className="w-4 h-4" />,
        'Blockquote',
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive('blockquote')
      )}
      {toolbarBtn(
        <Highlighter className="w-4 h-4" />,
        'Highlight',
        () => editor.chain().focus().toggleHighlight().run(),
        editor.isActive('highlight')
      )}

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Link */}
      {showLinkInput ? (
        <div className="flex items-center gap-1">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addLink();
              if (e.key === 'Escape') {
                setShowLinkInput(false);
                setLinkUrl('');
              }
            }}
            placeholder="https://..."
            className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded outline-none text-white placeholder-white/30 w-32"
            autoFocus
          />
          <button
            onClick={addLink}
            className="px-2 py-1 text-xs bg-teal-400/15 text-teal-400 rounded hover:bg-teal-400/25 transition-colors cursor-pointer"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className="px-2 py-1 text-xs text-white/30 hover:text-white/60 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        toolbarBtn(
          <Link className="w-4 h-4" />,
          'Insert Link',
          () => setShowLinkInput(true),
          editor.isActive('link')
        )
      )}

      {/* Table */}
      {toolbarBtn(<Table className="w-4 h-4" />, 'Insert Table', insertTable)}

      {/* Table operations (only show if in table) */}
      {editor.isActive('table') && (
        <>
          <div className="w-px h-4 bg-white/10 mx-1" />
          {toolbarBtn(<Plus className="w-3 h-3" />, 'Add Column Before', addColumnBefore)}
          {toolbarBtn(<Plus className="w-3 h-3" />, 'Add Column After', addColumnAfter)}
          {toolbarBtn(<Minus className="w-3 h-3" />, 'Delete Column', deleteColumn)}
          {toolbarBtn(<Plus className="w-3 h-3" />, 'Add Row Before', addRowBefore)}
          {toolbarBtn(<Plus className="w-3 h-3" />, 'Add Row After', addRowAfter)}
          {toolbarBtn(<Minus className="w-3 h-3" />, 'Delete Row', deleteRow)}
          {toolbarBtn(<Trash2 className="w-3 h-3" />, 'Delete Table', deleteTable)}
        </>
      )}

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Clear Formatting */}
      {toolbarBtn(
        <RemoveFormatting className="w-4 h-4" />,
        'Clear Formatting',
        () => editor.chain().focus().clearNodes().unsetAllMarks().run()
      )}
    </div>
  );
}
