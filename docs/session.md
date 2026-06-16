# ChPio UX Overhaul — Session Log

## Branch: `feat/ux-overhaul-phases-1-6`

---

## Completed Phases

### Phase 1: Dead Toggle Cleanup
- Removed non-functional Web/Code toggles from CommandBar
- Deleted unused `select-ai-agent-base.tsx` component
- Cleaned up related imports

### Phase 2: Responsive Layout (Mobile Support)
- Added `useIsMobile()` hook via `matchMedia` (breakpoint: 1023px)
- WorkspaceView: `flex-col` on mobile, `lg:flex-row` on desktop
- RightPanel: full-width overlay on mobile with "Back to Chat" button
- ChatPage: responsive padding (`px-3 sm:px-6 lg:px-8`)
- CommandBar: compact model selector, responsive padding
- BottomDock: compact icons, scrollable on mobile
- OnboardingView: responsive text size and padding
- Added `100dvh` viewport fix for mobile browsers
- Added `safe-bottom` utility for iOS notch
- Menu (hamburger) button in chat header for mobile feature access

### Phase 3: Chat Export
- New `src/utils/exportChat.ts` — export as `.md`, `.txt`, or copy to clipboard
- Export dropdown in chat header (Download icon)
- Three actions: Copy all, Export .md, Export .txt
- Click-outside to close dropdown
- Filename format: `{chat-title}-{YYYY-MM-DD}.ext`

### Phase 4: Docs Upgrade + extend-hq/ui Integration
- Attempted extend-hq/ui component installation
  - PDF/DOCX/XLSX viewers: **removed** — TW4-incompatible (oklch, extended Radix props, `size-*`)
  - File System: **removed** — same TW4 issues
  - Installed & restyled: `file-upload`, `file-thumbnail`, shadcn primitives (button, card, dialog, dropdown, select, tabs, tooltip, badge, scroll-area, separator, spinner, input, popover)
  - All `oklch()` colors replaced with ChPio dark glassmorphism palette
  - All `size-*` TW4 classes replaced with `w-* h-*`
- Built `FileBrowser` component (grid + list views, search, rename, delete)
- DocsPage rewritten with FileBrowser + editor improvements:
  - Markdown preview toggle (eye icon)
  - Formatting toolbar (Bold, Italic, Code, Heading, List, Link, Quote, Table)
  - Export .md + Copy to clipboard
  - Keyboard shortcuts (Cmd+Enter to save, Escape to cancel)
- CommandBar file attachment upgraded:
  - Drag-drop support with visual overlay
  - File type filter for picker
  - Cleaner file handling with `readFile()` helper

### Phase 5: Chat ↔ Docs Integration
- Docs can be attached to chat sessions for AI context
- "Attach Docs" button in CommandBar with checkbox picker dropdown (PortalDropdown)
- Attached docs shown as teal chips below input, removable with ✕
- Doc content injected into system prompt (truncated at 8000 chars/doc)
- AI can edit docs via structured output blocks:
  ```
  ```doc-update
  id: doc-uuid
  ---
  [new content]
  ```
  ```
- Parsed after streaming → executes update → strips block from display
- Shows feedback: `> Updated: Doc Title`
- Both `doStream()` paths in CommandBar and ChatPage updated
- New `src/utils/docContext.ts` — builds doc system prompt
- New `src/utils/parseDocUpdates.ts` — parses, executes, strips doc-update blocks

### Phase 6: Memory ↔ Chat Integration
- Memory toggle (Database icon) in CommandBar — ON by default
- 20 most recent memories injected into system prompt when toggle is ON
- "Remember" button (Bookmark icon) on every message
  - Auto-summarizes via AI (separate API call)
  - Extracts knowledge, not conversation actions
  - Skips if nothing worth remembering (NOTHING_NOTABLE token)
  - Three feedback states: ✓ saved, ✕ nothing to remember, spinning = loading
- Memory count badge next to toggle
- `src/utils/memoryContext.ts`:
  - `buildMemoryContextSystemMessage()` — formats memories for system prompt
  - `summarizeForMemory()` — AI extracts factual knowledge, returns null if nothing notable
- MemoryPage refactored:
  - Single `FormMode` state prevents edit/create desync
  - `key={formKey}` forces clean remount on mode change
  - Visual highlight on card being edited
  - Keyboard shortcuts (Cmd+Enter save, Escape cancel)

### Additional Fixes
- Doc picker dropdown layering: replaced inline dropdown with `PortalDropdown` (portal-based, bypasses overflow-hidden)
- Icon confusion resolved:
  - `Brain` = Think/reasoning toggle (CommandBar)
  - `Database` = Memory feature (CommandBar + BottomDock)
  - `Bookmark` = Save to memory (chat messages)
  - `BookOpen` = Attach docs (CommandBar)
- Memory summarization prompt enhanced:
  - Removed "under 30 words" constraint → "1-3 concise sentences"
  - Added rich examples of good vs bad memories
  - Emphasizes specific details: tool names, project names, tech stack

---

## New Files Created

| File | Purpose |
|------|---------|
| `src/utils/exportChat.ts` | Chat export (md, txt, clipboard, download) |
| `src/utils/docContext.ts` | Doc context system prompt builder |
| `src/utils/parseDocUpdates.ts` | Doc-update block parser + executor |
| `src/utils/memoryContext.ts` | Memory context prompt + AI summarizer |
| `src/components/FileBrowser.tsx` | Grid/list file browser with search, rename, delete |
| `src/components/ui/file-upload.tsx` | extend-hq/ui drag-drop file upload |
| `src/components/ui/file-thumbnail.tsx` | extend-hq/ui file type thumbnails |
| `src/components/ui/badge.tsx` | shadcn badge |
| `src/components/ui/button.tsx` | shadcn button |
| `src/components/ui/card.tsx` | shadcn card |
| `src/components/ui/dialog.tsx` | shadcn dialog (modal) |
| `src/components/ui/dropdown-menu.tsx` | shadcn dropdown menu |
| `src/components/ui/input.tsx` | shadcn input |
| `src/components/ui/popover.tsx` | shadcn popover |
| `src/components/ui/scroll-area.tsx` | shadcn scroll area |
| `src/components/ui/select.tsx` | shadcn select |
| `src/components/ui/separator.tsx` | shadcn separator |
| `src/components/ui/spinner.tsx` | Loading spinner |
| `src/components/ui/tabs.tsx` | shadcn tabs |
| `src/components/ui/tooltip.tsx` | shadcn tooltip |
| `docs/session.md` | This file |

---

## Modified Files

| File | Changes |
|------|---------|
| `src/types/index.ts` | `attachedDocIds` on ChatSession |
| `src/store/appStore.ts` | `useIsMobile()` hook |
| `src/store/chatStore.ts` | `setAttachedDocs()`, persist `attachedDocIds` |
| `src/App.tsx` | Responsive WorkspaceView, mobile BottomDock, OnboardingView padding |
| `src/index.css` | `100dvh`, `safe-bottom` utility |
| `src/components/CommandBar.tsx` | Memory toggle, doc picker, drag-drop, doc/memory injection, memory badge |
| `src/components/RightPanel.tsx` | Mobile full-width + back button |
| `src/components/BottomDock.tsx` | Compact mobile, Database icon for Memory |
| `src/pages/ChatPage.tsx` | Doc/memory injection, export dropdown, Remember button, responsive padding, Menu button |
| `src/pages/DocsPage.tsx` | FileBrowser, markdown preview, toolbar, export |
| `src/pages/MemoryPage.tsx` | Refactored form state, visual edit highlight, keyboard shortcuts |
| `package.json` | New deps: @embedpdf/*, @extend-ai/*, @radix-ui/*, @pierre/trees, @tanstack/react-virtual, border-beam, cmdk, pdf-lib |

---

## Dependencies Added

| Package | Purpose | Weight |
|---------|---------|--------|
| `border-beam` | Decorative animated border | ~3KB |
| `@radix-ui/*` (8 packages) | UI primitives (dialog, dropdown, select, etc.) | ~50KB total |
| `class-variance-authority` | Variant-based component styling | Already had |
| `@pierre/trees` | Tree component (unused after cleanup) | ~15KB |
| `@tanstack/react-virtual` | Virtualization (unused after cleanup) | ~10KB |
| `cmdk` | Command palette (unused after cleanup) | ~8KB |
| `pdf-lib` | PDF manipulation (unused after cleanup) | ~200KB |

Note: Heavy deps (@embedpdf/*, @extend-ai/react-docx, @extend-ai/react-xlsx) were installed then removed. Remaining unused deps can be cleaned up with `npm prune`.

---

## Next Phase — TODO

### Phase 7: Polish & Performance
- [ ] Keyboard shortcuts (Cmd+K command bar, Cmd+N new chat, 1-6 dock nav)
- [ ] Toast notification system for streaming completion
- [ ] Focus trap in modals (Tab can escape currently)
- [ ] ARIA labels on icon-only buttons (accessibility)
- [ ] Loading skeletons for lazy-loaded pages
- [ ] Chat in-chat message search (Ctrl+F style)
- [ ] Drag-and-drop for notes between folders
- [ ] Right-click context menus on messages/notes/docs
- [ ] Star/favorite important chats

### Phase 8: Advanced Features
- [ ] System prompt / custom instructions per chat session
- [ ] Chat-to-note and chat-to-doc actions (save response as note/doc)
- [ ] Link preview in chat messages
- [ ] Voice input for CommandBar
- [ ] Theme toggle (light mode)
- [ ] Data management (clear all, storage usage indicator, import/export all)

### Phase 9: Desktop App (Tauri)
- [ ] Wrap with Tauri
- [ ] Migrate localStorage to Tauri native storage
- [ ] Add native file system access
- [ ] PDF/DOCX viewer integration (Tauri webview handles WASM efficiently)
- [ ] Auto-updater
- [ ] System tray integration

### Phase 10: PDF/DOCX Viewers (Re-attempt)
- [ ] Build custom PDF viewer using `pdfjs-dist` (lighter than @embedpdf)
- [ ] Build DOCX viewer using `mammoth` (lighter than @extend-ai)
- [ ] Modal viewers triggered from FileBrowser and chat attachments
- [ ] Lazy-load viewers only when needed

---

## Architecture Notes

### Chat ↔ Docs Integration Pattern
```
User attaches docs → system prompt injection → AI reads/edits → parse doc-update blocks → execute updates
```

### Chat ↔ Memory Integration Pattern
```
Memories auto-injected (toggle controlled) → AI uses context → Remember button → AI summarizes → save to store
```

### Provider Tool Calling Status
- Currently: no API-level tool calling. Uses structured output parsing (regex-based).
- Future: can add native tool calling for OpenAI-compatible APIs (function calling parameter).
- Current approach works universally across all providers (OpenRouter, Ollama, Gemini, etc.).

---

*Last updated: 2026-06-17*
