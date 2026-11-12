import type { GlossaryPack, LearningPack } from '../../platform/contracts'

export const botanyGlossaryPack: GlossaryPack = {
  packId: 'botany-basics',
  title: '植物観察の図鑑',
  description: '植物のつくりを学ぶ用語集です。',
  locale: 'ja-JP',
  schemaVersion: 1,
  contentVersion: '1.0.0',
  entries: [
    {
      id: 'botany:leaf-vein',
      title: '葉脈',
      aliases: ['ようみゃく'],
      reading: 'ようみゃく',
      category: '葉',
      shortDefinition: '葉の中を通る、筋のようなつくりです。',
      description: '葉脈は、葉の中に広がる筋のようなつくりです。水分などが通る道になります。',
    },
    {
      id: 'botany:photosynthesis',
      title: '光合成',
      aliases: ['こうごうせい'],
      reading: 'こうごうせい',
      category: '植物のはたらき',
      shortDefinition: '植物が光を使って養分を作るはたらきです。',
      description: '光合成は、植物が光のエネルギーを使い、水や二酸化炭素から養分を作るはたらきです。',
    },
    {
      id: 'botany:stomata',
      title: '気孔',
      aliases: ['きこう'],
      reading: 'きこう',
      category: '葉',
      shortDefinition: '葉の表面にあり、空気の出入りをする小さな穴です。',
      description: '気孔は葉の表面にある小さな穴です。空気の出入りや水分の放出に関わります。',
    },
  ],
}

export const botanyLearningPack: LearningPack = {
  packId: 'botany-basics',
  title: '植物の基本',
  description: '植物の葉のつくりと、光を使ったはたらきを学びます。',
  locale: 'ja-JP',
  schemaVersion: 1,
  contentVersion: '1.0.0',
  courses: [{
    id: 'plant-observation',
    title: '植物を観察しよう',
    description: '身近な植物の葉を手がかりに、基本のつくりを学ぶコースです。',
    lessons: [
      {
        id: 'leaf-structure',
        title: '葉のつくりを見よう',
        summary: '葉の筋や小さな穴の役割を学びます。',
        blocks: [
          {
            type: 'paragraph',
            segments: [
              { type: 'text', text: '葉の中には、筋のように広がる' },
              { type: 'term', reference: { id: 'botany:leaf-vein', label: '葉脈', shortDefinition: '葉の中を通る、筋のようなつくりです。' } },
              { type: 'text', text: 'があります。葉の表面には、空気が出入りする' },
              { type: 'term', reference: { id: 'botany:stomata', label: '気孔', shortDefinition: '葉の表面にあり、空気の出入りをする小さな穴です。' } },
              { type: 'text', text: 'もあります。' },
            ],
          },
          {
            type: 'callout',
            title: '観察のポイント',
            segments: [{ type: 'text', text: '葉の表と裏を見比べ、筋や小さな穴を探してみましょう。' }],
          },
        ],
      },
      {
        id: 'making-nutrients',
        title: '植物が養分を作るしくみ',
        summary: '光を使って養分を作るはたらきを学びます。',
        blocks: [{
          type: 'paragraph',
          segments: [
            { type: 'term', reference: { id: 'botany:photosynthesis', label: '光合成', shortDefinition: '植物が光を使って養分を作るはたらきです。' } },
            { type: 'text', text: 'では、植物は光のエネルギーを使って養分を作ります。葉はそのはたらきをする大切な場所です。' },
          ],
        }],
      },
    ],
    quizzes: [{
      id: 'plant-check',
      title: '植物の基本チェック',
      description: '葉のつくりとはたらきを確認します。',
      questions: [{
        id: 'leaf-vein-check',
        prompt: [{ type: 'text', text: '葉の中を筋のように通るつくりはどれですか？' }],
        options: [
          { id: 'stomata', segments: [{ type: 'text', text: '気孔' }] },
          { id: 'vein', segments: [{ type: 'text', text: '葉脈' }] },
          { id: 'root', segments: [{ type: 'text', text: '根' }] },
        ],
        correctOptionId: 'vein',
        explanation: [
          { type: 'term', reference: { id: 'botany:leaf-vein', label: '葉脈', shortDefinition: '葉の中を通る、筋のようなつくりです。' } },
          { type: 'text', text: 'は葉の中に広がる筋のようなつくりです。' },
        ],
        reviewLessonId: 'leaf-structure',
      }],
    }],
  }],
}
