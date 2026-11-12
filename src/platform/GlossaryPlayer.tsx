import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { searchContentPacks, type SearchablePack } from './search'
import type { GlossaryPack } from './contracts'

type GlossaryPlayerProps = {
  pack: GlossaryPack
  initialEntryId?: string
}

export default function GlossaryPlayer({ pack, initialEntryId }: GlossaryPlayerProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedEntry = pack.entries.find((entry) => entry.id === selectedId) ?? null
  const searchablePack = useMemo<SearchablePack>(() => ({
    packId: pack.packId,
    locale: pack.locale,
    items: pack.entries.map((entry) => ({
      id: entry.id,
      kind: 'glossary',
      title: entry.title,
      aliases: entry.aliases,
      readings: entry.reading ? [entry.reading] : [],
      category: entry.category,
      description: entry.description,
    })),
  }), [pack])
  const results = useMemo(() => searchContentPacks([searchablePack], query), [searchablePack, query])

  useEffect(() => {
    if (initialEntryId && pack.entries.some((entry) => entry.id === initialEntryId)) {
      setSelectedId(initialEntryId)
      setQuery('')
    }
  }, [initialEntryId, pack.entries])

  if (selectedEntry) {
    return <section className="glossary-runtime" aria-labelledby="glossary-runtime-title">
      <button className="glossary-runtime-back" onClick={() => setSelectedId(null)} type="button"><ArrowLeft size={16} />用語一覧へ戻る</button>
      <article className="glossary-runtime-detail">
        <p>{selectedEntry.category}</p>
        <h2 id="glossary-runtime-title">{selectedEntry.title}</h2>
        {selectedEntry.reading && <p className="glossary-runtime-reading">{selectedEntry.reading}</p>}
        <p className="glossary-runtime-definition">{selectedEntry.shortDefinition}</p>
        <p>{selectedEntry.description}</p>
      </article>
    </section>
  }

  return <section className="glossary-runtime" aria-labelledby="glossary-runtime-title">
    <h2 id="glossary-runtime-title">{pack.title}</h2>
    <p>{pack.description}</p>
    <label className="glossary-runtime-search"><Search size={17} /><span className="visually-hidden">用語を検索</span>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="用語を検索" />
    </label>
    {results.length
      ? <ul className="glossary-runtime-list">{results.map(({ item }) => {
          const entry = pack.entries.find((candidate) => candidate.id === item.id)
          if (!entry) return null
          return <li key={entry.id}><button className="glossary-runtime-item" onClick={() => setSelectedId(entry.id)} type="button">
            <span><strong>{entry.title}</strong>{entry.reading && <small>{entry.reading}</small>}</span>
            <span className="glossary-runtime-tooltip" data-tooltip={entry.shortDefinition}>説明を見る</span>
          </button></li>
        })}</ul>
      : <p className="glossary-runtime-empty">一致する用語はありません。</p>}
  </section>
}
