import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Search, X, ChevronRight, Check, Sparkles, CircleHelp, ArrowLeft, BookmarkCheck } from 'lucide-react'
import { entries, getCategory, getDisplayName, getEntryExplanation, references, getEntryReadingVariants, type Entry } from './data/entries'
import YakuArtwork from './components/YakuArtwork'
import TermArtwork from './components/TermArtwork'
import GlossaryLinkedText, { getGlossaryEntries } from './components/GlossaryLinkedText'
import { hanLevels } from './data/hanLevels'
import { suitedTileReadings } from './data/suitedTileReadings'
import CoursePlayer from './platform/CoursePlayer'
import { mahjongBeginnerPack } from './content-packs/mahjong/beginner-course'
import { resolveMahjongGlossaryEntryId } from './content-packs/mahjong/glossaryAdapter'
import { mahjongExtensionRenderers } from './content-packs/mahjong/extensionRenderers'
import { learningPackToSearchPack, searchContentPacks, type SearchResult, type SearchablePack } from './platform/search'

const typeFilters = ['すべて', '役', '用語'] as const
type TypeFilter = typeof typeFilters[number]
const courseTracks = [
  { id: 'intro', title: '入門編', description: '牌の見方から、1局の流れ、役とアガリの基本まで学びます。', status: 'available' },
  { id: 'beginner', title: '初級編', description: '基本を身につけたあとに進むコースです。', status: 'coming-soon' },
  { id: 'intermediate', title: '中級編', description: '役や待ち、対局ルールをさらに学ぶコースです。', status: 'coming-soon' },
  { id: 'advanced', title: '上級編', description: '点数計算や戦術などを学ぶコースです。', status: 'coming-soon' },
] as const
const mahjongSearchPack: SearchablePack = (() => {
  const lessons = learningPackToSearchPack(mahjongBeginnerPack)
  return {
    ...lessons,
    items: [
      ...lessons.items,
      ...entries.map((entry) => ({
        id: entry.id,
        kind: 'glossary',
        title: getDisplayName(entry),
        aliases: [entry.name],
        readings: getEntryReadingVariants(entry),
        category: getCategory(entry),
        description: getEntryExplanation(entry),
        keywords: [entry.sourceCategory],
        facets: { type: entry.type },
      })),
    ],
  }
})()

type EntryHistoryLocation = { id: string; scrollY: number }

const GLOSSARY_PROGRESS_KEY = 'mahjong-zukan-learned'
const GLOSSARY_PROGRESS_SCHEMA_VERSION = 1

function loadLearnedEntryIds(): string[] {
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(GLOSSARY_PROGRESS_KEY)
    if (!raw) return []
    const saved: unknown = JSON.parse(raw)
    const ids = Array.isArray(saved)
      ? saved
      : typeof saved === 'object' && saved !== null && 'schemaVersion' in saved
        && saved.schemaVersion === GLOSSARY_PROGRESS_SCHEMA_VERSION
        && 'learnedEntryIds' in saved && Array.isArray(saved.learnedEntryIds)
          ? saved.learnedEntryIds
          : []
    const knownIds = new Set(entries.map((entry) => entry.id))
    return [...new Set(ids.filter((id): id is string => typeof id === 'string' && knownIds.has(id))]
  } catch {
    return []
  }
}

function saveLearnedEntryIds(learnedEntryIds: string[]) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(GLOSSARY_PROGRESS_KEY, JSON.stringify({
      schemaVersion: GLOSSARY_PROGRESS_SCHEMA_VERSION,
      learnedEntryIds,
    }))
  } catch {
    // Keep glossary controls usable when browser storage is unavailable or full.
  }
}

function App() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('すべて')
  const [categoryFilter, setCategoryFilter] = useState('すべて')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lessonToOpen, setLessonToOpen] = useState<string | undefined>(undefined)
  const [activeView, setActiveView] = useState<'course' | 'glossary'>('glossary')
  const [entryReturnView, setEntryReturnView] = useState<'course' | 'glossary'>('course')
  const [entryReturnScroll, setEntryReturnScroll] = useState(0)
  const [entryHistory, setEntryHistory] = useState<EntryHistoryLocation[]>([])
  const [learned, setLearned] = useState<string[]>(loadLearnedEntryIds)

  useEffect(() => {
    saveLearnedEntryIds(learned)
  }, [learned])

  const categories = useMemo(() => [...new Set(entries.map(getCategory))], [])
  const selected = entries.find((entry) => entry.id === selectedId) ?? null
  const selectedRelatedEntries = selected
    ? getGlossaryEntries(getEntryExplanation(selected)).filter((entry) => entry.id !== selected.id)
    : []
  const learnedCount = entries.filter((entry) => learned.includes(entry.id)).length
  const contentSearchResults = useMemo(
    () => searchContentPacks([mahjongSearchPack], query, { packIds: [mahjongBeginnerPack.packId] }),
    [query],
  )
  const lessonSearchResults = contentSearchResults.filter((result) => result.item.kind === 'lesson')
  const searchGroups = useMemo(() => {
    const matchesFilters = (entry: Entry) => (typeFilter === 'すべて' || entry.type === typeFilter)
      && (categoryFilter === 'すべて' || getCategory(entry) === categoryFilter)
    if (!query.trim()) return { exact: [], suggested: [], related: [], all: entries.filter(matchesFilters) }

    const glossaryHits = contentSearchResults.filter((result) => result.item.kind === 'glossary')
    const entriesFor = (match: SearchResult['match']) => glossaryHits
      .filter((result) => result.match === match)
      .map((result) => entries.find((entry) => entry.id === result.item.id))
      .filter((entry): entry is Entry => Boolean(entry))
      .filter(matchesFilters)
    return {
      exact: entriesFor('exact-title'),
      suggested: entriesFor('exact-metadata'),
      related: entriesFor('exact-description'),
      all: [],
    }
  }, [query, typeFilter, categoryFilter, contentSearchResults])

  function openSearchResult(result: SearchResult) {
    if (result.item.kind === 'lesson') {
      setSelectedId(null)
      setEntryHistory([])
      setLessonToOpen(result.item.id)
      setActiveView('course')
      setQuery('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const entry = entries.find((item) => item.id === result.item.id)
    if (entry) openEntry(entry)
  }

  function renderSearchResult(result: SearchResult) {
    const isLesson = result.item.kind === 'lesson'
    return <button
      className="content-search-result"
      key={result.packId + ':' + result.item.kind + ':' + result.item.id}
      onClick={() => openSearchResult(result)}
      type="button"
    >
      <span className={`content-search-kind ${isLesson ? 'lesson' : 'glossary'}`}>{isLesson ? '学習記事' : '図鑑'}</span>
      <span className="content-search-copy">
        <strong>{result.item.title}</strong>
        <small>{[result.item.category, result.item.kind === 'glossary' ? result.item.facets?.type : ''].filter(Boolean).join(' · ')}</small>
        {result.item.description && <small>{result.item.description.slice(0, 100)}{result.item.description.length > 100 ? '…' : ''}</small>}
      </span>
      <ChevronRight size={17} />
    </button>
  }

  function toggleLearned(id: string) {
    if (!entries.some((entry) => entry.id === id)) return
    setLearned((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id])
  }

  function openEntry(entry: Entry) {
    if (!selectedId) {
      setEntryReturnView(activeView)
      setEntryReturnScroll(window.scrollY)
    }
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
      setActiveView(entryReturnView)
      window.requestAnimationFrame(() => window.scrollTo({ top: entryReturnScroll, behavior: 'auto' }))
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

  function openBeginnerCourse() {
    setSelectedId(null)
    setEntryHistory([])
    setLessonToOpen(undefined)
    setQuery('')
    setActiveView('course')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (selected) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <button className="brand-button" onClick={() => { setSelectedId(null); setEntryHistory([]); setActiveView('glossary') }} aria-label="図鑑の一覧へ戻る">
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
            <div className="detail-tag-row">
              <span className="detail-category-block">{getCategory(selected)}</span>
              {selected.type === '役' && <>
                <span className="detail-metadata-tag">翻数：{String(selected.source['翻数（ハンスウ）'] ?? '記載なし')}</span>
                <span className="detail-metadata-tag">鳴き：{String(selected.source['鳴き'] ?? '記載なし')}</span>
              </>}
            </div>
            <section className="detail-section source-description">
              <h2>意味</h2>
              <p><GlossaryLinkedText text={getEntryExplanation(selected)} onOpen={openEntry} /></p>
            </section>
            {selectedRelatedEntries.length > 0 && <section className="detail-section related-words-section">
              <h2>関連ワード</h2>
              <div className="related-words">
                {selectedRelatedEntries.map((entry) => <button className="related-word" key={entry.id} onClick={() => openEntry(entry)}>{getDisplayName(entry)}<ChevronRight size={13} /></button>)}
              </div>
            </section>}
            {selected.type === '用語' && selected.id === 'term-052' && <section className="detail-section han-levels-section">
              <h2>翻数の区分（補足）</h2>
              <div className="han-table-wrap">
                <table className="han-table">
                  <thead><tr><th scope="col">翻数の区分</th><th scope="col">補足</th></tr></thead>
                  <tbody>{hanLevels.map((level) => <tr key={level.label}>
                    <th scope="row">{level.label}</th>
                    <td>{'note' in level ? level.note : ''}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <p className="han-table-note">この表は初期データの説明とは分けて表示しています。</p>
            </section>}
            {selected.type === '用語' && suitedTileReadings[selected.id] && <section className="detail-section suited-tile-readings-section">
              <h2>{suitedTileReadings[selected.id].title}（補足）</h2>
              <div className="han-table-wrap">
                <table className="han-table">
                  <thead><tr><th scope="col">牌</th><th scope="col">読み方</th></tr></thead>
                  <tbody>{suitedTileReadings[selected.id].tiles.map((tile) => <tr key={tile.tile}>
                    <th scope="row">{tile.tile}</th>
                    <td>{tile.reading}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <p className="han-table-note">この表は初期データの説明とは分けて表示しています。</p>
            </section>}
          </article>
        </main>
        <footer className="footer"><span>麻雀図鑑</span><span>少しずつ覚えていこう。</span></footer>
      </div>
    )
  }

  if (activeView === 'course' && !selected) {
    return <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={() => { setActiveView('course'); setSelectedId(null); setEntryHistory([]) }} aria-label="学習コーストップ">
          <span className="brand-mark"><BookOpen size={21} /></span>
          <span>麻雀図鑑</span>
        </button>
        <span className="topbar-note">はじめての麻雀を、もっとわかりやすく。</span>
        <div className="search-box topbar-search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="学習記事や用語を検索" aria-label="学習記事と図鑑を検索" />
          {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="検索をクリア"><X size={17} /></button>}
        </div>
        <button className="topbar-nav-button" onClick={() => setActiveView('glossary')} type="button">図鑑へ</button>
      </header>
      {query.trim() && <section className="content-search-results" aria-live="polite" aria-label="学習記事と図鑑の検索結果">
        <div className="content-search-heading"><h2>検索結果</h2><span>{contentSearchResults.length} 件</span></div>
        {contentSearchResults.length > 0
          ? <div className="content-search-list">{contentSearchResults.map(renderSearchResult)}</div>
          : <div className="empty-state"><CircleHelp size={26} /><h3>見つからなかったよ</h3><p>記事のタイトル、役や用語を別の言葉でも検索してみてね。</p></div>}
      </section>}
      <CoursePlayer
        initialLessonId={lessonToOpen}
        pack={mahjongBeginnerPack}
        course={mahjongBeginnerPack.courses[0]}
        renderExtension={(extension) => mahjongExtensionRenderers[extension.rendererId]?.(extension)}
        onOpenTerm={(reference) => {
          const entryId = resolveMahjongGlossaryEntryId(reference)
          const entry = entryId ? entries.find((item) => item.id === entryId) : undefined
          if (entry) openEntry(entry)
        }}
      />
      <footer className="footer"><span>麻雀図鑑</span><span>少しずつ覚えていこう。</span></footer>
    </div>
  }

  function renderEntryCard(entry: Entry) {
    return <article className="entry-card" key={entry.id}>
      <div className="entry-card-top"><span className={`type-pill type-${entry.type}`}>{entry.type}</span><span className="entry-category">{getCategory(entry)}</span></div>
      <div className="entry-illustration">
        {entry.type === '役'
          ? <YakuArtwork number={Number(entry.source['No'])} han={String(entry.source['翻数（ハンスウ）'] ?? '')} />
          : <TermArtwork number={Number(entry.source['No'])} category={entry.sourceCategory} />}
      </div>
      <h3><button className="entry-title-button" onClick={() => openEntry(entry)}>{getDisplayName(entry)}</button></h3>
      <p className="entry-reading">{entry.reading}</p>
      <p className="entry-summary"><GlossaryLinkedText text={getEntryExplanation(entry)} onOpen={openEntry} /></p>
      {entry.type === '役' && <p className="entry-yaku-meta">{entry.source['翻数（ハンスウ）']} ・ 鳴き {entry.source['鳴き'] || '記載なし'}</p>}
      <div className="entry-card-bottom">
        {learned.includes(entry.id) && <span className="learned-label"><Check size={14} />習得済み</span>}
        <button className="details-link" onClick={() => openEntry(entry)}>くわしく <ChevronRight size={15} /></button>
      </div>
    </article>
  }

  const progress = entries.length ? Math.round((learnedCount / entries.length) * 100) : 0
  const hasFilters = categoryFilter !== 'すべて' || typeFilter !== 'すべて' || Boolean(query)

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

        <section className="learning-section" aria-labelledby="learning-title">
          <div className="section-heading">
            <div><span className="section-eyebrow">LEARNING COURSES</span><h2 id="learning-title">学習コース</h2></div>
            <p className="section-caption">自分の段階に合わせて学ぼう。</p>
          </div>
          <div className="learning-course-grid">
            {courseTracks.map((track, index) => track.status === 'available'
              ? <button className="learning-course-card is-available" key={track.id} onClick={openBeginnerCourse} type="button">
                  <span className="learning-card-number">COURSE 0{index + 1}</span>
                  <strong>{track.title}</strong>
                  <span className="learning-course-description">{track.description}</span>
                  <span className="learning-course-action">コースを始める <ChevronRight size={14} /></span>
                </button>
              : <button className="learning-course-card is-coming-soon" key={track.id} disabled type="button">
                  <span className="learning-card-number">COURSE 0{index + 1}</span>
                  <strong>{track.title}</strong>
                  <span className="learning-course-status">作成中</span>
                  <span className="learning-course-description">{track.description}</span>
                </button>)}
          </div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-heading catalog-heading">
            <div><span className="section-eyebrow">THE ENCYCLOPEDIA</span><h2>図鑑をひらく</h2></div>
            <span className="result-count">{query.trim() ? `${searchGroups.exact.length + searchGroups.suggested.length + searchGroups.related.length + lessonSearchResults.length} 件の検索結果` : `${searchGroups.all.length} 件の項目`}</span>
          </div>
          <div className="search-box">
            <Search size={19} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="記事・名前・読み方・説明・カテゴリで検索…" aria-label="学習記事と図鑑を検索" />
            {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="検索をクリア"><X size={17} /></button>}
          </div>
          <div className="filter-row">
            {hasFilters && <button className="reset-button" onClick={resetFilters}>条件をリセット</button>}
          </div>
          <div className="filter-row type-filter-row"><div className="filter-pills" role="group" aria-label="項目の種類">
              {typeFilters.map((filter) => <button key={filter} className={`filter-pill ${typeFilter === filter ? 'selected' : ''}`} onClick={() => setTypeFilter(filter)}>{filter}</button>)}
            </div></div>
          <div className="filter-pills category-pills" role="group" aria-label="学習カテゴリ">
            {['すべて', ...categories].map((category) => <button key={category} className={`filter-pill ${categoryFilter === category ? 'selected' : ''}`} onClick={() => setCategoryFilter(category)}>{category}</button>)}
          </div>
          {query.trim() && lessonSearchResults.length > 0 && <section className="search-result-group lesson-search-group"><h3>学習記事</h3><div className="content-search-list">{lessonSearchResults.map(renderSearchResult)}</div></section>}
          {query.trim() ? <>
            {searchGroups.exact.length > 0 && <section className="search-result-group"><h3>検索結果</h3><div className="entry-grid">{searchGroups.exact.map(renderEntryCard)}</div></section>}
            {searchGroups.suggested.length > 0 && <section className="search-result-group"><h3>カテゴリ・関連語で一致</h3><div className="entry-grid">{searchGroups.suggested.map(renderEntryCard)}</div></section>}
            {searchGroups.related.length > 0 && <section className="search-result-group"><h3>説明文で一致</h3><div className="entry-grid">{searchGroups.related.map(renderEntryCard)}</div></section>}
            {searchGroups.exact.length + searchGroups.suggested.length + searchGroups.related.length + lessonSearchResults.length === 0 && <div className="empty-state"><CircleHelp size={30} /><h3>見つからなかったよ</h3><p>別の言葉で検索するか、絞り込みを解除してみてね。</p><button className="primary-button" onClick={resetFilters}>すべての項目を見る</button></div>}
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
