import type { Model } from '../types';
import type { WebWorkerMLCEngine, MLCEngineInterface } from '@mlc-ai/web-llm';

export type StreamChunk = { type: 'content' | 'thinking'; text: string };

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

let engine: WebWorkerMLCEngine | null = null;
let currentModelId: string | null = null;

async function getEngine(
  modelId: string,
  onProgress?: (progress: number, text: string) => void,
): Promise<MLCEngineInterface> {
  if (engine && currentModelId === modelId) return engine;

  const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm');

  if (engine) {
    engine.setInitProgressCallback?.((report: { progress: number; text: string }) => {
      onProgress?.(report.progress, report.text);
    });
    try {
      await engine.reload(modelId);
    } catch (e) {
      engine = null;
      currentModelId = null;
      throw mapWebLLMError(e);
    }
    currentModelId = modelId;
    return engine;
  }

  const worker = new Worker(
    new URL('../workers/webllm.worker.ts', import.meta.url),
    { type: 'module' },
  );

  try {
    engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: (report: { progress: number; text: string }) => {
        onProgress?.(report.progress, report.text);
      },
    });
  } catch (e) {
    engine = null;
    currentModelId = null;
    throw mapWebLLMError(e);
  }
  currentModelId = modelId;
  return engine;
}

function mapWebLLMError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('WebGPU') || msg.includes('not supported') || msg.includes('GPUDevice'))
    return new Error('WebGPU not available. Use Chrome or Edge 113+.');
  if (msg.includes('device lost') || msg.includes('out of memory') || msg.includes('OOM'))
    return new Error('GPU ran out of memory. Try a smaller model.');
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Failed to download model. Check your connection and try again.');
  return new Error(`Local model error: ${msg}`);
}

export async function* streamLocalChat(
  modelId: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
  const eng = await getEngine(modelId);

  const abortHandler = () => {
    try {
      eng.interruptGenerate();
    } catch {
      /* ignore */
    }
  };
  signal?.addEventListener('abort', abortHandler);

  try {
    const chunks = await eng.chat.completions.create({
      messages: messages as { role: 'user' | 'assistant' | 'system'; content: string }[],
      stream: true,
    });

    for await (const chunk of chunks) {
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield { type: 'content', text: content };
      }
    }
  } finally {
    signal?.removeEventListener('abort', abortHandler);
  }
}

interface ModelRecord {
  model: string;
  model_id: string;
  model_lib: string;
  vram_required_MB?: number;
  low_resource_required?: boolean;
  overrides?: { context_window_size?: number };
}

function parseParamSize(modelId: string): string {
  const match = modelId.match(/(\d+\.?\d*)[BbMm]/);
  return match ? match[0] : '';
}

function parseQuant(modelId: string): string {
  const match = modelId.match(/q\d+f\d+(?:_\d+)?/);
  return match ? match[0] : '';
}

function toModel(record: ModelRecord): Model {
  const id = record.model_id;
  const baseName = id.replace(/-MLC$/, '').replace(/-q\d+f\d+(?:_\d+)?/, '').replace(/-\d+k$/, '').replace(/-/g, ' ');
  const quant = parseQuant(id);
  const params = parseParamSize(id);
  const vram = record.vram_required_MB ? `~${Math.round(record.vram_required_MB)} MB` : '';
  const parts = [params && `${params}`, quant, vram].filter(Boolean);
  const description = parts.join(' · ');

  return {
    id,
    name: baseName,
    contextLength: record.overrides?.context_window_size || 4096,
    description,
    providerId: 'webllm',
  };
}

export async function getAvailableModels(): Promise<Model[]> {
  const { prebuiltAppConfig } = await import('@mlc-ai/web-llm');
  const models = (prebuiltAppConfig.model_list as ModelRecord[]).map(toModel);

  const customModels = getCustomModels();
  return [...customModels, ...models];
}

export async function getAllModels(): Promise<Model[]> {
  return getAvailableModels();
}

export async function unloadEngine(): Promise<void> {
  if (engine) {
    try {
      await engine.unload();
    } catch {
      /* ignore */
    }
    engine = null;
    currentModelId = null;
  }
}

const CUSTOM_MODELS_KEY = 'chpio-webllm-custom-models';

export interface CustomWebLLMModel {
  modelId: string;
  modelUrl: string;
  modelLibUrl: string;
  vramMb?: number;
  contextLength?: number;
}

export function getCustomModels(): Model[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MODELS_KEY);
    if (!raw) return [];
    const customs: CustomWebLLMModel[] = JSON.parse(raw);
    return customs.map((c) => ({
      id: c.modelId,
      name: c.modelId.replace(/-/g, ' '),
      contextLength: c.contextLength || 4096,
      description: c.vramMb ? `~${c.vramMb} MB · custom` : 'custom',
      providerId: 'webllm',
    }));
  } catch {
    return [];
  }
}

export function addCustomModel(model: CustomWebLLMModel): void {
  const existing = getCustomModelsRaw();
  const updated = [...existing.filter((m) => m.modelId !== model.modelId), model];
  localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(updated));
}

export function removeCustomModel(modelId: string): void {
  const existing = getCustomModelsRaw();
  const updated = existing.filter((m) => m.modelId !== modelId);
  localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(updated));
}

function getCustomModelsRaw(): CustomWebLLMModel[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MODELS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
