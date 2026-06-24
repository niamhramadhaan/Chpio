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

To edit a document, output a block in this EXACT format. The format must be EXACTLY as shown — no extra backticks, no code fences around it, no indentation:

\`\`\`doc-update
id: ${docs[0].id}
---
[the ENTIRE new content of the document, replacing all existing content]
\`\`\`END-DOC-UPDATE

CRITICAL RULES:
- The opening line must be exactly three backticks followed by doc-update: \`\`\`doc-update
- The id line must be: id: <document-id> (use the exact id from the <doc> tag)
- The separator must be exactly three dashes: ---
- The closing line must be exactly three backticks followed by END-DOC-UPDATE: \`\`\`END-DOC-UPDATE
- Do NOT wrap the doc-update block in another code block or code fence
- Do NOT add extra backticks around it
- Do NOT indent the block
- Include the FULL document content in the update, not just the changed parts
- You can include multiple doc-update blocks for multiple documents
- Put your regular response text BEFORE the doc-update blocks
- After the doc-update blocks, add a brief summary of what you changed`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
