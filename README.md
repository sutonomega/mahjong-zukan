# 麻雀図鑑

初心者向けに、麻雀の役・用語をひとつにまとめる図鑑サイトです。初期データは、プロジェクトフォルダーの1階層上に置いた `麻雀説明.xlsx` から取り込んでいます。このExcelファイルはリポジトリには含まれません。

## 使い方

学習コースの始め方、用語の調べ方、進捗の保存については[使い方ガイド](docs/user-guide.md)を確認してください。環境構築、コンテンツ更新、公開の手順は[開発・公開手順](docs/development-and-release.md)を確認してください。

## 開発

Node.js 24 と npm を用意して、プロジェクトのフォルダーで実行します。

```bash
npm install
npm run dev
```

本番用ビルドは次のコマンドで確認できます。

```bash
npm run build
```

## 初期データ

- Excelのシート「役一覧」から45件
- Excelのシート「用語一覧」から228件
- Excelのシート「図」の参考URL 2件

取り込んだ行は `src/data/mahjongData.json` に元の列名・値を保持しています。画面用の名前、読み方、説明などは `src/data/entries.ts` で元データから参照しています。Excelにない例、難易度、学習STEP、関連項目を初期データに追加していません。

通常の開発やビルドにExcelファイルは必要ありません。ExcelからJSONを再生成する場合のみ、Python 3と `openpyxl` が必要です。`麻雀説明.xlsx` をプロジェクトフォルダーの1階層上に置き、次のコマンドを実行します。

```bash
python -m pip install openpyxl
python scripts/import_excel.py
```

生成先は `src/data/mahjongData.json` です。差分を確認してから取り込み結果を反映してください。変換スクリプトは元のExcelファイルを変更しません。

## GitHub Pages

`.github/workflows/deploy.yml` が `main` ブランチへのpushをビルドし、GitHub Pagesにデプロイします。GitHubリポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。詳しい公開確認手順は[開発・公開手順](docs/development-and-release.md)を参照してください。

## 現在の段階

- Excelの役・用語を検索、種類・カテゴリで絞り込み
- Excelに記載された項目を詳細画面で原文表示
- 習得済み状態と進捗率をブラウザ内に保存
- 参考URLを表示（参照先画像の転載なし）

麻雀ルールの内容確認、学習STEP、独自の初心者向け説明や具体例は、Excel由来の情報と区別できる形で今後追加します。
