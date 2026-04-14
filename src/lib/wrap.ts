// 字数ベースの折り返しに簡易禁則処理を加える。日本語は単語境界で
// 折り返せないため、行頭・行末に来てはいけない約物だけを動かす。

// 行頭に置けない文字(句読点・閉じ括弧・繰り返し記号など)
const NO_START = new Set([
  ...'、。,..,:;!?!?」』)〉》】〕ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮーんゝゞ々…‥',
]);

// 行末に置けない文字(開き括弧類)
const NO_END = new Set([...'「『((〈《【〔']);

export interface WrapResult {
  lines: string[];
  truncated: boolean;
}

// perLine字で折り返す。行頭禁則は1字までのぶら下げ(行を1字延ばす)で、
// 行末禁則は次行への送り出しで処理する。明示的な改行は尊重する。
export function wrapText(text: string, perLine: number, maxLines = Infinity): WrapResult {
  const lines: string[] = [];
  let truncated = false;

  for (const source of text.split('\n')) {
    const chars = [...source];
    let line: string[] = [];
    const flush = () => {
      lines.push(line.join(''));
      line = [];
    };
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i] ?? '';
      line.push(ch);
      if (line.length >= perLine) {
        const next = chars[i + 1];
        if (next !== undefined && NO_START.has(next) && line.length === perLine) {
          continue; // 次の1字をぶら下げて受け入れる
        }
        if (NO_END.has(ch)) {
          line.pop(); // 開き括弧は次の行へ送る
          flush();
          line.push(ch);
          continue;
        }
        flush();
      }
    }
    if (line.length > 0) flush();
    if (source === '') lines.push('');
  }

  // 連続した明示改行で生じる末尾の空行を整える。
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  if (lines.length > maxLines) {
    truncated = true;
    const kept = lines.slice(0, maxLines);
    const last = [...(kept[maxLines - 1] ?? '')];
    kept[maxLines - 1] = last.slice(0, Math.max(0, perLine - 1)).join('') + '…';
    return { lines: kept, truncated };
  }
  return { lines, truncated };
}

// 縦書きで形が変わる約物を縦書き用字形へ置き換える。
const VERTICAL_FORMS: Record<string, string> = {
  ー: '︱',
  '—': '︱',
  '…': '︙',
  '、': '︑',
  '。': '︒',
  '「': '﹁',
  '」': '﹂',
  '『': '﹃',
  '』': '﹄',
  '(': '︵',
  ')': '︶',
  '〈': '︿',
  '〉': '﹀',
  '《': '︽',
  '》': '︾',
  '【': '︻',
  '】': '︼',
};

export function toVerticalForm(ch: string): string {
  return VERTICAL_FORMS[ch] ?? ch;
}
