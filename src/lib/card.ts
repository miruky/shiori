// 引用カードのSVG生成。文字数とカード寸法から収まるフォントサイズを
// 探し、横書き・縦書きそれぞれの組みでSVG文字列を返す純粋関数。

import { paletteById } from './palettes';
import { toVerticalForm, wrapText } from './wrap';

export type CardLayout = 'horizontal' | 'vertical';
export type CardSize = 'ogp' | 'square' | 'portrait';
export type CardFont = 'mincho' | 'gothic';

export interface CardSpec {
  quote: string;
  title: string;
  author: string;
  layout: CardLayout;
  size: CardSize;
  paletteId: string;
  font: CardFont;
}

export interface SizeDef {
  width: number;
  height: number;
  label: string;
}

export const SIZES: Record<CardSize, SizeDef> = {
  ogp: { width: 1200, height: 630, label: 'OGP 1200x630' },
  square: { width: 1080, height: 1080, label: '正方形 1080x1080' },
  portrait: { width: 1080, height: 1350, label: '縦長 1080x1350' },
};

const FONT_STACKS: Record<CardFont, string> = {
  mincho: "'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP',serif",
  gothic: "'Hiragino Kaku Gothic ProN','Yu Gothic','Noto Sans JP',sans-serif",
};

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const LINE_RATIO = 1.75; // 行送り(横書き)
const COL_RATIO = 1.8; // 列送り(縦書き)

interface Fit {
  fontSize: number;
  lines: string[];
}

// 大きい字から試し、収まる最大のフォントサイズを選ぶ。
// どうしても収まらないときは最小サイズで末尾を省略する。
function fit(
  quote: string,
  mainExtent: number, // 行方向に使える長さ(横=幅、縦=高さ)
  crossExtent: number, // 行が積み重なる方向の長さ
  base: number,
): Fit {
  const min = Math.round(base * 0.4);
  for (let f = base; f >= min; f -= 2) {
    const perLine = Math.max(4, Math.floor(mainExtent / f));
    const { lines, truncated } = wrapText(quote, perLine);
    if (!truncated && lines.length * f * LINE_RATIO <= crossExtent) {
      return { fontSize: f, lines };
    }
  }
  const perLine = Math.max(4, Math.floor(mainExtent / min));
  const maxLines = Math.max(1, Math.floor(crossExtent / (min * LINE_RATIO)));
  return { fontSize: min, lines: wrapText(quote, perLine, maxLines).lines };
}

function attribution(title: string, author: string): string {
  const t = title.trim();
  const a = author.trim();
  if (t === '' && a === '') return '';
  const book = t === '' ? '' : `『${t}』`;
  return `― ${book}${book !== '' && a !== '' ? ' ' : ''}${a}`;
}

// 鉤括弧モチーフの飾り罫。左上と右下に置く。
function corners(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  arm: number,
  color: string,
): string {
  return (
    `<path d="M ${x0} ${y0 + arm} V ${y0} H ${x0 + arm}" fill="none" stroke="${color}" stroke-width="6" aria-hidden="true"/>` +
    `<path d="M ${x1} ${y1 - arm} V ${y1} H ${x1 - arm}" fill="none" stroke="${color}" stroke-width="6" aria-hidden="true"/>`
  );
}

function horizontalBody(spec: CardSpec, width: number, height: number, fg: string): string {
  const mx = Math.round(width * 0.12);
  const myTop = Math.round(height * 0.16);
  const myBottom = Math.round(height * 0.24);
  const { fontSize, lines } = fit(
    spec.quote,
    width - mx * 2,
    height - myTop - myBottom,
    Math.round(width / 16),
  );
  const lineHeight = fontSize * LINE_RATIO;
  const blockH = lines.length * lineHeight;
  const startY = myTop + (height - myTop - myBottom - blockH) / 2 + fontSize;
  const texts = lines
    .map(
      (line, i) =>
        `<text x="${mx}" y="${Math.round(startY + i * lineHeight)}" font-size="${fontSize}" fill="${fg}" letter-spacing="0.06em">${escapeXml(line)}</text>`,
    )
    .join('');
  return texts;
}

function verticalBody(spec: CardSpec, width: number, height: number, fg: string): string {
  const mx = Math.round(width * 0.12);
  const myTop = Math.round(height * 0.14);
  const myBottom = Math.round(height * 0.22);
  const extentH = height - myTop - myBottom;
  const base = Math.round(height / 14);
  const min = Math.round(base * 0.4);
  let fontSize = min;
  let lines: string[] = [];
  for (let f = base; f >= min; f -= 2) {
    const perColumn = Math.max(4, Math.floor(extentH / f));
    const result = wrapText(spec.quote, perColumn);
    if (!result.truncated && result.lines.length * f * COL_RATIO <= width - mx * 2) {
      fontSize = f;
      lines = result.lines;
      break;
    }
  }
  if (lines.length === 0) {
    const perColumn = Math.max(4, Math.floor(extentH / min));
    const maxCols = Math.max(1, Math.floor((width - mx * 2) / (min * COL_RATIO)));
    lines = wrapText(spec.quote, perColumn, maxCols).lines;
  }
  const colAdvance = fontSize * COL_RATIO;
  const blockW = lines.length * colAdvance;
  const right = width - mx - (width - mx * 2 - blockW) / 2;
  const columns = lines
    .map((line, col) => {
      const x = Math.round(right - col * colAdvance - fontSize / 2);
      const spans = [...line]
        .map(
          (ch, i) =>
            `<tspan x="${x}" y="${Math.round(myTop + (i + 0.85) * fontSize)}">${escapeXml(toVerticalForm(ch))}</tspan>`,
        )
        .join('');
      return `<text font-size="${fontSize}" fill="${fg}" text-anchor="middle">${spans}</text>`;
    })
    .join('');
  return columns;
}

export function buildCard(spec: CardSpec): string {
  const { width, height } = SIZES[spec.size];
  const palette = paletteById(spec.paletteId);
  const font = FONT_STACKS[spec.font];
  const mx = Math.round(width * 0.07);
  const my = Math.round(height * 0.1);
  const arm = Math.round(Math.min(width, height) * 0.05);

  const body =
    spec.layout === 'vertical'
      ? verticalBody(spec, width, height, palette.fg)
      : horizontalBody(spec, width, height, palette.fg);

  const attrText = attribution(spec.title, spec.author);
  const attrSize = Math.max(22, Math.round(width / 42));
  const attr =
    attrText === ''
      ? ''
      : `<text x="${width - Math.round(width * 0.12)}" y="${height - Math.round(height * 0.11)}" text-anchor="end" font-size="${attrSize}" fill="${palette.sub}" letter-spacing="0.04em">${escapeXml(attrText)}</text>`;

  const excerpt = [...spec.quote.replace(/\n/g, ' ')].slice(0, 24).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(`引用カード: ${excerpt}`)}">` +
    `<title>${escapeXml(`引用カード: ${excerpt}`)}</title>` +
    `<rect width="${width}" height="${height}" fill="${palette.bg}"/>` +
    corners(mx, my, width - mx, height - my, arm, palette.accent) +
    `<g font-family="${escapeXml(font)}">` +
    body +
    attr +
    `</g>` +
    `</svg>`
  );
}
