// カードの配色。低彩度の地に一点だけ効かせ色を置く構成で統一する。

export interface Palette {
  id: string;
  name: string;
  bg: string;
  fg: string;
  sub: string;
  accent: string;
}

export const PALETTES: Palette[] = [
  {
    id: 'kinari',
    name: '生成りに墨',
    bg: '#f4efe5',
    fg: '#2b2722',
    sub: '#7a7264',
    accent: '#9a6a2f',
  },
  {
    id: 'ai',
    name: '藍',
    bg: '#1d2a44',
    fg: '#eef1f6',
    sub: '#9fadc4',
    accent: '#d9b96c',
  },
  {
    id: 'sumi',
    name: '墨',
    bg: '#1b1b1d',
    fg: '#e9e6df',
    sub: '#94908a',
    accent: '#c8a14f',
  },
  {
    id: 'wakaba',
    name: '若葉',
    bg: '#eef2e9',
    fg: '#27331f',
    sub: '#6f7d63',
    accent: '#3d6b35',
  },
  {
    id: 'sakura',
    name: '桜鼠',
    bg: '#f3e9e9',
    fg: '#3c2e30',
    sub: '#8b7376',
    accent: '#b04a5a',
  },
  {
    id: 'seiji',
    name: '青磁',
    bg: '#e7efed',
    fg: '#22312e',
    sub: '#64807a',
    accent: '#2e6e62',
  },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? (PALETTES[0] as Palette);
}
