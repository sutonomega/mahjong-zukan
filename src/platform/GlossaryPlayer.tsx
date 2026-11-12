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
  const visibleEntries = useMemo(() => {
    if (!query.trim()) return pack.entries
    const matchingIds = new Set(results.map(({ item }) => item.id))
    return pack.entries.filter((entry) => matchingIds.has(entry.id))
  }, [pack.entries, query, results])

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
        <h1 id="glossary-runtime-title">{selectedEntry.title}</h1>
        {selectedEntry.reading && <p className="glossary-runtime-reading">{selectedEntry.reading}</p>}
        <p className="glossary-runtime-definition">{selectedEntry.shortDefinition}</p>
        <p>{selectedEntry.description}</p>
      </article>
    </section>
  }

  return <section className="glossary-runtime" aria-labelledby="glossary-runtime-title">
    <h1 id="glossary-runtime-title">{pack.title}</h1>
    <p>{pack.description}</p>
    <label className="glossary-runtime-search"><Search size={17} /><span className="visually-hidden">用語を検索</span>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="用語を検索" />
    </label>
    {visibleEntries.length
      ? <ul className="glossary-runtime-list">{visibleEntries.map((entry) => <li key={entry.id}><button
            aria-label={entry.title + '。' + (entry.reading ?? '') + '。' + entry.shortDefinition + ' 詳細を開く'}
            className="glossary-runtime-item glossary-runtime-tooltip"
            data-tooltip={entry.shortDefinition}
            onClick={() => setSelectedId(entry.id)}
            type="button"
          >
            <span><strong>{entry.title}</strong>{entry.reading && <small>{entry.reading}</small>}</span>
            <span>説明を見る</span>
          </button></li>)}</ul>
      : <p className="glossary-runtime-empty">一致する用語はありません。</p>}
  </section>
}

