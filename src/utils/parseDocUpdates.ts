import { useDocsStore } from '../store/docsStore';

export interface DocUpdate {
  id: string;
  content: string;
}

export interface ParsedDocUpdate {
  id: string;
  title: string;
  success: boolean;
}

const DOC_UPDATE_REGEX = /```doc-update[ \t]*\r?\nid:[ \t]*([^\r\n]+)[ \t]*\r?\n---[ \t]*\r?\n([\s\S]*?)\r?\n```END-DOC-UPDATE/g;

export function parseDocUpdates(text: string): DocUpdate[] {
  const updates: DocUpdate[] = [];
  let match: RegExpExecArray | null;

  DOC_UPDATE_REGEX.lastIndex = 0;
  while ((match = DOC_UPDATE_REGEX.exec(text)) !== null) {
    const id = match[1].trim();
    const content = match[2].trim();
    if (id && content) {
      updates.push({ id, content });
    }
  }

  if (updates.length === 0) {
    const altRegex = /```doc-update[\s\S]*?id:[ \t]*([^\r\n]+)[\s\S]*?---[\s\S]*?([\s\S]*?)```END-DOC-UPDATE/g;
    altRegex.lastIndex = 0;
    while ((match = altRegex.exec(text)) !== null) {
      const id = match[1].trim();
      const content = match[2].trim();
      if (id && content && !updates.some((u) => u.id === id && u.content === content)) {
        updates.push({ id, content });
      }
    }
  }

  return updates;
}

export function executeDocUpdates(updates: DocUpdate[]): ParsedDocUpdate[] {
  const docsStore = useDocsStore.getState();
  const results: ParsedDocUpdate[] = [];

  for (const update of updates) {
    const doc = docsStore.docs.find((d) => d.id === update.id);
    if (doc) {
      docsStore.updateDoc(update.id, { content: update.content });
      results.push({ id: update.id, title: doc.title, success: true });
    } else {
      results.push({ id: update.id, title: 'Unknown', success: false });
    }
  }

  return results;
}

export function stripDocUpdates(text: string): string {
  return text
    .replace(/```doc-update[ \t]*\r?\nid:[ \t]*[^\r\n]+[ \t]*\r?\n---[ \t]*\r?\n[\s\S]*?\r?\n```END-DOC-UPDATE/g, '')
    .replace(/```doc-update[\s\S]*?id:[ \t]*[^\r\n]+[\s\S]*?---[\s\S]*?```END-DOC-UPDATE/g, '')
    .trim();
}

export function formatDocUpdateSummary(results: ParsedDocUpdate[]): string {
  if (results.length === 0) return '';
  const successful = results.filter((r) => r.success);
  if (successful.length === 0) return '';
  const names = successful.map((r) => r.title).join(', ');
  return `Updated: ${names}`;
}
