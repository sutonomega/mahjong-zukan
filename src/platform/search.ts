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
type SearchNormalizer = NonNullable<SearchOptions['normalize']>
type SearchTokenizer = NonNullable<SearchOptions['tokenize']>
type DescriptionAliasIndex = Map<SearchableItem, Set<string>>

const descriptionAliasIndexes = new WeakMap<
  SearchablePack,
  WeakMap<SearchNormalizer, WeakMap<SearchTokenizer, DescriptionAliasIndex>>
>()

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

function getDescriptionAliasIndex(
  pack: SearchablePack,
  normalize: SearchNormalizer,
  tokenize: SearchTokenizer,
): DescriptionAliasIndex {
  let normalizerIndexes = descriptionAliasIndexes.get(pack)
  if (!normalizerIndexes) {
    normalizerIndexes = new WeakMap<SearchNormalizer, WeakMap<SearchTokenizer, DescriptionAliasIndex>>()
    descriptionAliasIndexes.set(pack, normalizerIndexes)
  }

  let tokenizerIndexes = normalizerIndexes.get(normalize)
  if (!tokenizerIndexes) {
    tokenizerIndexes = new WeakMap<SearchTokenizer, DescriptionAliasIndex>()
    normalizerIndexes.set(normalize, tokenizerIndexes)
  }

  const cached = tokenizerIndexes.get(tokenize)
  if (cached) return cached

  const referencedTerms = pack.items.map((item) => ({
    item,
    titles: splitVariants([item.title, ...(item.aliases ?? [])])
      .map((value) => normalize(value, pack.locale))
      .filter(Boolean),
    aliases: splitVariants([...(item.aliases ?? []), ...(item.readings ?? [])])
      .map((value) => normalize(value, pack.locale))
      .filter(Boolean),
  }))
  const index: DescriptionAliasIndex = new Map()

  for (const item of pack.items) {
    const descriptionPhrases = getTokenPhrases(tokenize(item.description ?? '', pack.locale))
    const aliases = new Set<string>()

    for (const referencedTerm of referencedTerms) {
      if (!referencedTerm.titles.some((title) => descriptionPhrases.has(title))) continue
      referencedTerm.aliases.forEach((alias) => aliases.add(alias))
    }

    index.set(item, aliases)
  }

  tokenizerIndexes.set(tokenize, index)
  return index
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

    const descriptionAliasesByItem = getDescriptionAliasIndex(pack, normalize, tokenize)
    for (const item of pack.items) {
      const titleTerms = splitVariants([item.title, ...(item.aliases ?? []), ...(item.readings ?? [])])
        .map((value) => normalize(value, pack.locale))
        .filter(Boolean)
      const metadataTerms = [item.category, ...(item.keywords ?? [])]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => normalize(value, pack.locale))
        .filter(Boolean)
      const descriptionTokens = tokenize(item.description ?? '', pack.locale)
      const descriptionAliases = descriptionAliasesByItem.get(item) ?? new Set<string>()
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
