# 麻雀図鑑 — 実装書

この文書は、現在のコードの構成と変更方法を説明する。他の開発者が仕様と実装箇所を対応付けて、安全に修正できることを目的とする。

## 1. 技術とコマンド

- React 18、TypeScript 5、Vite 6。
- アイコンは `lucide-react`。
- 現在、ルーターやサーバーAPIは使っていない。

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` はTypeScriptのプロジェクトビルド後にViteで本番ビルドする。`package.json` にテスト用スクリプトはない。

## 2. ファイル構成

```text
src/
  App.tsx                         ホーム、学習コース選択、図鑑一覧・検索・フィルター・詳細、進捗と画面遷移
  main.tsx                        Reactの起動点
  styles.css                      共通CSS、吹き出し、レスポンシブ表示
  components/
    GlossaryLinkedText.tsx        説明文整形と用語リンクの共通表示
    TermArtwork.tsx               用語カード用ローカルSVG
    YakuArtwork.tsx               役カード用ローカルSVG
  data/
    entries.ts                    型、全役・用語データ、出典原文、レベル・カテゴリ、検索判定
    hanLevels.ts                  「翻」詳細に出す補足表
    suitedTileReadings.ts         萬子・筒子・索子の読み方表
  platform/
    CoursePlayer.tsx               共通コース表示、レッスン進捗
    progressStorage.ts             バージョン付きのコース進捗保存・復元
doc/
  design.md                       サイトの設計と振る舞い
  implementation.md               この実装書
.github/workflows/deploy.yml       GitHub Pagesのビルド・デプロイ
vite.config.ts                     Vite設定
```

## 3. データモデルとデータの扱い

### 統合項目データ

`src/data/entries.ts` の `entries` 配列を役・用語の唯一のデータ元として使う。全276件が同じファイルにあり、表示内容と学習分類を項目ごとに編集できる。

各項目は `id`、`type`、`origin`、`name`、`displayName`、`reading`、`explanation`、`level`、`category`、`sourceCategory`、`source` を持つ。`level` は取込元データとして保持するが、用語・役の画面分類や絞り込みには使わない。`category` は図鑑で使うカテゴリ。`sourceCategory` と `source` はExcel原文の確認用。補足用語は `origin: 'supplemental'` とする。

各項目の `id` は一意の識別子として使う。表示名は重複する場合や表示補正があるため、進捗保存やリンクの識別子には使わない。

役の詳細は `source` の翻数・鳴き情報をカテゴリタグと同じ大きさの補助タグで表示する。補助タグはカテゴリタグと区別できる配色にし、独立した見出しは置かない。

詳細画面の関連ワードは `GlossaryLinkedText.tsx` の共通解析結果から作る。説明文に実際にリンク表示される用語だけをチップにし、選択するとその用語の詳細を開く。

画面は `getDisplayName`、`getDisplayLabel`、`getEntryExplanation` を使って同じ項目データを参照する。表示名・読み方・説明を直す場合は、対象項目のフィールドを編集し、Excel原文の `source` は保持する。

### 補足用語の追加

Excelにない用語も `src/data/entries.ts` の `entries` 配列に追加する。

1. 重複しないIDを決める。
2. 表示名、読み方、説明、学習レベル、学習カテゴリを直接記入する。
3. Excel原文がない場合もカード表示用の `source` 情報を持たせ、`origin: 'supplemental'` を設定する。

補足用語の `No` はカードイラスト用の連番で、ExcelのNoではない。現在の補足用語は229〜231を使っている。用語名や読み方が既存項目と重なる場合は、検索・用語リンクの候補が意図した項目を指すか確認する。

### 翻数表

「翻」の詳細ページに出る表データは `src/data/hanLevels.ts` に置く。行の追加・文言変更はここで行い、`App.tsx` に値を直書きしない。表はExcelデータとは別の補足情報として表示する。

### 数牌の読み方表

萬子・筒子・索子の詳細ページに出す読み方表は `src/data/suitedTileReadings.ts` に置く。データは用語ID（term-089、term-088、term-090）で参照し、各表に牌名と読み方を9組登録する。表示条件や表のレイアウトは `App.tsx`、共通テーブルの見た目は `src/styles.css` が担当する。読みの追加・修正はデータファイルで行い、Excel原文は変更しない。

## 4. 検索の実装

`entries.ts` の `classifyEntryQuery` が各項目を分類する。

1. 元の名前、表示名、読み方と検索語の完全一致。スラッシュで並記された読み方は個別の候補にも分ける。
2. タイトルまたは読み方の部分一致、または検索語3〜12文字で1文字分だけ異なる曖昧一致。
3. 説明文内の部分一致。

各項目には最優先の分類一つだけを返す。`App.tsx` 側で学習記事・用語の検索結果と、図鑑の種類・カテゴリフィルターを適用し、「検索結果」「もしかして？」「関連する項目」を描画する。

`getEntryReadingVariants` は表示読み・元データの読みを取得し、スラッシュで区切られた各読みを個別候補にする。検索処理と用語リンク処理で共通利用する。`normalizeSearchText` はNFKC、小文字化、カタカナからひらがなへの変換、空白と一般的な句読点の除去を行う。変更時は漢字名・かな表記・説明文検索への影響を確認する。

## 5. 説明文と用語リンク

`src/components/GlossaryLinkedText.tsx` は `entries` から表示名、元の用語名、読み方の別名を作る。長い別名から順に説明文を分割し、該当用語をボタンとして表示する。

- `parseGlossaryText`: 元の文をテキストとリンク項目に分割する。
- `formatGlossaryText`: 吹き出し用に、リンク後と同じ表示文字列へ整形する。
- `getEntryExplanation`: カード、詳細、吹き出しで共通の説明データを返す。
- `getDisplayLabel`: 用語名と読み方を一つのラベルとして返す。同一文字列なら読みを重ねない。

修正時に維持する点：

- 吹き出しと詳細ページが同じ説明データ・整形結果を表示する。
- すでに「用語（読み）」と記載された箇所を一つのリンクにし、同じ読みの括弧を重複させない。
- 「場合」の「場」はリンクしない。
- 用語リンクのクリックは `App.tsx` の `openEntry` を使い、戻る履歴を残す。

## 6. 画面状態と進捗

画面状態は `App.tsx` と `CoursePlayer.tsx` で管理する。起動時は学習コース選択と図鑑一覧を含むホームを表示し、入門編を選ぶとコース画面へ移動する。

- `query`、`typeFilter`、`categoryFilter`: 図鑑の検索と絞り込み。用語・役の難易度絞り込みは行わない。
- `selectedId`: 詳細を開いている項目。
- `entryHistory`: 詳細画面間のIDとスクロール位置。
- `learned`: 図鑑で習得済みにした項目ID一覧。
- `CoursePlayer` の進捗: 完了レッスンIDと現在のレッスンID。図鑑の習得状態と独立して保存する。

### コース進捗の保存

`src/platform/progressStorage.ts` が、教材パック・コースごとの進捗を読み書きする。

- キーは `learning-platform:<packId>:<courseId>:v1`。IDをURLエンコードして衝突を防ぐ。
- 保存値は `schemaVersion`、`packId`、`courseId`、完了済みレッスンID、現在のレッスンIDを持つ。
- 読み込み時に既知のレッスンIDだけを採用し、未知IDや不正データは初期状態へ戻す。
- 旧形式（スキーマ情報がない進捗）は有効なレッスンIDを検証して読み込み、次回保存時に現行形式へ移行する。
- ブラウザー保存領域が利用できない、または容量不足の場合も、画面内の学習操作は続けられる。

### 図鑑の習得状態

図鑑の習得状態はコース進捗とは別の `mahjong-zukan-learned` キーで保存する。現行形式は `schemaVersion` と `learnedEntryIds` を持つ。従来のJSON配列も読み込み、既知の項目IDに絞って現行形式へ移行する。読み書きに失敗しても画面の操作を止めない。

カードは `<article>` にし、タイトルと「くわしく」をそれぞれボタンにしている。カード説明の用語リンクもボタンであるため、カード全体をボタンに戻すとHTML上のボタンの入れ子が発生する。

## 7. CSSとイラスト

レスポンシブ設定は `src/styles.css` にある。カード一覧は標準4列、900px以下で3列、620px以下で2列。吹き出しは `.glossary-term-link::after` が `data-tooltip` 属性を表示し、ホバーとキーボードフォーカスで現れる。

`TermArtwork.tsx` と `YakuArtwork.tsx` はローカルSVGを生成し、外部画像を取得しない。

## 8. GitHub Pages

`.github/workflows/deploy.yml` は `main` へのpushと手動実行で動く。Ubuntu 24.04、Node.js 24を使い、依存関係を入れた後に次を実行する。

```bash
npm run build -- --base=/${GITHUB_REPOSITORY#*/}
```

成果物 `dist` をアップロードしてGitHub Pagesへデプロイする。`vite.config.ts` の標準baseは `/` で、Actionsがリポジトリ名のパスに上書きする。`dev` へのpushだけではPagesデプロイは行われない。

## 9. 変更時の確認手順

1. `entries.ts` の対象項目を更新する。図鑑のカテゴリは同じ項目で管理し、難易度の表示や絞り込みは追加しない。
2. Excel由来項目の表示値を修正する場合は `source` 内の原文を保持する。
3. 用語追加は同じ `entries.ts` に記録する。翻数表は `hanLevels.ts`、数牌の読み方表は `suitedTileReadings.ts` に追加する。
4. 表示処理は共通ヘルパー・`GlossaryLinkedText` を使い、カード・詳細・吹き出しを別実装にしない。
5. 検索を変える場合は、完全一致・部分一致・説明文一致・カテゴリ絞り込みを確認する。
6. カード・表・吹き出しを変える場合は、スマートフォン幅も確認する。
7. 進捗保存を変更する場合は、再読み込み後の復元、複数パック・コース間の分離、未知IDや不正データ、保存不可の状態を確認する。
8. マージ前に `npm run build` を実行する。
8. GitHub Pagesへの公開は `main` へのマージ後、またはActionsの手動実行で行う。
