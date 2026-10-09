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
  /** 统计口径说明备注：原始统计11门/19.0学分，明细为10门课程名称/18.0学分 */
  creditAuditNote: '原始课表统计为 11 门课程、19.0 学分；但明细表格中列出 10 个不同课程名称，学分相加为 18.0 学分。课程数量差额的一种可能解释是国家安全教育的线上与线下安排被分开计数，但具体统计口径与学分差额原因均尚待确认。此处完整保留原始数据，不作主观推断或擅自修改。'
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

export const courses: Course[] = [
  // 周一
  {
    id: 'monday-math-a1',
    name: '高等数学A1',
    weekday: 1,
    start: '14:00',
    end: '15:50',
    teacher: '吕红杰',
    room: '教三楼204',
    weeks: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  },
  // 周二
  {
    id: 'tuesday-c-lang',
    name: 'C语言程序设计',
    weekday: 2,
    start: '08:00',
    end: '09:50',
    teacher: '常化文',
    room: '教三楼700',
    weeks: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    segments: [
      { start: '08:00', end: '08:50' },
      { start: '09:00', end: '09:50' }
    ]
  },
  {
    id: 'tuesday-english-reading-a1',
    name: '大学英语读写译A1',
    weekday: 2,
    start: '10:10',
    end: '12:00',
    teacher: '林娜',
    room: '教三楼504',
    weeks: [6, 7, 8, 9, 10, 11, 12],
    segments: [
      { start: '10:10', end: '11:00' },
      { start: '11:10', end: '12:00' }
    ]
  },
  {
    id: 'tuesday-math-a1',
    name: '高等数学A1',
    weekday: 2,
    start: '14:00',
    end: '15:50',
    teacher: '吕红杰',
    room: '教三楼200',
    weeks: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  },
  {
    id: 'tuesday-career-planning',
    name: '大学生职业生涯规划',
    weekday: 2,
    start: '16:10',
    end: '18:00',
    teacher: '欧阳杜娟',
    room: '教三楼401',
    weeks: [6, 7, 8, 9, 10, 11, 12]
  },
  // 周三
  {
    id: 'wednesday-circuit-analysis-c',
    name: '电路分析基础C',
    weekday: 3,
    start: '10:10',
    end: '12:00',
    teacher: '陈冬冬',
    room: '教三楼509',
    weeks: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  },
  // 周四
  {
    id: 'thursday-math-a1',
    name: '高等数学A1',
    weekday: 4,
    start: '08:00',
    end: '09:50',
    teacher: '吕红杰',
    room: '教三楼200',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  },
  {
    id: 'thursday-situation-policy-1',
    name: '形势与政策1',
    weekday: 4,
    start: '10:10',
    end: '12:00',
    teacher: '徐菲',
    room: '教三楼204',
    weeks: [5, 6, 7, 8],
    dates: ['2026-10-08', '2026-10-15', '2026-10-22', '2026-10-29']
  },
  {
    id: 'thursday-national-security-offline',
    name: '国家安全教育（线下）',
    weekday: 4,
    start: '14:00',
    end: '18:00',
    teacher: '国家安全教育团队',
    room: '教三楼102',
    weeks: [8],
    dates: ['2026-10-29'],
    segments: [
      { start: '14:00', end: '14:50' },
      { start: '15:00', end: '15:50' },
      { start: '16:10', end: '17:00' },
      { start: '17:10', end: '18:00' }
    ]
  },
  // 周五
  {
    id: 'friday-pe-1',
    name: '大学体育1',
    weekday: 5,
    start: '08:00',
    end: '09:50',
    teacher: '贺伟',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  },
  {
    id: 'friday-english-listening-a1',
    name: '大学英语视听说A1',
    weekday: 5,
    start: '10:10',
    end: '12:00',
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
    segments: [
      { start: '10:10', end: '11:00' },
      { start: '11:10', end: '12:00' }
    ]
  },
  {
    id: 'friday-cs-intro',
    name: '计算机科学导论',
    weekday: 5,
    start: '14:00',
    end: '15:50',
    teacher: '刘炎培',
    room: '教三楼608',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  },
  {
    id: 'friday-c-lang',
    name: 'C语言程序设计',
    weekday: 5,
    start: '16:10',
    end: '18:00',
    teacher: '常化文',
    room: '教三楼700',
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    segments: [
      { start: '16:10', end: '17:00' },
      { start: '17:10', end: '18:00' }
    ]
  },
  // 周六
  {
    id: 'saturday-national-security-online',
    name: '国家安全教育（线上）',
    weekday: 6,
    start: '19:30',
    end: '21:10',
    teacher: '尔雅',
    isOnline: true,
    weeks: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
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
    activePractices
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
