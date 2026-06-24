import type { Model, ProviderConfig } from '../types';

export function getActiveModels(providers: ProviderConfig[]): Model[] {
  return providers
    .filter((p) => p.enabled && p.syncedModels.length > 0)
    .flatMap((p) =>
      p.syncedModels.map((m) => ({
        ...m,
        providerId: p.id,
        id: `${p.id}/${m.id}`,
      }))
    );
}

export function getModelProvider(modelId: string): string {
  const parts = modelId.split('/');
  return parts[0] || '';
}

export function stripProviderPrefix(modelId: string): string {
  const idx = modelId.indexOf('/');
  return idx >= 0 ? modelId.slice(idx + 1) : modelId;
}

const THINKING_PATTERNS = [
  /o1/i,
  /o3/i,
  /deepseek.*r1/i,
  /deepseek.*reason/i,
  /qwq/i,
  /thinking/i,
  /reason/i,
];

export function supportsThinking(modelId: string, providerId?: string): boolean {
  if (providerId === 'ollama') return true;
  if (providerId === 'google') return true;
  if (providerId === 'webllm') return true;

  const modelPart = stripProviderPrefix(modelId).toLowerCase();
  return THINKING_PATTERNS.some((pattern) => pattern.test(modelPart));
}
