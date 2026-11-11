export type GlossaryReference = {
  /** Stable item ID including the content-pack namespace, for example "mahjong:term-066". */
  id: string
  label: string
  shortDefinition: string
}

export type LessonSegment =
  | { type: 'text'; text: string }
  | { type: 'term'; reference: GlossaryReference }

export type LessonBlock =
  | { type: 'paragraph'; segments: LessonSegment[] }
  | { type: 'callout'; title: string; segments: LessonSegment[] }

export type LearningLesson = {
  id: string
  title: string
  summary: string
  blocks: LessonBlock[]
}

export type LearningCourse = {
  id: string
  title: string
  description: string
  lessons: LearningLesson[]
}

export type LearningPack = {
  packId: string
  title: string
  description: string
  locale: string
  schemaVersion: number
  contentVersion: string
  courses: LearningCourse[]
}
