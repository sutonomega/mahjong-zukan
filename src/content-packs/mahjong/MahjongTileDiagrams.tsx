import type { JsonValue, LessonExtension } from '../../platform/contracts'

type TileFamily = {
  name: string
  reading: string
  category: string
  examples: string[]
  description: string
}

type HandGroup = {
  name: string
  tiles: string[]
  description: string
}

function isRecord(value: JsonValue | undefined): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: JsonValue | undefined): string | null {
  return typeof value === 'string' ? value : null
}

function readStringArray(value: JsonValue | undefined): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return null
  return value
}

function readTileFamilies(extension: LessonExtension): TileFamily[] | null {
  if (!isRecord(extension.payload) || !Array.isArray(extension.payload.families)) return null
  const families: TileFamily[] = []
  for (const item of extension.payload.families) {
    if (!isRecord(item)) return null
    const name = readString(item.name)
    const reading = readString(item.reading)
    const category = readString(item.category)
    const examples = readStringArray(item.examples)
    const description = readString(item.description)
    if (!name || !reading || !category || !examples?.length || !description) return null
    families.push({ name, reading, category, examples, description })
  }
  return families.length ? families : null
}

function readHandGroups(extension: LessonExtension): { groups: HandGroup[]; pair: HandGroup } | null {
  if (!isRecord(extension.payload) || !Array.isArray(extension.payload.groups) || !isRecord(extension.payload.pair)) return null
  const groups: HandGroup[] = []
  for (const item of extension.payload.groups) {
    if (!isRecord(item)) return null
    const name = readString(item.name)
    const tiles = readStringArray(item.tiles)
    const description = readString(item.description)
    if (!name || !tiles || tiles.length !== 3 || !description) return null
    groups.push({ name, tiles, description })
  }
  const pairName = readString(extension.payload.pair.name)
  const pairTiles = readStringArray(extension.payload.pair.tiles)
  const pairDescription = readString(extension.payload.pair.description)
  if (!pairName || !pairTiles || pairTiles.length !== 2 || !pairDescription || groups.length !== 4) return null
  return { groups, pair: { name: pairName, tiles: pairTiles, description: pairDescription } }
}

function TileFaces({ tiles }: { tiles: string[] }) {
  return <div className="mahjong-tile-faces" role="list">
    {tiles.map((tile, index) => <span className="mahjong-tile-face" key={tile + '-' + index} role="listitem">{tile}</span>)}
  </div>
}

function TileFamiliesDiagram({ families }: { families: TileFamily[] }) {
  const categories = [...new Set(families.map((family) => family.category))]
  return <figure aria-labelledby="mahjong-families-title" className="mahjong-diagram mahjong-families-diagram">
    <figcaption id="mahjong-families-title">麻雀の牌の種類</figcaption>
    {categories.map((category) => <section className="mahjong-family-category" key={category}>
      <h4>{category}</h4>
      <div className="mahjong-family-grid">
        {families.filter((family) => family.category === category).map((family) => <article className="mahjong-family-card" key={family.name}>
          <h5>{family.name}<span>{family.reading}</span></h5>
          <TileFaces tiles={family.examples} />
          <p>{family.description}</p>
        </article>)}
      </div>
    </section>)}
    <p className="mahjong-diagram-note">数牌は「萬子・筒子・索子」の3種類、字牌は「風牌・三元牌」に分かれます。</p>
  </figure>
}

function WinningHandDiagram({ groups, pair }: { groups: HandGroup[]; pair: HandGroup }) {
  return <figure aria-labelledby="mahjong-winning-hand-title" className="mahjong-diagram mahjong-winning-hand-diagram">
    <figcaption id="mahjong-winning-hand-title">アガリの基本形：3枚組4つ ＋ 雀頭1つ</figcaption>
    <ol className="mahjong-hand-groups">
      {groups.map((group, index) => <li className="mahjong-hand-group" key={group.name + '-' + index}>
        <span className="mahjong-group-name">{group.name}</span>
        <TileFaces tiles={group.tiles} />
        <span className="mahjong-group-description">{group.description}</span>
      </li>)}
    </ol>
    <div className="mahjong-pair-group">
      <span className="mahjong-group-name">{pair.name}</span>
      <TileFaces tiles={pair.tiles} />
      <span className="mahjong-group-description">{pair.description}</span>
    </div>
    <p className="mahjong-diagram-note">この例では、順子3つと刻子1つで3枚組を4つ作り、東2枚を雀頭にしています。</p>
  </figure>
}

export default function MahjongTileDiagrams({ extension }: { extension: LessonExtension }) {
  if (extension.schemaVersion !== 1) return null

  if (extension.rendererId === 'mahjong.tile-families') {
    const families = readTileFamilies(extension)
    return families ? <TileFamiliesDiagram families={families} /> : null
  }

  if (extension.rendererId === 'mahjong.winning-hand') {
    const hand = readHandGroups(extension)
    return hand ? <WinningHandDiagram groups={hand.groups} pair={hand.pair} /> : null
  }

  return null
}
