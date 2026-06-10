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

export async function testConnection(
  baseUrl: string,
  apiKey?: string,
  providerId?: string,
): Promise<{ ok: boolean; error?: string }> {
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

  return data.data.map((m) => ({
    id: m.id,
    name: m.id,
    contextLength: 4096,
    providerId: providerId,
  }));
}

export async function* streamChat(
  baseUrl: string,
  apiKey: string | undefined,
  modelId: string,
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  providerId?: string,
): AsyncGenerator<string> {
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
    });
  } else if (isGoogle) {
    url = `${baseUrl}/models/${modelId}:streamGenerateContent?alt=sse`;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    body = JSON.stringify({ contents });
  } else {
    url = `${baseUrl}/chat/completions`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'ChPio';
    body = JSON.stringify({ model: modelId, messages, stream: true });
  }

  const res = await fetch(url, { method: 'POST', headers, body });

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
          const content = parsed.message?.content;
          if (content) yield content;
          if (parsed.done) return;
        } catch {
          // skip
        }
      } else if (isGoogle) {
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) yield content;
        } catch {
          // skip
        }
      } else {
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip
        }
      }
    }
  }
}
