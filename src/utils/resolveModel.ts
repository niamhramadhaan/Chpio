import type { Model, ProviderConfig } from '../types';

export interface ResolvedProvider {
  model: Model | undefined;
  provider: ProviderConfig | undefined;
  baseUrl: string;
  apiKey: string | undefined;
  providerId: string | undefined;
}

export function resolveModelProvider(
  modelId: string,
  models: Model[],
  providers: ProviderConfig[],
): ResolvedProvider {
  const model = models.find((m) => m.id === modelId);
  const provider = providers.find((p) => p.id === model?.providerId);
  return {
    model,
    provider,
    baseUrl: provider?.baseUrl || 'https://openrouter.ai/api/v1',
    apiKey: provider?.apiKey || undefined,
    providerId: model?.providerId,
  };
}
