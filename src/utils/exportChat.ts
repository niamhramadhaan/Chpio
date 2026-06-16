import type { ChatSession } from '../types';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

function safeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
    || 'chat';
}

export function exportChatAsMd(session: ChatSession): string {
  const lines: string[] = [];

  lines.push(`# ${session.title}`);
  lines.push('');
  lines.push(`- **Messages:** ${session.messages.length}`);
  lines.push(`- **Model:** ${session.modelId}`);
  lines.push(`- **Created:** ${formatDate(session.createdAt)}`);
  lines.push(`- **Updated:** ${formatDate(session.updatedAt)}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const msg of session.messages) {
    const label = msg.role === 'user' ? '## You' : '## ChPio';
    lines.push(label);
    lines.push(`*${formatDate(msg.timestamp)}*`);
    lines.push('');

    if (msg.thinking) {
      lines.push('> **Thinking**');
      lines.push('>');
      for (const tl of msg.thinking.split('\n')) {
        lines.push(`> ${tl}`);
      }
      lines.push('');
    }

    lines.push(msg.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function exportChatAsTxt(session: ChatSession): string {
  const lines: string[] = [];

  lines.push(session.title);
  lines.push(`${session.messages.length} messages | Model: ${session.modelId}`);
  lines.push(`Created: ${formatDate(session.createdAt)}`);
  lines.push('='.repeat(50));
  lines.push('');

  for (const msg of session.messages) {
    const label = msg.role === 'user' ? 'You' : 'ChPio';
    lines.push(`[${label}] ${formatDate(msg.timestamp)}`);

    if (msg.thinking) {
      lines.push(`  (Thinking: ${msg.thinking.slice(0, 200)}${msg.thinking.length > 200 ? '...' : ''})`);
    }

    lines.push(msg.content);
    lines.push('');
    lines.push('-'.repeat(40));
    lines.push('');
  }

  return lines.join('\n');
}

export function copyChatToClipboard(session: ChatSession): string {
  const lines: string[] = [];

  for (const msg of session.messages) {
    const label = msg.role === 'user' ? 'You' : 'ChPio';
    lines.push(`${label}:`);
    lines.push(msg.content);
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getExportFilename(session: ChatSession, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${safeFilename(session.title)}-${date}.${ext}`;
}
