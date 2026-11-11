import { useMemo, useState } from 'react'
import { BookOpen, Search, X, ChevronRight, Check, Sparkles, CircleHelp, ArrowLeft, BookmarkCheck } from 'lucide-react'
import { entries, getCategory, getDisplayName, getEntryExplanation, classifyEntryQuery, references, type Entry, type LearningLevel } from './data/entries'
import YakuArtwork from './components/YakuArtwork'
import TermArtwork from './components/TermArtwork'
import GlossaryLinkedText, { getGlossaryEntries } from './components/GlossaryLinkedText'
import { hanLevels } from './data/hanLevels'
import { suitedTileReadings } from './data/suitedTileReadings'
import CoursePlayer from './platform/CoursePlayer'
import { mahjongBeginnerPack } from './content-packs/mahjong/beginner-course'
import { resolveMahjongGlossaryEntryId } from './content-packs/mahjong/glossaryAdapter'
import { mahjongExtensionRenderers } from './content-packs/mahjong/extensionRenderers'

const typeFilters = ['すべて', '役', '用語'] as const
type TypeFilter = typeof typeFilters[number]
const learningLevels: LearningLevel[] = ['初級', '中級', '上級']
const learningTracks: { level: LearningLevel; summary: string; categories: { name: string; title?: string; description: string }[] }[] = [
  { level: '初級', summary: 'ゲームの流れや牌の基本を学び、役とアガリのしくみにつなげる。', categories: [
    { name: 'ゲームの進行', description: '局の始まりから終わりまでの流れ。' },
    { name: '場とプレイヤー', description: '自分や他の人、場の呼び方。' },
    { name: '牌の基本', description: '牌の種類や手牌、牌山の基本。' },
    { name: '基本の組み合わせ', description: '雀頭や順子など、牌の組み合わせ。' },
    { name: 'アガリの基礎', title: 'アガリ方の基本', description: '和了、ロン、ツモなどアガリ方の基本。' },
    { name: '基本の役', description: 'まず覚えておきたい基本的な役。' },
    { name: '鳴きと門前', description: '鳴きと門前の基本を知る。' },
  ] },
  { level: '中級', summary: '待ちや役のしくみを知り、ルールを理解する。', categories: [
    { name: 'ゲームルール', description: '対局で使われるルールや取り決め。' },
    { name: '基本の組み合わせ', title: '面子と槓子', description: '少し複雑な面子や槓子の形。' },
    { name: '鳴きと門前', title: '鳴きの応用', description: '鳴きの種類や、鳴いたときの扱い。' },
    { name: '待ちとテンパイ', description: 'テンパイや待ちの形を理解する。' },
    { name: 'アガリの基礎', title: 'アガリの表記と関連語', description: 'アガリを表す言葉や別表記を確認する。' },
    { name: 'ドラとボーナス', description: 'ドラやボーナス牌の種類と扱い。' },
    { name: '役と翻数', description: '役の組み合わせと翻数のしくみ。' },
    { name: '戦術と安全牌', description: '安全牌や基本的な打ち方の考え方。' },
  ] },
  { level: '上級', summary: '点数計算や戦術、特殊な役や用語を学ぶ。', categories: [
    { name: '特殊な役・用語', description: '珍しい役や専門的な用語。' },
    { name: '点数計算', description: '符や点棒など、点数計算に関する知識。' },
    { name: '反則とペナルティ', description: '反則や罰則に関する用語。' },
    { name: '戦術と安全牌', title: '高度な守備', description: '状況に応じた守備や戦術。' },
    { name: 'スジ読み', description: 'スジに関する考え方や用語。' },
    { name: '待ちとテンパイ', title: '複雑な待ち', description: '複雑な待ちや特殊なテンパイ。' },
  ] },
]
type EntryHistoryLocation = { id: string; scrollY: number }

function App() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('すべて')
  const [categoryFilter, setCategoryFilter] = useState('すべて')
  const [levelFilter, setLevelFilter] = useState<'すべて' | LearningLevel>('すべて')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'course' | 'glossary'>('course')
  const [entryReturnView, setEntryReturnView] = useState<'course' | 'glossary'>('course')
  const [entryReturnScroll, setEntryReturnScroll] = useState(0)
  const [entryHistory, setEntryHistory] = useState<EntryHistoryLocation[]>([])
  const [learned, setLearned] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mahjong-zukan-learned') ?? '[]') as string[]
    } catch {
      return []
    }
  })

  const categories = useMemo(() => [...new Set(entries.filter((entry) => levelFilter === 'すべて' || entry.level === levelFilter).map(getCategory))], [levelFilter])
  const selected = entries.find((entry) => entry.id === selectedId) ?? null
  const selectedRelatedEntries = selected
    ? getGlossaryEntries(getEntryExplanation(selected)).filter((entry) => entry.id !== selected.id)
    : []
  const learnedCount = entries.filter((entry) => learned.includes(entry.id)).length
  const searchGroups = useMemo(() => {
    const matchesFilters = (entry: Entry) => (typeFilter === 'すべて' || entry.type === typeFilter)
      && (levelFilter === 'すべて' || entry.level === levelFilter)
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
  }, [query, typeFilter, categoryFilter, levelFilter])

  function toggleLearned(id: string) {
    const next = learned.includes(id) ? learned.filter((item) => item !== id) : [...learned, id]
    setLearned(next)
    localStorage.setItem('mahjong-zukan-learned', JSON.stringify(next))
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
    setLevelFilter('すべて')
  }

  function openLearningCategory(level: LearningLevel, category: string) {
    setQuery('')
    setTypeFilter('すべて')
    setCategoryFilter(category)
    setLevelFilter(level)
    document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' })
  }

  function openLearningLevel(level: LearningLevel) {
    setQuery('')
    setTypeFilter('すべて')
    setCategoryFilter('すべて')
    setLevelFilter(level)
    document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' })
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
            <div className="detail-kicker"><span className={`type-pill level-${selected.level}`}>{selected.level}</span><span className={`type-pill type-${selected.type}`}>{selected.type}</span></div>
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
        <button className="topbar-nav-button" onClick={() => setActiveView('glossary')} type="button">図鑑・学習ガイドを見る</button>
      </header>
      <CoursePlayer
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
      <div className="entry-card-top"><span className={`type-pill level-${entry.level}`}>{entry.level}</span><span className="entry-category">{getCategory(entry)}</span></div>
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
  const hasFilters = categoryFilter !== 'すべて' || typeFilter !== 'すべて' || levelFilter !== 'すべて' || query

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={resetFilters} aria-label="麻雀図鑑トップ">
          <span className="brand-mark"><BookOpen size={21} /></span>
          <span>麻雀図鑑</span>
        </button>
        <span className="topbar-note">はじめての麻雀を、もっとわかりやすく。</span>
        <button className="topbar-nav-button" onClick={() => setActiveView('course')} type="button">入門コースへ</button>
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
            <div><span className="section-eyebrow">LEARNING ROADMAP</span><h2 id="learning-title">学習コース</h2></div>
            <p className="section-caption">初級から上級へ、順番に学べる。</p>
          </div>
          <div className="learning-tracks">
            {learningTracks.map((track, trackIndex) => {
              const levelEntries = entries.filter((entry) => entry.level === track.level)
              return <section className={`learning-track learning-track-${track.level}`} key={track.level}>
                <div className="learning-track-heading">
                  <div><span className="learning-card-number">COURSE 0{trackIndex + 1}</span><h3>{track.level}編</h3><p>{track.summary}</p></div>
                  <button className="track-all-button" onClick={() => openLearningLevel(track.level)}>この編をすべて見る <ChevronRight size={14} /></button>
                </div>
                <div className="learning-unit-grid">
                  {track.categories.map((unit) => {
                    const count = levelEntries.filter((entry) => entry.category === unit.name).length
                    if (!count) return null
                    return <button className="learning-unit-card" key={unit.name} onClick={() => openLearningCategory(track.level, unit.name)}>
                      <span className="learning-unit-step">STEP {String(track.categories.indexOf(unit) + 1).padStart(2, '0')}</span>
                      <strong>{unit.title ?? unit.name}</strong>
                      <span className="learning-unit-description">{unit.description}</span>
                      <span className="learning-card-count">{count}項目 <ChevronRight size={14} /></span>
                    </button>
                  })}
                </div>
              </section>
            })}
          </div>
        </section>

        <section className="catalog-section" id="catalog">
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
            <div className="filter-pills" role="group" aria-label="学習レベル">
              {(['すべて', ...learningLevels] as const).map((level) => <button key={level} className={`filter-pill ${levelFilter === level ? 'selected' : ''}`} onClick={() => { setLevelFilter(level); setCategoryFilter('すべて') }}>{level}</button>)}
            </div>
            {hasFilters && <button className="reset-button" onClick={resetFilters}>条件をリセット</button>}
          </div>
          <div className="filter-row type-filter-row"><div className="filter-pills" role="group" aria-label="項目の種類">
              {typeFilters.map((filter) => <button key={filter} className={`filter-pill ${typeFilter === filter ? 'selected' : ''}`} onClick={() => setTypeFilter(filter)}>{filter}</button>)}
            </div></div>
          <div className="filter-pills category-pills" role="group" aria-label="学習カテゴリ">
            {['すべて', ...categories].map((category) => <button key={category} className={`filter-pill ${categoryFilter === category ? 'selected' : ''}`} onClick={() => setCategoryFilter(category)}>{category}</button>)}
          </div>
          {query.trim() ? <>
            {searchGroups.exact.length > 0 && <section className="search-result-group"><h3>検索結果</h3><div className="entry-grid">{searchGroups.exact.map(renderEntryCard)}</div></section>}
            {searchGroups.suggested.length > 0 && <section className="search-result-group"><h3>もしかして？</h3><div className="entry-grid">{searchGroups.suggested.map(renderEntryCard)}</div></section>}
            {searchGroups.related.length > 0 && <section className="search-result-group"><h3>関連する項目（説明文に含まれています）</h3><div className="entry-grid">{searchGroups.related.map(renderEntryCard)}</div></section>}
            {searchGroups.exact.length + searchGroups.suggested.length + searchGroups.related.length === 0 && <div className="empty-state"><CircleHelp size={30} /><h3>見つからなかったよ</h3><p>別の言葉で検索するか、絞り込みを解除してみてね。</p><button className="primary-button" onClick={resetFilters}>すべての項目を見る</button></div>}
          </> : levelFilter === 'すべて' && categoryFilter === 'すべて'
            ? learningLevels.map((level) => {
              const levelEntries = searchGroups.all.filter((entry) => entry.level === level)
              return <section className={`search-result-group learning-level-group level-group-${level}`} key={level}>
                <div className="learning-level-heading"><h3>{level}</h3><span>{levelEntries.length} 項目</span></div>
                {levelEntries.length > 0 ? <div className="entry-grid">{levelEntries.map(renderEntryCard)}</div> : <p className="empty-level">このレベルの項目はありません。</p>}
              </section>
            })
            : <div className="entry-grid">{searchGroups.all.map(renderEntryCard)}</div>}
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
