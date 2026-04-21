import { describe, expect, it } from 'vitest';
import type { CardSpec } from './card';
import { buildCard, DEFAULT_SPEC, normalizeSpec, SIZES } from './card';
import { PALETTES } from './palettes';

const base: CardSpec = {
  quote: '智に働けば角が立つ。情に棹させば流される。',
  title: '草枕',
  author: '夏目漱石',
  layout: 'horizontal',
  size: 'ogp',
  paletteId: 'kinari',
  font: 'mincho',
  frame: 'kagi',
};

function fontSizeOf(svg: string): number {
  const m = /<text[^>]*font-size="(\d+)"/.exec(svg);
  return m === null ? 0 : Number(m[1]);
}

describe('buildCard', () => {
  it('サイズ指定どおりの寸法になる', () => {
    for (const size of Object.keys(SIZES) as (keyof typeof SIZES)[]) {
      const svg = buildCard({ ...base, size });
      expect(svg).toContain(`viewBox="0 0 ${SIZES[size].width} ${SIZES[size].height}"`);
    }
  });

  it('パレットの背景色と文字色を使う', () => {
    const svg = buildCard({ ...base, paletteId: 'ai' });
    const ai = PALETTES.find((p) => p.id === 'ai');
    expect(svg).toContain(`fill="${ai?.bg}"`);
    expect(svg).toContain(`fill="${ai?.fg}"`);
  });

  it('未知のパレットIDは先頭のパレットへ落ちる', () => {
    const svg = buildCard({ ...base, paletteId: 'nothing' });
    expect(svg).toContain(`fill="${PALETTES[0]?.bg}"`);
  });

  it('引用と出典をエスケープして含める', () => {
    const svg = buildCard({
      ...base,
      quote: '<b>太字</b>という話',
      title: 'A&B',
    });
    expect(svg).not.toContain('<b>');
    expect(svg).toContain('&lt;b&gt;');
    expect(svg).toContain('A&amp;B');
  });

  it('長い引用ほど小さい字で組む', () => {
    const short = buildCard(base);
    const long = buildCard({ ...base, quote: '長い文章。'.repeat(40) });
    expect(fontSizeOf(long)).toBeLessThan(fontSizeOf(short));
  });

  it('縦書きでは1字ずつtspanに分解する', () => {
    const svg = buildCard({ ...base, layout: 'vertical', quote: 'あいう' });
    expect(svg.match(/<tspan/g)).toHaveLength(3);
  });

  it('縦書きでは句読点が縦書き字形になる', () => {
    const svg = buildCard({ ...base, layout: 'vertical', quote: 'はい。' });
    expect(svg).toContain('︒');
    expect(svg).not.toContain('>。<');
  });

  it('縦書きの2桁数字は縦中横として一つのtspanに収める', () => {
    const svg = buildCard({ ...base, layout: 'vertical', quote: 'は12時' });
    expect(svg).toContain('>12</tspan>');
    expect(svg.match(/<tspan/g)).toHaveLength(3);
  });

  it('出典が空なら出典行を出さない', () => {
    const svg = buildCard({ ...base, title: '', author: '' });
    expect(svg).not.toContain('―');
  });

  it('書名だけ・著者だけでも出典行が成立する', () => {
    expect(buildCard({ ...base, author: '' })).toContain('『草枕』');
    expect(buildCard({ ...base, title: '' })).toContain('夏目漱石');
  });

  it('title要素に引用の冒頭を入れる', () => {
    const svg = buildCard(base);
    expect(svg).toContain('<title>引用カード: 智に働けば角が立つ。');
  });
});

describe('buildCard の罫(frame)', () => {
  it('鉤括弧は2本のpathを引く', () => {
    const svg = buildCard({ ...base, frame: 'kagi' });
    expect(svg.match(/<path/g)).toHaveLength(2);
  });

  it('罫囲みは内外2枚のrectを足す', () => {
    const card = buildCard({ ...base, frame: 'rule' });
    const bg = buildCard({ ...base, frame: 'none' });
    // 背景の1枚に対し、罫囲みでは枠の2枚が増える
    expect((card.match(/<rect/g) ?? []).length).toBe((bg.match(/<rect/g) ?? []).length + 2);
  });

  it('装飾なしは飾り罫を一切引かない', () => {
    const svg = buildCard({ ...base, frame: 'none' });
    expect(svg).not.toContain('<path');
    expect(svg.match(/<rect/g)).toHaveLength(1);
  });
});

describe('normalizeSpec', () => {
  it('オブジェクトでない値は既定へ落とす', () => {
    expect(normalizeSpec(null)).toEqual(DEFAULT_SPEC);
    expect(normalizeSpec('text')).toEqual(DEFAULT_SPEC);
  });

  it('空オブジェクトは引用を既定にし、出典は空にする', () => {
    expect(normalizeSpec({})).toEqual({ ...DEFAULT_SPEC, title: '', author: '' });
  });

  it('妥当なフィールドは保持し不正値だけ直す', () => {
    const spec = normalizeSpec({
      quote: '本の話',
      title: '',
      author: '誰か',
      layout: 'vertical',
      size: 'square',
      paletteId: 'ai',
      font: 'gothic',
      frame: 'bogus',
    });
    expect(spec.quote).toBe('本の話');
    expect(spec.layout).toBe('vertical');
    expect(spec.size).toBe('square');
    expect(spec.paletteId).toBe('ai');
    expect(spec.font).toBe('gothic');
    expect(spec.frame).toBe('kagi');
  });

  it('存在しないパレットIDは既定へ戻す', () => {
    expect(normalizeSpec({ paletteId: 'none-such' }).paletteId).toBe(DEFAULT_SPEC.paletteId);
  });
});
