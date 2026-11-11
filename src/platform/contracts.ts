export type GlossaryReference = {
  /** Stable item ID including the content-pack namespace, for example "mahjong:term-066". */
  id: string
  label: string
  shortDefinition: string
}

export type LessonSegment =
  | { type: 'text'; text: string }
  | { type: 'term'; reference: GlossaryReference }

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type LessonExtension = {
  rendererId: string
  schemaVersion: number
  altText: string
  payload: JsonValue
}

export type LessonStep = {
  title: string
  segments: LessonSegment[]
}

export type LessonBlock =
  | { type: 'paragraph'; segments: LessonSegment[] }
  | { type: 'callout'; title: string; segments: LessonSegment[] }
  | { type: 'steps'; steps: LessonStep[] }
  | ({ type: 'extension' } & LessonExtension)

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
