import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw } from 'lucide-react'
import type { LearningCourse, LearningLesson, LearningPack, LessonSegment, GlossaryReference } from '../platform/contracts'

type SavedProgress = {
  completedLessonIds: string[]
  activeLessonId: string
}

type CoursePlayerProps = {
  pack: LearningPack
  course: LearningCourse
  onOpenTerm: (reference: GlossaryReference) => void
  renderExtension?: (extension: LessonExtension) => ReactNode
}

function readProgress(key: string, course: LearningCourse): SavedProgress {
  const fallback = { completedLessonIds: [], activeLessonId: course.lessons[0]?.id ?? '' }
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<SavedProgress> | null
    if (!saved) return fallback
    return {
      completedLessonIds: Array.isArray(saved.completedLessonIds)
        ? saved.completedLessonIds.filter((id): id is string => course.lessons.some((lesson) => lesson.id === id))
        : [],
      activeLessonId: course.lessons.some((lesson) => lesson.id === saved.activeLessonId)
        ? saved.activeLessonId as string
        : fallback.activeLessonId,
    }
  } catch {
    return fallback
  }
}

function LessonSegments({ segments, onOpenTerm }: { segments: LessonSegment[]; onOpenTerm: CoursePlayerProps['onOpenTerm'] }) {
  return <>{segments.map((segment, index) => segment.type === 'text'
    ? <span key={index}>{segment.text}</span>
    : <button
        aria-label={segment.reference.label + '。' + segment.reference.shortDefinition + '。クリックで図鑑の詳しい説明を開く'}
        className="course-term-link"
        data-tooltip={segment.reference.shortDefinition}
        key={segment.reference.id + '-' + index}
        onClick={() => onOpenTerm(segment.reference)}
        type="button"
      >{segment.reference.label}</button>)}</>
}

export default function CoursePlayer({ pack, course, onOpenTerm, renderExtension }: CoursePlayerProps) {
  const progressKey = 'learning-platform:' + pack.packId + ':' + course.id + ':v1'
  const [progress, setProgress] = useState(() => readProgress(progressKey, course))
  const lessons = course.lessons
  const activeIndex = Math.max(0, lessons.findIndex((lesson) => lesson.id === progress.activeLessonId))
  const activeLesson = lessons[activeIndex]
  const completedCount = progress.completedLessonIds.length
  const percentage = lessons.length ? Math.round(completedCount / lessons.length * 100) : 0

  useEffect(() => {
    try {
      localStorage.setItem(progressKey, JSON.stringify(progress))
    } catch {
      // Keep the lesson usable when browser storage is unavailable.
    }
  }, [progress, progressKey])

  function selectLesson(lesson: LearningLesson) {
    setProgress((current) => ({ ...current, activeLessonId: lesson.id }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function completeAndContinue() {
    if (!activeLesson) return
    const completedLessonIds = progress.completedLessonIds.includes(activeLesson.id)
      ? progress.completedLessonIds
      : [...progress.completedLessonIds, activeLesson.id]
    const nextLesson = lessons[activeIndex + 1]
    setProgress({
      completedLessonIds,
      activeLessonId: nextLesson?.id ?? activeLesson.id,
    })
    if (nextLesson) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetProgress() {
    setProgress({ completedLessonIds: [], activeLessonId: lessons[0]?.id ?? '' })
  }

  const lessonOutline = useMemo(() => lessons.map((lesson, index) => ({
    lesson,
    index,
    completed: progress.completedLessonIds.includes(lesson.id),
  })), [lessons, progress.completedLessonIds])

  if (!activeLesson) return null

  return <main className="course-layout">
    <section className="course-hero">
      <div className="course-eyebrow"><BookOpen size={15} /> LEARNING COURSE</div>
      <p className="course-pack-title">{pack.title}</p>
      <h1>{course.title}</h1>
      <p className="course-description">{course.description}</p>
      <div className="course-progress-row">
        <span>{completedCount} / {lessons.length} レッスン完了</span>
        <span>{percentage}%</span>
      </div>
      <div className="course-progress-track" role="progressbar" aria-label="コースの進捗" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: percentage + '%' }} />
      </div>
    </section>

    <div className="course-columns">
      <nav className="course-outline" aria-label="レッスン一覧">
        <h2>レッスン</h2>
        {lessonOutline.map(({ lesson, index, completed }) => <button
          aria-current={lesson.id === activeLesson.id ? 'step' : undefined}
          className={'course-outline-item' + (lesson.id === activeLesson.id ? ' is-active' : '')}
          key={lesson.id}
          onClick={() => selectLesson(lesson)}
          type="button"
        >
          <span className="course-outline-number">{completed ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span>
          <span><strong>{lesson.title}</strong><small>{lesson.summary}</small></span>
        </button>)}
        {completedCount > 0 && <button className="course-reset-button" onClick={resetProgress} type="button"><RotateCcw size={13} />進捗をリセット</button>}
      </nav>

      <article className="course-lesson">
        <div className="course-lesson-kicker">LESSON {String(activeIndex + 1).padStart(2, '0')} / {String(lessons.length).padStart(2, '0')}</div>
        <h2>{activeLesson.title}</h2>
        <p className="course-lesson-summary">{activeLesson.summary}</p>
        <div className="course-lesson-body">
          {activeLesson.blocks.map((block, index) => {
            const key = activeLesson.id + '-block-' + index
            if (block.type === 'paragraph') {
              return <p key={key}><LessonSegments segments={block.segments} onOpenTerm={onOpenTerm} /></p>
            }
            if (block.type === 'callout') {
              return <aside className="course-callout" key={key}>
                <strong>{block.title}</strong>
                <p><LessonSegments segments={block.segments} onOpenTerm={onOpenTerm} /></p>
              </aside>
            }
            return <div className="course-extension" key={key}>
              {renderExtension?.(block) ?? <aside className="course-extension-fallback">{block.altText}</aside>}
            </div>
          })}
        </div>
        <div className="course-lesson-actions">
          <button className="course-previous-button" disabled={activeIndex === 0} onClick={() => selectLesson(lessons[activeIndex - 1])} type="button"><ArrowLeft size={16} />前のレッスン</button>
          <button className="course-next-button" onClick={completeAndContinue} type="button">
            {activeIndex === lessons.length - 1
              ? (progress.completedLessonIds.includes(activeLesson.id) ? 'コースを完了しました' : 'コースを完了する')
              : (progress.completedLessonIds.includes(activeLesson.id) ? '次のレッスンへ' : '完了して次へ')}
            {activeIndex < lessons.length - 1 && <ArrowRight size={16} />}
          </button>
        </div>
      </article>
    </div>
    <p className="course-term-hint">下線のある用語は、ポイントすると短い説明が見られます。選ぶと図鑑の詳しい説明を開きます。</p>
  </main>
}
