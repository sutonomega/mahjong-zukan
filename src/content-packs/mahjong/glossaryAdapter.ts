import type { GlossaryReference } from '../../platform/contracts'

const MAHJONG_NAMESPACE = 'mahjong:'

export function resolveMahjongGlossaryEntryId(reference: GlossaryReference): string | null {
  if (!reference.id.startsWith(MAHJONG_NAMESPACE)) return null
  return reference.id.slice(MAHJONG_NAMESPACE.length)
}
