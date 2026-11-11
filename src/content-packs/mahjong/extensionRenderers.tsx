import type { ReactNode } from 'react'
import type { LessonExtension } from '../../platform/contracts'
import MahjongTileDiagrams from './MahjongTileDiagrams'

export const mahjongExtensionRenderers: Record<string, (extension: LessonExtension) => ReactNode> = {
  'mahjong.tile-families': (extension) => <MahjongTileDiagrams extension={extension} />,
  'mahjong.winning-hand': (extension) => <MahjongTileDiagrams extension={extension} />,
  'mahjong.yaku-hands': (extension) => <MahjongTileDiagrams extension={extension} />,
}
