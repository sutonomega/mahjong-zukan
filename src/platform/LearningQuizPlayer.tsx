import { useState } from 'react'
import { BookOpen, Check, RotateCcw } from 'lucide-react'
import type { LearningQuiz, LearningQuizQuestion, LessonSegment, GlossaryReference } from './contracts'

type LearningQuizPlayerProps = {
  quiz: LearningQuiz
  onOpenLesson: (lessonId: string) => void
  onOpenTerm: (reference: GlossaryReference) => void
}

function QuizSegments({ segments, onOpenTerm }: { segments: LessonSegment[]; onOpenTerm: LearningQuizPlayerProps['onOpenTerm'] }) {
  return <>{segments.map((segment, index) => segment.type === 'text'
    ? <span key={index}>{segment.text}</span>
    : <button
        aria-label={segment.reference.label + 'の図鑑を開く'}
        className="course-term-link"
        data-tooltip={segment.reference.shortDefinition}
        key={segment.reference.id + '-' + index}
        onClick={() => onOpenTerm(segment.reference)}
        type="button"
      >{segment.reference.label}</button>)}</>
}

function QuizOptionSegments({ segments }: { segments: LessonSegment[] }) {
  return <>{segments.map((segment, index) => segment.type === 'text'
    ? <span key={index}>{segment.text}</span>
    : <span className="course-quiz-term-label" key={index}>{segment.reference.label}</span>)}</>
}

function getOption(question: LearningQuizQuestion, optionId: string) {
  return question.options.find((option) => option.id === optionId)
}

export default function LearningQuizPlayer({ quiz, onOpenLesson, onOpenTerm }: LearningQuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const answeredCount = quiz.questions.filter((question) => answers[question.id]).length
  const correctCount = quiz.questions.filter((question) => answers[question.id] === question.correctOptionId).length

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }))
  }

  function resetAnswers() {
    setAnswers({})
  }

  return <section className="course-quiz" id={'course-quiz-' + quiz.id} aria-labelledby={'course-quiz-title-' + quiz.id}>
    <div className="course-quiz-heading">
      <div>
        <span className="course-quiz-eyebrow">CHECK YOUR UNDERSTANDING</span>
        <h2 id={'course-quiz-title-' + quiz.id}>{quiz.title}</h2>
        <p>{quiz.description}</p>
      </div>
      <div className="course-quiz-score" aria-live="polite">
        <strong>{correctCount} / {quiz.questions.length}</strong>
        <span>{answeredCount} 問に回答</span>
      </div>
    </div>

    <div className="course-quiz-questions">
      {quiz.questions.map((question, index) => {
        const selectedOptionId = answers[question.id]
        const selectedOption = selectedOptionId ? getOption(question, selectedOptionId) : undefined
        const correctOption = getOption(question, question.correctOptionId)
        const isCorrect = selectedOptionId === question.correctOptionId

        return <section className="course-quiz-question" key={question.id} aria-labelledby={'quiz-question-' + question.id}>
          <h3 id={'quiz-question-' + question.id}><span className="course-quiz-question-number">Q{index + 1}</span><span className="course-quiz-prompt"><QuizSegments segments={question.prompt} onOpenTerm={onOpenTerm} /></span></h3>
          <div className="course-quiz-options" role="group" aria-label={'問題' + (index + 1) + 'の回答'}>
            {question.options.map((option) => {
              const isSelected = option.id === selectedOptionId
              const isCorrectOption = selectedOptionId && option.id === question.correctOptionId
              const className = [
                'course-quiz-option',
                isSelected ? (isCorrect ? 'is-correct' : 'is-incorrect') : '',
                isCorrectOption && !isSelected ? 'is-answer' : '',
              ].filter(Boolean).join(' ')
              return <button
                aria-pressed={isSelected}
                className={className}
                key={option.id}
                onClick={() => selectAnswer(question.id, option.id)}
                type="button"
              >
                <span className="course-quiz-option-mark">{isSelected && isCorrect ? <Check size={16} /> : String.fromCharCode(65 + question.options.indexOf(option))}</span>
                <span><QuizOptionSegments segments={option.segments} /></span>
              </button>
            })}
          </div>

          {selectedOption && <div className={'course-quiz-feedback ' + (isCorrect ? 'is-correct' : 'is-incorrect')} role="status">
            <strong>{isCorrect ? '正解です。' : '今回は不正解です。'}</strong>
            {!isCorrect && correctOption && <p>正解は「<QuizSegments segments={correctOption.segments} onOpenTerm={onOpenTerm} />」です。</p>}
            <p><QuizSegments segments={question.explanation} onOpenTerm={onOpenTerm} /></p>
            {question.reviewLessonId && <div className="course-quiz-followups">
              <button className="course-quiz-review-link" onClick={() => onOpenLesson(question.reviewLessonId!)} type="button"><BookOpen size={14} />関連レッスンを復習</button>
            </div>}
          </div>}
        </section>
      })}
    </div>

    {answeredCount > 0 && <button className="course-quiz-reset" onClick={resetAnswers} type="button"><RotateCcw size={14} />回答をリセット</button>}
  </section>
}
