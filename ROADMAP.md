# ChPio Roadmap

## What's New

### Image Generation Canvas 🎨
- New **Image Gen** feature in the bottom dock (⋯ menu)
- Generate images with AI using OpenAI (DALL-E, gpt-image-1) or Together AI (FLUX, SDXL)
- **Custom endpoint support** — connect your own OpenAI-compatible image generation server
- Image canvas with download, delete, copy prompt, and send-to-chat
- Stylized dropdowns for provider/model selection
- Settings → Image Gen tab for provider configuration

### Local AI (Browser) 🧠
- Run models directly in your browser — no API key, no server, no install
- New **Local** tab in Settings with WebGPU status, model sync, and custom model support
- Requires Chrome or Edge 113+ with WebGPU enabled
- Models download on first use (~0.7-2 GB) and are cached locally
- Supported models: Llama 3.2, Phi-3.5, Qwen2.5, Gemma 2, SmolLM2, and more

### Project System Improvements 📁
- **Skills quick setup** — tag selector with 8 categories (Lang, Frontend, Backend, Database, DevOps, AI/ML, Mobile, Other)
- Input-based filtering — type "devops" to see related skills
- Project context now injected into AI system message
- AI Generate button for auto-generating skills & instructions
- Description field, delete button, move-to-project UI

### Chpio Mode Enhancements ✨
- **Goal tracking** — AI acknowledges and tracks your goals per session
- **Interactive options** — AI gives clickable options when unsure (context-aware, not just numbered lists)
- **Persistent mode** — Chpio mode now survives page refresh
- Options detect questions vs requirements to avoid false positives

### Custom Provider 🔧
- New **Custom** provider in Settings → Providers
- Connect to any OpenAI-compatible endpoint (local or remote)
- Configurable name, base URL, and API key

### Document Handling 📄
- **PDF support** — attach PDFs, content extracted via LiteParse WASM (runs in browser)
- **DOCX support** — attach Word documents, text extracted via Mammoth
- **Image attachments** — attach images, sent as base64 to vision models
- File preview with loading states and error handling
- Images show as thumbnails in chat bubbles

### Fixed Provider Logos
- OpenAI, Groq, Mistral AI, Together AI, Fireworks AI logos now display correctly
- Switched to jsdelivr CDN with correct brand slugs

### Data Backup & Restore
- New **Data** tab in Settings
- Export all your chats, notes, docs, memories, and settings as a JSON file
- Import from a previous backup to restore

### Toast Notifications
- Centralized feedback system — "Copied", "Saved", "Error" notifications appear as toasts

### Research History
- Research sessions now persist across page refreshes
- Your research history is saved locally

### Favicon
- ChPio now has a proper favicon (teal "C" on dark background)

---

## Improvements You'll Notice

### Chat
- Streaming responses no longer disappear if you navigate away mid-generation
- Better error messages for WebGPU and GPU memory issues
- Clickable options in AI responses (when Chpio mode detects decision points)
- Active note indicator in top bar with "Sent!" feedback

### Settings
- Provider settings no longer reset your in-progress edits when something changes
- Custom provider now works properly with test, sync, and activate buttons
- "More" menu in bottom dock to avoid button pile-up

### Performance
- Faster initial load — heavy export libraries (docx, file-saver) load only when needed
- Custom model list no longer re-reads from storage on every render
- PDF/DOCX parsing happens on-demand, not at startup

### Reliability
- App shows a recovery screen instead of blank white on crashes
- Email real-time connection no longer leaks memory on reconnect
- Model context length detection is more accurate

---

## Coming Soon
- Calendar with CalDAV sync
- Global chat search across all sessions
- Virtualized message lists for better performance with long conversations
- Consolidated icon library for smaller bundle size
- More image generation providers (Stability AI, Replicate)
- Image generation settings (default size, quality, style)
