import type { Locale } from '#lib/i18n';

export type FooterTip =
  | { kind: 'text'; text: Record<Locale, string> }
  | { kind: 'time' };

/**
 * Author-supplied footer trivia. One entry is shown at random on each visit;
 * the time entry renders the visitor's local clock and updates every second.
 */
export const footerTips: readonly FooterTip[] = [
  {
    kind: 'text',
    text: {
      'zh-CN': '你说得对，但是...',
      en: "You're right, but..."
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '1+1+4+514=520',
      en: '1+1+4+514=520'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '哼哼哼啊啊啊啊啊啊啊啊',
      en: 'Hmph hmph hmph aaaaaaaa'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '关注小哲谢谢喵',
      en: 'Follow Xiaozhe, thanks meow.'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': 'Fa♂Q',
      en: 'Fa♂Q'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '我很可爱，请给我钱',
      en: "I'm cute, please give me money."
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '不知道写什么提示.jpg',
      en: 'No idea what to write here.jpg'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '恭喜你，获得了0元大奖',
      en: 'Congratulations, you won a 0-yuan prize.'
    }
  },
  {
    kind: 'time'
  },
  {
    kind: 'text',
    text: {
      'zh-CN': 'Cykablyat！',
      en: 'Cykablyat!'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '哈基米南北路多',
      en: 'Hakimi nanbeilu duo'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '欢迎填报郑州轻工业大学',
      en: 'Welcome to apply to Zhengzhou University of Light Industry.'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '计科很好，图灵派很妙',
      en: 'Computer science is great; the Turing school is wonderful.'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '欢迎扩列！OvO',
      en: 'Feel free to add me! OvO'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '未恋爱，等待对的人',
      en: 'Single, waiting for the right person.'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': 'TvT 我想静静，但是不知道静静是谁',
      en: "TvT I want some peace, but I don't know who Jingjing is."
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '喵帕斯~',
      en: 'Nyanpasu~'
    }
  },
  {
    kind: 'text',
    text: {
      'zh-CN': '帕秋莉，Go！',
      en: 'Patchouli, go!'
    }
  }
];
