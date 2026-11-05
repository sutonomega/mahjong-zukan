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

export function getSearchableText(entry: Entry): string {
  const shared = [entry.name, entry.reading, entry.explanation]
  return entry.type === '役'
    ? [...shared, entry.source['翻数（ハンスウ）'], entry.source.鳴き].join(' ')
    : [...shared, entry.source.カテゴリ].join(' ')
}
