import type { LearningPack } from '../../platform/contracts'

export const mahjongBeginnerPack: LearningPack = {
  packId: 'mahjong-basics',
  title: '麻雀の基本',
  description: '牌の見方から、1局の進み方、アガリの形までを順番に学ぶ入門コースです。',
  locale: 'ja-JP',
  schemaVersion: 1,
  contentVersion: '1.0.0',
  courses: [{
    id: 'first-steps',
    title: 'はじめての麻雀',
    description: 'まずは麻雀の全体像をつかみましょう。全3レッスン、いつでも自分のペースで進められます。',
    lessons: [
      {
        id: 'tiles-and-hand',
        title: '牌と手牌を知ろう',
        summary: '麻雀で使う牌と、自分の前に並べる牌を知ります。',
        blocks: [
          { type: 'paragraph', segments: [
            { type: 'text', text: '麻雀では、絵柄のついた牌を組み合わせてアガリを目指します。自分が持っている牌のまとまりを' },
            { type: 'term', reference: { id: 'mahjong:term-066', label: '牌', shortDefinition: '麻雀で使う、絵柄や数字が描かれた道具です。' } },
            { type: 'text', text: 'といい、自分の前にある牌を' },
            { type: 'term', reference: { id: 'mahjong:term-068', label: '手牌', shortDefinition: '自分の手元でそろえていく牌の集まりです。' } },
            { type: 'text', text: 'といいます。' },
          ] },
          { type: 'callout', title: 'このレッスンのポイント', segments: [
            { type: 'text', text: '最初は牌の名前を全部覚えなくても大丈夫。まずは「牌を集めて形を作るゲーム」とつかめば十分です。' },
          ] },
        ],
      },
      {
        id: 'turns-and-discard',
        title: '順番に牌を引いて、1枚捨てる',
        summary: '自分の番に何をするのかを見てみます。',
        blocks: [
          { type: 'paragraph', segments: [
            { type: 'text', text: 'ゲームが始まると、各プレイヤーは最初の' },
            { type: 'term', reference: { id: 'mahjong:term-067', label: '配牌', shortDefinition: 'ゲーム開始時に各プレイヤーへ配られる牌です。' } },
            { type: 'text', text: 'を受け取ります。その後は順番に牌を引き、手牌から1枚を' },
            { type: 'term', reference: { id: 'mahjong:term-118', label: '捨てる', shortDefinition: '手牌から選んだ牌を場に出すことです。' } },
            { type: 'text', text: 'ことを繰り返します。' },
          ] },
          { type: 'callout', title: '覚えておこう', segments: [
            { type: 'text', text: '「引く」「1枚選んで捨てる」を繰り返しながら、アガリに近づく牌を残していきます。' },
          ] },
        ],
      },
      {
        id: 'winning-shape',
        title: 'アガリの形を作ろう',
        summary: '牌の組み合わせと、アガリに必要な役の入口を学びます。',
        blocks: [
          { type: 'paragraph', segments: [
            { type: 'text', text: '基本のアガリは、同じ牌3枚の組や数字が続く3枚の組を4つと、同じ牌2枚の組を1つ作る形です。最後に必要な牌がそろうと' },
            { type: 'term', reference: { id: 'mahjong:term-155', label: '和了（アガリ）', shortDefinition: '必要な形と条件を満たして、局に勝つことです。' } },
            { type: 'text', text: 'になります。' },
          ] },
          { type: 'paragraph', segments: [
            { type: 'text', text: 'ただし、形がそろうだけではアガれないルールがあります。アガリには、決められた条件である' },
            { type: 'term', reference: { id: 'mahjong:term-052', label: '役', shortDefinition: 'アガリを成立させるために必要な条件や組み合わせです。' } },
            { type: 'text', text: 'が必要です。次のコースでは、まず覚えやすい役から見ていきましょう。' },
          ] },
        ],
      },
    ],
  }],
}
