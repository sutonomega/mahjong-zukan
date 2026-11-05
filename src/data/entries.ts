import importedData from './mahjongData.json'
import { supplementalTerms } from './supplementalTerms'

type RoleSource = {
  No: number
  役名: string
  読み方: string
  説明: string
  '翻数（ハンスウ）': string
  鳴き: string
}

type TermSource = {
  No: number
  カテゴリ: string
  用語: string
  読み方: string
  説明: string
}

export type RoleEntry = {
  id: string
  type: '役'
  origin: 'excel'
  source: RoleSource
  name: string
  reading: string
  explanation: string
}

export type TermEntry = {
  id: string
  type: '用語'
  origin: 'excel' | 'supplemental'
  source: TermSource
  name: string
  displayName: string
  reading: string
  explanation: string
}

export type Entry = RoleEntry | TermEntry

// Display overrides for imported and supplemental entries; original values remain in `source`.
const termDisplayNames: Record<string, string> = {
  'term-078': '和了牌',
  'term-094': '客風',
  'term-095': '客風牌',
  'term-114': '槓裏',
  'term-119': '自摸切り',
  'term-120': '碰',
  'term-121': '吃',
  'term-122': '明槓（行為）',
  'term-123': '暗槓（行為）',
  'term-126': '空槓',
  'term-127': '錯碰',
  'term-128': '錯吃',
  'term-129': '錯槓',
  'term-136': '門前役',
  'term-140': '喰い断么九',
  'term-170': '栄和',
  'term-183': '延べ単騎',
  'term-191': '即立直',
  'term-198': '空聴',
  'term-199': '吃聴',
  'term-206': '筋を追う',
  'term-207': '降りる',
  'term-209': '突っ張る',
  'term-213': '筋追い',
  'term-225': '四暗刻単騎',
  'term-supplement-kan': '槓',
}

const termDisplayReadings: Record<string, string> = {
  'term-066': 'パイ／ハイ',
}

const termDisplayExplanations: Record<string, string> = {
  'term-110': 'アガった場合に、ドラを持っていれば1枚で1翻（ファン、ハン）加算される特別な牌。一般的に懸賞牌とも言う。役は付かない。',
}

const roles: RoleEntry[] = importedData.roles.map((record) => ({
  id: record.id,
  type: '役',
  origin: 'excel',
  source: record.source,
  name: record.source.役名,
  reading: record.source.読み方,
  explanation: record.source.説明,
}))

const terms: TermEntry[] = importedData.terms.map((record) => ({
  id: record.id,
  type: '用語',
  origin: 'excel',
  source: record.source,
  name: record.source.用語,
  displayName: termDisplayNames[record.id] ?? record.source.用語,
  reading: termDisplayReadings[record.id] ?? record.source.読み方,
  explanation: record.source.説明,
}))

const addedTerms: TermEntry[] = supplementalTerms.map((record) => ({
  id: record.id,
  type: '用語',
  origin: 'supplemental',
  source: record.source,
  name: record.source.用語,
  displayName: termDisplayNames[record.id] ?? record.source.用語,
  reading: record.source.読み方,
  explanation: record.source.説明,
}))

export const entries: Entry[] = [...roles, ...terms, ...addedTerms]
export const references = importedData.provenance.references

export function getCategory(entry: Entry): string {
  return entry.type === '役' ? '役' : entry.source.カテゴリ
}

export function getDisplayName(entry: Entry): string {
  return entry.type === '役' ? entry.name : entry.displayName
}

export function getDisplayLabel(entry: Entry): string {
  const name = getDisplayName(entry)
  return name.normalize('NFKC') === entry.reading.normalize('NFKC') ? name : `${name}（${entry.reading}）`
}

export function getEntryExplanation(entry: Entry): string {
  const explanation = entry.type === '用語' ? termDisplayExplanations[entry.id] ?? entry.explanation : entry.explanation
  return explanation || 'Excelに説明の記載はありません。'
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
    .replace(/[\s\u3000・･、。，,.!?！？：:()（）「」『』【】\[\]]/g, '')
}

function isWithinOneEdit(query: string, candidate: string): boolean {
  if (Math.abs(query.length - candidate.length) > 1) return false

  let queryIndex = 0
  let candidateIndex = 0
  let edits = 0

  while (queryIndex < query.length && candidateIndex < candidate.length) {
    if (query[queryIndex] === candidate[candidateIndex]) {
      queryIndex += 1
      candidateIndex += 1
      continue
    }

    edits += 1
    if (edits > 1) return false

    if (query.length > candidate.length) queryIndex += 1
    else if (candidate.length > query.length) candidateIndex += 1
    else {
      queryIndex += 1
      candidateIndex += 1
    }
  }

  if (queryIndex < query.length || candidateIndex < candidate.length) edits += 1
  return edits <= 1
}

function containsOneEditMatch(query: string, text: string): boolean {
  const minLength = query.length - 1
  const maxLength = query.length + 1

  for (let start = 0; start < text.length; start += 1) {
    for (let length = minLength; length <= maxLength; length += 1) {
      if (start + length > text.length) continue
      if (isWithinOneEdit(query, text.slice(start, start + length))) return true
    }
  }

  return false
}

export type EntrySearchMatch = 'exact-title' | 'suggested-title' | 'related-description' | null

export function classifyEntryQuery(entry: Entry, rawQuery: string): EntrySearchMatch {
  const query = normalizeSearchText(rawQuery)
  if (!query) return null

  const titleFields = [entry.name, entry.type === '用語' ? entry.displayName : entry.name, entry.reading].map(normalizeSearchText)
  if (titleFields.some((field) => field === query)) return 'exact-title'

  const titleContainsQuery = titleFields.some((field) => field.includes(query))
  const titleIsClose = query.length >= 3 && query.length <= 12
    && titleFields.some((field) => containsOneEditMatch(query, field))
  if (titleContainsQuery || titleIsClose) return 'suggested-title'

  if (normalizeSearchText(entry.explanation).includes(query)) return 'related-description'
  return null
}
