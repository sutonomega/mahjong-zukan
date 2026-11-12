# 麻雀図鑑

麻雀を初めて学ぶ人向けのWebサービスです。学習コースで基本を学び、図鑑で役や用語を調べられます。教材中の用語から図鑑の説明へ移動でき、詳細ページやレッスンはURLを共有して直接開けます。

## 主な機能

- 入門コースを順に学び、理解度チェックで確認
- 役・用語を名前、読み方、説明、カテゴリで検索・絞り込み
- 学習中の用語を選ぶと、短い説明を確認して図鑑の詳細へ移動
- コースの進捗と習得済み項目をブラウザー内に保存

## ドキュメント

- [使い方ガイド](docs/user-guide.md)：コース、図鑑、進捗、フィードバックの使い方
- [開発・公開・コンテンツ更新手順](docs/development-and-release.md)：環境構築、教材更新、GitHub Pagesへの公開
- [学習コンテンツ作成ガイド](docs/learning-content-authoring.md)：コースとレッスンの記述方法
- [実装書](docs/implementation.md)・[設計書](docs/design.md)：データとシステムの構成

## 開発環境

Node.js 24 と npm を用意し、リポジトリのルートで実行します。

```bash
npm install
npm run dev
```

本番用の型検査とビルドは次のコマンドで確認できます。

```bash
npm run build
```

## 初期データと教材

初期の役・用語データは、Excelの「役一覧」「用語一覧」シートから取り込んでいます。元データの値は `src/data/mahjongData.json` に保持し、画面用の表示名・読み方・説明などを `src/data/entries.ts` で扱います。Excelファイル自体はリポジトリに含まれません。

麻雀の学習コースは `src/content-packs/mahjong/`、共通の学習・図鑑機能は `src/platform/` に分けています。Excelから初期データを再生成する場合の手順と必要なファイルは[開発・公開・コンテンツ更新手順](docs/development-and-release.md)を確認してください。

## 公開

日常の変更は `dev` を基準にPull Requestで確認します。`main` への反映で `.github/workflows/deploy.yml` がGitHub Pagesへ自動公開します。公開前チェックと公開後の確認手順は[開発・公開・コンテンツ更新手順](docs/development-and-release.md)に記載しています。
