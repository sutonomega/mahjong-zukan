import { useMemo, useState } from 'react'
import { BookOpen, Search, X, ChevronRight, Check, Sparkles, CircleHelp, ArrowLeft, BookmarkCheck } from 'lucide-react'
import { entries, getCategory, getDisplayName, classifyEntryQuery, references, type Entry } from './data/entries'
import YakuArtwork from './components/YakuArtwork'
import TermArtwork from './components/TermArtwork'
import GlossaryLinkedText from './components/GlossaryLinkedText'

const typeFilters = ['すべて', '役', '用語'] as const
type TypeFilter = typeof typeFilters[number]
type EntryHistoryLocation = { id: string; scrollY: number }

function App() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('すべて')
  const [categoryFilter, setCategoryFilter] = useState('すべて')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [entryHistory, setEntryHistory] = useState<EntryHistoryLocation[]>([])
  const [learned, setLearned] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mahjong-zukan-learned') ?? '[]') as string[]
    } catch {
      return []
    }
  })

  const categories = useMemo(() => [...new Set(entries.filter((entry) => entry.type === '用語').map(getCategory))], [])
  const selected = entries.find((entry) => entry.id === selectedId) ?? null
  const learnedCount = entries.filter((entry) => learned.includes(entry.id)).length
  const searchGroups = useMemo(() => {
    const matchesFilters = (entry: Entry) => (typeFilter === 'すべて' || entry.type === typeFilter)
      && (categoryFilter === 'すべて' || getCategory(entry) === categoryFilter)
    if (!query.trim()) return { exact: [], suggested: [], related: [], all: entries.filter(matchesFilters) }

    const exact: Entry[] = []
    const suggested: Entry[] = []
    const related: Entry[] = []
    entries.filter(matchesFilters).forEach((entry) => {
      const match = classifyEntryQuery(entry, query)
      if (match === 'exact-title') exact.push(entry)
      else if (match === 'suggested-title') suggested.push(entry)
      else if (match === 'related-description') related.push(entry)
    })
    return { exact, suggested, related, all: [] }
  }, [query, typeFilter, categoryFilter])

  function toggleLearned(id: string) {
    const next = learned.includes(id) ? learned.filter((item) => item !== id) : [...learned, id]
    setLearned(next)
    localStorage.setItem('mahjong-zukan-learned', JSON.stringify(next))
  }

  function openEntry(entry: Entry) {
    if (selectedId && selectedId !== entry.id) {
      setEntryHistory((history) => [...history, { id: selectedId, scrollY: window.scrollY }])
    }
    setSelectedId(entry.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function backFromEntry() {
    const previous = entryHistory[entryHistory.length - 1]
    if (!previous) {
      setSelectedId(null)
      return
    }

    setEntryHistory((history) => history.slice(0, -1))
    setSelectedId(previous.id)
    window.requestAnimationFrame(() => window.scrollTo({ top: previous.scrollY, behavior: 'auto' }))
  }

  function resetFilters() {
    setQuery('')
    setTypeFilter('すべて')
    setCategoryFilter('すべて')
  }

  if (selected) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <button className="brand-button" onClick={() => { setSelectedId(null); setEntryHistory([]) }} aria-label="図鑑の一覧へ戻る">
            <span className="brand-mark"><BookOpen size={21} /></span>
            <span>麻雀図鑑</span>
          </button>
          <span className="topbar-note">はじめての麻雀を、もっとわかりやすく。</span>
        </header>
        <main className="detail-layout">
          <button className="back-link" onClick={backFromEntry}><ArrowLeft size={16} /> {entryHistory.length > 0 ? '前の説明へ戻る' : '図鑑一覧へ戻る'}</button>
          <article className="detail-card">
            <div className="detail-kicker"><span className={`type-pill type-${selected.type}`}>{selected.type}</span></div>
            <div className="detail-title-row">
              <div>
                <h1>{getDisplayName(selected)}</h1>
                <p className="reading">{selected.reading}</p>
              </div>
              <button className={`learn-button ${learned.includes(selected.id) ? 'is-learned' : ''}`} onClick={() => toggleLearned(selected.id)}>
                {learned.includes(selected.id) ? <Check size={17} /> : <BookmarkCheck size={17} />}
                {learned.includes(selected.id) ? '習得済み' : '覚えた！'}
              </button>
            </div>
            <section className="detail-section source-description">
              <h2>Excelの説明（原文）</h2>
              <p><GlossaryLinkedText text={selected.explanation || 'Excelに説明の記載はありません。'} onOpen={openEntry} /></p>
            </section>
            <section className="detail-section">
              <h2>Excelの項目</h2>
              <div className="metadata-row"><span>カテゴリ</span><span>{getCategory(selected)}</span></div>
              {selected.type === '役' && <>
                <div className="metadata-row"><span>翻数（ハンスウ）</span><span>{selected.source['翻数（ハンスウ）'] || '記載なし'}</span></div>
                <div className="metadata-row"><span>鳴き</span><span>{selected.source.鳴き || '記載なし'}</span></div>
              </>}
              <div className="metadata-row"><span>ExcelのNo</span><span>{selected.source.No}</span></div>
            </section>
            <p className="source-note">説明は初期データの記載をそのまま表示しています。ルール確認や補足は今後、元データと分けて追加します。</p>
          </article>
        </main>
        <footer className="footer"><span>麻雀図鑑</span><span>少しずつ覚えていこう。</span></footer>
      </div>
    )
  }

  function renderEntryCard(entry: Entry) {
    return <button className="entry-card" key={entry.id} onClick={() => openEntry(entry)}>
      <div className="entry-card-top"><span className={`type-pill type-${entry.type}`}>{entry.type}</span><span className="entry-category">{getCategory(entry)}</span></div>
      <div className="entry-illustration">
        {entry.type === '役'
          ? <YakuArtwork number={entry.source.No} han={entry.source['翻数（ハンスウ）']} />
          : <TermArtwork number={entry.source.No} category={entry.source.カテゴリ} />}
      </div>
      <h3>{getDisplayName(entry)}</h3>
      <p className="entry-reading">{entry.reading}</p>
      <p className="entry-summary">{entry.explanation || 'Excelに説明の記載はありません。'}</p>
      {entry.type === '役' && <p className="entry-yaku-meta">{entry.source['翻数（ハンスウ）']} ・ 鳴き {entry.source.鳴き || '記載なし'}</p>}
      <div className="entry-card-bottom">
        {learned.includes(entry.id) ? <span className="learned-label"><Check size={14} />習得済み</span> : <span className="details-link">くわしく <ChevronRight size={15} /></span>}
      </div>
    </button>
  }

  const progress = entries.length ? Math.round((learnedCount / entries.length) * 100) : 0
  const hasFilters = categoryFilter !== 'すべて' || typeFilter !== 'すべて' || query

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={resetFilters} aria-label="麻雀図鑑トップ">
          <span className="brand-mark"><BookOpen size={21} /></span>
          <span>麻雀図鑑</span>
        </button>
        <span className="topbar-note">はじめての麻雀を、もっとわかりやすく。</span>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow"><Sparkles size={14} /> BEGINNER'S FIELD GUIDE</div>
            <h1>見て、知って、<br /><em>少しずつ覚える。</em></h1>
            <p>役も用語も、ひとつずつ。<br className="mobile-only" />自分のペースで麻雀を知っていこう。</p>
            <div className="hero-stats">
              <div><strong>{entries.length}</strong><span>図鑑の項目</span></div>
              <div><strong>{learnedCount}</strong><span>覚えた項目</span></div>
              <div><strong>{progress}%</strong><span>図鑑の達成度</span></div>
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun-disc" />
            <div className="tile tile-back">中</div>
            <div className="tile tile-left">發</div>
            <div className="tile tile-front">白</div>
            <div className="floating-dot dot-one" />
            <div className="floating-dot dot-two" />
            <div className="art-caption">ONE TILE AT A TIME</div>
          </div>
        </section>

        <section className="catalog-section">
          <div className="section-heading catalog-heading">
            <div><span className="section-eyebrow">THE ENCYCLOPEDIA</span><h2>図鑑をひらく</h2></div>
            <span className="result-count">{query.trim() ? `${searchGroups.exact.length + searchGroups.suggested.length + searchGroups.related.length} 件の項目` : `${searchGroups.all.length} 件の項目`}</span>
          </div>
          <div className="search-box">
            <Search size={19} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・読み方・説明・カテゴリで検索（ひらがな・カタカナ対応）…" aria-label="図鑑を検索" />
            {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="検索をクリア"><X size={17} /></button>}
          </div>
          <div className="filter-row">
            <div className="filter-pills" role="group" aria-label="種類">
              {typeFilters.map((filter) => <button key={filter} className={`filter-pill ${typeFilter === filter ? 'selected' : ''}`} onClick={() => setTypeFilter(filter)}>{filter}</button>)}
            </div>
            {hasFilters && <button className="reset-button" onClick={resetFilters}>条件をリセット</button>}
          </div>
          <div className="filter-pills category-pills" role="group" aria-label="カテゴリ">
            {['すべて', ...categories].map((category) => <button key={category} className={`filter-pill ${categoryFilter === category ? 'selected' : ''}`} onClick={() => setCategoryFilter(category)}>{category}</button>)}
          </div>
          {query.trim() ? <>
            {searchGroups.exact.length > 0 && <section className="search-result-group"><h3>検索結果</h3><div className="entry-grid">{searchGroups.exact.map(renderEntryCard)}</div></section>}
            {searchGroups.suggested.length > 0 && <section className="search-result-group"><h3>もしかして？</h3><div className="entry-grid">{searchGroups.suggested.map(renderEntryCard)}</div></section>}
            {searchGroups.related.length > 0 && <section className="search-result-group"><h3>関連する項目（説明文に含まれています）</h3><div className="entry-grid">{searchGroups.related.map(renderEntryCard)}</div></section>}
            {searchGroups.exact.length + searchGroups.suggested.length + searchGroups.related.length === 0 && <div className="empty-state"><CircleHelp size={30} /><h3>見つからなかったよ</h3><p>別の言葉で検索するか、絞り込みを解除してみてね。</p><button className="primary-button" onClick={resetFilters}>すべての項目を見る</button></div>}
          </> : <div className="entry-grid">{searchGroups.all.map(renderEntryCard)}</div>}
        </section>

        <section className="reference-section">
          <h2>参考リンク</h2>
          <p>Excelのシート「図」に記載されていた参考URLです。参照先の画像は転載していません。</p>
          <ul>{references.map((reference) => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a></li>)}</ul>
        </section>
      </main>
      <footer className="footer"><span>麻雀図鑑</span><span>少しずつ覚えていこう。</span></footer>
    </div>
  )
}

export default App
