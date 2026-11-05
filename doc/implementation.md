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
  App.tsx                         一覧、検索、フィルター、詳細、進捗、画面遷移
  main.tsx                        Reactの起動点
  styles.css                      共通CSS、吹き出し、レスポンシブ表示
  components/
    GlossaryLinkedText.tsx        説明文整形と用語リンクの共通表示
    TermArtwork.tsx               用語カード用ローカルSVG
    YakuArtwork.tsx               役カード用ローカルSVG
  data/
    mahjongData.json              Excel取り込みデータ（役45件、用語228件、参考URL）
    entries.ts                    型、データ統合、表示補正、検索判定
    supplementalTerms.ts          Excelにない補足用語
    hanLevels.ts                  「翻」詳細に出す補足表
    suitedTileReadings.ts         萬子・筒子・索子の読み方表
doc/
  design.md                       サイトの設計と振る舞い
  implementation.md               この実装書
.github/workflows/deploy.yml       GitHub Pagesのビルド・デプロイ
vite.config.ts                     Vite設定
```

## 3. データモデルとデータの扱い

### Excel取り込みデータ

`src/data/mahjongData.json` がワークブックのスナップショット。元の日本語列名と値を保持する。`src/data/entries.ts` が画面で使いやすい形にマッピングする。

主な型は次のとおり。

- `RoleEntry`: `役名`、`読み方`、`説明`、`翻数（ハンスウ）`、`鳴き`を持つ役。
- `TermEntry`: `カテゴリ`、`用語`、`読み方`、`説明`を持つ用語。`origin` は `excel` または `supplemental`。
- `Entry`: `RoleEntry` と `TermEntry` の共用型。

各項目の `id` は一意の識別子として使う。表示名は重複する場合や表示補正があるため、進捗保存やリンクの識別子には使わない。

### 表示用補正

`entries.ts` 内の設定は、元データを変更せず画面上の表示だけを変える。

- `termDisplayNames`: 用語の漢字表記などの表示名。
- `termDisplayReadings`: 読み方の表示補正。「牌」は「パイ／ハイ」。
- `termDisplayExplanations`: 表示用の説明文補正。現在はドラの表記修正と、です・ます調だった3件の常体化など。

表示値を取得するときは `getDisplayName`、`getDisplayLabel`、`getEntryExplanation` を使う。画面ごとに別の表示規則を書かないことで、カード・詳細・検索リンク・吹き出しの表記をそろえる。

説明文の補正が必要な場合は、Excel JSONを書き換えず `termDisplayExplanations` にIDと表示文を追加する。これによりExcel由来の値は `entry.source` に残る。

### 補足用語の追加

Excelにない用語は `src/data/supplementalTerms.ts` に追加する。

1. 重複しないIDを決める。
2. `source` に `No`、`カテゴリ`、`用語`、`読み方`、`説明`を記入する。
3. 必要なら `entries.ts` の `termDisplayNames` に表示名を設定する。
4. `entries.ts` が `origin: 'supplemental'` を付けて、Excel項目と合わせて `entries` に登録する。

補足用語の `No` はカードイラスト用の連番で、ExcelのNoではない。現在の補足用語は229〜231を使っている。用語名や読み方が既存項目と重なる場合は、検索・用語リンクの候補が意図した項目を指すか確認する。

### 翻数表

「翻」の詳細ページに出る表データは `src/data/hanLevels.ts` に置く。行の追加・文言変更はここで行い、`App.tsx` に値を直書きしない。表はExcelデータとは別の補足情報として表示する。

### 数牌の読み方表

萬子・筒子・索子の詳細ページに出す読み方表は `src/data/suitedTileReadings.ts` に置く。データは用語ID（term-089、term-088、term-090）で参照し、各表に牌名と読み方を9組登録する。表示条件や表のレイアウトは `App.tsx`、共通テーブルの見た目は `src/styles.css` が担当する。読みの追加・修正はデータファイルで行い、Excel原文は変更しない。

## 4. 検索の実装

`entries.ts` の `classifyEntryQuery` が各項目を分類する。

1. 元の名前、表示名、読み方と検索語の完全一致。
2. タイトルまたは読み方の部分一致、または検索語3〜12文字で1文字分だけ異なる曖昧一致。
3. 説明文内の部分一致。

各項目には最優先の分類一つだけを返す。`App.tsx` 側で型・カテゴリのフィルターを適用し、「検索結果」「もしかして？」「関連する項目」を描画する。

`normalizeSearchText` はNFKC、小文字化、カタカナからひらがなへの変換、空白と一般的な句読点の除去を行う。変更時は漢字名・かな表記・説明文検索への影響を確認する。

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

画面状態は `App.tsx` で管理する。

- `query`、`typeFilter`、`categoryFilter`: 検索・絞り込み。
- `selectedId`: 詳細を開いている項目。
- `entryHistory`: 詳細画面間のIDとスクロール位置。
- `learned`: 習得済みの項目ID一覧。

進捗は `localStorage` の `mahjong-zukan-learned` にJSON配列として保存する。保存キーを変更する場合は、既存データの読み込み・移行を考慮する。

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

1. 変更する情報がExcel原文、補足データ、表示補正のどれに当たるか決める。
2. Excel由来の値を直す必要がある場合は、元Excelを根拠にJSONを再生成する。表示上の修正だけならoverrideを使う。
3. 用語追加は `supplementalTerms.ts`、翻数表は `hanLevels.ts` に追加する。
4. 表示処理は共通ヘルパー・`GlossaryLinkedText` を使い、カード・詳細・吹き出しを別実装にしない。
5. 検索を変える場合は、完全一致・部分一致・説明文一致・カテゴリ絞り込みを確認する。
6. カード・表・吹き出しを変える場合は、スマートフォン幅も確認する。
7. マージ前に `npm run build` を実行する。
8. GitHub Pagesへの公開は `main` へのマージ後、またはActionsの手動実行で行う。
