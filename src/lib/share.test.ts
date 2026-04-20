import { describe, expect, it } from 'vitest';
import type { CardSpec } from './card';
import { DEFAULT_SPEC } from './card';
import { decodeSpec, encodeSpec, specFromHash, specToHash } from './share';

const spec: CardSpec = {
  quote: '本の一節、約物「」も。',
  title: '草枕',
  author: '夏目漱石',
  layout: 'vertical',
  size: 'portrait',
  paletteId: 'ai',
  font: 'gothic',
  frame: 'rule',
};

describe('encodeSpec / decodeSpec', () => {
  it('日本語と約物を含めて往復できる', () => {
    expect(decodeSpec(encodeSpec(spec))).toEqual(spec);
  });

  it('URLに使えない文字を含まない', () => {
    expect(encodeSpec(spec)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('壊れた文字列はnullになる', () => {
    expect(decodeSpec('!!!not-base64!!!')).toBeNull();
    expect(decodeSpec('')).toBeNull();
  });

  it('欠けたフィールドは既定で補う', () => {
    const partial = encodeSpec({ quote: 'だけ' } as unknown as CardSpec);
    expect(decodeSpec(partial)?.paletteId).toBe(DEFAULT_SPEC.paletteId);
  });
});

describe('specToHash / specFromHash', () => {
  it('ハッシュ接頭辞を付けて往復できる', () => {
    const hash = specToHash(spec);
    expect(hash.startsWith('#c=')).toBe(true);
    expect(specFromHash(hash)).toEqual(spec);
  });

  it('接頭辞のないハッシュはnull', () => {
    expect(specFromHash('#other')).toBeNull();
    expect(specFromHash('')).toBeNull();
  });
});
