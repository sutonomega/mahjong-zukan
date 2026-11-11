import type { LearningPack } from '../../platform/contracts'

export const mahjongBeginnerPack: LearningPack = {
  packId: 'mahjong-basics',
  title: '麻雀の基本',
  description: '牌の見方から、1局の進み方、役、アガリの形までを順番に学ぶ入門コースです。',
  locale: 'ja-JP',
  schemaVersion: 1,
  contentVersion: '1.0.0',
  courses: [{
    id: 'first-steps',
    title: 'はじめての麻雀',
    description: 'まずは麻雀の全体像をつかみましょう。全4レッスン、いつでも自分のペースで進められます。',
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
            { type: 'term', reference: { id: 'mahjong:term-117', label: '打牌', shortDefinition: '手牌から1枚選んで場に出すことです。' } },
            { type: 'text', text: 'します。これを繰り返しながら、アガリに近づく牌を残していきます。' },
          ] },
          { type: 'callout', title: '覚えておこう', segments: [
            { type: 'text', text: '「引く」「1枚選んで捨てる」を繰り返すのが、自分の番の基本です。' },
          ] },
        ],
      },
      {
        id: 'first-yaku',
        title: 'アガリには「役」が必要',
        summary: '形だけでなく、アガリを成立させる条件があることを知ります。',
        blocks: [
          { type: 'paragraph', segments: [
            { type: 'text', text: '麻雀では、牌の形がそろっただけではアガれません。アガリには、決められた条件である' },
            { type: 'term', reference: { id: 'mahjong:term-175', label: '手役', shortDefinition: '手牌の組み合わせなどによって成立する、アガリの条件です。' } },
            { type: 'text', text: 'が少なくとも1つ必要です。' },
          ] },
          { type: 'paragraph', segments: [
            { type: 'text', text: '最初に覚える役の例が' },
            { type: 'term', reference: { id: 'mahjong:yaku-001', label: '立直（リーチ）', shortDefinition: '門前でテンパイしたときに宣言できる役です。' } },
            { type: 'text', text: 'です。まずは「アガリには役が必要」と覚えましょう。' },
          ] },
        ],
      },
      {
        id: 'winning-shape',
        title: 'アガリの基本形を作ろう',
        summary: '3枚組4つと2枚組1つを目指す、基本の形を学びます。',
        blocks: [
          { type: 'paragraph', segments: [
            { type: 'text', text: '一般的なアガリの基本形は、3枚組を4つと、同じ牌2枚の組を1つ作る形です。数字が続く3枚組を' },
            { type: 'term', reference: { id: 'mahjong:term-146', label: '順子', shortDefinition: '同じ種類の数牌で、数字が続く3枚の組です。' } },
            { type: 'text', text: '、同じ牌3枚の組を' },
            { type: 'term', reference: { id: 'mahjong:term-147', label: '刻子', shortDefinition: '同じ種類の牌を3枚そろえた組です。' } },
            { type: 'text', text: 'と呼びます。2枚組は' },
            { type: 'term', reference: { id: 'mahjong:term-141', label: '雀頭', shortDefinition: 'アガリの形に使う、同じ牌2枚の組です。' } },
            { type: 'text', text: 'です。' },
          ] },
          { type: 'paragraph', segments: [
            { type: 'text', text: '必要な形と役がそろってアガることを' },
            { type: 'term', reference: { id: 'mahjong:term-155', label: '和了（アガリ）', shortDefinition: '決められた条件を満たして、局に勝つことです。' } },
            { type: 'text', text: 'といいます。まずはこの基本形を目標に、牌を集めていきましょう。' },
          ] },
        ],
      },
    ],
  }],
}
