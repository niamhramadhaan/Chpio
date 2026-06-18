# ✨ ChPio — Chat Pioneer ✨

> Your self-hosted AI workspace (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧

Self-hosted AI workspace. Chat with any local model or API, organize with projects, and take notes — all local-first, privacy-first.

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
- File attachments
- **Save to Memory** — extract key facts from any message

### Notes & Tasks 📝
- Pocket card folder system
- Tasks with progress tracking
- **Drag & drop** notes between folders
- Pin important notes
- Archive & search
- Links management

### Documents 📄
- **Rich text editor** with TipTap (ﾉ´ヮ`)ﾉ*: ・ﾟ✧
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

### Memory 🧠
- Persistent memory store
- AI-powered summarization from chat
- Tag-based organization
- Search functionality
- **Error-aware save** — distinguishes "nothing notable" from actual failures

---

## 🛠️ Getting Started

```bash
# Clone the repo (╯°□°)╯︵ ┻━┻
git clone <your-repo-url>

# Install dependencies
npm install

# Start the dev server (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), go to **Settings**, add your API key, sync models, and start chatting!

### Deep Research Setup
1. Go to **Settings → Research**
2. Enter your [Tavily API key](https://tavily.com) (free: 1000 searches/mo)
3. Click **Test** to verify, then **Save**
4. Open **Deep Research** from the bottom dock and start exploring!

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

---

## 📁 Project Structure

```
src/
├── components/     # UI components
│   ├── editor/     # TipTap editor components
│   ├── research/   # Deep research UI components
│   └── ui/         # Reusable UI primitives
├── pages/          # Page components
├── store/          # Zustand stores
├── services/       # API providers & orchestration
├── utils/          # Helper functions
└── types/          # TypeScript types
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
  <sub>(ﾉ´ヮ`)ﾉ*: ・ﾟ✧ ChPio — Your AI Companion</sub>
</p>
