# ✨ ChPio — Chat Pioneer ✨

> Your self-hosted AI workspace (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧

Self-hosted AI workspace. Chat with any local model or API, organize with projects, take notes, manage email, generate images, and do deep research — all local-first, privacy-first.

<!-- INSERT GIF: Hero screenshot showing the workspace with chat, side panel, and wallpaper -->

---

## 🚀 Features

### Chat 💬
- Connect to **OpenRouter, OpenAI, Ollama, llama.cpp, Groq, DeepSeek, Mistral**, and more (◕‿◕✿)
- Streaming responses with thinking blocks
- Message editing & regeneration
- Export as `.md`, `.txt`, or clipboard
- **Star/favorite** important chats ⭐
- **In-chat search** (Ctrl+F) 🔍
- Right-click context menus
- File attachments (text, PDF, DOCX, images)
- **Save to Memory** — extract key facts from any message
- **Interactive options** — AI gives clickable choices when unsure

<!-- INSERT GIF: Chat demo showing streaming response with thinking blocks -->

### Image Generation 🎨
- **AI image generation** canvas in the bottom dock
- Support for **OpenAI** (DALL-E, gpt-image-1) and **Together AI** (FLUX, SDXL)
- **Custom endpoint** — connect your own OpenAI-compatible server
- Image grid with download, delete, copy prompt, and send-to-chat
- Stylized provider/model selection dropdowns

<!-- INSERT IMAGE: Image generation canvas with generated images -->

### Local AI (Browser) 🧠
- Run models **directly in your browser** — no API key, no server, no install
- Powered by **WebLLM** with WebGPU acceleration
- Requires Chrome or Edge 113+
- Models download on first use (~0.7-2 GB) and are cached locally
- Supported: Llama 3.2, Phi-3.5, Qwen2.5, Gemma 2, SmolLM2, and more

### Projects 📁
- Organize chats into projects with **skills** and **instructions**
- **Quick skill setup** — tag selector with 8 categories
- AI-powered project setup
- Project context injected into AI conversations

### Notes & Tasks 📝
- Pocket card folder system
- Tasks with progress tracking
- **Drag & drop** notes between folders
- Pin important notes
- Archive & search
- Links management

<!-- INSERT IMAGE: Notes panel showing folders, tasks, and pinned notes -->

### Documents 📄
- **Rich text editor** with TipTap (ﾉ´Ŵ`)ﾉ*: ・ﾟ✧
- A4 page layout with visual separation
- Markdown support (tables, code blocks, lists)
- Export as **Markdown, HTML, or Word (.docx)**
- Floating modal editor with glassmorphic design
- Auto-save
- **Enhanced grid view** — responsive columns, content previews, date grouping, richer card layout

### Deep Research 🔬
- **Multi-step AI research** — plan, search, read, evaluate, report
- Powered by **Tavily** web search API
- Live progress tracking with elapsed timer
- Expandable source cards with favicons and extracted facts
- **Suggested follow-up queries** after completion
- **Save to Docs** — export research reports as documents
- Research history with session management

<!-- INSERT GIF: Deep research showing the multi-step pipeline in action -->

### Email 📧
- **IMAP/SMTP** email client with companion server
- **AI triage** — auto-classifies emails as urgent, FYI, newsletter, or spam
- **Smart tags** — AI extracts topic tags per message
- **Compose** — reply, forward, and new emails
- **AI reply drafts** — streaming draft generation from thread context
- **Thread view** — grouped messages by subject
- **Save to Docs** — export email threads as documents
- **Create Task** — turn emails into follow-up tasks
- **Real-time** — SSE push notifications + desktop notifications
- **Attachment** support with download

### Memory 🧠
- Persistent memory store
- AI-powered summarization from chat
- Tag-based organization
- Search functionality
- **Error-aware save** — distinguishes "nothing notable" from actual failures

---

## ⌨️ Keyboard Shortcuts & Command Palette

ChPio has a powerful **Command Palette** (⌘K) that lets you search across all chats, notes, docs, and memory — and jump to anything instantly.

<!-- INSERT IMAGE: Command Palette overlay showing search results -->

| Shortcut | Action |
|----------|--------|
| ⌘K | Open Command Palette — search everything, navigate anywhere |
| ⌘⇧Q | Quick Capture — instantly save a note from anywhere |
| ⌘/ | Keyboard Shortcuts reference |
| ⌘F | Search messages in current chat |
| ⌘B / ⌘I / ⌘U | Bold / Italic / Underline (in editor) |
| ⌘Z / ⌘⇧Z | Undo / Redo |
| Enter | Send message |
| Shift+Enter | New line in message |
| Esc | Close any overlay or cancel |

<!-- INSERT IMAGE: Keyboard Shortcuts HUD showing the table layout -->

### Focus Mode

Toggle **Focus Mode** via Command Palette (⌘K → "Toggle Focus Mode") for a distraction-free chat experience. Hides the side panel and dock, centers the chat input.

<!-- INSERT IMAGE: Focus mode showing centered chat input -->

### Quick Capture

Press **⌘⇧Q** anywhere to instantly jot down a thought. Notes are saved to a "Quick Notes" folder automatically — no need to switch panels.

<!-- INSERT IMAGE: Quick Capture overlay -->

---

## 🎯 Notification Center & Activity Pulse

### Notification Center
The bell icon in the footer shows **actionable items** that need your attention:
- Notes with incomplete tasks
- Chats that errored during streaming
- Empty chat sessions
- Memories without tags

<!-- INSERT IMAGE: Notification dropdown with items -->

### Activity Pulse
The onboarding screen shows a **Recent Activity** accordion with your latest work across all features — chats, notes, docs, and memory. Click any item to jump right back in.

<!-- INSERT IMAGE: Activity Pulse grid on home screen -->

---

## 📖 ChPio Guides

Access the built-in **ChPio Guides** from the notification footer or Command Palette (⌘K → "Chpio Guides"). Includes step-by-step tutorials for every feature:

- Getting Started — set up providers, start chatting
- Chat Features — thinking mode, memory, Chpio mode, file attachments
- Notes & Tasks — folders, tasks, pinning, Quick Capture
- Documents — rich text editor, export options
- Deep Research — how the pipeline works, Tavily setup
- Email — IMAP/SMTP setup, AI triage, smart replies
- Memory — how memory works, tagging, auto-summarize
- Keyboard Shortcuts — quick reference for all shortcuts

<!-- INSERT IMAGE: ChPio Guides modal showing sidebar and content -->

---

## 🛠️ Getting Started

```bash
# Clone the repo (╯°□°)╯︵ ┻━┻
git clone <your-repo-url>

# Install frontend dependencies
npm install

# Start the frontend dev server (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), go to **Settings**, add your API key, sync models, and start chatting!

### Deep Research Setup
1. Go to **Settings → Research**
2. Enter your [Tavily API key](https://tavily.com) (free: 1000 searches/mo)
3. Click **Test** to verify, then **Save**
4. Open **Deep Research** from the bottom dock and start exploring!

### Email Setup
```bash
# Install companion server dependencies
cd server
npm install

# Start the email server
npm run dev
```
1. Go to **Settings → Email**
2. Enter the server URL (default: `http://localhost:3001`)
3. Click **Test** to verify connection
4. Add your email account (IMAP/SMTP credentials)
5. Open **Email** from the bottom dock!

### Image Generation Setup
1. Go to **Settings → Image Gen**
2. Enable **OpenAI** or **Together AI** and add your API key (or configure a custom endpoint)
3. Open **Image Gen** from the bottom dock (⋯ menu)
4. Type a prompt and click Generate!

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Multi-provider AI chat with streaming
- [x] Thinking blocks (reasoning display)
- [x] Local browser AI via WebLLM/WebGPU
- [x] Notes & Tasks with folder system
- [x] Documents with rich text editor
- [x] Deep Research with Tavily
- [x] Email client with AI triage
- [x] Memory store with AI summarization
- [x] Image generation (OpenAI, Together AI, Pollinations)
- [x] Projects with skills & instructions
- [x] Right-click context menus
- [x] ⌘K Command Palette — global search & navigation
- [x] ⌘⇧Q Quick Capture — instant note saving
- [x] ⌘/ Keyboard Shortcuts HUD — table-style reference
- [x] Focus Mode — distraction-free chat
- [x] Notification Center — actionable items
- [x] Activity Pulse — recent activity feed
- [x] ChPio Guides — built-in tutorial system
- [x] Enhanced Thinking Indicator — live token count, animated dots

### 🔜 Coming Soon
- [ ] AI Agent / Tool Use — let AI call tools (search, code execution, file ops)
- [ ] Code Interpreter — in-browser JS/Python sandbox for data analysis
- [ ] RAG / Knowledge Base — index documents for retrieval-augmented generation
- [ ] Voice Interface — speech-to-text and text-to-speech
- [ ] Workflow Automation — chain AI actions on triggers
- [ ] Browser Extension — "Ask ChPio" on any webpage
- [ ] Integrations Hub — connect GitHub, Slack, Notion, Google Drive
- [ ] Scheduled Tasks — recurring AI jobs (daily digest, weekly research)
- [ ] Prompt Library — community-shared prompts and templates
- [ ] Export/Share Chats — public shareable links
- [ ] Custom Themes — light mode, custom accent colors

---

## 🎨 Tech Stack

| Technology | Purpose |
|------------|---------|
| ⚛️ React 19 | UI Framework |
| 🔷 TypeScript | Type Safety |
| ⚡ Vite | Build Tool |
| 🎨 Tailwind CSS | Styling |
| 🐻 Zustand | State Management |
| 🎭 Framer Motion | Animations |
| ✏️ TipTap | Rich Text Editor |
| 📝 Lucide Icons | Icons |
| 🔍 Tavily | Web Search API |
| 📬 imapflow | IMAP Client |
| 📨 nodemailer | SMTP Sending |
| 📮 postal-mime | MIME Parsing |
| 💾 better-sqlite3 | Email Cache |
| 🧠 WebLLM | Local AI (Browser) |
| 📄 LiteParse | PDF Parsing (WASM) |
| 📝 Mammoth | DOCX Parsing |

---

## 📁 Project Structure

```
src/                             # Frontend
├── components/                  # UI components
│   ├── editor/                  # TipTap editor components
│   ├── email/                   # Email UI (FolderList, EmailList, etc.)
│   ├── research/                # Deep research UI components
│   └── ui/                      # Reusable UI primitives
├── pages/                       # Page components
├── store/                       # Zustand stores
├── services/                    # API providers & orchestration
├── utils/                       # Helper functions
└── types/                       # TypeScript types

server/                          # Email companion server
├── src/
│   ├── index.ts                 # Express entry point
│   ├── db.ts                    # SQLite schema + queries
│   ├── imap.ts                  # IMAP connection pool
│   ├── smtp.ts                  # SMTP sending
│   └── routes/                  # REST API endpoints
│       ├── accounts.ts          # Account CRUD
│       ├── folders.ts           # Folder listing
│       ├── messages.ts          # Messages + triage
│       ├── send.ts              # Send email
│       └── events.ts            # SSE real-time events
├── package.json
└── tsconfig.json
```

---

## 🤝 Contributing

Contributions welcome! (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a PR

---

## 📝 License

MIT ┬─┬ノ( º _ ºノ)

---

<p align="center">
  Made with ❤️ and lots of ☕
  <br>
  <sub>(ﾉ´Ŵ`)ﾉ*: ・ﾟ✧ ChPio — Your AI Companion</sub>
</p>
