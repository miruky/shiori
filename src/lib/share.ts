// カードの設定をURLのハッシュに載せて共有できるようにする。
// JSONをUTF-8安全なbase64urlへ変換し、読み込み時に復元する。

import type { CardSpec } from './card';
import { normalizeSpec } from './card';

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSpec(spec: CardSpec): string {
  return toBase64Url(JSON.stringify(spec));
}

// 復元できないとき(壊れた文字列など)はnullを返し、呼び出し側で
// 保存値や既定にフォールバックさせる。
export function decodeSpec(encoded: string): CardSpec | null {
  if (encoded === '') return null;
  try {
    return normalizeSpec(JSON.parse(fromBase64Url(encoded)));
  } catch {
    return null;
  }
}

const HASH_PREFIX = '#c=';

export function specToHash(spec: CardSpec): string {
  return HASH_PREFIX + encodeSpec(spec);
}

export function specFromHash(hash: string): CardSpec | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  return decodeSpec(hash.slice(HASH_PREFIX.length));
}
