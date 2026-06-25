export interface ImageGenResult {
  imageData: string;
  mimeType: string;
}

export interface ImageGenSettings {
  size: string;
  quality: string;
}

export interface ImageGenProvider {
  name: string;
  models: string[];
  baseUrl: string;
  isCustom?: boolean;
}

export const IMAGE_GEN_PROVIDERS: Record<string, ImageGenProvider> = {
  pollinations: {
    name: 'Pollinations AI',
    models: ['flux', 'zimage', 'flux-realism', 'flux-anime', 'flux-3d', 'gptimage', 'seedream'],
    baseUrl: 'https://gen.pollinations.ai',
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-image-1', 'dall-e-3', 'dall-e-2'],
    baseUrl: 'https://api.openai.com/v1',
  },
  together: {
    name: 'Together AI',
    models: [
      'black-forest-labs/FLUX.1-schnell-Free',
      'black-forest-labs/FLUX.1-dev',
      'stabilityai/stable-diffusion-xl-base-1.0',
    ],
    baseUrl: 'https://api.together.xyz/v1',
  },
  custom: {
    name: 'Custom',
    models: ['custom-model'],
    baseUrl: '',
    isCustom: true,
  },
};

export const COMMON_IMAGE_MODELS = [
  'gpt-image-1',
  'dall-e-3',
  'dall-e-2',
  'black-forest-labs/FLUX.1-schnell-Free',
  'black-forest-labs/FLUX.1-dev',
  'stabilityai/stable-diffusion-xl-base-1.0',
  'stable-diffusion-v1-5',
  'stable-diffusion-2-1',
];

export function getImageGenProviders() {
  return IMAGE_GEN_PROVIDERS;
}

export async function generateImage(
  prompt: string,
  provider: string,
  apiKey: string,
  model: string,
  settings: ImageGenSettings,
  customBaseUrl?: string,
  onProgress?: (msg: string) => void,
): Promise<ImageGenResult> {
  if (provider === 'pollinations') {
    return generatePollinations(prompt, model, settings, apiKey, onProgress);
  }
  if (provider === 'openai') {
    return generateOpenAI(prompt, apiKey, model, settings, onProgress);
  }
  if (provider === 'together') {
    return generateTogether(prompt, apiKey, model, settings, onProgress);
  }
  if (provider === 'custom') {
    return generateCustom(prompt, apiKey, model, settings, customBaseUrl || '', onProgress);
  }
  throw new Error(`Unsupported image generation provider: ${provider}`);
}

async function generatePollinations(
  prompt: string,
  model: string,
  settings: ImageGenSettings,
  apiKey: string,
  onProgress?: (msg: string) => void,
): Promise<ImageGenResult> {
  onProgress?.('Calling Pollinations AI...');

  const [w, h] = (settings.size || '1024x1024').split('x').map(Number);
  const seed = Math.floor(Math.random() * 2147483647);
  const modelParam = model || 'flux';
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${w || 1024}&height=${h || 1024}&model=${modelParam}&seed=${seed}&nologo=true`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pollinations error: ${res.status} ${err}`);
  }

  const blob = await res.blob();
  const base64 = await blobToBase64(blob);
  return { imageData: base64, mimeType: blob.type || 'image/jpeg' };
}

async function generateOpenAI(
  prompt: string,
  apiKey: string,
  model: string,
  settings: ImageGenSettings,
  onProgress?: (msg: string) => void,
): Promise<ImageGenResult> {
  onProgress?.('Calling OpenAI...');

  const isDalle2 = model === 'dall-e-2';
  const body: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    size: settings.size || '1024x1024',
  };

  if (!isDalle2) {
    body.quality = settings.quality || 'standard';
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const image = data.data?.[0];
  if (!image) throw new Error('No image returned from OpenAI');

  if (image.b64_json) return { imageData: image.b64_json, mimeType: 'image/png' };
  if (image.url) return await fetchImageAsBase64(image.url);

  throw new Error('Unexpected OpenAI response format');
}

async function generateTogether(
  prompt: string,
  apiKey: string,
  model: string,
  settings: ImageGenSettings,
  onProgress?: (msg: string) => void,
): Promise<ImageGenResult> {
  onProgress?.('Calling Together AI...');

  const [w, h] = (settings.size || '1024x1024').split('x').map(Number);

  const res = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'black-forest-labs/FLUX.1-schnell-Free',
      prompt,
      width: w || 1024,
      height: h || 1024,
      n: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Together AI error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const image = data.data?.[0];
  if (!image) throw new Error('No image returned from Together AI');

  if (image.b64_json) return { imageData: image.b64_json, mimeType: 'image/png' };
  if (image.url) return await fetchImageAsBase64(image.url);

  throw new Error('Unexpected Together AI response format');
}

async function generateCustom(
  prompt: string,
  apiKey: string,
  model: string,
  settings: ImageGenSettings,
  baseUrl: string,
  onProgress?: (msg: string) => void,
): Promise<ImageGenResult> {
  if (!baseUrl) throw new Error('Custom provider requires a Base URL');

  onProgress?.('Calling custom endpoint...');

  const url = baseUrl.replace(/\/$/, '') + '/images/generations';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: model || 'custom-model',
      prompt,
      n: 1,
      size: settings.size || '1024x1024',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Custom endpoint error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const image = data.data?.[0];
  if (!image) throw new Error('No image returned from custom endpoint');

  if (image.b64_json) return { imageData: image.b64_json, mimeType: 'image/png' };
  if (image.url) return await fetchImageAsBase64(image.url);

  throw new Error('Unexpected custom endpoint response format');
}

async function fetchImageAsBase64(url: string): Promise<ImageGenResult> {
  const res = await fetch(url);
  const blob = await res.blob();
  const base64 = await blobToBase64(blob);
  return { imageData: base64, mimeType: blob.type || 'image/png' };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}
