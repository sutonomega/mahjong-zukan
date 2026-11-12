import { useEffect, useState } from 'react'
import { BookOpen, Library } from 'lucide-react'
import CoursePlayer from './CoursePlayer'
import GlossaryPlayer from './GlossaryPlayer'
import type { GlossaryPack, LearningPack } from './contracts'

export type ContentPackDemoProps = {
  demoPackId: string
  returnHref?: string
  learningPack: LearningPack
  glossaryPack: GlossaryPack
}

export default function ContentPackDemo({ demoPackId, returnHref = '?', learningPack, glossaryPack }: ContentPackDemoProps) {
  const [view, setView] = useState<'course' | 'glossary'>('course')
  const [termId, setTermId] = useState<string | undefined>()
  const [glossaryRevision, setGlossaryRevision] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = learningPack.title + ' | 学習パック'
    return () => { document.title = previousTitle }
  }, [learningPack.title])

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">本文へスキップ</a>
    <header className="topbar">
      <a className="brand-button" href={'?demoPack=' + encodeURIComponent(demoPackId)} aria-label={learningPack.title}>
        <span className="brand-mark"><BookOpen size={21} /></span>
        <span>{learningPack.title}</span>
      </a>
      <span className="topbar-note">分野に依存しない学習パックの表示例</span>
      <nav className="content-pack-demo-nav" aria-label="教材の種類">
        <button aria-pressed={view === 'course'} onClick={() => setView('course')} type="button"><BookOpen size={16} />コース</button>
        <button aria-pressed={view === 'glossary'} onClick={() => { setTermId(undefined); setGlossaryRevision((revision) => revision + 1); setView('glossary') }} type="button"><Library size={16} />図鑑</button>
      </nav>
      <a className="topbar-nav-button" href={returnHref}>学習トップへ戻る</a>
    </header>
    {view === 'course' && <CoursePlayer
      pack={learningPack}
      course={learningPack.courses[0]}
      onOpenTerm={(reference) => {
        setTermId(reference.id)
        setGlossaryRevision((revision) => revision + 1)
        setView('glossary')
      }}
    />}
    {view === 'glossary' && <main id="main-content" className="course-layout" tabIndex={-1}>
      <GlossaryPlayer key={(termId ?? 'list') + ':' + glossaryRevision} pack={glossaryPack} initialEntryId={termId} />
    </main>}
    <footer className="footer"><span>{learningPack.title}</span><span>{learningPack.description}</span></footer>
  </div>
}
