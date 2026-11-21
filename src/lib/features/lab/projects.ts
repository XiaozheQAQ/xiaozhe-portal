import type { Locale } from '#lib/i18n';

export type LabProject = {
  url: `https://${string}`;
  linkType: 'repository' | 'app' | 'software';
  status: 'maintenance' | 'development';
  title: string;
  description: Record<Locale, string>;
  tags: readonly string[];
  icon: string;
};

export const labProjects: readonly LabProject[] = [
  {
    url: 'https://github.com/XiaozheQAQ/netease-music-winui',
    linkType: 'repository',
    status: 'maintenance',
    title: 'Luma Music',
    description: {
      'zh-CN': '基于 WinUI 3 的 Windows 音乐播放器，支持网易云音乐搜索、歌单和同步歌词。',
      en: 'A Windows music player built with WinUI 3, with NetEase Cloud Music search, playlists, and synced lyrics.'
    },
    tags: ['WinUI 3', 'C#', 'Windows'],
    icon: 'ri-music-2-line'
  },
  {
    url: 'https://exam.xiaozhe.link/',
    linkType: 'app',
    status: 'maintenance',
    title: 'A 类业余无线电题库与模拟考试',
    description: {
      'zh-CN': '在线练习 A 类业余无线电题库，通过模拟考试检验学习情况。',
      en: 'An online question bank and mock exams for the Class A amateur radio examination.'
    },
    tags: ['Web App', 'Amateur Radio'],
    icon: 'ri-radio-line'
  },
  {
    url: 'https://github.com/XiaozheQAQ/xiaozhe-portal',
    linkType: 'repository',
    status: 'maintenance',
    title: 'Xiaozhe Portal',
    description: {
      'zh-CN': '本站的源代码，用 Markdown 管理文章，也包含个人状态和 maimai DX 成绩档案。',
      en: 'The source code for this site, with Markdown articles, a personal status page, and a maimai DX score archive.'
    },
    tags: ['SvelteKit', 'TypeScript', 'Tailwind CSS'],
    icon: 'ri-window-line'
  },
  {
    url: 'https://github.com/XiaozheQAQ/Enable-RDP',
    linkType: 'repository',
    status: 'maintenance',
    title: 'RDP-QuickAccess',
    description: {
      'zh-CN': 'Windows 10/11 局域网 RDP 一键配置、状态检查与生命周期管理工具，支持账户轮换、防火墙规则和快照恢复。',
      en: 'A one-click RDP setup, status check, and lifecycle tool for Windows 10/11 LANs, with account rotation, firewall rules, and snapshot restore.'
    },
    tags: ['PowerShell', 'Windows', 'RDP'],
    icon: 'ri-computer-line'
  },
  {
    url: 'https://github.com/XiaozheQAQ/proxy-tui',
    linkType: 'repository',
    status: 'development',
    title: 'ProxyTUI',
    description: {
      'zh-CN': '面向 Windows、Linux 和 macOS 的终端代理客户端，封装 Mihomo 与 sing-box，支持订阅导入、节点切换和系统代理接管。',
      en: 'A terminal-native proxy client for Windows, Linux, and macOS that wraps Mihomo and sing-box, with subscription import, node switching, and system proxy takeover.'
    },
    tags: ['Go', 'TUI', 'Proxy'],
    icon: 'ri-terminal-box-line'
  },
  {
    url: 'https://github.com/XiaozheQAQ/HS2',
    linkType: 'repository',
    status: 'maintenance',
    title: 'Homework Sentinel',
    description: {
      'zh-CN': '本地优先的作业通知整理工具：把教学应用通知收进收件箱，人工确认后转成带截止时间的作业清单。',
      en: 'A local-first homework notification organizer: collect teaching-app notifications in an inbox, confirm them, and turn them into assignments with deadlines.'
    },
    tags: ['Android', 'Notifications', 'Local-first'],
    icon: 'ri-smartphone-line'
  },
  {
    url: 'https://github.com/XiaozheQAQ/Learning-and-construct-platforms',
    linkType: 'repository',
    status: 'development',
    title: 'Learning and Construction Platforms',
    description: {
      'zh-CN': '面向高校的综合学习平台，目前处于骨架阶段，已搭建课程管理与任务考核的基础模块。',
      en: 'A learning platform for universities, currently at the scaffold stage with initial course management and assessment modules.'
    },
    tags: ['React', 'TypeScript', 'Spring Boot'],
    icon: 'ri-book-open-line'
  }
];
