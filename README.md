# ChPio — Chat Pioneer

> Your self-hosted AI workspace. Chat with any model, write docs, research anything, manage email, generate images — all local-first, privacy-first.

<!-- SCREENSHOT: hero.png — full workspace view with chat open, side panel visible, and a nice wallpaper -->

[Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md) · [Report a Bug](https://github.com/niamhramadhaan/Chpio/issues/new?template=bug_report.yml) · [Request a Feature](https://github.com/niamhramadhaan/Chpio/issues/new?template=feature_request.yml)

---

## What you can do

**Chat with any AI** — connect to OpenRouter, OpenAI, Groq, DeepSeek, Mistral, Ollama, and more. Or run models directly in your browser with WebLLM. No API key needed.

**Write & organize** — take notes in pocket-card folders, track tasks with progress bars, and write documents in a rich-text editor. Export as Word, Markdown, or HTML.

**Research anything** — give ChPio a topic and it'll search the web, read sources, and write you a report. Powered by Tavily.

**Your email, smarter** — connect your email account and let AI triage your inbox. Auto-classify as urgent, FYI, newsletter, or spam. Get AI-drafted replies.

**Create images** — generate images with OpenAI, Together AI, Pollinations, or your own custom endpoint.

**Remember everything** — save facts from any chat to Memory. ChPio recalls them in future conversations.

---

## Quick Start

```bash
git clone https://github.com/niamhramadhaan/Chpio.git
cd Chpio
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and you'll see the onboarding screen. Click **"Add an API key to get started"** or go to **Settings → Providers**, paste your key, hit **Sync**, and you're chatting.

Don't have an API key? [OpenRouter](https://openrouter.ai) gives you access to hundreds of models with one key. Or use **WebLLM** to run models locally in your browser — zero setup.

---

## Features

### Talk to any AI

Bring your own API key from any provider — OpenRouter, OpenAI, Groq, DeepSeek, Mistral, Google Gemini, Together AI, Fireworks, and more. Or run models locally with Ollama, llama.cpp, or WebLLM.

ChPio streams responses in real-time, shows the model's thinking process, and lets you edit or regenerate anything. Attach files (PDFs, DOCX, images) and the AI reads them. Save important facts to Memory so ChPio remembers across conversations.

<!-- SCREENSHOT: chat-streaming.png — chat mid-stream with thinking blocks visible -->

### Write & organize

**Notes** — jot things down in pocket-card folders. Add tasks with checkboxes, pin important notes, drag them between folders. Everything's searchable.

**Documents** — a full rich-text editor with markdown support. Write with tables, code blocks, lists. Preview live. Export as Word (.docx), Markdown, or HTML.

<!-- SCREENSHOT: notes-docs.png — notes panel with folders on the left, document editor on the right -->

### Research anything

Type a question and ChPio runs a multi-step research pipeline: it plans the search, reads sources, evaluates what's useful, and writes you a structured report. You can expand source cards to see what was extracted, and save the report as a document.

Needs a [Tavily API key](https://tavily.com) (free: 1000 searches/month). Set it up in **Settings → Research**.

<!-- SCREENSHOT: research-progress.png — deep research in progress with source cards and progress bar -->

### Your email, smarter

Connect your email account (IMAP/SMTP) and ChPio becomes an AI-powered inbox. It auto-triage each email — urgent, FYI, newsletter, or spam — and extracts topic tags. Compose, reply, forward. Get AI-drafted replies based on the thread context.

Requires the companion email server (included in `/server`). See [Email Setup](#email-setup) below.

<!-- SCREENSHOT: email-triage.png — email inbox with AI tags and triage badges -->

### Create images

Generate images from text prompts using OpenAI (DALL-E, gpt-image-1), Together AI (FLUX, SDXL), Pollinations, or your own custom endpoint. Download, copy prompts, or send images directly to chat.

Set up in **Settings → Image Gen**. Open from the bottom dock (⋯ menu).

### Go local

Run AI models directly in your browser — no API key, no server, no install. Powered by WebLLM with WebGPU acceleration. Requires Chrome or Edge 113+.

Models download on first use (~0.7-2 GB) and get cached locally. Supported: Llama 3.2, Phi-3.5, Qwen2.5, Gemma 2, SmolLM2, and more.

---

## Power User Stuff

**Command Palette** — press `⌘K` to search across all your chats, notes, docs, and memory. Jump to anything instantly.

<!-- SCREENSHOT: command-palette.png — ⌘K overlay with search results -->

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

**Quick Capture** — press `⌘⇧Q` anywhere to jot down a thought. Saved to a "Quick Notes" folder automatically.

**Built-in Guides** — press `⌘K` → "Chpio Guides" for step-by-step walkthroughs of every feature.

---

## Detailed Setup

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

## Tech Stack

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

## Contributing

Contributions welcome! Here's how:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Push to the branch
5. Open a PR

Check the [open issues](https://github.com/niamhramadhaan/Chpio/issues) for things to work on.

---

## License

[MIT](LICENSE)

---

<p align="center">
  Made with ☕ and a questionable amount of late nights
</p>
