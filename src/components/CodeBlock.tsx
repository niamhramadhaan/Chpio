import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  cs: 'C#',
  'c#': 'C#',
  go: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  kt: 'Kotlin',
  scala: 'Scala',
  html: 'HTML',
  xml: 'XML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  md: 'Markdown',
  markdown: 'Markdown',
  sql: 'SQL',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  latex: 'LaTeX',
  tex: 'LaTeX',
  bibtex: 'BibTeX',
  bib: 'BibTeX',
  r: 'R',
  lua: 'Lua',
  vim: 'Vim',
  graphql: 'GraphQL',
  gql: 'GraphQL',
  dart: 'Dart',
  elixir: 'Elixir',
  ex: 'Elixir',
  erlang: 'Erlang',
  hs: 'Haskell',
  haskell: 'Haskell',
  ocaml: 'OCaml',
  fs: 'F#',
  'f#': 'F#',
  clojure: 'Clojure',
  clj: 'Clojure',
  lisp: 'Lisp',
  scheme: 'Scheme',
  terraform: 'Terraform',
  tf: 'Terraform',
  hcl: 'HCL',
  nginx: 'Nginx',
  apache: 'Apache',
  makefile: 'Makefile',
  make: 'Makefile',
  cmake: 'CMake',
  proto: 'Protobuf',
  protobuf: 'Protobuf',
  vue: 'Vue',
  svelte: 'Svelte',
  astro: 'Astro',
};

function getLanguageLabel(language: string): string {
  return LANGUAGE_LABELS[language.toLowerCase()] || language;
}

export default function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden mb-3 border border-white/5">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-white/5">
        <span className="text-xs text-white/30 font-mono">{getLanguageLabel(language)}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-teal-400" />
              <span className="text-teal-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        wrapLongLines
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'rgba(15, 20, 19, 0.8)',
          fontSize: '0.8rem',
          lineHeight: '1.5',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            whiteSpace: 'pre',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
