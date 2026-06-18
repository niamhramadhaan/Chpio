export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

export interface TavilyResponse {
  query: string;
  answer?: string;
  results: TavilyResult[];
  response_time: number;
}

export async function tavilySearch(
  apiKey: string,
  query: string,
  options?: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeRawContent?: boolean;
  },
): Promise<TavilyResponse> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: options?.searchDepth ?? 'advanced',
      max_results: options?.maxResults ?? 5,
      include_raw_content: options?.includeRawContent ?? true,
      include_answer: false,
    }),
  });

  if (res.status === 401) throw new Error('Invalid Tavily API key');
  if (res.status === 429) throw new Error('Tavily rate limit exceeded — try again later');
  if (res.status === 432 || res.status === 433) throw new Error('Tavily plan limit exceeded');
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);

  return res.json();
}

export async function testTavilyConnection(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: 'test', max_results: 1 }),
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401) return { ok: false, error: 'Invalid API key' };
    if (res.status === 429) return { ok: false, error: 'Rate limit exceeded' };
    if (res.status === 432 || res.status === 433) return { ok: false, error: 'Plan limit exceeded' };
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Connection failed' };
  }
}
