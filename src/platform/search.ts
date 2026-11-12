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

export type SearchMatch = 'exact-title' | 'exact-metadata' | 'exact-description'

export type SearchResult = {
  packId: string
  locale: string
  item: SearchableItem
  match: SearchMatch
}

export type SearchOptions = {
  packIds?: string[]
  normalize?: (value: string, locale: string) => string
  tokenize?: (value: string, locale: string) => string[]
}

type WordSegment = { segment: string; isWordLike?: boolean }
type WordSegmenter = { segment: (value: string) => Iterable<WordSegment> }
type WordSegmenterConstructor = new (locale: string, options: { granularity: 'word' }) => WordSegmenter

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

export function tokenizeSearchText(value: string, locale: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: WordSegmenterConstructor }).Segmenter
  if (Segmenter) {
    const segments = new Segmenter(locale, { granularity: 'word' }).segment(value)
    return Array.from(segments)
      .filter((segment) => segment.isWordLike !== false)
      .map((segment) => normalizeSearchText(segment.segment, locale))
      .filter(Boolean)
  }

  return value
    .split(/[\s\u3000・･、。，,.!?！？：:;；()（）「」『』【】\[\]{}<>「」『』'"`／/]+/)
    .map((segment) => normalizeSearchText(segment, locale))
    .filter(Boolean)
}

function splitVariants(values: string[]): string[] {
  return values.flatMap((value) => value.split(/[／/]/)).map((value) => value.trim()).filter(Boolean)
}

function getTokenPhrases(tokens: string[]): Set<string> {
  const phrases = new Set<string>()
  for (let start = 0; start < tokens.length; start++) {
    let phrase = ''
    for (let end = start; end < tokens.length; end++) {
      phrase += tokens[end]
      phrases.add(phrase)
    }
  }
  return phrases
}

function getDescriptionAliases(
  pack: SearchablePack,
  descriptionTokens: string[],
  normalize: (value: string, locale: string) => string,
): Set<string> {
  const descriptionPhrases = getTokenPhrases(descriptionTokens)
  const aliases = new Set<string>()

  for (const referencedItem of pack.items) {
    const referencedTitles = splitVariants([referencedItem.title, ...(referencedItem.aliases ?? [])])
      .map((value) => normalize(value, pack.locale))
      .filter(Boolean)
    if (!referencedTitles.some((title) => descriptionPhrases.has(title))) continue

    for (const alias of splitVariants([...(referencedItem.aliases ?? []), ...(referencedItem.readings ?? [])])) {
      const normalized = normalize(alias, pack.locale)
      if (normalized) aliases.add(normalized)
    }
  }

  return aliases
}

function hasExactTokenPhrase(query: string, tokens: string[]): boolean {
  for (let start = 0; start < tokens.length; start++) {
    let phrase = ''
    for (let end = start; end < tokens.length; end++) {
      phrase += tokens[end]
      if (phrase === query) return true
      if (phrase.length >= query.length) break
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
  const normalize = options.normalize ?? normalizeSearchText
  const tokenize = options.tokenize ?? tokenizeSearchText
  const matches: { result: SearchResult; score: number; order: number }[] = []
  let order = 0

  for (const pack of packs) {
    if (selectedPackIds && !selectedPackIds.has(pack.packId)) continue
    const query = normalize(rawQuery.trim(), pack.locale)
    if (!query) continue

    for (const item of pack.items) {
      const titleTerms = splitVariants([item.title, ...(item.aliases ?? []), ...(item.readings ?? [])])
        .map((value) => normalize(value, pack.locale))
        .filter(Boolean)
      const metadataTerms = [item.category, ...(item.keywords ?? [])]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => normalize(value, pack.locale))
        .filter(Boolean)
      const descriptionTokens = tokenize(item.description ?? '', pack.locale)
      const descriptionAliases = getDescriptionAliases(pack, descriptionTokens, normalize)
      const match: SearchMatch | null = titleTerms.includes(query)
        ? 'exact-title'
        : metadataTerms.includes(query)
          ? 'exact-metadata'
          : hasExactTokenPhrase(query, descriptionTokens) || descriptionAliases.has(query)
            ? 'exact-description'
            : null
      const score = match === 'exact-title' ? 0 : match === 'exact-metadata' ? 1 : match === 'exact-description' ? 2 : null
      if (match && score !== null) matches.push({ result: { packId: pack.packId, locale: pack.locale, item, match }, score, order })
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
