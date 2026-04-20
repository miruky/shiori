# shiori

[![CI](https://github.com/miruky/shiori/actions/workflows/ci.yml/badge.svg)](https://github.com/miruky/shiori/actions/workflows/ci.yml)
[![Deploy](https://github.com/miruky/shiori/actions/workflows/deploy.yml/badge.svg)](https://github.com/miruky/shiori/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Test](https://img.shields.io/badge/Test-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**書籍の一節を、禁則処理まで効いた組版のSVG引用カードにするジェネレータです。**

## 概要

引用文と出典(書名・著者)を入れると、文章量に応じてフォントサイズを自動で決め、行頭の句読点のぶら下げや開き括弧の送り出しといった禁則処理を効かせて折り返した引用カードを組みます。横書きと縦書きの両方に対応し、縦書きでは句読点・括弧・長音を縦書き用の字形に置き換えます。サイズはOGP(1200x630)・正方形・縦長の3種、配色は生成り・藍・墨など9種、囲み罫は鉤括弧・罫囲み・なしから選べます。

出力はSVGとPNGのダウンロード、またはSVGソースのコピーです。プレビューに見えているものがそのまま書き出されます。入力内容はlocalStorageに保存されて次回復元され、同時にURLのハッシュにも書き込まれるので、リンクを送れば同じカードを相手の画面で開けます。著作権の切れた作品の一節を集めた例文ギャラリーから組み始めることもできます。

試す: https://miruky.github.io/shiori/

### なぜ作ったのか

読んだ本の一節を共有するとき、スクリーンショットでは粗く、プレーンテキストでは素っ気ない。画像生成サービスはたいてい英文組版が前提で、日本語の禁則や縦書きが崩れます。句読点が行頭に来ない、開き括弧が行末に残らない、縦書きなら約物が縦用の字形になる、という当たり前の組版を備えた引用カードが欲しくて作りました。

## 使い方

- 引用文・書名・著者を入力すると、右のプレビューが即座に更新されます
- 「組み」で横書き・縦書き、「サイズ」で用途(OGP・正方形・縦長)、「書体」で明朝・ゴシック、「罫」で囲みの体裁を選びます
- 配色は9種。いずれも低彩度の地に一点の効かせ色という構成です
- 「SVGを保存」「PNGを保存」「SVGをコピー」で書き出し、「共有リンク」で現在の設定を載せたURLをコピーします
- 例文ギャラリーから一節を選ぶと、その配色・組みごと設定に流し込まれます

入力欄の外では、キーボードからも操作できます。

| キー      | 動作                       |
| :-------- | :------------------------- |
| `S` / `P` | SVG / PNG を保存           |
| `C` / `L` | SVG / 共有リンク をコピー  |
| `V`       | 縦書き・横書きを切り替え   |
| `T`       | テーマ(自動・明・暗)を巡回 |
| `[` `]`   | 配色を前後に送る           |

SVGはフォントを埋め込まないため、表示には閲覧環境の日本語フォントが使われます。確実に見た目を固定したい場合はPNGで書き出してください。長すぎる引用は最小フォントサイズでも収まらない場合に末尾が省略されます。

## アーキテクチャ

![shioriのアーキテクチャ](docs/architecture.svg)

カードの生成は `card.ts` の純粋関数で、入力(CardSpec)から完全なSVG文字列を返します。文章の折り返しは `wrap.ts` が担い、行頭・行末禁則とぶら下げ、縦書き字形への置き換えを文字単位で処理します。縦書きは1字ずつ `tspan` で座標を確定させる方式なので、SVGの `writing-mode` 対応がないPNG変換やRSSリーダー上でも崩れません。UI層の `app.ts` は入力値の保持とBlobの書き出しを受け持ち、設定の検証(`normalizeSpec`)・テーマ解決(`theme.ts`)・URLハッシュへの符号化(`share.ts`)・例文(`samples.ts`)を組み合わせます。

## 技術スタック

| カテゴリ | 技術                 |
| :------- | :------------------- |
| 言語     | TypeScript 5(strict) |
| 描画     | 自前のSVG生成        |
| ビルド   | Vite 8               |
| テスト   | Vitest(42テスト)     |
| リンタ   | ESLint + Prettier    |
| CI / CD  | GitHub Actions       |
| 配信     | GitHub Pages         |

## プロジェクト構成

- `src/lib/wrap.ts` — 禁則処理つきの折り返しと縦書き字形への置き換え
- `src/lib/card.ts` — フォントサイズの採寸、囲み罫、SVGカードの組み立て、設定の検証
- `src/lib/palettes.ts` — 9種の和色配色定義
- `src/lib/samples.ts` — 著作権の切れた作品の例文
- `src/lib/theme.ts` — テーマ(自動・明・暗)解決の純粋関数
- `src/lib/share.ts` — 設定とURLハッシュの相互変換
- `src/app.ts` — フォーム・ライブプレビュー・テーマ・共有・SVG/PNG書き出し
- `docs/architecture.svg` — アーキテクチャ図

## はじめ方

### 前提条件

- Node.js 20.19 以上(または 22.12 以上)

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

- **組版を妥協しない**: 字数で機械的に切らず、句読点のぶら下げと開き括弧の送り出しを行います。縦書きでは約物を縦書き用字形へ置き換え、長音は縦線にし、2桁の半角数字は縦中横として横に寝かせて組みます。この規則群はすべて単体テストで固定しています。
- **採寸してから組む**: 文章量とカード寸法からフォントサイズを大きい順に試し、収まる最大の字で組みます。「文字が小さすぎる」か「はみ出す」かの二択を避けるための設計です。
- **見たままを書き出す**: プレビューと出力は同じ関数の戻り値です。PNGはそのSVGをcanvasに描いて変換するだけなので、プレビューと食い違いません。
- **道具は控えめに**: ツール側のUIは生成り色の地に臙脂を一点だけ置いた編集的なトーンにとどめ、ユーザーが選んだカードの配色を主役にします。罫線と余白で区切り、囲みの箱や影は使いません。
- **状態をURLに載せる**: 設定はlocalStorageに保存しつつ、同じ内容をURLのハッシュにも符号化します。リンクを共有すれば相手の画面で同じカードが開き、サーバーを介さずに状態を持ち運べます。

## ライセンス

[MIT](LICENSE)
