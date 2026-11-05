import { entries, type TermEntry } from '../data/entries'

type GlossaryLinkedTextProps = {
  text: string
  onOpen: (entry: TermEntry) => void
}

const glossaryTerms = entries
  .filter((entry): entry is TermEntry => entry.type === '用語' && Boolean(entry.name.trim()))
  .sort((left, right) => right.name.length - left.name.length)

const termByName = new Map<string, TermEntry>()
glossaryTerms.forEach((entry) => {
  if (!termByName.has(entry.name)) termByName.set(entry.name, entry)
})

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const termPattern = new RegExp(`(${[...termByName.keys()].map(escapeRegExp).join('|')})`, 'g')

export default function GlossaryLinkedText({ text, onOpen }: GlossaryLinkedTextProps) {
  const parts = text.split(termPattern)

  return <>
    {parts.map((part, index) => {
      const entry = termByName.get(part)
      if (!entry) return <span key={index}>{part}</span>

      const tooltip = entry.explanation || `${entry.name}（${entry.reading}）`
      return <button
        aria-label={`${part}。説明: ${tooltip}。クリックで用語詳細を開く`}
        className="glossary-term-link"
        data-tooltip={tooltip}
        key={index}
        onClick={() => onOpen(entry)}
        type="button"
      >{part}</button>
    })}
  </>
}
