import type { Memory, MemoryType } from '../types';
import { relativeTime } from './relativeTime';

const MAX_MEMORIES = 20;

const TYPE_LABELS: Record<MemoryType, string> = {
  preference: 'PREFERENCES',
  project: 'PROJECTS',
  goal: 'GOALS',
  pattern: 'PATTERNS',
  context: 'CONTEXT',
};

export function detectPatterns(memories: Memory[]): string[] {
  const patterns: string[] = [];
  
  // Count tag co-occurrences
  const tagCounts: Record<string, number> = {};
  for (const memory of memories) {
    for (const tag of memory.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  
  // Find frequently discussed topics (tags appearing 3+ times)
  const frequentTopics = Object.entries(tagCounts)
    .filter(([tag, count]) => count >= 3 && tag !== 'from-chat')
    .map(([tag]) => tag);
  
  if (frequentTopics.length > 0) {
    patterns.push(`Frequently discussed topics: ${frequentTopics.join(', ')}`);
  }
  
  // Count memories by type
  const typeCounts: Record<MemoryType, number> = {
    preference: 0,
    project: 0,
    goal: 0,
    pattern: 0,
    context: 0,
  };
  
  for (const memory of memories) {
    const type = memory.type || 'context';
    typeCounts[type]++;
  }
  
  // Detect if user has multiple active projects
  if (typeCounts.project >= 2) {
    patterns.push('Working on multiple projects simultaneously');
  }
  
  // Detect if user has stated goals
  if (typeCounts.goal > 0) {
    patterns.push('Has stated goals they are working towards');
  }
  
  // Detect preference patterns
  if (typeCounts.preference >= 3) {
    patterns.push('Has strong preferences about tools and workflow');
  }
  
  // Detect recent activity (memories from last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentMemories = memories.filter(m => m.updatedAt > oneDayAgo);
  if (recentMemories.length >= 3) {
    patterns.push('High recent activity - actively working on something');
  }
  
  return patterns;
}

export function buildMemoryContextSystemMessage(memories: Memory[]): string | null {
  if (memories.length === 0) return null;

  const recent = [...memories]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_MEMORIES);

  // Group by type
  const grouped: Record<MemoryType, Memory[]> = {
    preference: [],
    project: [],
    goal: [],
    pattern: [],
    context: [],
  };

  for (const memory of recent) {
    const type = memory.type || 'context';
    grouped[type].push(memory);
  }

  // Build grouped output
  const sections: string[] = [];
  for (const [type, label] of Object.entries(TYPE_LABELS)) {
    const typeMemories = grouped[type as MemoryType];
    if (typeMemories.length === 0) continue;
    
    const lines = typeMemories.map((m) => {
      const tags = m.tags.length > 0 ? `[${m.tags.join(', ')}] ` : '';
      return `- ${tags}${m.content} (${relativeTime(m.updatedAt)})`;
    }).join('\n');
    
    sections.push(`${label}:\n${lines}`);
  }

  // Add pattern detection
  const patterns = detectPatterns(memories);
  if (patterns.length > 0) {
    sections.push(`DETECTED PATTERNS:\n${patterns.map(p => `- ${p}`).join('\n')}`);
  }

  const memoryBlock = sections.join('\n\n');

  return `You have access to the following user memories. Use this context to personalize your responses and reference previous conversations naturally.

<memories>
${memoryBlock}
</memories>

Reference memories naturally when relevant. Do not list them unless the user asks.

When you notice patterns from the memories above, you may offer proactive suggestions - but only when genuinely useful. One suggestion per conversation max.`;
}

export interface MemoryExtraction {
  content: string;
  type: MemoryType;
}

export async function summarizeForMemory(
  content: string,
  streamFn: (messages: { role: 'system' | 'user'; content: string }[]) => AsyncGenerator<{ type: string; text: string }>,
): Promise<MemoryExtraction | null> {
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

After the memory text, on a new line, output the memory type in brackets: [TYPE]
Valid types: [preference] [project] [goal] [pattern] [context]

What IS worth remembering:
- User preferences with specifics (not just "likes dark mode" — include what kind, what tools) -> [preference]
- Facts about their projects (names, tech stack, goals, current progress) -> [project]
- Goals they stated or are working towards -> [goal]
- Behavioral patterns or recurring themes -> [pattern]
- General context about their work or life -> [context]

What is NOT worth remembering:
- Generic questions ("how do I...", "what is...")
- Simple requests with no personal context
- Greetings, small talk, one-off tasks
- Answers to questions (unless they reveal preferences)

Examples of good memories:
- "Prefers dark mode UI with glassmorphism effects. Working on ChPio, a self-hosted AI workspace built with React 19, Zustand, Tailwind CSS. Targets Tauri for desktop builds, cares about bundle size. [preference]"
- "Uses OpenRouter as primary AI provider with Gemini and DeepSeek models. Prefers lightweight components over heavy libraries. Planning to add PDF/DOCX viewer features. [preference]"
- "Building a finance dashboard with Next.js and Chart.js. Prefers server components over client-side fetching. Uses Prisma with PostgreSQL. [project]"

Examples of bad memories (too vague):
- "Prefers dark mode" — missing what, how, which project
- "Likes React" — no specifics, not useful for future reference
- "Asked about coding" — narration, not knowledge`,
    },
    {
      role: 'user' as const,
      content: `Is there anything worth remembering from this? If yes, write it as a short factual statement followed by the type in brackets. If no, output NOTHING_NOTABLE.\n\n${content.slice(0, 1500)}`,
    },
  ];

  const timeoutMs = 15000;
  let summary = '';

  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('Memory extraction timed out'));
    }, timeoutMs);
  });

  const streamPromise = (async () => {
    for await (const chunk of streamFn(messages)) {
      if (chunk.type === 'content') {
        summary += chunk.text;
      }
    }
  })();

  await Promise.race([streamPromise, timeoutPromise]);

  const result = summary.trim().replace(/^["']|["']$/g, '');

  if (!result || result.includes('NOTHING_NOTABLE')) {
    return null;
  }

  // Parse type from result
  const typeMatch = result.match(/\[(preference|project|goal|pattern|context)\]\s*$/i);
  const type: MemoryType = typeMatch ? typeMatch[1].toLowerCase() as MemoryType : 'context';
  const content_text = typeMatch ? result.replace(typeMatch[0], '').trim() : result;

  return { content: content_text, type };
}
