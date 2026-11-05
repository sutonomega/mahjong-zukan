import { entries, type TermEntry } from '../data/entries'

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

export default function GlossaryLinkedText({ text, onOpen }: GlossaryLinkedTextProps) {
  const parts = text.split(termPattern)

  return <>
    {parts.map((part, index) => {
      const entry = termByAlias.get(part)
      if (!entry) return <span key={index}>{part}</span>

      const tooltip = entry.explanation || `${entry.displayName}（${entry.reading}）`
      return <button
        aria-label={`${entry.displayName}（${entry.reading}）。説明: ${tooltip}。クリックで用語詳細を開く`}
        className="glossary-term-link"
        data-tooltip={tooltip}
        key={index}
        onClick={() => onOpen(entry)}
        type="button"
      >{entry.displayName}（{entry.reading}）</button>
    })}
  </>
}
