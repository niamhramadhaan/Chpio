# ChPio — Chat Pioneer

> Your self-hosted AI workspace (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/niamhramadhaan/Chpio?style=flat&color=yellow)](https://github.com/niamhramadhaan/Chpio/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/niamhramadhaan/Chpio?style=flat&color=red)](https://github.com/niamhramadhaan/Chpio/issues)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/niamhramadhaan/Chpio?style=flat&color=blue)](https://github.com/niamhramadhaan/Chpio/commits)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite&logoColor=white)

Chat with any model, write docs, research anything, manage email, generate images — all local-first, privacy-first.

<!-- SCREENSHOT: hero.png — full workspace view with chat open, side panel visible, and a nice wallpaper -->

[Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md) · [Report a Bug](https://github.com/niamhramadhaan/Chpio/issues/new?template=bug_report.yml) · [Request a Feature](https://github.com/niamhramadhaan/Chpio/issues/new?template=feature_request.yml)

---

## // What you can do

**Chat with any AI** — connect to OpenRouter, OpenAI, Groq, DeepSeek, Mistral, Ollama, and more. Or run models directly in your browser with WebLLM. No API key needed.

**Write & organize** — take notes in pocket-card folders, track tasks with progress bars, and write documents in a rich-text editor. Export as Word, Markdown, or HTML.

**Research anything** — give ChPio a topic and it'll search the web, read sources, and write you a report. Powered by Tavily.

**Your email, smarter** — connect your email account and let AI triage your inbox. Auto-classify as urgent, FYI, newsletter, or spam. Get AI-drafted replies.

**Create images** — generate images with OpenAI, Together AI, Pollinations, or your own custom endpoint.

**Remember everything** — save facts from any chat to Memory. ChPio recalls them in future conversations.

**Organize with projects** — group chats by project with custom skills and instructions. Give each project its own personality.

**ChPio Mode** — toggle the sparkle button and your AI becomes ChPio — a cool friend with opinions, not a corporate chatbot. It remembers your goals, celebrates wins, and gives you structured choices when you're stuck. More on this below.

---

## // Quick Start

```bash
git clone https://github.com/niamhramadhaan/Chpio.git (╯°□°)╯︵ ┻━┻
cd Chpio
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and you'll see the onboarding screen. Click **"Add an API key to get started"** or go to **Settings → Providers**, paste your key, hit **Sync**, and you're chatting.

Don't have an API key? [OpenRouter](https://openrouter.ai) gives you access to hundreds of models with one key. Or use **WebLLM** to run models locally in your browser — zero setup.

<!-- SCREENSHOT: onboarding.png — the welcome screen with the "Add an API key" CTA visible -->

---

## // Features

### Talk to any AI

Bring your own API key from any provider — OpenRouter, OpenAI, Groq, DeepSeek, Mistral, Google Gemini, Together AI, Fireworks, and more. Or run models locally with Ollama, llama.cpp, or WebLLM.

ChPio streams responses in real-time, shows the model's thinking process, and lets you edit or regenerate anything.

<!-- GIF: chat-streaming.gif — chat with a streaming response, thinking blocks expanding, then the response completes -->

Attach files — PDFs, DOCX, images — and the AI reads them. Send a screenshot, drop a contract, or paste a codebase. The context goes straight to the model.

<!-- SCREENSHOT: chat-file-attach.png — chat with a file attachment visible in the message bubble and the AI responding about it -->

Save important facts to Memory mid-conversation. Next time you chat, ChPio already knows your preferences, project context, and past decisions.

<!-- SCREENSHOT: chat-memory-save.png — the "Save to Memory" action on a message, or the memory save confirmation -->

### Write & organize

**Notes** — jot things down in pocket-card folders. Add tasks with checkboxes, pin important notes, drag them between folders. Everything's searchable.

<!-- SCREENSHOT: notes-folders.png — notes panel showing pocket-card folders with note counts -->

Open a note and you get a clean editor with task lists, links, and quick actions — export as text, duplicate, move to another folder, or pin it to your active chat for reference.

<!-- SCREENSHOT: note-editor.png — a note open with tasks, links, and the action bar visible -->

**Documents** — a full rich-text editor (ﾉ´Ŵ`)ﾉ*: ・ﾟ✧ with markdown support. Write with tables, code blocks, lists. Preview live. Export as Word (.docx), Markdown, or HTML.

<!-- SCREENSHOT: docs-editor.png — document editor with a rich document open, showing toolbar and preview -->

### Research anything

Type a question and ChPio runs a multi-step research pipeline: it plans the search, reads sources, evaluates what's useful, and writes you a structured report. You can expand source cards to see what was extracted, and save the report as a document.

<!-- GIF: research-progress.gif — research running: sources appearing, facts being extracted, report building -->

Needs a [Tavily API key](https://tavily.com) (free: 1000 searches/month). Set it up in **Settings → Research**.

### Your email, smarter

Connect your email account (IMAP/SMTP) and ChPio becomes an AI-powered inbox. It auto-triages each email — urgent, FYI, newsletter, or spam — and extracts topic tags.

<!-- SCREENSHOT: email-inbox.png — email inbox with AI triage badges (urgent/fyi/newsletter) and smart tags -->

Compose, reply, forward. Get AI-drafted replies based on the thread context — just hit "Draft" and ChPio writes a response you can edit before sending.

<!-- SCREENSHOT: email-compose.png — compose modal with an AI-drafted reply visible -->

Requires the companion email server (included in `/server`). See [Detailed Setup](#detailed-setup) below.

### Create images

Generate images from text prompts using OpenAI (DALL-E, gpt-image-1), Together AI (FLUX, SDXL), Pollinations, or your own custom endpoint. Download, copy prompts, or send images directly to chat.

<!-- SCREENSHOT: image-gen.png — image generation canvas with a grid of generated images and the prompt bar -->

Set up in **Settings → Image Gen**. Open from the bottom dock (⋯ menu).

### Go local

Run AI models directly in your browser — no API key, no server, no install. Powered by WebLLM with WebGPU acceleration. Requires Chrome or Edge 113+.

Models download on first use (~0.7-2 GB) and get cached locally. Supported: Llama 3.2, Phi-3.5, Qwen2.5, Gemma 2, SmolLM2, and more.

<!-- SCREENSHOT: webllm-running.png — WebLLM model running in browser with the model picker visible -->

### Organize with projects

Group related chats under a project. Give each project custom **skills** (what the AI should know) and **instructions** (how it should behave). A coding project gets a different AI personality than a writing project.

<!-- SCREENSHOT: projects.png — project list or a project with its skills/instructions visible -->

### ChPio Mode

Most AI assistants are polite robots. ChPio Mode is different — toggle it on and your AI develops a personality. It tracks your goals, gives you options instead of open-ended questions, celebrates wins, and remembers what you told it.

It reads your profile (name, title, timezone) and acts like a competent friend, not a customer service agent. It'll say things like "That broke. Let's fix it" instead of "I apologize for the inconvenience."

Toggle it with the sparkle button in the chat input or via `⌘K` → "Toggle ChPio Mode".

<!-- SCREENSHOT: chpio-mode.png — chat with ChPio mode active, showing the purple sparkle button and a casual AI response with goal tracking -->

---

## // Power User Stuff

**Command Palette** — press `⌘K` to search across all your chats, notes, docs, and memory. Jump to anything instantly.

<!-- GIF: command-palette.gif — pressing ⌘K, typing a search, selecting a result, landing on it -->

**Keyboard Shortcuts:**

| Shortcut | Action |
|----------|--------|
| `⌘K` | Command Palette — search everything |
| `⌘⇧Q` | Quick Capture — save a note instantly |
| `⌘/` | Keyboard shortcuts reference |
| `⌘F` | Search messages in current chat |
| `⌘B` / `⌘I` / `⌘U` | Bold / Italic / Underline (in editor) |
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Esc` | Close any overlay |

**Focus Mode** — hides the side panel and dock for distraction-free chat. Toggle via `⌘K` → "Toggle Focus Mode".

<!-- SCREENSHOT: focus-mode.png — focused chat view with centered input, no side panel -->

**Quick Capture** — press `⌘⇧Q` anywhere to jot down a thought. Saved to a "Quick Notes" folder automatically.

<!-- SCREENSHOT: quick-capture.png — the Quick Capture overlay with a note being typed -->

**Right-click anything** — messages, notes, and docs have context menus. Edit, copy, archive, export, or save to memory without hunting for buttons.

**Built-in Guides** — press `⌘K` → "Chpio Guides" for step-by-step walkthroughs of every feature. No need to leave the app.

---

## // Detailed Setup

### Email Setup

```bash
cd server
npm install
npm run dev
```

Then in ChPio: **Settings → Email** → enter `http://localhost:3001` → click **Test** → add your IMAP/SMTP credentials.

### Image Generation Setup

**Settings → Image Gen** → enable a provider and add your API key. Or configure a custom OpenAI-compatible endpoint.

---

## // Tech Stack

| | |
|---|---|
| React 19 + TypeScript + Vite | UI & build |
| Tailwind CSS + Framer Motion | Styling & animations |
| Zustand | State management |
| TipTap | Rich text editor |
| WebLLM | Local browser AI |
| Tavily | Web search for research |
| imapflow + nodemailer | Email (IMAP/SMTP) |
| better-sqlite3 | Email cache |
| LiteParse + Mammoth | PDF & DOCX parsing |

---

## // Contributing

(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ Contributions welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Push to the branch
5. Open a PR

Check the [open issues](https://github.com/niamhramadhaan/Chpio/issues) for things to work on. If you find a bug or have a feature idea, [open an issue](https://github.com/niamhramadhaan/Chpio/issues/new/choose) first.

---

## // Built with

<p align="left">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind" /></a>
  <a href="https://zustand-demo.pmnd.rs"><img src="https://img.shields.io/badge/Zustand-5-fff?logo=zustand&logoColor=black" alt="Zustand" /></a>
  <a href="https://tiptap.dev"><img src="https://img.shields.io/badge/TipTap-3-purple" alt="TipTap" /></a>
  <a href="https://webllm.mlc.ai"><img src="https://img.shields.io/badge/WebLLM-Browser_AI-green" alt="WebLLM" /></a>
</p>

---

## // License

MIT ┬─┬ノ( º _ ºノ)

---

<p align="center">
  (ﾉ´Ŵ`)ﾉ*: ・ﾟ✧ ChPio — Your AI Companion
  <br>
  Made with ☕ and questionable life choices
</p>
