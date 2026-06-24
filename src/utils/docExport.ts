interface ExportOptions {
  title: string;
  content: string;
}

export async function exportToDocx({ title, content }: ExportOptions): Promise<void> {
  const docx = await import('docx');
  const { saveAs } = await import('file-saver');
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, convertMillimetersToTwip } = docx;

  const lines = content.split('\n');
  const paragraphs: InstanceType<typeof Paragraph>[] = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: line.slice(2), bold: true, size: 32 })],
          spacing: { after: 200 },
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: line.slice(3), bold: true, size: 28 })],
          spacing: { after: 200 },
        })
      );
    } else if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: line.slice(4), bold: true, size: 24 })],
          spacing: { after: 200 },
        })
      );
    } else if (line.startsWith('- ')) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: line.slice(2) })],
          spacing: { after: 100 },
        })
      );
    } else if (line.startsWith('1. ')) {
      paragraphs.push(
        new Paragraph({
          numbering: { reference: 'default-numbering', level: 0 },
          children: [new TextRun({ text: line.slice(3) })],
          spacing: { after: 100 },
        })
      );
    } else if (line.startsWith('> ')) {
      paragraphs.push(
        new Paragraph({
          indent: { left: convertMillimetersToTwip(10) },
          children: [new TextRun({ text: line.slice(2), italics: true, color: '666666' })],
          spacing: { after: 100 },
        })
      );
    } else if (line.trim() === '') {
      paragraphs.push(
        new Paragraph({
          children: [],
          spacing: { after: 200 },
        })
      );
    } else {
      const children: InstanceType<typeof TextRun>[] = [];
      let remaining = line;

      while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
        const italicMatch = remaining.match(/\*(.*?)\*/);
        const codeMatch = remaining.match(/`(.*?)`/);

        const matches = [
          boldMatch ? { type: 'bold', match: boldMatch } : null,
          italicMatch ? { type: 'italic', match: italicMatch } : null,
          codeMatch ? { type: 'code', match: codeMatch } : null,
        ].filter(Boolean);

        if (matches.length === 0) {
          children.push(new TextRun({ text: remaining }));
          break;
        }

        const firstMatch = matches.reduce((a, b) =>
          a!.match.index! < b!.match.index! ? a : b
        )!;

        if (firstMatch.match.index! > 0) {
          children.push(new TextRun({ text: remaining.slice(0, firstMatch.match.index!) }));
        }

        const text = firstMatch.match[1];
        if (firstMatch.type === 'bold') {
          children.push(new TextRun({ text, bold: true }));
        } else if (firstMatch.type === 'italic') {
          children.push(new TextRun({ text, italics: true }));
        } else if (firstMatch.type === 'code') {
          children.push(new TextRun({ text, font: 'Courier New', size: 20 }));
        }

        remaining = remaining.slice(firstMatch.match.index! + firstMatch.match[0].length);
      }

      paragraphs.push(
        new Paragraph({
          children,
          spacing: { after: 200 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(25),
              right: convertMillimetersToTwip(25),
              bottom: convertMillimetersToTwip(25),
              left: convertMillimetersToTwip(25),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title || 'document'}.docx`);
}

export function exportToHtml({ title, content }: ExportOptions): string {
  const lines = content.split('\n');
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || 'Document'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    ul, ol { padding-left: 2em; margin-bottom: 1em; }
    li { margin-bottom: 0.25em; }
    blockquote {
      border-left: 3px solid #ddd;
      padding-left: 1em;
      margin-left: 0;
      color: #666;
      font-style: italic;
    }
    code {
      background: #f4f4f4;
      padding: 0.1em 0.3em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background: #f4f4f4;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5em 0.75em;
      text-align: left;
    }
    th { background: #f4f4f4; font-weight: 600; }
    a { color: #0066cc; }
    mark { background: #fff3cd; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
  </style>
</head>
<body>
`;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      html += `<h1>${escapeHtml(line.slice(2))}</h1>\n`;
    } else if (line.startsWith('## ')) {
      html += `<h2>${escapeHtml(line.slice(3))}</h2>\n`;
    } else if (line.startsWith('### ')) {
      html += `<h3>${escapeHtml(line.slice(4))}</h3>\n`;
    } else if (line.startsWith('- ')) {
      html += `<ul><li>${processInlineMarkdown(line.slice(2))}</li></ul>\n`;
    } else if (line.match(/^\d+\. /)) {
      html += `<ol><li>${processInlineMarkdown(line.replace(/^\d+\. /, ''))}</li></ol>\n`;
    } else if (line.startsWith('> ')) {
      html += `<blockquote>${processInlineMarkdown(line.slice(2))}</blockquote>\n`;
    } else if (line.trim() === '') {
      html += '<br>\n';
    } else {
      html += `<p>${processInlineMarkdown(line)}</p>\n`;
    }
  }

  html += `</body>\n</html>`;
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function processInlineMarkdown(text: string): string {
  let result = escapeHtml(text);

  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  result = result.replace(/`(.*?)`/g, '<code>$1</code>');
  result = result.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  result = result.replace(/==(.*?)==/g, '<mark>$1</mark>');

  return result;
}

export async function downloadHtml({ title, content }: ExportOptions): Promise<void> {
  const { saveAs } = await import('file-saver');
  const html = exportToHtml({ title, content });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${title || 'document'}.html`);
}
