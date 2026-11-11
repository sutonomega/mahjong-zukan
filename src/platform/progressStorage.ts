export type CourseProgress = {
  completedLessonIds: string[]
  activeLessonId: string
}

type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>

type StoredCourseProgress = CourseProgress & {
  schemaVersion?: number
  packId?: string
  courseId?: string
}

export const COURSE_PROGRESS_SCHEMA_VERSION = 1

function getStorage(): ProgressStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function courseProgressStorageKey(packId: string, courseId: string) {
  return 'learning-platform:' + encodeURIComponent(packId) + ':' + encodeURIComponent(courseId) + ':v1'
}

export function readCourseProgress(
  packId: string,
  courseId: string,
  lessonIds: string[],
  preferredLessonId?: string,
): CourseProgress {
  const validLessonIds = new Set(lessonIds)
  const defaultLessonId = validLessonIds.has(preferredLessonId ?? '') ? preferredLessonId as string : lessonIds[0] ?? ''
  const fallback: CourseProgress = { completedLessonIds: [], activeLessonId: defaultLessonId }

  try {
    const raw = getStorage()?.getItem(courseProgressStorageKey(packId, courseId))
    if (!raw) return fallback

    const saved: unknown = JSON.parse(raw)
    if (!isRecord(saved)) return fallback

    const stored = saved as StoredCourseProgress
    if (stored.schemaVersion !== undefined && stored.schemaVersion !== COURSE_PROGRESS_SCHEMA_VERSION) return fallback
    if (stored.packId !== undefined && stored.packId !== packId) return fallback
    if (stored.courseId !== undefined && stored.courseId !== courseId) return fallback

    return {
      completedLessonIds: Array.isArray(stored.completedLessonIds)
        ? [...new Set(stored.completedLessonIds.filter((id): id is string => typeof id === 'string' && validLessonIds.has(id)))]
        : [],
      activeLessonId: typeof stored.activeLessonId === 'string' && validLessonIds.has(stored.activeLessonId)
        ? stored.activeLessonId
        : defaultLessonId,
    }
  } catch {
    return fallback
  }
}

export function writeCourseProgress(packId: string, courseId: string, progress: CourseProgress) {
  try {
    getStorage()?.setItem(courseProgressStorageKey(packId, courseId), JSON.stringify({
      schemaVersion: COURSE_PROGRESS_SCHEMA_VERSION,
      packId,
      courseId,
      completedLessonIds: progress.completedLessonIds,
      activeLessonId: progress.activeLessonId,
    }))
  } catch {
    // Keep learning usable when browser storage is unavailable or full.
  }
}
