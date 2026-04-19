// テーマの解決を純粋関数に切り出す。実際のDOM反映とlocalStorageは
// app側で行い、ここは「設定値+OS設定 → 実際に出す色」の対応だけを持つ。

export type ThemePref = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_KEY = 'shiori:theme';

export const THEME_LABELS: Record<ThemePref, string> = {
  auto: '自動',
  light: '明',
  dark: '暗',
};

export function isThemePref(value: unknown): value is ThemePref {
  return value === 'auto' || value === 'light' || value === 'dark';
}

export function resolveTheme(pref: ThemePref, prefersDark: boolean): ResolvedTheme {
  if (pref === 'auto') return prefersDark ? 'dark' : 'light';
  return pref;
}

// 自動 → 明 → 暗 → 自動 と巡回する。
export function nextTheme(pref: ThemePref): ThemePref {
  if (pref === 'auto') return 'light';
  if (pref === 'light') return 'dark';
  return 'auto';
}
