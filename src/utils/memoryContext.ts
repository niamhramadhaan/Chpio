import type { Memory } from '../types';

const MAX_MEMORIES = 20;

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function buildMemoryContextSystemMessage(memories: Memory[]): string | null {
  if (memories.length === 0) return null;

  const recent = memories
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_MEMORIES);

  const memoryLines = recent.map((m) => {
    const tags = m.tags.length > 0 ? `[${m.tags.join(', ')}] ` : '';
    return `- ${tags}${m.content} (${relativeTime(m.updatedAt)})`;
  }).join('\n');

  return `You have access to the following user memories. Use this context to personalize your responses and reference previous conversations naturally.

<memories>
${memoryLines}
</memories>

Reference memories naturally when relevant. Do not list them unless the user asks.`;
}

export async function summarizeForMemory(
  content: string,
  streamFn: (messages: { role: 'system' | 'user'; content: string }[]) => AsyncGenerator<{ type: string; text: string }>,
): Promise<string | null> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are a memory extraction system. Extract factual knowledge worth remembering.

Rules:
- Write 1-3 concise sentences capturing ALL relevant facts, preferences, and context
- Include specific details: tool names, project names, tech stack, concrete preferences
- Write as bare facts: "Prefers dark mode UI, uses Tailwind CSS, working on ChPio (React + Zustand)"
- NOT "The user prefers dark mode" (too vague, missing context)
- Do NOT start with "Based on", "The user", "According to", or any preamble
- Do NOT describe what happened — only extract reusable knowledge
- If nothing in the message is worth remembering long-term, output exactly: NOTHING_NOTABLE
- Output ONLY the memory text or NOTHING_NOTABLE, nothing else

What IS worth remembering:
- User preferences with specifics (not just "likes dark mode" — include what kind, what tools)
- Facts about their projects (names, tech stack, goals, current progress)
- Decisions they made and why, constraints they mentioned
- Personal context relevant to future conversations
- Tools, libraries, frameworks they use or prefer

What is NOT worth remembering:
- Generic questions ("how do I...", "what is...")
- Simple requests with no personal context
- Greetings, small talk, one-off tasks
- Answers to questions (unless they reveal preferences)

Examples of good memories:
- "Prefers dark mode UI with glassmorphism effects. Working on ChPio, a self-hosted AI workspace built with React 19, Zustand, Tailwind CSS. Targets Tauri for desktop builds, cares about bundle size."
- "Uses OpenRouter as primary AI provider with Gemini and DeepSeek models. Prefers lightweight components over heavy libraries. Planning to add PDF/DOCX viewer features."
- "Building a finance dashboard with Next.js and Chart.js. Prefers server components over client-side fetching. Uses Prisma with PostgreSQL."

Examples of bad memories (too vague):
- "Prefers dark mode" — missing what, how, which project
- "Likes React" — no specifics, not useful for future reference
- "Asked about coding" — narration, not knowledge`,
    },
    {
      role: 'user' as const,
      content: `Is there anything worth remembering from this? If yes, write it as a short factual statement. If no, output NOTHING_NOTABLE.\n\n${content.slice(0, 1500)}`,
    },
  ];

  let summary = '';
  for await (const chunk of streamFn(messages)) {
    if (chunk.type === 'content') {
      summary += chunk.text;
    }
  }

  const result = summary.trim().replace(/^["']|["']$/g, '');

  if (!result || result.includes('NOTHING_NOTABLE')) {
    return null;
  }

  return result;
}
