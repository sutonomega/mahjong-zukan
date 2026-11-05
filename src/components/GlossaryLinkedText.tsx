import type { ReactNode } from 'react'
import { entries, getDisplayName, getEntryExplanation, type TermEntry } from '../data/entries'

type GlossaryLinkedTextProps = {
  text: string
  onOpen: (entry: TermEntry) => void
}

const glossaryTerms = entries
  .filter((entry): entry is TermEntry => entry.type === '用語' && Boolean(entry.name.trim()))

const termByAlias = new Map<string, TermEntry>()
const addAliases = (getAlias: (entry: TermEntry) => string) => glossaryTerms.forEach((entry) => {
  const alias = getAlias(entry).trim()
  if (alias && !termByAlias.has(alias)) termByAlias.set(alias, entry)
})
addAliases((entry) => entry.displayName)
addAliases((entry) => entry.name)
addAliases((entry) => entry.reading)

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const termPattern = new RegExp(`(${[...termByAlias.keys()].sort((left, right) => right.length - left.length).map(escapeRegExp).join('|')})`, 'g')

function normalizeReading(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u30a1-\u30f6]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
    .replace(/[\s\u3000]/g, '')
}

export default function GlossaryLinkedText({ text, onOpen }: GlossaryLinkedTextProps) {
  const parts: ReactNode[] = []
  let cursor = 0
  let index = 0
  termPattern.lastIndex = 0
  let match = termPattern.exec(text)

  while (match) {
    const alias = match[0]
    const start = match.index
    const entry = termByAlias.get(alias)
    if (!entry || start < cursor) {
      match = termPattern.exec(text)
      continue
    }

    if (start > cursor) parts.push(text.slice(cursor, start))

    let end = start + alias.length
    while (true) {
      const readingSuffix = text.slice(end).match(/^\s*(?:（([^（）]+)）|\(([^()]+)\))/)
      const suffixReading = readingSuffix?.[1] ?? readingSuffix?.[2]
      if (!readingSuffix || !suffixReading || normalizeReading(suffixReading) !== normalizeReading(entry.reading)) break
      end += readingSuffix[0].length
    }

    const displayName = getDisplayName(entry)
    const tooltip = getEntryExplanation(entry)
    parts.push(<button
      aria-label={`${displayName}（${entry.reading}）。説明: ${tooltip}。クリックで用語詳細を開く`}
      className="glossary-term-link"
      data-tooltip={tooltip}
      key={index}
      onClick={() => onOpen(entry)}
      type="button"
    >{displayName}（{entry.reading}）</button>)
    index += 1
    cursor = end
    termPattern.lastIndex = end
    match = termPattern.exec(text)
  }

  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}
