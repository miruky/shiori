# shiori

[![CI](https://github.com/miruky/shiori/actions/workflows/ci.yml/badge.svg)](https://github.com/miruky/shiori/actions/workflows/ci.yml)
[![Deploy](https://github.com/miruky/shiori/actions/workflows/deploy.yml/badge.svg)](https://github.com/miruky/shiori/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Test](https://img.shields.io/badge/Test-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**書籍の一節を、禁則処理まで効いた組版のSVG引用カードにするジェネレータです。**

## 概要

引用文と出典(書名・著者)を入れると、文章量に応じてフォントサイズを自動で決め、行頭の句読点のぶら下げや開き括弧の送り出しといった禁則処理を効かせて折り返した引用カードを組みます。横書きと縦書きの両方に対応し、縦書きでは句読点・括弧・長音を縦書き用の字形に置き換えます。サイズはOGP(1200x630)・正方形・縦長の3種、配色は生成り・藍・墨など6種から選べます。

出力はSVGとPNGのダウンロード、またはSVGソースのコピーです。プレビューに見えているものがそのまま書き出されます。入力内容はlocalStorageに保存され、次に開いたとき復元されます。

試す: https://miruky.github.io/shiori/

### なぜ作ったのか

読んだ本の一節を共有するとき、スクリーンショットでは粗く、プレーンテキストでは素っ気ない。画像生成サービスはたいてい英文組版が前提で、日本語の禁則や縦書きが崩れます。句読点が行頭に来ない、開き括弧が行末に残らない、縦書きなら約物が縦用の字形になる、という当たり前の組版を備えた引用カードが欲しくて作りました。

## 使い方

- 引用文・書名・著者を入力すると、右のプレビューが即座に更新されます
- 「組み」で横書き・縦書き、「サイズ」で用途(OGP・正方形・縦長)、「書体」で明朝・ゴシックを選びます
- 配色は6種。いずれも低彩度の地に一点の効かせ色という構成です
- 「SVGをダウンロード」「PNGをダウンロード」「SVGをコピー」で書き出します

SVGはフォントを埋め込まないため、表示には閲覧環境の日本語フォントが使われます。確実に見た目を固定したい場合はPNGで書き出してください。長すぎる引用は最小フォントサイズでも収まらない場合に末尾が省略されます。

## アーキテクチャ

![shioriのアーキテクチャ](docs/architecture.svg)

カードの生成は `card.ts` の純粋関数で、入力(CardSpec)から完全なSVG文字列を返します。文章の折り返しは `wrap.ts` が担い、行頭・行末禁則とぶら下げ、縦書き字形への置き換えを文字単位で処理します。縦書きは1字ずつ `tspan` で座標を確定させる方式なので、SVGの `writing-mode` 対応がないPNG変換やRSSリーダー上でも崩れません。UI層の `app.ts` は入力値の保持とBlobの書き出しだけを行います。

## 技術スタック

| カテゴリ | 技術                 |
| :------- | :------------------- |
| 言語     | TypeScript 5(strict) |
| 描画     | 自前のSVG生成        |
| ビルド   | Vite 6               |
| テスト   | Vitest(22テスト)     |
| リンタ   | ESLint + Prettier    |
| CI / CD  | GitHub Actions       |
| 配信     | GitHub Pages         |

## プロジェクト構成

- `src/lib/wrap.ts` — 禁則処理つきの折り返しと縦書き字形への置き換え
- `src/lib/card.ts` — フォントサイズの採寸とSVGカードの組み立て
- `src/lib/palettes.ts` — 6種の配色定義
- `src/app.ts` — フォーム・ライブプレビュー・SVG/PNG書き出し
- `docs/architecture.svg` — アーキテクチャ図

## はじめ方

### 前提条件

- Node.js 20 以上

### セットアップ

```bash
git clone https://github.com/miruky/shiori.git
cd shiori
npm ci
npm run dev
```

### テストとlint

```bash
npm test
npm run lint
```

### ビルド

```bash
npm run build
```

GitHub Pagesへは `main` へのpushで自動デプロイされます。サブパス配信のため、ワークフローでは環境変数 `SHIORI_BASE=/shiori/` を渡してViteの `base` を切り替えています。

## 設計方針

- **組版を妥協しない**: 字数で機械的に切らず、句読点のぶら下げと開き括弧の送り出しを行います。縦書きでは約物を縦書き用字形へ置き換え、長音は縦線にします。この規則群はすべて単体テストで固定しています。
- **採寸してから組む**: 文章量とカード寸法からフォントサイズを大きい順に試し、収まる最大の字で組みます。「文字が小さすぎる」か「はみ出す」かの二択を避けるための設計です。
- **見たままを書き出す**: プレビューと出力は同じ関数の戻り値です。PNGはそのSVGをcanvasに描いて変換するだけなので、プレビューと食い違いません。
- **道具は無彩色に**: ツール側のUIから彩度を抜き、ユーザーが選んだカードの配色だけが目に入るようにしています。

## ライセンス

[MIT](LICENSE)
