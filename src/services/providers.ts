import type { Model } from '../types';

interface OllamaTag {
  name: string;
  size: number;
  modified_at: string;
}

interface OllamaTagsResponse {
  models: OllamaTag[];
}

interface OpenAIModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

interface OpenAIModelsResponse {
  data: OpenAIModel[];
}

const NON_CHAT_PATTERNS = [
  /^text-embedding/i,
  /^embedding-/i,
  /^dall-e/i,
  /^gpt-image/i,
  /^whisper/i,
  /^tts/i,
  /^moderation/i,
  /^babbage/i,
  /^davinci/i,
  /^chatgpt-4o-audio/i,
  /^omni-moderation/i,
  /^codex/i,
  /^audio-/i,
  /^transcribe/i,
  /^gpt-4o-search/i,
  /^gpt-4o-mini-search/i,
  /-instruct$/i,
  /^ft:/i,
];

function isChatModel(id: string): boolean {
  if (NON_CHAT_PATTERNS.some((p) => p.test(id))) return false;
  return true;
}

function guessContextLength(id: string): number {
  const lower = id.toLowerCase();
  if (lower.includes('gpt-4o') || lower.includes('gpt-4.1') || lower.includes('o3') || lower.includes('o4')) return 128000;
  if (lower.includes('gpt-4-turbo') || lower.includes('gpt-4-1106')) return 128000;
  if (lower.includes('gpt-4-32k')) return 32768;
  if (lower.includes('gpt-4')) return 8192;
  if (lower.includes('gpt-3.5-turbo-16k')) return 16384;
  if (lower.includes('gpt-3.5')) return 4096;
  if (lower.includes('o1')) return 128000;
  if (lower.includes('deepseek')) return 64000;
  if (lower.includes('llama')) return 8192;
  if (lower.includes('mistral') || lower.includes('mixtral')) return 32768;
  if (lower.includes('qwen')) return 32768;
  if (lower.includes('gemini')) return 1048576;
  if (lower.includes('claude')) return 200000;
  return 4096;
}

export async function testConnection(
  baseUrl: string,
  apiKey?: string,
  providerId?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (providerId === 'webllm') {
    const { isWebGPUAvailable } = await import('./webllm');
    return isWebGPUAvailable()
      ? { ok: true }
      : { ok: false, error: 'WebGPU not available. Use Chrome or Edge 113+.' };
  }

  try {
    const isOllama = providerId === 'ollama' || baseUrl.includes('11434');
    const isGoogle = providerId === 'google';
    const headers: Record<string, string> = {};
    if (apiKey) {
      if (isGoogle) {
        headers['x-goog-api-key'] = apiKey;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    const endpoint = isOllama ? '/api/tags' : '/models';
    const res = await fetch(`${baseUrl}${endpoint}`, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Connection failed' };
  }
}

export async function fetchProviderModels(
  baseUrl: string,
  apiKey?: string,
  providerId?: string,
): Promise<Model[]> {
  if (providerId === 'webllm') {
    const { getAvailableModels } = await import('./webllm');
    return getAvailableModels();
  }

  const isOllama = providerId === 'ollama' || baseUrl.includes('11434');
  const isGoogle = providerId === 'google';
  const headers: Record<string, string> = {};
  if (apiKey) {
    if (isGoogle) {
      headers['x-goog-api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  if (isOllama) {
    const res = await fetch(`${baseUrl}/api/tags`, { headers });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data: OllamaTagsResponse = await res.json();
    return data.models.map((m) => ({
      id: m.name.replace(/:latest$/, ''),
      name: m.name.replace(/:latest$/, ''),
      contextLength: 4096,
      providerId: 'ollama',
    }));
  }

  if (isGoogle) {
    const res = await fetch(`${baseUrl}/models`, { headers });
    if (!res.ok) throw new Error(`Google error: ${res.status}`);
    const data = await res.json();
    return (data.models || [])
      .filter((m: { supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes('generateContent')
      )
      .map((m: { name: string; displayName?: string; description?: string }) => ({
        id: m.name.replace('models/', ''),
        name: m.displayName || m.name.replace('models/', ''),
        contextLength: 4096,
        providerId: 'google',
      }));
  }

  const res = await fetch(`${baseUrl}/models`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  const data: OpenAIModelsResponse = await res.json();

  return data.data
    .filter((m) => isChatModel(m.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => ({
      id: m.id,
      name: m.id,
      contextLength: guessContextLength(m.id),
      providerId: providerId,
    }));
}

export type StreamChunk = { type: 'content' | 'thinking'; text: string };

export async function* streamChat(
  baseUrl: string,
  apiKey: string | undefined,
  modelId: string,
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  providerId?: string,
  signal?: AbortSignal,
  thinking?: boolean,
): AsyncGenerator<StreamChunk> {
  if (providerId === 'webllm') {
    const { streamLocalChat } = await import('./webllm');
    yield* streamLocalChat(modelId, messages, signal);
    return;
  }

  const isOllama = providerId === 'ollama' || baseUrl.includes('11434');
  const isGoogle = providerId === 'google';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    if (isGoogle) {
      headers['x-goog-api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  let url: string;
  let body: string;

  if (isOllama) {
    url = `${baseUrl}/api/chat`;
    body = JSON.stringify({
      model: modelId,
      messages,
      stream: true,
      ...(thinking ? { think: true } : {}),
    });
  } else if (isGoogle) {
    url = `${baseUrl}/models/${modelId}:streamGenerateContent?alt=sse`;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    body = JSON.stringify({
      contents,
      ...(thinking ? { generationConfig: { thinkingConfig: { includeThoughts: true } } } : {}),
    });
  } else {
    url = `${baseUrl}/chat/completions`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'ChPio';
    body = JSON.stringify({ model: modelId, messages, stream: true });
  }

  const res = await fetch(url, { method: 'POST', headers, body, signal });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Provider error: ${res.status} ${error}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (isOllama) {
        try {
          const parsed = JSON.parse(trimmed);
          const thinking = parsed.message?.thinking;
          const content = parsed.message?.content;
          if (thinking) yield { type: 'thinking', text: thinking };
          if (content) yield { type: 'content', text: content };
          if (parsed.done) return;
        } catch {
          // skip
        }
      } else if (isGoogle) {
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const parts = parsed.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.thought && part.text) yield { type: 'thinking', text: part.text };
              else if (part.text) yield { type: 'content', text: part.text };
            }
          }
        } catch {
          // skip
        }
      } else {
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (delta) {
            const reasoning = delta.reasoning_content ?? delta.reasoning;
            const content = delta.content;
            if (reasoning) yield { type: 'thinking', text: reasoning };
            if (content) yield { type: 'content', text: content };
          }
        } catch {
          // skip
        }
      }
    }
  }
}
