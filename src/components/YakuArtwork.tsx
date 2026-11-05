type YakuArtworkProps = {
  number: number
  han: string
}

const accents = [
  { background: '#edf3e8', disc: '#d5e5c9', ink: '#39715b', tile: '#fffdf6' },
  { background: '#edf1f7', disc: '#d8e2f0', ink: '#496e9a', tile: '#fffdf8' },
  { background: '#f7f0e4', disc: '#ebdbb9', ink: '#a36c2d', tile: '#fffdf6' },
  { background: '#f1edf5', disc: '#dfd2eb', ink: '#765b91', tile: '#fffdf8' },
]

function getAccent(han: string) {
  if (han.includes('役満')) return accents[3]
  if (han.includes('6翻') || han.includes('5翻') || han.includes('3翻')) return accents[2]
  if (han.includes('2翻')) return accents[1]
  return accents[0]
}

function TileOrnament({ variant, ink }: { variant: number; ink: string }) {
  if (variant === 0) {
    return <g fill={ink}>
      <circle cx="0" cy="-8" r="3.2" /><circle cx="-8" cy="5" r="3.2" /><circle cx="8" cy="5" r="3.2" />
    </g>
  }

  if (variant === 1) {
    return <g fill="none" stroke={ink} strokeLinecap="round" strokeWidth="3">
      <path d="M-8-10v20M0-10v20M8-10v20" />
      <path d="M-11-7h6M-3 2h6M5-5h6" stroke="#c78b58" strokeWidth="2" />
    </g>
  }

  return <g fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0-12v24M-11-6l22 12M11-6L-11 6" />
    <circle cx="0" cy="0" r="3.5" fill="#c78b58" stroke="none" />
  </g>
}

export default function YakuArtwork({ number, han }: YakuArtworkProps) {
  const accent = getAccent(han)
  const tileRotations = [-11, 3, 13]
  const tileX = [73, 120, 167]

  return (
    <svg className="yaku-artwork" viewBox="0 0 240 112" role="img" aria-label={`${han}の役をイメージした牌のイラスト`}>
      <rect width="240" height="112" rx="12" fill={accent.background} />
      <circle cx="120" cy="56" r="43" fill={accent.disc} opacity=".72" />
      <circle cx="31" cy="28" r="2.5" fill={accent.ink} opacity=".45" />
      <circle cx="210" cy="79" r="3" fill="#c78b58" opacity=".58" />
      <path d="M39 77l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill={accent.ink} opacity=".38" />
      <path d="M198 28l1.5-4 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5z" fill="#c78b58" opacity=".65" />
      {tileX.map((x, index) => (
        <g key={x} transform={`translate(${x} 57) rotate(${tileRotations[index]})`}>
          <rect x="-17" y="-25" width="34" height="50" rx="5" fill="#20312c" opacity=".12" transform="translate(1 3)" />
          <rect x="-17" y="-27" width="34" height="50" rx="5" fill={accent.tile} stroke="#d8d9cf" />
          <rect x="-13" y="-23" width="26" height="42" rx="3" fill="none" stroke="#e9e7db" />
          <g transform={`translate(0 0)`}>
            <TileOrnament variant={(number + index) % 3} ink={accent.ink} />
          </g>
        </g>
      ))}
    </svg>
  )
}
