// フォームとライブプレビュー。カードの生成はlibに任せ、ここでは
// 入力値の保持・復元、URL共有、テーマ、SVG/PNGの書き出しを受け持つ。

import type { CardFont, CardFrame, CardLayout, CardSize, CardSpec } from './lib/card';
import { buildCard, DEFAULT_SPEC, escapeXml, FRAMES, normalizeSpec, SIZES } from './lib/card';
import { PALETTES } from './lib/palettes';
import { SAMPLES } from './lib/samples';
import {
  isThemePref,
  nextTheme,
  resolveTheme,
  THEME_KEY,
  THEME_LABELS,
  type ThemePref,
} from './lib/theme';
import { specFromHash, specToHash } from './lib/share';

const esc = escapeXml;
const STORAGE_KEY = 'shiori:v1';

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
  <rect x="12" y="6" width="40" height="52" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <path d="M40 6v22l-6-5-6 5V6" fill="var(--accent)"/>
  <path d="M20 40h24M20 48h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.4"/>
</svg>`;

const SHORTCUTS: [string, string][] = [
  ['S', 'SVGを保存'],
  ['P', 'PNGを保存'],
  ['C', 'SVGをコピー'],
  ['L', '共有リンク'],
  ['V', '縦横を切替'],
  ['T', 'テーマ'],
  ['[ ]', '配色を送る'],
];

function readStored(storage: Storage): CardSpec | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === null ? null : normalizeSpec(JSON.parse(raw));
  } catch {
    return null;
  }
}

function initialSpec(storage: Storage): CardSpec {
  return specFromHash(location.hash) ?? readStored(storage) ?? { ...DEFAULT_SPEC };
}

function loadThemePref(storage: Storage): ThemePref {
  try {
    const raw = storage.getItem(THEME_KEY);
    return isThemePref(raw) ? raw : 'auto';
  } catch {
    return 'auto';
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

function radioGroup<T extends string>(name: string, labels: Record<T, string>): string {
  return (Object.keys(labels) as T[])
    .map(
      (key) =>
        `<label class="choice"><input type="radio" name="${name}" value="${key}">${labels[key]}</label>`,
    )
    .join('');
}

export function mountApp(root: HTMLElement, storage: Storage): void {
  let spec = initialSpec(storage);
  let themePref = loadThemePref(storage);

  const media =
    typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

  function applyTheme(): void {
    const resolved = resolveTheme(themePref, media?.matches ?? false);
    document.documentElement.dataset.theme = resolved;
  }

  root.innerHTML = `
    <div class="page">
      <header class="masthead reveal">
        <div class="brand">
          ${LOGO}
          <div class="brand__name">
            <span class="wordmark">栞<span class="wordmark__latin">shiori</span></span>
            <span class="brand__kicker">引用カード組版</span>
          </div>
        </div>
        <button type="button" id="theme" class="theme-toggle" aria-live="polite">
          <span class="theme-toggle__label">テーマ</span>
          <span class="theme-toggle__value" data-theme-value></span>
        </button>
      </header>

      <section class="intro">
        <div class="intro__lede reveal">
          <p class="kicker">QUOTE CARD COMPOSER</p>
          <h1 class="intro__title">本の一節を、<br>組版のまま持ち出す。</h1>
          <p class="intro__text">
            引用文と出典を入れると、文章量に合わせて字の大きさを決め、句読点のぶら下げや
            開き括弧の送り出しといった禁則を効かせて折り返します。横書きと縦書き、
            SVGとPNGの書き出しに対応します。
          </p>
        </div>
        <figure class="intro__figure reveal">
          <img
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1100&q=80"
            alt="" width="1100" height="734" loading="lazy" decoding="async">
          <figcaption>組まれた文字は、読まれる前にまず眺められる。</figcaption>
        </figure>
      </section>

      <div class="workspace">
        <form class="controls reveal" id="controls" aria-label="カードの設定">
          <label class="field">
            <span class="field__label">引用文</span>
            <textarea name="quote" rows="5" required></textarea>
          </label>
          <div class="field-row">
            <label class="field">
              <span class="field__label">書名</span>
              <input name="title" placeholder="草枕">
            </label>
            <label class="field">
              <span class="field__label">著者</span>
              <input name="author" placeholder="夏目漱石">
            </label>
          </div>
          <fieldset class="choice-group">
            <legend class="field__label">組み</legend>
            ${radioGroup('layout', LAYOUT_LABELS)}
          </fieldset>
          <fieldset class="choice-group">
            <legend class="field__label">サイズ</legend>
            ${(Object.keys(SIZES) as CardSize[])
              .map(
                (s) =>
                  `<label class="choice"><input type="radio" name="size" value="${s}">${SIZES[s].label}</label>`,
              )
              .join('')}
          </fieldset>
          <fieldset class="choice-group">
            <legend class="field__label">書体</legend>
            ${radioGroup('font', FONT_LABELS)}
          </fieldset>
          <fieldset class="choice-group">
            <legend class="field__label">罫</legend>
            ${radioGroup('frame', FRAMES)}
          </fieldset>
          <fieldset class="choice-group palette-group">
            <legend class="field__label">配色</legend>
            <div class="palettes" role="radiogroup" aria-label="配色">
              ${PALETTES.map(
                (p, i) => `
                <button type="button" class="palette" data-palette="${p.id}"
                  title="${esc(p.name)}" aria-pressed="false" style="--i:${i}">
                  <span class="swatch" aria-hidden="true"
                    style="--swatch-bg:${p.bg};--swatch-accent:${p.accent}"></span>
                  <span class="palette__name">${esc(p.name)}</span>
                </button>`,
              ).join('')}
            </div>
          </fieldset>
          <div class="actions">
            <button type="button" id="dl-svg" class="btn btn--primary">SVGを保存</button>
            <button type="button" id="dl-png" class="btn btn--primary">PNGを保存</button>
            <button type="button" id="copy-svg" class="btn">SVGをコピー</button>
            <button type="button" id="share" class="btn">共有リンク</button>
          </div>
        </form>

        <aside class="plate reveal">
          <div class="plate__sheet">
            <div id="preview" class="preview" aria-live="polite"></div>
          </div>
          <figcaption class="plate__caption">
            <span class="plate__dim" data-dim></span>
            <span>プレビューがそのまま書き出されます。フォントは閲覧環境のものを使います。</span>
          </figcaption>
        </aside>
      </div>

      <section class="gallery reveal">
        <div class="section-head">
          <p class="kicker">例文</p>
          <h2 class="section-head__title">古典から組んでみる</h2>
          <p class="section-head__note">著作権の切れた作品の一節です。選ぶと設定に流し込まれます。</p>
        </div>
        <ul class="gallery__list">
          ${SAMPLES.map(
            (s, i) => `
            <li>
              <button type="button" class="sample" data-sample="${i}"
                aria-label="${esc(`${s.author}『${s.title}』を組む`)}">
                <span class="sample__card">${buildCard({ ...DEFAULT_SPEC, ...s, size: 'square' })}</span>
                <span class="sample__meta">『${esc(s.title)}』<span>${esc(s.author)}</span></span>
              </button>
            </li>`,
          ).join('')}
        </ul>
      </section>

      <section class="colophon reveal">
        <div class="section-head">
          <p class="kicker">組版について</p>
          <h2 class="section-head__title">機械的に、切らない</h2>
        </div>
        <div class="colophon__cols">
          <p>
            字数で割っただけの折り返しは、行頭に句読点を、行末に開き括弧を平気で置く。
            ここでは行頭にきてはいけない約物を前の行へぶら下げ、行末の開き括弧を次の行へ送る。
          </p>
          <p>
            縦書きでは句読点・括弧・長音を縦組み用の字形へ置き換える。
            一字ずつ座標を確定させて並べるので、<code>writing-mode</code>を解さない
            PNG変換やRSSリーダーの上でも崩れない。
          </p>
          <p>
            文章量とカード寸法から、収まる最大の字を探してから組む。
            「小さすぎる」か「はみ出す」かの二択を避けるための採寸で、
            プレビューと書き出しは同じ関数の戻り値だから食い違わない。
          </p>
        </div>
      </section>

      <footer class="footer">
        <dl class="shortcuts" aria-label="キーボードショートカット">
          ${SHORTCUTS.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
        </dl>
        <p class="footer__note">入力中は無効。設定はこの端末に保存され、URLにも書き込まれます。</p>
      </footer>
      <div id="toast" role="status" aria-live="polite"></div>
    </div>`;

  const $ = <T extends HTMLElement>(selector: string): T => {
    const node = root.querySelector<T>(selector);
    if (node === null) throw new Error(`要素が見つからない: ${selector}`);
    return node;
  };

  const form = $<HTMLFormElement>('#controls');
  const preview = $('#preview');
  const themeButton = $<HTMLButtonElement>('#theme');
  const themeValue = $('[data-theme-value]');
  const dimLabel = $('[data-dim]');
  const toastBox = $('#toast');
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function toast(message: string): void {
    toastBox.textContent = message;
    toastBox.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastBox.classList.remove('show'), 2600);
  }

  function syncTheme(): void {
    applyTheme();
    themeValue.textContent = THEME_LABELS[themePref];
    themeButton.setAttribute('aria-label', `テーマ: ${THEME_LABELS[themePref]}(押すと切替)`);
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
    set('frame', spec.frame);
    root.querySelectorAll<HTMLElement>('[data-palette]').forEach((b) => {
      const active = b.dataset.palette === spec.paletteId;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
  }

  let renderRaf = 0;
  function render(): void {
    preview.innerHTML = buildCard(spec);
    const size = SIZES[spec.size];
    dimLabel.textContent = `${size.width} × ${size.height}`;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(spec));
    } catch {
      // 永続化できない環境(プライベートモード等)でも動作は続ける
    }
    if (renderRaf !== 0) cancelAnimationFrame(renderRaf);
    renderRaf = requestAnimationFrame(() => {
      history.replaceState(null, '', specToHash(spec));
    });
  }

  function update(next: Partial<CardSpec>): void {
    spec = { ...spec, ...next };
    syncForm();
    render();
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
      frame: text('frame') as CardFrame,
    };
    render();
  }

  form.addEventListener('input', readForm);
  form.addEventListener('submit', (e) => e.preventDefault());

  form.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-palette]');
    if (button === null) return;
    update({ paletteId: button.dataset.palette ?? spec.paletteId });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-sample]').forEach((button) => {
    button.addEventListener('click', () => {
      const sample = SAMPLES[Number(button.dataset.sample)];
      if (sample === undefined) return;
      update({
        quote: sample.quote,
        title: sample.title,
        author: sample.author,
        layout: sample.layout,
        paletteId: sample.paletteId,
        frame: sample.frame,
      });
      preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(`『${sample.title}』を組みました`);
    });
  });

  function cyclePalette(step: number): void {
    const index = PALETTES.findIndex((p) => p.id === spec.paletteId);
    const next = PALETTES[(index + step + PALETTES.length) % PALETTES.length];
    if (next !== undefined) update({ paletteId: next.id });
  }

  function toggleTheme(): void {
    themePref = nextTheme(themePref);
    try {
      storage.setItem(THEME_KEY, themePref);
    } catch {
      // 保存できなくてもセッション中は切り替わる
    }
    syncTheme();
  }

  function saveSvg(): void {
    downloadBlob(new Blob([buildCard(spec)], { type: 'image/svg+xml' }), `shiori-${stamp()}.svg`);
    toast('SVGを保存しました');
  }

  function savePng(): void {
    const { width, height } = SIZES[spec.size];
    void svgToPngBlob(buildCard(spec), width, height)
      .then((blob) => {
        downloadBlob(blob, `shiori-${stamp()}.png`);
        toast('PNGを保存しました');
      })
      .catch((e: unknown) => {
        toast(e instanceof Error ? e.message : 'PNGの生成に失敗しました');
      });
  }

  function copySvg(): void {
    void navigator.clipboard
      .writeText(buildCard(spec))
      .then(() => toast('SVGをコピーしました'))
      .catch(() => toast('コピーに失敗しました'));
  }

  function copyShareLink(): void {
    const url = location.origin + location.pathname + specToHash(spec);
    void navigator.clipboard
      .writeText(url)
      .then(() => toast('共有リンクをコピーしました'))
      .catch(() => toast('コピーに失敗しました'));
  }

  themeButton.addEventListener('click', toggleTheme);
  $('#dl-svg').addEventListener('click', saveSvg);
  $('#dl-png').addEventListener('click', savePng);
  $('#copy-svg').addEventListener('click', copySvg);
  $('#share').addEventListener('click', copyShareLink);

  media?.addEventListener('change', () => {
    if (themePref === 'auto') syncTheme();
  });

  window.addEventListener('hashchange', () => {
    const fromHash = specFromHash(location.hash);
    if (fromHash !== null) update(fromHash);
  });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target;
    if (
      target instanceof HTMLElement &&
      target.matches('input, textarea, select, [contenteditable="true"]')
    ) {
      return;
    }
    const handlers: Record<string, () => void> = {
      s: saveSvg,
      p: savePng,
      c: copySvg,
      l: copyShareLink,
      t: toggleTheme,
      v: () => update({ layout: spec.layout === 'vertical' ? 'horizontal' : 'vertical' }),
      '[': () => cyclePalette(-1),
      ']': () => cyclePalette(1),
    };
    const handler = handlers[e.key.toLowerCase()];
    if (handler !== undefined) {
      e.preventDefault();
      handler();
    }
  });

  setupReveal(root);

  syncTheme();
  syncForm();
  render();
}

// スクロールで各セクションをそっと現す。reduced-motionや
// IntersectionObserver非対応では、最初から見えている状態にする。
function setupReveal(root: HTMLElement): void {
  const targets = root.querySelectorAll<HTMLElement>('.reveal');
  const reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof IntersectionObserver !== 'function') {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  targets.forEach((el) => observer.observe(el));
}
