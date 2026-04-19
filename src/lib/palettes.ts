// カードの配色。低彩度の地に一点だけ効かせ色を置く構成で統一する。
// line は地になじむ淡い罫線色で、罫囲みフレームに使う。

export interface Palette {
  id: string;
  name: string;
  bg: string;
  fg: string;
  sub: string;
  accent: string;
  line: string;
}

export const PALETTES: Palette[] = [
  {
    id: 'kinari',
    name: '生成りに墨',
    bg: '#f4efe5',
    fg: '#2b2722',
    sub: '#7a7264',
    accent: '#9a6a2f',
    line: '#d9d0bf',
  },
  {
    id: 'ai',
    name: '藍',
    bg: '#1d2a44',
    fg: '#eef1f6',
    sub: '#9fadc4',
    accent: '#d9b96c',
    line: '#37456180',
  },
  {
    id: 'sumi',
    name: '墨',
    bg: '#1b1b1d',
    fg: '#e9e6df',
    sub: '#94908a',
    accent: '#c8a14f',
    line: '#3a3a3e',
  },
  {
    id: 'wakaba',
    name: '若葉',
    bg: '#eef2e9',
    fg: '#27331f',
    sub: '#6f7d63',
    accent: '#3d6b35',
    line: '#d3ddc8',
  },
  {
    id: 'sakura',
    name: '桜鼠',
    bg: '#f3e9e9',
    fg: '#3c2e30',
    sub: '#8b7376',
    accent: '#b04a5a',
    line: '#e2d2d3',
  },
  {
    id: 'seiji',
    name: '青磁',
    bg: '#e7efed',
    fg: '#22312e',
    sub: '#64807a',
    accent: '#2e6e62',
    line: '#cfe0db',
  },
  {
    id: 'rikyu',
    name: '利休鼠',
    bg: '#e6e8e1',
    fg: '#2a2e26',
    sub: '#737a6b',
    accent: '#5b6b4c',
    line: '#d2d6c9',
  },
  {
    id: 'kurumi',
    name: '胡桃',
    bg: '#ece1d2',
    fg: '#34291d',
    sub: '#8a7762',
    accent: '#7a4a26',
    line: '#dbcdb9',
  },
  {
    id: 'tetsukon',
    name: '鉄紺',
    bg: '#1f2733',
    fg: '#e7ebf1',
    sub: '#94a1b4',
    accent: '#c97f5a',
    line: '#33404f',
  },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? (PALETTES[0] as Palette);
}
