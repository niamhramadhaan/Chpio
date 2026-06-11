# ChPio Development Notes

## Session: Major Feature Build (Commit 5441cad)

**22 files changed, 2961 insertions, 304 deletions**

---

## Notes System — Pocket Card Overhaul

### Pocket Stack Design
- 4-layer absolute-positioned system inside each folder card (h-48):
  - **Layer 1 (z-10)**: Back paper sheet, `-rotate-[4deg]`, gradient bg, corner fold decoration
  - **Layer 2 (z-20)**: Mid paper sheet, `rotate-[2deg]`, renders first note snippet text, ruled lines
  - **Layer 3 (z-30)**: Frosted white glass pocket sleeve — `rgba(255,255,255,0.15)`, `blur(24px)`, gradient border, accent lip line
  - **Layer 4 (z-40)**: Text overlay — folder title, metadata, note count badge
- Paper sheets slide up `-translate-y-3` on hover
- Empty folders show lined-paper silhouette with corner fold
- Archived folders show same design at `opacity-40`

### Toolbar Changes
- All buttons as individual chips (no dropdown)
- Removed chevron scroll button
- Horizontal scroll via `onWheel` → `scrollLeft += deltaY`
- Search animation: fixed width 180px, `layout` prop, no `mode="wait"`
- Archive chip highlights teal when active, toggles back to Notes on re-click
- +New Folder disabled when in archived view
- Pinned popover moved outside `overflow-x-auto` to fix clipping

### Note Editor
- Action bar: `[Pin] [List] [Links] [Paste]` — always visible
- Pin: teal-400 color toggle
- List: task accordion always visible (even 0 tasks), expand/collapse
- Links: collapsible section, clickable `<a>` tags, add/remove. `NoteLink` type with `id` + `url`
- Paste: clipboard API, `document.execCommand('insertText')` for undo support
- Textarea: `flex-1 min-h-0` fills available space

### Store Changes (notesStore.ts)
- `NoteLink` interface: `{ id: string; url: string }`
- `links?: NoteLink[]` on Note type
- `pinned?: boolean` on Note type
- Actions: `togglePin`, `getPinnedNotes`, `addLink`, `removeLink`

### NoteCard
- Pin button removed from hover actions (pin indicator badge stays)
- Delete prominent for archived notes (always visible, not hover-only)
- Task progress: mini bar + fraction
- Content preview: 2-line clamp
- Pinned indicator: `text-teal-400/60`

---

## Chat — Markdown/LaTeX Rendering Fix

### Root Cause
The old `MathContent` component used regex to split text on `$` delimiters, passing fragments to separate `<ReactMarkdown>` instances. This broke multi-block structures (tables, lists, bold/italic).

### Fix
- Installed `remark-math` + `rehype-katex`
- Single `<ReactMarkdown>` with plugins: `[remarkGfm, remarkMath]` + `[rehypeKatex]`
- `remark-math` parses `$...$` and `$$...$$` at AST level (respects code blocks)
- `rehype-katex` renders math nodes with KaTeX
- Removed `MathContent`, `MathInline`, `MathBlock` components (~65 lines)

### Added mdComponents
- `li`, `strong`, `em`, `del`, `img`, `hr`, `input` (checkbox for task lists)

---

## Chat — Thinking Process

### StreamChunk Architecture
- `streamChat` yields `StreamChunk = { type: 'content' | 'thinking'; text: string }` instead of plain strings
- Extracts thinking from all 3 provider types:
  - OpenAI-compatible: `delta.reasoning_content` / `delta.reasoning`
  - Google Gemini: parts with `thought: true`
  - Ollama: `message.thinking`

### ThinkingBlock Component
- Brain icon, "▸ Thought" label (or "Thinking..." while active)
- Collapsible with `AnimatePresence`, auto-collapses when streaming ends
- `max-h-60` scrollable for long reasoning
- `React.memo` wrapped

### Performance
- Thinking tokens accumulated locally during stream, written to store **once** at end
- Avoids per-token store updates for thinking content

---

## Chat — Lag Optimization

### Root Causes (pre-existing)
- 1 store update + 1 localStorage write per token (20-100/sec)
- `JSON.stringify` of entire sessions array on every token
- `ReactMarkdown` full re-parse on every token
- Unscoped Zustand selectors causing full re-renders
- No `React.memo` on message components

### Fixes Applied
| Fix | What |
|-----|------|
| Debounced localStorage | `saveSessions` runs every 500ms during streaming, flushes on `setStreaming(false)` |
| Scoped selectors | Individual `useChatStore(s => s.x)` instead of destructuring |
| React.memo | `UserMessage`, `AssistantMessage`, `ThinkingBlock` wrapped |
| Thinking deferred | Written once at end of stream, not per-token |
| Removed scroll effect | ThinkingBlock no longer measures `scrollHeight` per-token |

---

## Chat — Message Editing

### UserMessage
- Hover shows Edit (Pen) + Copy buttons
- Click Edit → textarea with auto-resize, Save/Cancel
- Save calls `onEdit` → parent updates store + auto-regenerates assistant response
- Enter saves, Shift+Enter for newline, Escape cancels

### AssistantMessage
- Hover shows Edit (Pen) + Copy + Regenerate buttons
- Edit button hidden on error responses and while streaming
- Click Edit → raw markdown textarea editor
- Regenerate available on all responses (not just errors)
- Auto-resize textarea matches content height

### Edit Mode Width Fix
- Removed `min-w-0` from parent flex wrapper during edit mode
- Textarea uses `w-full` with `boxSizing: 'border-box'`
- Both textareas match rendered bubble width

---

## Chat — Attachment Intent Anchor
- File picker reads file content via `FileReader.readAsText()`
- Shows pill with filename + X to remove near input
- File content injected into message on send: `[Attached: filename]\ncontent`

## Chat — Archived Chat State
- `isArchived` read from store in CommandBar
- Textarea disabled + dimmed, send button disabled
- Amber banner in ChatPage: "This conversation is archived"
- Archived sessions hidden from onboarding

## Onboarding
- Sessions sorted by `updatedAt` (most recent first)
- Auto-scroll: `requestAnimationFrame` at 0.3px/frame, pauses on hover
- Wheel scroll: `onWheel` converts `deltaY` → `scrollLeft`
- Archived sessions filtered out

---

## Known Issues / TODO
- **Edit mode width**: Still may not perfectly match rendered bubble for very long markdown content with code blocks or tables. The `min-w-0` removal helps but may need deeper investigation into flex layout interaction with `max-w-[85%]`.
- **Attachment preview**: Only text files supported. No image preview.
- **"Think" toggle**: Only wired for Gemini (`thinkingConfig`). Other providers need request body modifications.
- **Pinned notes popover**: May still have z-index issues in some contexts.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/types/index.ts` | `NoteLink`, `pinned`, `links`, `thinking` on Message |
| `src/store/notesStore.ts` | `togglePin`, `getPinnedNotes`, `addLink`, `removeLink` |
| `src/store/chatStore.ts` | Debounced localStorage, `editMessage`, `updateLastAssistantThinking` |
| `src/services/providers.ts` | `StreamChunk` type, thinking extraction from all providers, `thinking` param |
| `src/pages/NotesPage.tsx` | Pocket card, toolbar, editor, pinned popover, archive fixes |
| `src/pages/ChatPage.tsx` | Markdown fix, thinking, editing, archived state, lag fixes |
| `src/components/CommandBar.tsx` | Thinking defer, attachment anchor, archived guard |
| `src/components/CodeBlock.tsx` | Syntax highlighting component |
| `src/App.tsx` | Onboarding sort/scroll/filter, archived filter |
| `package.json` | Added `remark-math`, `rehype-katex` |
