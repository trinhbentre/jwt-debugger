import { useState, useMemo, useCallback } from 'react'
import {
  generateSnippet,
  detectAlgoFamily,
  LANGUAGE_LABELS,
  type Language,
} from '../lib/snippetTemplates'
import type { DecodedToken } from '../types/jwt'

interface Props {
  decoded: DecodedToken
}

// Ultra-minimal CSS-based syntax highlighting (no library)
function highlight(code: string, lang: Language): React.ReactNode[] {
  // Split into lines and apply simple token coloring per line
  return code.split('\n').map((line, i) => {
    // Comments
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) {
      return (
        <div key={i} className="text-text-muted">
          {line}
        </div>
      )
    }
    // Keywords
    const keywords =
      lang === 'nodejs'
        ? ['const', 'let', 'var', 'function', 'return', 'try', 'catch', 'if', 'new', 'await', 'async', 'require', 'import', 'from']
        : lang === 'python'
          ? ['import', 'from', 'def', 'return', 'try', 'except', 'with', 'as', 'if', 'print', 'raise']
          : lang === 'go'
            ? ['func', 'var', 'import', 'package', 'if', 'return', 'fmt', 'os', 'err', 'nil']
            : ['public', 'class', 'static', 'void', 'try', 'catch', 'new', 'import', 'var', 'throws']

    // Tokenise the line: strings, keywords, rest
    const parts: React.ReactNode[] = []
    let segKey = 0

    // String literals (single + double quote, capture)
    const strRe = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
    let lastIdx = 0
    let m: RegExpExecArray | null
    while ((m = strRe.exec(line)) !== null) {
      const before = line.slice(lastIdx, m.index)
      if (before) {
        parts.push(
          <span key={segKey++} className={keywords.some((k) => before.includes(k)) ? '' : ''}>
            {colorKeywords(before, keywords, segKey++)}
          </span>,
        )
      }
      parts.push(
        <span key={segKey++} className="text-orange-300">
          {m[0]}
        </span>,
      )
      lastIdx = m.index + m[0].length
    }
    const rest = line.slice(lastIdx)
    // eslint-disable-next-line no-useless-assignment
    if (rest) parts.push(<span key={segKey++}>{colorKeywords(rest, keywords, segKey++)}</span>)

    return (
      <div key={i} className="text-text-primary leading-relaxed">
        {parts.length > 0 ? parts : line}
      </div>
    )
  })
}

function colorKeywords(text: string, keywords: string[], baseKey: number): React.ReactNode {
  // Simple split by word boundaries
  const re = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = baseKey
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>)
    parts.push(
      <span key={k++} className="text-purple-400">
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  // eslint-disable-next-line no-useless-assignment
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>)
  return <>{parts}</>
}

export function CodeSnippet({ decoded }: Props) {
  const [lang, setLang] = useState<Language>('nodejs')
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const alg = typeof decoded.header.alg === 'string' ? decoded.header.alg : 'HS256'
  const iss = typeof decoded.payload.iss === 'string' ? decoded.payload.iss : undefined
  const aud = typeof decoded.payload.aud === 'string' ? decoded.payload.aud : undefined

  const ctx = useMemo(
    () => ({
      algorithm: alg,
      algoFamily: detectAlgoFamily(alg),
      issuer: iss,
      audience: aud,
    }),
    [alg, iss, aud],
  )

  const code = useMemo(() => generateSnippet(lang, ctx), [lang, ctx])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  const highlighted = useMemo(() => highlight(code, lang), [code, lang])

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2 border-b border-surface-700 flex items-center justify-between hover:bg-surface-700/50 transition-colors"
      >
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
          Code Snippet
          <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-surface-700 text-accent">
            {alg}
          </span>
        </span>
        <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-3">
          {/* Language selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  lang === l
                    ? 'bg-accent text-surface-900 font-medium'
                    : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                }`}
              >
                {LANGUAGE_LABELS[l]}
              </button>
            ))}

            <button
              onClick={handleCopy}
              className="ml-auto px-3 py-1 text-xs rounded bg-surface-700 text-text-secondary hover:bg-surface-600 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Code block */}
          <pre className="bg-surface-900 border border-surface-700 rounded p-3 text-xs font-mono overflow-x-auto leading-relaxed">
            {highlighted}
          </pre>
        </div>
      )}
    </div>
  )
}
