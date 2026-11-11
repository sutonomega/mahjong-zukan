import type { LearningPack, LessonBlock, LessonSegment } from './contracts'

export type SearchableItem = {
  id: string
  kind: string
  title: string
  aliases?: string[]
  readings?: string[]
  category?: string
  description?: string
  keywords?: string[]
  facets?: Record<string, string>
}

export type SearchablePack = {
  packId: string
  locale: string
  items: SearchableItem[]
}

export type SearchMatch = 'exact-title' | 'suggested-title' | 'related-description'

export type SearchResult = {
  packId: string
  locale: string
  item: SearchableItem
  match: SearchMatch
}

export type SearchOptions = {
  packIds?: string[]
  normalize?: (value: string, locale: string) => string
}

export function normalizeSearchText(value: string, locale: string): string {
  let normalized = value.normalize('NFKC')
  try {
    normalized = normalized.toLocaleLowerCase(locale)
  } catch {
    normalized = normalized.toLowerCase()
  }
  if (locale.toLowerCase().startsWith('ja')) {
    normalized = normalized.replace(/[\u30a1-\u30f6]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
  }
  return normalized.replace(/[\s\u3000・･、。，,.!?！？：:;；()（）「」『』【】\[\]{}<>「」『』'"`]/g, '')
}

function isWithinOneEdit(query: string, candidate: string): boolean {
  if (Math.abs(query.length - candidate.length) > 1) return false
  let queryIndex = 0
  let candidateIndex = 0
  let edits = 0
  while (queryIndex < query.length && candidateIndex < candidate.length) {
    if (query[queryIndex] === candidate[candidateIndex]) {
      queryIndex++
      candidateIndex++
      continue
    }
    if (++edits > 1) return false
    if (query.length > candidate.length) queryIndex++
    else if (candidate.length > query.length) candidateIndex++
    else {
      queryIndex++
      candidateIndex++
    }
  }
  if (queryIndex < query.length || candidateIndex < candidate.length) edits++
  return edits <= 1
}

function containsOneEditMatch(query: string, value: string): boolean {
  for (let start = 0; start < value.length; start++) {
    for (let length = Math.max(1, query.length - 1); length <= query.length + 1; length++) {
      if (start + length <= value.length && isWithinOneEdit(query, value.slice(start, start + length))) return true
    }
  }
  return false
}

export function searchContentPacks(
  packs: SearchablePack[],
  rawQuery: string,
  options: SearchOptions = {},
): SearchResult[] {
  const selectedPackIds = options.packIds ? new Set(options.packIds) : null
  const matches: { result: SearchResult; score: number; order: number }[] = []
  const queryByLocale = new Map<string, string>()
  let order = 0

  for (const pack of packs) {
    if (selectedPackIds && !selectedPackIds.has(pack.packId)) continue
    const normalize = options.normalize ?? normalizeSearchText
    let query = queryByLocale.get(pack.locale)
    if (query === undefined) {
      query = normalize(rawQuery, pack.locale)
      queryByLocale.set(pack.locale, query)
    }
    if (!query) continue

    for (const item of pack.items) {
      const normalized = (values: (string | undefined)[]) => values
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => normalize(value, pack.locale))
      const titles = normalized([item.title])
      const aliases = normalized(item.aliases ?? [])
      const readings = normalized(item.readings ?? [])
      const metadata = normalized([item.category, ...(item.keywords ?? [])])
      const description = normalize(item.description ?? '', pack.locale)
      let score: number | null = null
      let match: SearchMatch

      if ([...titles, ...aliases, ...readings].some((field) => field === query)) {
        score = 0
        match = 'exact-title'
      } else if ([...titles, ...aliases, ...readings].some((field) => field.includes(query))
        || (query.length >= 3 && query.length <= 12 && [...titles, ...aliases, ...readings].some((field) => containsOneEditMatch(query as string, field)))) {
        score = 1
        match = 'suggested-title'
      } else if (metadata.some((field) => field.includes(query as string))) {
        score = 2
        match = 'suggested-title'
      } else if (description.includes(query)) {
        score = 3
        match = 'related-description'
      }
      if (score !== null) matches.push({ result: { packId: pack.packId, locale: pack.locale, item, match }, score, order })
      order++
    }
  }
  return matches.sort((left, right) => left.score - right.score || left.order - right.order).map(({ result }) => result)
}

function segmentText(segments: LessonSegment[]): string {
  return segments.map((segment) => segment.type === 'text'
    ? segment.text
    : segment.reference.label + ' ' + segment.reference.shortDefinition).join(' ')
}

function blockText(block: LessonBlock): string {
  if (block.type === 'paragraph') return segmentText(block.segments)
  if (block.type === 'callout') return block.title + ' ' + segmentText(block.segments)
  if (block.type === 'steps') return block.steps.map((step) => step.title + ' ' + segmentText(step.segments)).join(' ')
  return block.altText + ' ' + JSON.stringify(block.payload)
}

/** Builds a domain-neutral search pack from lesson headings and authored lesson text. */
export function learningPackToSearchPack(pack: LearningPack): SearchablePack {
  return {
    packId: pack.packId,
    locale: pack.locale,
    items: pack.courses.flatMap((course) => course.lessons.map((lesson) => ({
      id: lesson.id,
      kind: 'lesson',
      title: lesson.title,
      aliases: [course.title],
      category: course.title,
      description: [course.description, lesson.summary, ...lesson.blocks.map(blockText)].join(' '),
      facets: { courseId: course.id },
    }))),
  }
}
