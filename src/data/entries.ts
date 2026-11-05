import importedData from './mahjongData.json'

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
  source: RoleSource
  name: string
  reading: string
  explanation: string
}

export type TermEntry = {
  id: string
  type: '用語'
  source: TermSource
  name: string
  reading: string
  explanation: string
}

export type Entry = RoleEntry | TermEntry

const roles: RoleEntry[] = importedData.roles.map((record) => ({
  id: record.id,
  type: '役',
  source: record.source,
  name: record.source.役名,
  reading: record.source.読み方,
  explanation: record.source.説明,
}))

const terms: TermEntry[] = importedData.terms.map((record) => ({
  id: record.id,
  type: '用語',
  source: record.source,
  name: record.source.用語,
  reading: record.source.読み方,
  explanation: record.source.説明,
}))

export const entries: Entry[] = [...roles, ...terms]
export const references = importedData.provenance.references

export function getCategory(entry: Entry): string {
  return entry.type === '役' ? '役' : entry.source.カテゴリ
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

export function matchesEntryQuery(entry: Entry, rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery)
  if (!query) return true

  const searchableFields = entry.type === '役'
    ? [entry.name, entry.reading, entry.explanation, entry.source['翻数（ハンスウ）'], entry.source.鳴き]
    : [entry.name, entry.reading, entry.explanation, entry.source.カテゴリ]
  const normalizedFields = searchableFields.map(normalizeSearchText)

  if (normalizedFields.some((field) => field.includes(query))) return true

  if (query.length < 3 || query.length > 12) return false

  const fuzzyFields = entry.type === '役'
    ? [entry.name, entry.reading]
    : [entry.name, entry.reading, entry.source.カテゴリ]

  return fuzzyFields.some((field) => containsOneEditMatch(query, normalizeSearchText(field)))
}
