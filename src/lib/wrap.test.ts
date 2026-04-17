import { describe, expect, it } from 'vitest';
import { toVerticalForm, wrapText } from './wrap';

describe('wrapText', () => {
  it('指定字数で折り返す', () => {
    expect(wrapText('あいうえおかきくけこ', 4).lines).toEqual(['あいうえ', 'おかきく', 'けこ']);
  });

  it('行頭に句読点が来るときは前の行へぶら下げる', () => {
    expect(wrapText('あいうえ。かきく', 4).lines).toEqual(['あいうえ。', 'かきく']);
  });

  it('行頭の閉じ括弧もぶら下げる', () => {
    expect(wrapText('「あいう」と言う', 4).lines).toEqual(['「あいう」', 'と言う']);
  });

  it('行末の開き括弧は次の行へ送る', () => {
    expect(wrapText('あいう「えおかき」', 4).lines).toEqual(['あいう', '「えおか', 'き」']);
  });

  it('明示的な改行を尊重する', () => {
    expect(wrapText('あい\nうえ', 10).lines).toEqual(['あい', 'うえ']);
  });

  it('空行を保持する', () => {
    expect(wrapText('あい\n\nうえ', 10).lines).toEqual(['あい', '', 'うえ']);
  });

  it('行数上限を超えたら省略して報告する', () => {
    const result = wrapText('あ'.repeat(30), 5, 2);
    expect(result.truncated).toBe(true);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[1]?.endsWith('…')).toBe(true);
  });

  it('上限内なら省略しない', () => {
    const result = wrapText('あいうえお', 5, 2);
    expect(result.truncated).toBe(false);
    expect(result.lines).toEqual(['あいうえお']);
  });

  it('サロゲートペアを壊さない', () => {
    expect(wrapText('𠮷野家と𩸽の話', 3).lines).toEqual(['𠮷野家', 'と𩸽の', '話']);
  });
});

describe('toVerticalForm', () => {
  it('句読点と括弧を縦書き用字形にする', () => {
    expect(toVerticalForm('、')).toBe('︑');
    expect(toVerticalForm('。')).toBe('︒');
    expect(toVerticalForm('「')).toBe('﹁');
    expect(toVerticalForm('」')).toBe('﹂');
  });

  it('長音は縦線に置き換える', () => {
    expect(toVerticalForm('ー')).toBe('︱');
  });

  it('それ以外の文字はそのまま返す', () => {
    expect(toVerticalForm('本')).toBe('本');
    expect(toVerticalForm('A')).toBe('A');
  });
});
