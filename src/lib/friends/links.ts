export type FriendLink = {
  /** Site name exactly as published on the source page. */
  name: string;
  url: string;
  /** Intro text exactly as published on the source page. */
  description: string;
  /** Local copy of the icon offered by the source page, if there was one. */
  icon?: string;
};

/**
 * Friend links mirrored from https://xznice.dpdns.org/ (the "友链" panel).
 * Read and verified on 2026-10-09; names, URLs and descriptions are copied
 * verbatim from that page and icons were downloaded from the same panel.
 *
 * Intentionally omitted: 归星 (https://blog.gzxing.asia/) — removed on request.
 * Do not re-add it when refreshing this list.
 */
export const friendLinks: FriendLink[] = [
  {
    name: 'Xiaocuitang',
    url: 'https://iceawa.com/',
    description: '豪姐妹x',
    icon: '/images/friends/xiaocuitang.webp'
  },
  {
    name: '玖小柒',
    url: 'https://www.jiuxiaoqi.top/',
    description: '全栈开发大佬',
    icon: '/images/friends/jiuxiaoqi.webp'
  },
  {
    name: 'Yuesekaer',
    url: 'https://yuesekaer.com/',
    description: '无私的分享站',
    icon: '/images/friends/yuesekaer.ico'
  }
];

/** Source page the list above was read from, shown in the friends section. */
export const friendLinksSource = 'https://xznice.dpdns.org/';
