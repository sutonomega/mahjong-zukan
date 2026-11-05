export type SuitedTileReading = {
  title: string
  tiles: readonly { tile: string; reading: string }[]
}

export const suitedTileReadings: Record<string, SuitedTileReading> = {
  'term-089': {
    title: '萬子の読み方',
    tiles: [
      { tile: '一萬', reading: 'イーワン' },
      { tile: '二萬', reading: 'リャンワン' },
      { tile: '三萬', reading: 'サンワン' },
      { tile: '四萬', reading: 'スーワン' },
      { tile: '五萬', reading: 'ウーワン' },
      { tile: '六萬', reading: 'ローワン' },
      { tile: '七萬', reading: 'チーワン' },
      { tile: '八萬', reading: 'パーワン' },
      { tile: '九萬', reading: 'キューワン' },
    ],
  },
  'term-088': {
    title: '筒子の読み方',
    tiles: [
      { tile: '一筒', reading: 'イーピン' },
      { tile: '二筒', reading: 'リャンピン' },
      { tile: '三筒', reading: 'サンピン' },
      { tile: '四筒', reading: 'スーピン' },
      { tile: '五筒', reading: 'ウーピン' },
      { tile: '六筒', reading: 'ローピン' },
      { tile: '七筒', reading: 'チーピン' },
      { tile: '八筒', reading: 'パーピン' },
      { tile: '九筒', reading: 'キューピン' },
    ],
  },
  'term-090': {
    title: '索子の読み方',
    tiles: [
      { tile: '一索', reading: 'イーソー' },
      { tile: '二索', reading: 'リャンソー' },
      { tile: '三索', reading: 'サンソー' },
      { tile: '四索', reading: 'スーソー' },
      { tile: '五索', reading: 'ウーソー' },
      { tile: '六索', reading: 'ローソー' },
      { tile: '七索', reading: 'チーソー' },
      { tile: '八索', reading: 'パーソー' },
      { tile: '九索', reading: 'キューソー' },
    ],
  },
}
