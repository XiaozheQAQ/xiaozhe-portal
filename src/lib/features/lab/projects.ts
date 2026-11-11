import type { Locale } from '#lib/i18n';

export type LabProject = {
  repository: `XiaozheQAQ/${string}`;
  status: 'maintenance' | 'development';
  title: string;
  description: Record<Locale, string>;
  tech: readonly string[];
  icon: string;
};

export const labProjects: readonly LabProject[] = [
  {
    repository: 'XiaozheQAQ/netease-music-winui',
    status: 'maintenance',
    title: 'Luma Music',
    description: {
      'zh-CN': '基于 WinUI 3 的 Windows 音乐播放器，支持网易云音乐搜索、歌单和同步歌词。',
      en: 'A Windows music player built with WinUI 3, with NetEase Cloud Music search, playlists, and synced lyrics.'
    },
    tech: ['WinUI 3', 'C#', 'Windows'],
    icon: 'ri-music-2-line'
  },
  {
    repository: 'XiaozheQAQ/xiaozhe-portal',
    status: 'maintenance',
    title: 'Xiaozhe Portal',
    description: {
      'zh-CN': '本站的源代码，用 Markdown 管理文章，也包含个人状态和 maimai DX 成绩档案。',
      en: 'The source code for this site, with Markdown articles, a personal status page, and a maimai DX score archive.'
    },
    tech: ['SvelteKit', 'TypeScript', 'Tailwind CSS'],
    icon: 'ri-window-line'
  },
  {
    repository: 'XiaozheQAQ/Learning-and-construct-platforms',
    status: 'development',
    title: 'Learning and Construction Platforms',
    description: {
      'zh-CN': '面向高校的综合学习平台，目前处于骨架阶段，已搭建课程管理与任务考核的基础模块。',
      en: 'A learning platform for universities, currently at the scaffold stage with initial course management and assessment modules.'
    },
    tech: ['React', 'TypeScript', 'Spring Boot'],
    icon: 'ri-book-open-line'
  }
];

export function projectUrl(project: LabProject) {
  return `https://github.com/${project.repository}`;
}
