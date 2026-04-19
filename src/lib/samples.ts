// 例文。著作権の切れた作品の一節を、組みの見本として用意する。
// ギャラリーから選ぶとそのまま設定に流し込まれる。

import type { CardFrame, CardLayout } from './card';

export interface Sample {
  quote: string;
  title: string;
  author: string;
  layout: CardLayout;
  paletteId: string;
  frame: CardFrame;
}

export const SAMPLES: Sample[] = [
  {
    quote:
      '智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。',
    title: '草枕',
    author: '夏目漱石',
    layout: 'horizontal',
    paletteId: 'kinari',
    frame: 'kagi',
  },
  {
    quote: 'メロスは激怒した。必ず、かの邪智暴虐の王を除かなければならぬと決意した。',
    title: '走れメロス',
    author: '太宰治',
    layout: 'vertical',
    paletteId: 'ai',
    frame: 'rule',
  },
  {
    quote: 'ある日の暮方の事である。一人の下人が、羅生門の下で雨やみを待っていた。',
    title: '羅生門',
    author: '芥川龍之介',
    layout: 'horizontal',
    paletteId: 'sumi',
    frame: 'kagi',
  },
  {
    quote: '人生は何事をも為さぬには余りに長いが、何事かを為すには余りに短い。',
    title: '山月記',
    author: '中島敦',
    layout: 'vertical',
    paletteId: 'tetsukon',
    frame: 'none',
  },
  {
    quote: 'ほんとうのさいわいは一体何だろう。僕はもうあのさそりのようにみんなのために。',
    title: '銀河鉄道の夜',
    author: '宮沢賢治',
    layout: 'horizontal',
    paletteId: 'seiji',
    frame: 'rule',
  },
  {
    quote: '廻れば大門の見返り柳いと長けれど、お歯ぐろ溝に灯火うつる三階の騒ぎも手に取る如く。',
    title: 'たけくらべ',
    author: '樋口一葉',
    layout: 'vertical',
    paletteId: 'sakura',
    frame: 'kagi',
  },
];
