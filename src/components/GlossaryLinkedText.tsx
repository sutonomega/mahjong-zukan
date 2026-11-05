import { entries, getDisplayLabel, getEntryExplanation, getEntryReadingVariants, type TermEntry } from '../data/entries'

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
glossaryTerms.forEach((entry) => {
  getEntryReadingVariants(entry).forEach((reading) => {
    const alias = reading.trim()
    if (alias && !termByAlias.has(alias)) termByAlias.set(alias, entry)
  })
})

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const termPattern = new RegExp(`(${[...termByAlias.keys()].sort((left, right) => right.length - left.length).map(escapeRegExp).join('|')})`, 'g')

function normalizeReading(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u30a1-\u30f6]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
    .replace(/[\s\u3000]/g, '')
}

function isValidTermMatch(text: string, start: number, alias: string, entry: TermEntry): boolean {
  if (entry.name !== '場') return true
  if (alias === 'バ') return false
  if (alias !== '場') return true

  const followingText = text.slice(start + alias.length)
  return !/^\s*(?:(?:（バ）|\(バ\))\s*)?合/.test(followingText)
}

type GlossaryTextPart = { text: string; entry?: TermEntry }

function parseGlossaryText(text: string): GlossaryTextPart[] {
  const parts: GlossaryTextPart[] = []
  let cursor = 0
  termPattern.lastIndex = 0
  let match = termPattern.exec(text)

  while (match) {
    const alias = match[0]
    const start = match.index
    const entry = termByAlias.get(alias)
    if (!entry || start < cursor || !isValidTermMatch(text, start, alias, entry)) {
      match = termPattern.exec(text)
      continue
    }

    if (start > cursor) parts.push({ text: text.slice(cursor, start) })

    let end = start + alias.length
    while (true) {
      const readingSuffix = text.slice(end).match(/^\s*(?:（([^（）]+)）|\(([^()]+)\))/)
      const suffixReading = readingSuffix?.[1] ?? readingSuffix?.[2]
      const readingVariants = getEntryReadingVariants(entry)
      const matchesReading = suffixReading && readingVariants.some((reading) => normalizeReading(suffixReading) === normalizeReading(reading))
      if (!readingSuffix || !suffixReading || !matchesReading) break
      end += readingSuffix[0].length
    }

    parts.push({ text: getDisplayLabel(entry), entry })
    cursor = end
    termPattern.lastIndex = end
    match = termPattern.exec(text)
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor) })
  return parts
}

export function formatGlossaryText(text: string): string {
  return parseGlossaryText(text).map((part) => part.text).join('')
}

export default function GlossaryLinkedText({ text, onOpen }: GlossaryLinkedTextProps) {
  const parts = parseGlossaryText(text)

  return <>
    {parts.map((part, index) => {
      if (!part.entry) return <span key={index}>{part.text}</span>

      const entry = part.entry
      const displayLabel = getDisplayLabel(entry)
      const tooltip = formatGlossaryText(getEntryExplanation(entry))
      return <button
        aria-label={`${displayLabel}。説明: ${tooltip}。クリックで用語詳細を開く`}
        className="glossary-term-link"
        data-tooltip={tooltip}
        key={index}
        onClick={() => onOpen(entry)}
        type="button"
      >{displayLabel}</button>
    })}
  </>
}
