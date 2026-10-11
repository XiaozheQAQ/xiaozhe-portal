export type TimeSegment = {
  start: string;
  end: string;
};

export type Course = {
  id: string;
  name: string;
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  start: string;
  end: string;
  room?: string;
  teacher?: string;
  weeks?: number[];
  dates?: string[];
  segments?: TimeSegment[];
  note?: string;
  isOnline?: boolean;
};

export type PracticeEvent = {
  id: string;
  name: string;
  weekRangeText: string;
  dateRange: string;
  startWeek: number;
  endWeek: number;
  teachers: string;
  location?: string;
  time?: string;
  note?: string;
};

export type CourseMeta = {
  name: string;
  credit: number;
  hours: number;
  assessment: '考试' | '考查';
  nature: '必修' | '选修';
};

export const semesterInfo = {
  academicYear: '2026—2027',
  term: 1,
  school: '郑州轻工业大学',
  college: '计算机与人工智能学院',
  major: '计算机科学与技术',
  grade: '2026 级',
  class: '计算机 26-01[33]',
  timezone: 'Asia/Shanghai',
  startDate: '2026-09-07',
  teachingStartDate: '2026-10-08',
  /** 原始课表统计口径：11门课程、19.0学分（保留原始数据不擅自修改） */
  reportedCoursesCount: 11,
  reportedCredits: 19.0,
  /** 兼容旧属性名称 */
  totalCoursesCount: 11,
  totalCredits: 19.0,
  /** 课表明细去重后的课程名称数量：10门（国家安全教育在此算作1门课程） */
  distinctCoursesCount: 10,
  /** 每周常规固定排课时段数量：13个（不含单次课程；高数每周3次，C语言每周2次） */
  regularWeeklySlotsCount: 13,
  /** 单次课程安排条数：1项（仅第8周周四线下国家安全教育） */
  singleEventCount: 1,
  /** 课表录入的全部排课记录条数：14条（13个常规固定时段 + 1项单次排课安排） */
  totalScheduleSlots: 14,
  /** 根据给出的10门课程明细求和的学分：18.0学分 */
  calculatedCredits: 18.0,
  /** 课表汇总与课程明细的差额记录：汇总 11 门/19.0 学分，明细 10 门/18.0 学分 */
  creditAuditNote: '课表汇总为 11 门、19.0 学分，课程明细列出 10 门、合计 18.0 学分，差额原因尚待确认。'
} as const;

export const courseMetas: Record<string, CourseMeta> = {
  '高等数学A1': { name: '高等数学A1', credit: 4.5, hours: 72, assessment: '考试', nature: '必修' },
  'C语言程序设计': { name: 'C语言程序设计', credit: 4.0, hours: 48, assessment: '考试', nature: '必修' },
  '大学英语读写译A1': { name: '大学英语读写译A1', credit: 1.0, hours: 16, assessment: '考试', nature: '必修' },
  '大学生职业生涯规划': { name: '大学生职业生涯规划', credit: 1.0, hours: 12, assessment: '考查', nature: '必修' },
  '电路分析基础C': { name: '电路分析基础C', credit: 2.0, hours: 26, assessment: '考试', nature: '必修' },
  '形势与政策1': { name: '形势与政策1', credit: 0.5, hours: 8, assessment: '考查', nature: '必修' },
  '大学体育1': { name: '大学体育1', credit: 1.0, hours: 36, assessment: '考查', nature: '必修' },
  '大学英语视听说A1': { name: '大学英语视听说A1', credit: 1.0, hours: 16, assessment: '考试', nature: '必修' },
  '计算机科学导论': { name: '计算机科学导论', credit: 2.0, hours: 20, assessment: '考试', nature: '必修' },
  '国家安全教育': { name: '国家安全教育', credit: 1.0, hours: 4, assessment: '考查', nature: '必修' }
};

export const holidayDates: string[] = [
  '2026-10-05',
  '2026-10-06',
  '2026-10-07'
];

// 2026—2027 学年第一学期教学节次（每节 45 分钟，节间休息 10 分钟）。
// 用户可见的课程起止时间一律以 courses 中的 start/end 为准，segments 仅用于课间状态判定与展示。
const SEG_MORNING_FIRST: TimeSegment[] = [
  { start: '08:00', end: '08:45' },
  { start: '08:55', end: '09:40' }
];
const SEG_MORNING_SECOND: TimeSegment[] = [
  { start: '10:00', end: '10:45' },
  { start: '10:55', end: '11:40' }
];
const SEG_AFTERNOON_FIRST: TimeSegment[] = [
  { start: '14:30', end: '15:15' },
  { start: '15:25', end: '16:10' }
];
const SEG_AFTERNOON_SECOND: TimeSegment[] = [
  { start: '16:30', end: '17:15' },
  { start: '17:25', end: '18:10' }
];
const SEG_EVENING: TimeSegment[] = [
  { start: '19:30', end: '20:15' },
  { start: '20:25', end: '21:10' }
];
export const courses: Course[] = [
  // 周一 · 高等数学A1（第5—16周；第5周周一 10-05 为国庆假期，实际从第6周周一 10-12 开始）
  {
    id: 'monday-math-a1',
    name: '高等数学A1',
    weekday: 1,
    start: '14:30',
    end: '16:10',
    teacher: '吕红杰',
    room: '教三楼204',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    segments: SEG_AFTERNOON_FIRST
  },
  // 周二 · C语言程序设计（第5—16周；第5周周二 10-06 为国庆假期）
  {
    id: 'tuesday-c-lang',
    name: 'C语言程序设计',
    weekday: 2,
    start: '08:00',
    end: '09:40',
    teacher: '常化文',
    room: '教三楼700',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    segments: SEG_MORNING_FIRST
  },
  // 周二 · 大学英语读写译A1（第5—12周）
  {
    id: 'tuesday-english-reading-a1',
    name: '大学英语读写译A1',
    weekday: 2,
    start: '10:00',
    end: '11:40',
    teacher: '林娜',
    room: '教三楼504',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12],
    segments: SEG_MORNING_SECOND
  },
  // 周二 · 高等数学A1（第5—16周）
  {
    id: 'tuesday-math-a1',
    name: '高等数学A1',
    weekday: 2,
    start: '14:30',
    end: '16:10',
    teacher: '吕红杰',
    room: '教三楼200',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    segments: SEG_AFTERNOON_FIRST
  },
  // 周二 · 大学生职业生涯规划（第5—12周；与上一节高等数学间隔仅 20 分钟）
  {
    id: 'tuesday-career-planning',
    name: '大学生职业生涯规划',
    weekday: 2,
    start: '16:30',
    end: '18:10',
    teacher: '欧阳杜娟',
    room: '教三楼401',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12],
    segments: SEG_AFTERNOON_SECOND
  },
  // 周三 · 电路分析基础C（第5—17周；第5周周三 10-07 为国庆假期）
  {
    id: 'wednesday-circuit-analysis-c',
    name: '电路分析基础C',
    weekday: 3,
    start: '10:00',
    end: '11:40',
    teacher: '陈冬冬',
    room: '教三楼509',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    segments: SEG_MORNING_SECOND
  },
  // 周四 · 高等数学A1（第5—16周；首次实际授课 2026-10-08）
  {
    id: 'thursday-math-a1',
    name: '高等数学A1',
    weekday: 4,
    start: '08:00',
    end: '09:40',
    teacher: '吕红杰',
    room: '教三楼200',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    segments: SEG_MORNING_FIRST
  },
  // 周四 · 形势与政策1（第5—8周；对应 10-08/10-15/10-22/10-29 四次）
  {
    id: 'thursday-situation-policy-1',
    name: '形势与政策1',
    weekday: 4,
    start: '10:00',
    end: '11:40',
    teacher: '徐菲',
    room: '教三楼204',
    weeks: [5, 6, 7, 8],
    dates: ['2026-10-08', '2026-10-15', '2026-10-22', '2026-10-29'],
    segments: SEG_MORNING_SECOND
  },
  // 周四 · 国家安全教育（线下）：独立的单次安排，仅 2026-10-29 一次，14:00—18:00
  // 不按周重复，也不拆分节次（官方未提供该时段的节次结构）。
  {
    id: 'thursday-national-security-offline',
    name: '国家安全教育（线下）',
    weekday: 4,
    start: '14:00',
    end: '18:00',
    teacher: '国家安全教育团队',
    room: '教三楼102',
    weeks: [8],
    dates: ['2026-10-29']
  },
  // 周五 · 大学体育1（第5—17周；地点课表未提供，不得自行填写）
  {
    id: 'friday-pe-1',
    name: '大学体育1',
    weekday: 5,
    start: '08:00',
    end: '09:40',
    teacher: '贺伟',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    segments: SEG_MORNING_FIRST
  },
  // 周五 · 大学英语视听说A1：以 8 个确切日期为准（第8—15周，教师病假自第8周开始）
  {
    id: 'friday-english-listening-a1',
    name: '大学英语视听说A1',
    weekday: 5,
    start: '10:00',
    end: '11:40',
    teacher: '郭超',
    room: '教一楼103',
    weeks: [8, 9, 10, 11, 12, 13, 14, 15],
    dates: [
      '2026-10-30',
      '2026-11-06',
      '2026-11-13',
      '2026-11-20',
      '2026-11-27',
      '2026-12-04',
      '2026-12-11',
      '2026-12-18'
    ],
    segments: SEG_MORNING_SECOND
  },
  // 周五 · 计算机科学导论（第5—14周，第14周后停止）
  {
    id: 'friday-cs-intro',
    name: '计算机科学导论',
    weekday: 5,
    start: '14:30',
    end: '16:10',
    teacher: '刘炎培',
    room: '教三楼608',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    segments: SEG_AFTERNOON_FIRST
  },
  // 周五 · C语言程序设计（第5—16周）
  {
    id: 'friday-c-lang',
    name: 'C语言程序设计',
    weekday: 5,
    start: '16:30',
    end: '18:10',
    teacher: '常化文',
    room: '教三楼700',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    segments: SEG_AFTERNOON_SECOND
  },
  // 周六 · 国家安全教育（线上/平台安排，第5—17周）——与周四 10-29 线下安排相互独立
  {
    id: 'saturday-national-security-online',
    name: '国家安全教育（线上）',
    weekday: 6,
    start: '19:30',
    end: '21:10',
    teacher: '尔雅',
    room: '教三楼102',
    isOnline: true,
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    segments: SEG_EVENING
  }
];

export const practiceEvents: PracticeEvent[] = [
  {
    id: 'practice-electronic-internship-b',
    name: '电子实习B',
    weekRangeText: '第7周',
    dateRange: '2026-10-19 至 2026-10-25',
    startWeek: 7,
    endWeek: 7,
    teachers: '王俊杰、周振',
    location: '未提供',
    time: '未提供'
  },
  {
    id: 'practice-programming-training',
    name: '程序设计实训',
    weekRangeText: '第8–9周',
    dateRange: '2026-10-26 至 2026-11-08',
    startWeek: 8,
    endWeek: 9,
    teachers: '王凤琴',
    location: '未提供',
    time: '未提供'
  },
  {
    id: 'practice-professional-internship',
    name: '专业见习',
    weekRangeText: '第10周',
    dateRange: '2026-11-09 至 2026-11-15',
    startWeek: 10,
    endWeek: 10,
    teachers: '徐盛',
    location: '未提供',
    time: '未提供'
  }
];

export type RoomAccess = 'elevator' | 'stairs' | 'ground';

export type RoomGuide = {
  room: string;
  /** 电梯可达性：elevator 可达 / stairs 不可达（走楼梯）/ ground 无需上楼 */
  access: RoomAccess;
  /** 方位：left 左侧 / right 右侧 */
  side?: 'left' | 'right';
  /** 从楼栋正门出发的完整步行路线 */
  route: string;
  /** 关联课程等补充说明 */
  note?: string;
};

// 教室路线统一按“教室”维度维护，避免同一教室在不同课程里出现互相冲突的描述。
export const roomGuides: Record<string, RoomGuide> = {
  '教三楼204': {
    room: '教三楼204',
    access: 'stairs',
    side: 'left',
    route: '从教三楼正门进入后左转，上楼梯到二楼，进门左转直走。',
    note: '高等数学A1（周一）、形势与政策1'
  },
  '教三楼200': {
    room: '教三楼200',
    access: 'stairs',
    side: 'left',
    route: '从教三楼正门进入后左转，上楼梯到二楼，进门左转直走，到头再左转。',
    note: '高等数学A1（周二、周四）'
  },
  '教三楼700': {
    room: '教三楼700',
    access: 'elevator',
    side: 'left',
    route: '从教三楼正门进入后左转，乘坐电梯到七楼，再左转到最里面的教室。',
    note: 'C语言程序设计（周二、周五）'
  },
  '教三楼504': {
    room: '教三楼504',
    access: 'elevator',
    side: 'left',
    route: '从教三楼正门进入后左转，乘坐电梯到五楼，再左转。',
    note: '大学英语读写译A1'
  },
  '教三楼509': {
    room: '教三楼509',
    access: 'elevator',
    side: 'right',
    route: '从教三楼正门进入后右转，乘坐电梯到五楼，再右转即到。',
    note: '电路分析基础C'
  },
  '教三楼401': {
    room: '教三楼401',
    access: 'stairs',
    side: 'right',
    route: '从教三楼正门进入后右转，步行至四楼，右转经过403、405，即到401。',
    note: '大学生职业生涯规划'
  },
  '教三楼608': {
    room: '教三楼608',
    access: 'elevator',
    side: 'left',
    route: '从教三楼正门进入后左转，乘坐电梯到六楼，再左转即到。',
    note: '计算机科学导论'
  },
  '教一楼103': {
    room: '教一楼103',
    access: 'ground',
    route: '从教一楼正门进入，从楼梯右侧进入，不上楼，右拐直行，上一小段台阶后，右手侧正对即为103。',
    note: '大学英语视听说A1；教一楼在食堂正大门斜对面，右侧大门位于拐角处'
  },
  '教三楼102': {
    room: '教三楼102',
    access: 'ground',
    route: '从教三楼正门进入后左转，直走到头即到。',
    note: '国家安全教育（周六线上/平台安排与 10-29 周四单次线下安排）'
  }
};

export function getRoomGuide(room?: string): RoomGuide | undefined {
  if (!room) return undefined;
  return roomGuides[room];
}

export type RoomChangeNotice = {
  id: string;
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  fromRoom: string;
  toRoom: string;
  fromEndTime: string;
  toStartTime: string;
  gapMinutes: number;
};

// 换教室提醒：仅记录确有冲突风险的相邻课程。
export const roomChangeNotices: RoomChangeNotice[] = [
  {
    id: 'tuesday-math-to-career-planning',
    weekday: 2,
    fromRoom: '教三楼200',
    toRoom: '教三楼401',
    fromEndTime: '16:10',
    toStartTime: '16:30',
    gapMinutes: 20
  }
];
export function parseMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getShanghaiParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: semesterInfo.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdays: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7
  };

  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const weekday = weekdays[values.weekday] ?? 1;
  const minutes = Number(values.hour) * 60 + Number(values.minute);

  return {
    year,
    month,
    day,
    dateString,
    weekday,
    minutes
  };
}

export function getSemesterWeek(date: Date): number | null {
  const { year, month, day } = getShanghaiParts(date);
  // 学期第1周周一：2026-09-07 UTC 00:00
  const startUtc = Date.UTC(2026, 8, 7);
  const currentUtc = Date.UTC(year, month - 1, day);
  const diffDays = Math.floor((currentUtc - startUtc) / 86400000);
  const week = Math.floor(diffDays / 7) + 1;
  return week >= 1 ? week : null;
}

export function isCourseActiveOnDate(course: Course, dateString: string, week: number | null): boolean {
  if (holidayDates.includes(dateString)) {
    return false;
  }
  if (course.dates && course.dates.length > 0) {
    return course.dates.includes(dateString);
  }
  if (course.weeks && week !== null) {
    return course.weeks.includes(week);
  }
  return true;
}

export function getTodaysCourses(date: Date): Course[] {
  const { dateString, weekday } = getShanghaiParts(date);
  const week = getSemesterWeek(date);

  return courses
    .filter((course) => course.weekday === weekday && isCourseActiveOnDate(course, dateString, week))
    .sort((a, b) => parseMinutes(a.start) - parseMinutes(b.start));
}

export function isCourseInSession(course: Course, minutes: number): boolean {
  if (course.segments && course.segments.length > 0) {
    return course.segments.some((segment) => {
      const start = parseMinutes(segment.start);
      const end = parseMinutes(segment.end);
      return minutes >= start && minutes < end;
    });
  }
  const start = parseMinutes(course.start);
  const end = parseMinutes(course.end);
  return minutes >= start && minutes < end;
}

export function isCourseInBreak(course: Course, minutes: number): boolean {
  const overallStart = parseMinutes(course.start);
  const overallEnd = parseMinutes(course.end);
  if (minutes < overallStart || minutes >= overallEnd) {
    return false;
  }
  if (!course.segments || course.segments.length <= 1) {
    return false;
  }
  return !isCourseInSession(course, minutes);
}

export function getScheduleDetails(date: Date) {
  const { dateString, weekday, minutes } = getShanghaiParts(date);
  const week = getSemesterWeek(date);
  const isHoliday = holidayDates.includes(dateString);
  const todaysCourses = isHoliday ? [] : getTodaysCourses(date);

  const currentCourse = todaysCourses.find((course) => isCourseInSession(course, minutes));
  const breakCourse = !currentCourse
    ? todaysCourses.find((course) => isCourseInBreak(course, minutes))
    : undefined;

  const nextCourse = todaysCourses.find((course) => {
    const start = parseMinutes(course.start);
    return start > minutes;
  });

  const activePractices = week !== null
    ? practiceEvents.filter((event) => week >= event.startWeek && week <= event.endWeek)
    : [];

  // 今日各节课对应的教室路线（按课程顺序去重，集中实践不产生教室路线）。
  const todayRoomGuides = todaysCourses
    .map((course) => getRoomGuide(course.room))
    .filter((guide): guide is RoomGuide => Boolean(guide))
    .filter((guide, index, list) => list.findIndex((item) => item.room === guide.room) === index);

  const roomChangeNotice = todaysCourses.length > 0
    ? roomChangeNotices.find((notice) => notice.weekday === weekday)
    : undefined;

  return {
    week,
    weekday,
    dateString,
    minutes,
    isHoliday,
    todaysCourses,
    currentCourse,
    breakCourse,
    nextCourse,
    activePractices,
    todayRoomGuides,
    roomChangeNotice,
    /** 距离下一节课开始的分钟数；无后续课程时为 null */
    minutesUntilNext: nextCourse ? parseMinutes(nextCourse.start) - minutes : null
  };
}

export type StatusService = {
  key: string;
  path: string;
};

export const statusServices: StatusService[] = [
  { key: 'home', path: '/' },
  { key: 'blog', path: '/blog' },
  { key: 'lab', path: '/lab' },
  { key: 'about', path: '/about' }
];