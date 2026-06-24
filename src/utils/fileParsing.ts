let liteParseInit: ((opts?: any) => Promise<any>) | null = null;
let LiteParseClass: any = null;

async function getLiteParse() {
  if (!liteParseInit) {
    const wasm = await import('@llamaindex/liteparse-wasm');
    liteParseInit = wasm.default;
    LiteParseClass = wasm.LiteParse;
  }
  // Point to WASM file in public folder
  await liteParseInit({
    module_or_path: '/liteparse_wasm_bg.wasm',
  });
  return new LiteParseClass({ outputFormat: 'markdown', ocrEnabled: false });
}

export async function parsePdf(file: File): Promise<string> {
  try {
    const parser = await getLiteParse();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await parser.parse(bytes);
    return result.text || '';
  } catch (e) {
    console.error('PDF parse error:', e);
    throw new Error(`Failed to parse PDF: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export async function parseDocx(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || '';
  } catch (e) {
    console.error('DOCX parse error:', e);
    throw new Error(`Failed to parse DOCX: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

export function isPdfFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf');
}

export function isDocxFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.docx');
}

export interface ParsedFile {
  name: string;
  text: string;
  base64?: string;
  mimeType?: string;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name;

  if (isImageFile(name)) {
    const base64 = await fileToBase64(file);
    return {
      name,
      text: `[Image: ${name}]`,
      base64,
      mimeType: file.type || 'image/png',
    };
  }

  if (isPdfFile(name)) {
    const text = await parsePdf(file);
    return { name, text };
  }

  if (isDocxFile(name)) {
    const text = await parseDocx(file);
    return { name, text };
  }

  const text = await file.text();
  return { name, text };
}
