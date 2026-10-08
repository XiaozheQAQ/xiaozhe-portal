import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

export type Locale = 'zh-CN' | 'en';

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  'zh-CN': {
    'nav.home': '首页',
    'nav.blog': '文章',
    'nav.projects': '项目',
    'nav.lab': '实验室',
    'nav.about': '关于',
    'nav.search': '搜索',
    'nav.menu': '菜单',
    'brand.blog': '博客',
    'theme.system': '跟随系统',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'hero.eyebrow': '个人技术门户',
    'hero.title': '你好，我是 Xiaozhe',
    'hero.subtitle': '写 Web，折腾 AI，也会研究一些系统、网络和偶尔让人上头的小东西。',
    'hero.ctaProjects': '查看项目',
    'hero.ctaWriting': '阅读文章',
    'hero.current': '当前状态',
    'hero.building': '最近在做',
    'hero.buildingValue': '个人技术门户',
    'hero.learning': '最近在学',
    'hero.learningValue': 'SvelteKit / Edge',
    'hero.exploring': '最近在折腾',
    'hero.exploringValue': 'AI Agent',
    'hero.updated': '更新于 2026 年 10 月',
    'home.quick': '快速浏览',
    'home.quickWriting': '阅读最新文章',
    'home.quickProjects': '查看精选项目',
    'home.quickLab': '进入实验室',
    'section.projects': '项目',
    'section.writing': '文章',
    'section.lab': '实验室',
    'section.viewAll': '查看全部',
    'home.now': '最近在做个人门户，也在学习 SvelteKit，尽量把事情保持简单。',
    'page.blog': '文章',
    'page.projects': '项目',
    'page.lab': '实验室',
    'page.about': '关于',
    'page.search': '搜索',
    'page.blogDescription': '最近写下的一些东西，关于 Web、AI、系统，以及还在学习的内容。',
    'page.projectsDescription': '认真做过，也还在继续做的东西。',
    'page.labDescription': '还在折腾，偶尔成功，偶尔不太成功。',
    'page.aboutTitle': '一些背景。',
    'search.placeholder': '搜索文章、项目和实验',
    'search.label': '搜索文章、项目和实验',
    'search.empty': '没有找到匹配内容。',
    'search.blog': '文章',
    'search.project': '项目',
    'search.lab': '实验室',
    'content.chineseOnly': '仅支持中文',
    'content.copy': '复制',
    'content.copied': '已复制',
    'content.footnotes': '脚注',
    'content.backToContent': '返回正文',
    'status.active': '进行中',
    'status.experimental': '实验中',
    'status.done': '已完成',
    'status.archived': '已归档',
    'status.maintenance': '维护中',
    'footer.tagline': '这里记录一些技术、项目，还有一路上顺手留下的东西。',
    'footer.rss': '订阅 RSS'
  },
  en: {
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.projects': 'Projects',
    'nav.lab': 'Lab',
    'nav.about': 'About',
    'nav.search': 'Search',
    'nav.menu': 'Menu',
    'brand.blog': 'Blog',
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'hero.eyebrow': 'Personal tech portal',
    'hero.title': "Hi, I'm Xiaozhe",
    'hero.subtitle': 'I write for the web, tinker with AI, and keep finding my way into systems and networks.',
    'hero.ctaProjects': 'View projects',
    'hero.ctaWriting': 'Read the writing',
    'hero.current': 'Currently',
    'hero.building': 'Lately',
    'hero.buildingValue': 'This personal portal',
    'hero.learning': 'Learning',
    'hero.learningValue': 'SvelteKit and Edge',
    'hero.exploring': 'Playing with',
    'hero.exploringValue': 'AI agents',
    'hero.updated': 'Updated October 2026',
    'home.quick': 'Quick access',
    'home.quickWriting': 'Read latest writing',
    'home.quickProjects': 'View selected projects',
    'home.quickLab': 'Enter the lab',
    'section.projects': 'Projects',
    'section.writing': 'Writing',
    'section.lab': 'Lab',
    'section.viewAll': 'View all',
    'home.now': 'Working on this portal, learning SvelteKit, and trying to keep the whole thing understandable.',
    'page.blog': 'Blog',
    'page.projects': 'Projects',
    'page.lab': 'Lab',
    'page.about': 'About',
    'page.search': 'Search',
    'page.blogDescription': 'Notes about the web, AI, systems, and things I am still learning.',
    'page.projectsDescription': 'Things I have taken seriously enough to keep working on.',
    'page.labDescription': 'Experiments, half-finished ideas, and the occasional useful accident.',
    'page.aboutTitle': 'A little context.',
    'search.placeholder': 'Search writing, projects and experiments',
    'search.label': 'Search writing, projects and experiments',
    'search.empty': 'No matching content.',
    'search.blog': 'Blog',
    'search.project': 'Project',
    'search.lab': 'Lab',
    'content.chineseOnly': 'Chinese Only',
    'content.copy': 'Copy',
    'content.copied': 'Copied',
    'content.footnotes': 'Footnotes',
    'content.backToContent': 'Back to content',
    'status.active': 'Active',
    'status.experimental': 'Experimental',
    'status.done': 'Done',
    'status.archived': 'Archived',
    'status.maintenance': 'Maintenance',
    'footer.tagline': 'A small place for notes, projects, experiments, and everything in between.',
    'footer.rss': 'Subscribe via RSS'
  }
};

export type I18nContext = {
  locale: Writable<Locale>;
  subscribe: Writable<Locale>['subscribe'];
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

export function createI18n() {
  const locale = writable<Locale>('zh-CN');
  const context: I18nContext = {
    locale,
    subscribe: locale.subscribe,
    setLocale(locale) {
      context.locale.set(locale);
      if (typeof localStorage !== 'undefined') localStorage.setItem('xiaozhe-locale', locale);
      if (typeof document !== 'undefined') document.documentElement.lang = locale;
    },
    t(key) {
      let current: Locale = 'zh-CN';
      const unsubscribe = locale.subscribe((value) => (current = value));
      unsubscribe();
      return dictionaries[current][key] ?? dictionaries.en[key] ?? key;
    }
  };
  setContext('i18n', context);
  return context;
}

export function useI18n() {
  return getContext<I18nContext>('i18n');
}
