// フォームとライブプレビュー。カードの生成はlibに任せ、ここでは
// 入力値の保持・復元と、SVG/PNGの書き出しだけを行う。

import type { CardFont, CardLayout, CardSize, CardSpec } from './lib/card';
import { buildCard, escapeXml, SIZES } from './lib/card';
import { PALETTES } from './lib/palettes';

const esc = escapeXml;

const STORAGE_KEY = 'shiori:v1';

const DEFAULT_SPEC: CardSpec = {
  quote:
    '智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。',
  title: '草枕',
  author: '夏目漱石',
  layout: 'horizontal',
  size: 'ogp',
  paletteId: 'kinari',
  font: 'mincho',
};

const LAYOUT_LABELS: Record<CardLayout, string> = {
  horizontal: '横書き',
  vertical: '縦書き',
};

const FONT_LABELS: Record<CardFont, string> = {
  mincho: '明朝',
  gothic: 'ゴシック',
};

const LOGO = `
<svg class="logo" viewBox="0 0 64 64" aria-hidden="true">
  <rect x="12" y="6" width="40" height="52" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
  <path d="M40 6v22l-6-5-6 5V6" fill="var(--accent)"/>
  <path d="M20 40h24M20 48h16" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
</svg>`;

function loadSpec(storage: Storage): CardSpec {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { ...DEFAULT_SPEC };
    const v = JSON.parse(raw) as Record<string, unknown>;
    return {
      quote: typeof v.quote === 'string' ? v.quote : DEFAULT_SPEC.quote,
      title: typeof v.title === 'string' ? v.title : '',
      author: typeof v.author === 'string' ? v.author : '',
      layout: v.layout === 'vertical' ? 'vertical' : 'horizontal',
      size: v.size === 'square' || v.size === 'portrait' ? v.size : 'ogp',
      paletteId:
        typeof v.paletteId === 'string' && PALETTES.some((p) => p.id === v.paletteId)
          ? v.paletteId
          : DEFAULT_SPEC.paletteId,
      font: v.font === 'gothic' ? 'gothic' : 'mincho',
    };
  } catch {
    return { ...DEFAULT_SPEC };
  }
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function svgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVGの描画に失敗しました'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('canvasを初期化できませんでした');
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob === null) reject(new Error('PNGの生成に失敗しました'));
        else resolve(blob);
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function mountApp(root: HTMLElement, storage: Storage): void {
  let spec = loadSpec(storage);

  root.innerHTML = `
    <div class="shell">
      <header class="masthead">
        <div class="brand">
          ${LOGO}
          <div>
            <h1>shiori</h1>
            <p class="tagline">書籍の一節を、組版の整った引用カードに</p>
          </div>
        </div>
      </header>

      <div class="workspace">
        <form class="panel controls" id="controls" aria-label="カードの設定">
          <label class="field">引用文
            <textarea name="quote" rows="5" required></textarea>
          </label>
          <div class="field-row">
            <label class="field">書名<input name="title" placeholder="草枕"></label>
            <label class="field">著者<input name="author" placeholder="夏目漱石"></label>
          </div>
          <fieldset class="choice-group">
            <legend>組み</legend>
            ${(Object.keys(LAYOUT_LABELS) as CardLayout[])
              .map(
                (l) =>
                  `<label class="choice"><input type="radio" name="layout" value="${l}">${LAYOUT_LABELS[l]}</label>`,
              )
              .join('')}
          </fieldset>
          <fieldset class="choice-group">
            <legend>サイズ</legend>
            ${(Object.keys(SIZES) as CardSize[])
              .map(
                (s) =>
                  `<label class="choice"><input type="radio" name="size" value="${s}">${SIZES[s].label}</label>`,
              )
              .join('')}
          </fieldset>
          <fieldset class="choice-group">
            <legend>書体</legend>
            ${(Object.keys(FONT_LABELS) as CardFont[])
              .map(
                (f) =>
                  `<label class="choice"><input type="radio" name="font" value="${f}">${FONT_LABELS[f]}</label>`,
              )
              .join('')}
          </fieldset>
          <fieldset class="choice-group palette-group">
            <legend>配色</legend>
            <div class="palettes" role="radiogroup" aria-label="配色">
              ${PALETTES.map(
                (p) => `
                <button type="button" class="palette" data-palette="${p.id}"
                  title="${esc(p.name)}" aria-pressed="false"
                  style="--swatch-bg:${p.bg};--swatch-fg:${p.fg};--swatch-accent:${p.accent}">
                  <span class="swatch" aria-hidden="true"></span>${esc(p.name)}
                </button>`,
              ).join('')}
            </div>
          </fieldset>
          <div class="actions">
            <button type="button" id="dl-svg" class="primary">SVGをダウンロード</button>
            <button type="button" id="dl-png" class="primary">PNGをダウンロード</button>
            <button type="button" id="copy-svg" class="ghost">SVGをコピー</button>
          </div>
        </form>

        <div class="preview-pane">
          <div id="preview" class="preview" aria-live="polite"></div>
          <p class="preview-note">プレビューはそのまま書き出されます。フォントは閲覧環境のものを使います。</p>
        </div>
      </div>
      <div id="toast" role="status" aria-live="polite"></div>
    </div>`;

  const $ = <T extends HTMLElement>(selector: string): T => {
    const node = root.querySelector<T>(selector);
    if (node === null) throw new Error(`要素が見つからない: ${selector}`);
    return node;
  };

  const form = $<HTMLFormElement>('#controls');
  const toastBox = $('#toast');
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function toast(message: string): void {
    toastBox.textContent = message;
    toastBox.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastBox.classList.remove('show'), 3000);
  }

  function syncForm(): void {
    const set = (name: string, value: string) => {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        el.value = value;
      } else if (el instanceof RadioNodeList) {
        el.value = value;
      }
    };
    set('quote', spec.quote);
    set('title', spec.title);
    set('author', spec.author);
    set('layout', spec.layout);
    set('size', spec.size);
    set('font', spec.font);
    root.querySelectorAll<HTMLElement>('[data-palette]').forEach((b) => {
      const active = b.dataset.palette === spec.paletteId;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
  }

  function render(): void {
    $('#preview').innerHTML = buildCard(spec);
    storage.setItem(STORAGE_KEY, JSON.stringify(spec));
  }

  function readForm(): void {
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? '');
    spec = {
      quote: text('quote'),
      title: text('title'),
      author: text('author'),
      layout: text('layout') as CardLayout,
      size: text('size') as CardSize,
      paletteId: spec.paletteId,
      font: text('font') as CardFont,
    };
    render();
  }

  form.addEventListener('input', readForm);
  form.addEventListener('submit', (e) => e.preventDefault());

  form.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-palette]');
    if (button === null) return;
    spec = { ...spec, paletteId: button.dataset.palette ?? spec.paletteId };
    syncForm();
    render();
  });

  $('#dl-svg').addEventListener('click', () => {
    const blob = new Blob([buildCard(spec)], { type: 'image/svg+xml' });
    downloadBlob(blob, `shiori-${stamp()}.svg`);
    toast('SVGを保存しました');
  });

  $('#dl-png').addEventListener('click', () => {
    const { width, height } = SIZES[spec.size];
    void svgToPngBlob(buildCard(spec), width, height)
      .then((blob) => {
        downloadBlob(blob, `shiori-${stamp()}.png`);
        toast('PNGを保存しました');
      })
      .catch((e: unknown) => {
        toast(e instanceof Error ? e.message : 'PNGの生成に失敗しました');
      });
  });

  $('#copy-svg').addEventListener('click', () => {
    void navigator.clipboard
      .writeText(buildCard(spec))
      .then(() => toast('SVGをコピーしました'))
      .catch(() => toast('コピーに失敗しました'));
  });

  syncForm();
  render();
}
