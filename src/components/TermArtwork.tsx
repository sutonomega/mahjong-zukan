type TermArtworkProps = {
  category: string
  number: number
}

type SymbolKind = 'cycle' | 'compass' | 'people' | 'rules' | 'coin' | 'tile' | 'sparkle' | 'exchange' | 'link' | 'open' | 'groups' | 'win' | 'target' | 'flag' | 'lines' | 'warning' | 'question'

const categories: Record<string, SymbolKind> = {
  ゲーム単位: 'cycle',
  場: 'compass',
  プレイヤー名称: 'people',
  ゲームルール: 'rules',
  点数系: 'coin',
  牌系: 'tile',
  ドラ系: 'sparkle',
  ツモと捨て牌: 'exchange',
  鳴き: 'link',
  'メンゼン／食い系': 'open',
  牌の組み合わせ: 'groups',
  アガり系: 'win',
  待ち系: 'target',
  '立直／テンパイ系': 'flag',
  スジ系: 'lines',
  戦術系: 'compass',
  ペナルティー: 'warning',
  役: 'win',
  その他: 'question',
}

const palettes = [
  { background: '#edf3e8', disc: '#d5e5c9', ink: '#39715b', tile: '#fffdf6' },
  { background: '#edf1f7', disc: '#d8e2f0', ink: '#496e9a', tile: '#fffdf8' },
  { background: '#f7f0e4', disc: '#ebdbb9', ink: '#a36c2d', tile: '#fffdf6' },
  { background: '#f1edf5', disc: '#dfd2eb', ink: '#765b91', tile: '#fffdf8' },
]

function Mark({ kind, ink }: { kind: SymbolKind; ink: string }) {
  const shared = { fill: 'none', stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (kind) {
    case 'cycle':
      return <g {...shared}><path d="M-12-3a13 13 0 0 1 22-5l3 3M13-11v6H7M12 3A13 13 0 0 1-10 8l-3-3M-13 11V5h6" /></g>
    case 'compass':
      return <g {...shared}><circle r="13" /><path d="m5-6-3 9-9 3 3-9z" fill={ink} stroke="none" /><circle r="2" fill="#c78b58" stroke="none" /></g>
    case 'people':
      return <g {...shared}><circle cx="-6" cy="-5" r="4" /><circle cx="7" cy="-3" r="3.5" /><path d="M-15 10c0-5 3-8 8-8s8 3 8 8M2 4c5-2 10 1 11 6" /></g>
    case 'rules':
      return <g {...shared}><path d="M-10-12h15l6 6v18h-21zM5-12v7h6M-5 0h11M-5 6h11" /></g>
    case 'coin':
      return <g {...shared}><circle r="12" /><circle r="8" /><path d="M-3-5c1-2 6-2 6 1 0 4-6 2-6 6 0 3 5 3 7 1M0-8v16" /></g>
    case 'tile':
      return <g {...shared}><rect x="-10" y="-14" width="20" height="28" rx="3" /><path d="M-6-9h12M-6 9h12M-4-3v6M0-3v6M4-3v6" /></g>
    case 'sparkle':
      return <g fill={ink}><path d="M0-15 3-4 14 0 3 3 0 14-3 3-14 0-3-4z" /><circle cx="11" cy="-11" r="2" fill="#c78b58" /><circle cx="-12" cy="10" r="1.7" fill="#c78b58" /></g>
    case 'exchange':
      return <g {...shared}><path d="M-13-6h22l-4-4M13 6h-22l4 4M-13-6l4-4M13 6l-4 4" /></g>
    case 'link':
      return <g {...shared}><path d="M-4 4-7 7a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 0M4-4l3-3a5 5 0 0 1 7 7L8 6a5 5 0 0 1-7 0M-5 0h10" /></g>
    case 'open':
      return <g {...shared}><path d="M-12 12V-10a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v22M-4-5h8M-4 0h8" /><path d="M0 12V5" stroke="#c78b58" /></g>
    case 'groups':
      return <g {...shared}><circle cx="-7" cy="-7" r="5" /><circle cx="7" cy="-7" r="5" /><circle cx="-7" cy="7" r="5" /><circle cx="7" cy="7" r="5" /></g>
    case 'win':
      return <g {...shared}><path d="M0-14 4-5 14-4 6 2 9 12 0 7-9 12-6 2-14-4-4-5z" /><path d="m-4 0 3 3 6-7" stroke="#c78b58" /></g>
    case 'target':
      return <g {...shared}><circle r="13" /><circle r="7" /><circle r="2" fill="#c78b58" stroke="none" /><path d="m6-6 9-9M10-15h5v5" /></g>
    case 'flag':
      return <g {...shared}><path d="M-8 14V-14M-7-12h15l-3 5 3 5H-7" /><circle cx="-8" cy="-14" r="2" fill="#c78b58" stroke="none" /></g>
    case 'lines':
      return <g {...shared}><path d="M-13-9h26M-13 0h26M-13 9h26" /><circle cx="-4" cy="-9" r="2" fill="#c78b58" stroke="none" /></g>
    case 'warning':
      return <g {...shared}><path d="M0-14 14 11h-28z" /><path d="M0-5v7M0 7v.5" stroke="#c78b58" strokeWidth="3" /></g>
    default:
      return <g {...shared}><circle r="13" /><path d="M-4-4a4 4 0 1 1 7 3c-2 1-3 2-3 4M0 9v.5" /></g>
  }
}

export default function TermArtwork({ category, number }: TermArtworkProps) {
  const kind = categories[category] ?? 'question'
  const palette = palettes[[...category].reduce((sum, letter) => sum + letter.charCodeAt(0), number) % palettes.length]
  const sideOrnament = number % 2 === 0

  return (
    <svg className="term-artwork" viewBox="0 0 240 112" role="img" aria-label={`${category}カテゴリの用語イラスト`}>
      <rect width="240" height="112" rx="12" fill={palette.background} />
      <circle cx="120" cy="56" r="44" fill={palette.disc} opacity=".72" />
      <circle cx="31" cy="28" r="2.5" fill={palette.ink} opacity=".45" />
      <circle cx="210" cy="79" r="3" fill="#c78b58" opacity=".58" />
      <g transform="translate(73 57) rotate(-11)">
        <rect x="-15" y="-23" width="30" height="46" rx="5" fill="#20312c" opacity=".12" transform="translate(1 3)" />
        <rect x="-15" y="-25" width="30" height="46" rx="5" fill={palette.tile} stroke="#d8d9cf" />
        <path d={sideOrnament ? 'M-6-7h12M-6 0h12M-6 7h12' : 'M0-9v18M-7-4l14 8M7-4-7 4'} fill="none" stroke={palette.ink} strokeWidth="2.2" strokeLinecap="round" />
      </g>
      <g transform="translate(167 57) rotate(11)">
        <rect x="-15" y="-23" width="30" height="46" rx="5" fill="#20312c" opacity=".12" transform="translate(1 3)" />
        <rect x="-15" y="-25" width="30" height="46" rx="5" fill={palette.tile} stroke="#d8d9cf" />
        <circle cx="0" cy="-5" r="3" fill={palette.ink} />
        <circle cx="-5" cy="5" r="2.5" fill="#c78b58" />
        <circle cx="5" cy="5" r="2.5" fill={palette.ink} />
      </g>
      <g transform="translate(120 57)">
        <rect x="-21" y="-31" width="42" height="62" rx="6" fill="#20312c" opacity=".14" transform="translate(1 3)" />
        <rect x="-21" y="-33" width="42" height="62" rx="6" fill={palette.tile} stroke="#d1d4c9" />
        <rect x="-16" y="-28" width="32" height="52" rx="4" fill="none" stroke="#e7e5d9" />
        <Mark kind={kind} ink={palette.ink} />
      </g>
    </svg>
  )
}
