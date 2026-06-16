import type { Doc } from '../types';

export function buildDocContextSystemMessage(docs: Doc[]): string | null {
  if (docs.length === 0) return null;

  const docBlocks = docs.map((doc) => {
    const truncated = doc.content.length > 8000
      ? doc.content.slice(0, 8000) + '\n\n[... truncated — ask to read specific sections if needed]'
      : doc.content;
    return `<doc id="${doc.id}" title="${escapeXml(doc.title)}">\n${truncated}\n</doc>`;
  }).join('\n\n');

  return `You have access to the following user documents. You can read them, reference them in your responses, summarize them, and edit them.

<docs>
${docBlocks}
</docs>

To edit a document, output a block in this exact format on its own lines:

\`\`\`doc-update
id: ${docs[0].id}
---
[the ENTIRE new content of the document, replacing all existing content]
\`\`\`

Rules:
- Only include doc-update blocks when you need to modify a document.
- Always include the FULL document content in the update, not just the changed parts.
- You can include multiple doc-update blocks for multiple documents.
- The id must match one of the document IDs provided above.
- Put your regular response text BEFORE the doc-update blocks.
- After the doc-update blocks, you can add a brief summary of what you changed.`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
