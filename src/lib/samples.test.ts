import { describe, expect, it } from 'vitest';
import { buildCard, DEFAULT_SPEC } from './card';
import { PALETTES } from './palettes';
import { SAMPLES } from './samples';

describe('SAMPLES', () => {
  it('引用・書名・著者がそろっている', () => {
    for (const s of SAMPLES) {
      expect(s.quote.length).toBeGreaterThan(0);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.author.length).toBeGreaterThan(0);
    }
  });

  it('参照する配色IDが実在する', () => {
    for (const s of SAMPLES) {
      expect(PALETTES.some((p) => p.id === s.paletteId)).toBe(true);
    }
  });

  it('そのままカードとして組める', () => {
    for (const s of SAMPLES) {
      const svg = buildCard({ ...DEFAULT_SPEC, ...s, size: 'square' });
      expect(svg).toContain('<svg');
      expect(svg).toContain(s.author);
    }
  });
});
