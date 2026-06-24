export interface InteractiveOption {
  text: string;
  number: number;
}

const OPTION_PATTERNS = [
  /^\d+\.\s*\*?\*?(.+?)\*?\*?\s*[—\-:]\s*(.+)$/i,
  /^\d+\.\s*\[(.+?)\]\s*[—\-:]\s*(.+)$/i,
  /^\d+\.\s*(.+?)\s*\(.*?\)\s*$/i,
];

// Patterns that indicate the text before the list is asking for a choice
const OPTION_CONTEXT_PATTERNS = [
  /which\s+(do\s+you|would\s+you|should\s+we)/i,
  /what\s+(do\s+you|would\s+you|should\s+we)/i,
  /choose/i,
  /prefer/i,
  /option/i,
  /approach/i,
  /alternative/i,
  /how\s+(should|would|do)\s+(we|you|I)/i,
  /pick/i,
  /select/i,
  /decide/i,
  /sound\s+(good|right|best)/i,
  /think\s+(about|of)/i,
];

// Patterns that indicate requirements, not options
const REQUIREMENT_PATTERNS = [
  /you('ll|\s+will)\s+need/i,
  /you\s+need/i,
  /required/i,
  /must\s+have/i,
  /prerequisite/i,
  /install/i,
  /setup/i,
  /dependencies/i,
];

function isOptionLine(line: string): boolean {
  return OPTION_PATTERNS.some((p) => p.test(line.trim()));
}

function parseOptionLine(line: string): { label: string; description: string } | null {
  for (const pattern of OPTION_PATTERNS) {
    const match = line.trim().match(pattern);
    if (match) {
      return { label: match[1].trim(), description: (match[2] || '').trim() };
    }
  }
  return null;
}

function hasOptionContext(textBeforeList: string): boolean {
  // Check if text before the list contains a question or choice language
  const hasQuestion = textBeforeList.includes('?');
  const hasChoiceLanguage = OPTION_CONTEXT_PATTERNS.some((p) => p.test(textBeforeList));

  // If it has a question mark OR choice language, it's likely an option
  if (hasQuestion || hasChoiceLanguage) return true;

  // Check if it's a requirement list (not options)
  const isRequirement = REQUIREMENT_PATTERNS.some((p) => p.test(textBeforeList));
  if (isRequirement) return false;

  // Default: if no clear context, don't treat as options
  return false;
}

export function parseInteractiveOptions(content: string): InteractiveOption[] | null {
  const lines = content.split('\n');
  const options: InteractiveOption[] = [];
  let inOptionBlock = false;
  let textBeforeList = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      if (inOptionBlock && options.length >= 2) break;
      inOptionBlock = false;
      textBeforeList = '';
      options.length = 0;
      continue;
    }

    if (isOptionLine(trimmed)) {
      if (!inOptionBlock) {
        // First option line - check context
        textBeforeList = lines.slice(Math.max(0, i - 3), i).join(' ').trim();
        if (!hasOptionContext(textBeforeList)) {
          // Not an option context - skip this block
          inOptionBlock = false;
          options.length = 0;
          continue;
        }
      }
      inOptionBlock = true;
      const parsed = parseOptionLine(trimmed);
      if (parsed) {
        const fullText = parsed.description
          ? `${parsed.label} — ${parsed.description}`
          : parsed.label;
        options.push({ text: fullText, number: options.length + 1 });
      }
    } else if (inOptionBlock) {
      if (options.length >= 2) break;
      inOptionBlock = false;
      options.length = 0;
    }
  }

  // Real options are typically 2-6 items
  if (options.length < 2 || options.length > 6) return null;

  return options;
}

export function removeOptionsFromContent(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let skipMode = false;
  let consecutiveOptions = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (isOptionLine(trimmed)) {
      consecutiveOptions++;
      skipMode = true;
      continue;
    }

    if (skipMode && !trimmed && consecutiveOptions >= 2) {
      skipMode = false;
      consecutiveOptions = 0;
      continue;
    }

    if (skipMode && trimmed && !isOptionLine(trimmed)) {
      if (consecutiveOptions < 2) {
        for (let i = 0; i < consecutiveOptions; i++) {
          result.push('');
        }
      }
      skipMode = false;
      consecutiveOptions = 0;
    }

    result.push(line);
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
