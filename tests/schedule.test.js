// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSemesterWeek,
  getTodaysCourses,
  getScheduleDetails,
  isCourseInSession,
  isCourseInBreak,
  getRoomGuide,
  roomGuides,
  roomChangeNotices,
  courses,
  practiceEvents,
  semesterInfo,
  courseMetas
} from '../src/lib/status/schedule.ts';

// 构造上海时区指定时间的 Date 对象
function makeDate(dateStr, timeStr = '12:00') {
  return new Date(dateStr + 'T' + timeStr + ':00+08:00');
}

function names(list) {
  return list.map((c) => c.name);
}

function courseById(id) {
  return courses.find((c) => c.id === id);
}

function timeOf(list, name) {
  const item = list.find((c) => c.name === name);
  return item ? item.start + '-' + item.end : null;
}

test('课程统计与学分核对（保留原始口径）', () => {
  assert.equal(semesterInfo.reportedCoursesCount, 11, '原始课表记录应为11门课程');
  assert.equal(semesterInfo.reportedCredits, 19.0, '原始课表记录应为19.0学分');

  const distinctMetaNames = Object.keys(courseMetas);
  assert.equal(distinctMetaNames.length, 10, '明细中应有10门不同课程名称');
  assert.equal(semesterInfo.distinctCoursesCount, 10);

  assert.equal(semesterInfo.regularWeeklySlotsCount, 13, '常规每周固定时段应为13个');
  assert.equal(semesterInfo.singleEventCount, 1, '单次排课安排应为1项');
  assert.equal(courses.length, 14, '排课记录总计应为14条');
  assert.equal(semesterInfo.totalScheduleSlots, 14);

  const sumCredits = Object.values(courseMetas).reduce((acc, c) => acc + c.credit, 0);
  assert.equal(sumCredits, 18.0, '明细学分累加为18.0');
  assert.equal(semesterInfo.calculatedCredits, 18.0);

  // 差额原因未确认：说明中不得断言一定来自国家安全教育重复安排
  assert.ok(semesterInfo.creditAuditNote.includes('尚待确认'));
});

test('所有课程起止时间均采用最新版（无旧时间残留）', () => {
  const expected = {
    'monday-math-a1': ['14:30', '16:10'],
    'tuesday-c-lang': ['08:00', '09:40'],
    'tuesday-english-reading-a1': ['10:00', '11:40'],
    'tuesday-math-a1': ['14:30', '16:10'],
    'tuesday-career-planning': ['16:30', '18:10'],
    'wednesday-circuit-analysis-c': ['10:00', '11:40'],
    'thursday-math-a1': ['08:00', '09:40'],
    'thursday-situation-policy-1': ['10:00', '11:40'],
    'thursday-national-security-offline': ['14:00', '18:00'],
    'friday-pe-1': ['08:00', '09:40'],
    'friday-english-listening-a1': ['10:00', '11:40'],
    'friday-cs-intro': ['14:30', '16:10'],
    'friday-c-lang': ['16:30', '18:10'],
    'saturday-national-security-online': ['19:30', '21:10']
  };
  for (const [id, [start, end]] of Object.entries(expected)) {
    const course = courseById(id);
    assert.ok(course, id + ' 应存在');
    assert.equal(course.start, start, id + ' 开始时间应为最新版');
    assert.equal(course.end, end, id + ' 结束时间应为最新版');
  }

  // 旧版时间不得出现在任何课程的起止时间里
  for (const course of courses) {
    assert.notEqual(course.start, '10:10', course.id + ' 不应使用旧版 10:10');
    assert.notEqual(course.end, '15:50', course.id + ' 不应使用旧版 15:50');
    assert.notEqual(course.end, '12:00', course.id + ' 不应使用旧版 12:00');
  }

  // 分段节次同样必须为新版 45 分钟结构
  assert.deepEqual(courseById('tuesday-c-lang').segments, [
    { start: '08:00', end: '08:45' },
    { start: '08:55', end: '09:40' }
  ]);
  assert.deepEqual(courseById('friday-c-lang').segments, [
    { start: '16:30', end: '17:15' },
    { start: '17:25', end: '18:10' }
  ]);
});

test('国庆假期与第5周常规课程起始', () => {
  assert.equal(getTodaysCourses(makeDate('2026-10-05')).length, 0, '10-05 国庆假期不应排课');
  assert.equal(getTodaysCourses(makeDate('2026-10-06')).length, 0, '10-06 国庆假期不应排课');
  assert.equal(getTodaysCourses(makeDate('2026-10-07')).length, 0, '10-07 国庆假期不应排课');

  const thu = getTodaysCourses(makeDate('2026-10-08'));
  assert.equal(getSemesterWeek(makeDate('2026-10-08')), 5);
  assert.deepEqual(names(thu), ['高等数学A1', '形势与政策1']);
  assert.equal(timeOf(thu, '高等数学A1'), '08:00-09:40');
  assert.equal(timeOf(thu, '形势与政策1'), '10:00-11:40');

  const fri = getTodaysCourses(makeDate('2026-10-09'));
  assert.deepEqual(names(fri), ['大学体育1', '计算机科学导论', 'C语言程序设计']);
  assert.equal(timeOf(fri, '大学体育1'), '08:00-09:40');
  assert.equal(timeOf(fri, '计算机科学导论'), '14:30-16:10');
  assert.equal(timeOf(fri, 'C语言程序设计'), '16:30-18:10');
  assert.equal(names(fri).includes('大学英语视听说A1'), false, '10-09 不得出现英语视听说');
});

test('第6周常规课表（10-12 至 10-16）', () => {
  const mon = getTodaysCourses(makeDate('2026-10-12'));
  assert.equal(getSemesterWeek(makeDate('2026-10-12')), 6);
  assert.deepEqual(names(mon), ['高等数学A1']);
  assert.equal(timeOf(mon, '高等数学A1'), '14:30-16:10');

  const tue = getTodaysCourses(makeDate('2026-10-13'));
  assert.deepEqual(names(tue), ['C语言程序设计', '大学英语读写译A1', '高等数学A1', '大学生职业生涯规划']);
  assert.equal(timeOf(tue, 'C语言程序设计'), '08:00-09:40');
  assert.equal(timeOf(tue, '大学英语读写译A1'), '10:00-11:40');
  assert.equal(timeOf(tue, '高等数学A1'), '14:30-16:10');
  assert.equal(timeOf(tue, '大学生职业生涯规划'), '16:30-18:10');

  const wed = getTodaysCourses(makeDate('2026-10-14'));
  assert.deepEqual(names(wed), ['电路分析基础C']);
  assert.equal(timeOf(wed, '电路分析基础C'), '10:00-11:40');

  const fri = getTodaysCourses(makeDate('2026-10-16'));
  assert.deepEqual(names(fri), ['大学体育1', '计算机科学导论', 'C语言程序设计']);
  assert.equal(names(fri).includes('大学英语视听说A1'), false, '10-16 不得出现英语视听说');
});

test('国家安全教育：线上与线下两条独立安排', () => {
  const sat = getTodaysCourses(makeDate('2026-10-10'));
  assert.equal(sat.length, 1);
  assert.equal(sat[0].name, '国家安全教育（线上）');
  assert.equal(sat[0].start, '19:30');
  assert.equal(sat[0].end, '21:10');
  assert.equal(sat[0].isOnline, true);
  assert.equal(sat[0].room, '教三楼102');

  const thu = getTodaysCourses(makeDate('2026-10-29'));
  assert.deepEqual(names(thu), ['高等数学A1', '形势与政策1', '国家安全教育（线下）']);
  assert.equal(timeOf(thu, '国家安全教育（线下）'), '14:00-18:00');

  // 线下国安不得按周重复
  assert.equal(names(getTodaysCourses(makeDate('2026-10-22'))).includes('国家安全教育（线下）'), false);
  assert.equal(names(getTodaysCourses(makeDate('2026-11-05'))).includes('国家安全教育（线下）'), false);

  // 周六线上安排不因周四线下安排而消失
  assert.ok(names(getTodaysCourses(makeDate('2026-10-31'))).includes('国家安全教育（线上）'));
});

test('大学英语视听说A1仅 8 次课，且日期精确', () => {
  const expected = ['2026-10-30', '2026-11-06', '2026-11-13', '2026-11-20', '2026-11-27', '2026-12-04', '2026-12-11', '2026-12-18'];
  for (const date of expected) {
    const list = getTodaysCourses(makeDate(date));
    const hits = list.filter((c) => c.name === '大学英语视听说A1');
    assert.equal(hits.length, 1, date + ' 应且仅应出现一次英语视听说');
    assert.equal(hits[0].start, '10:00');
    assert.equal(hits[0].end, '11:40');
    assert.equal(hits[0].teacher, '郭超');
    assert.equal(hits[0].room, '教一楼103');
    // 同日其他周五课程不被误删
    assert.ok(names(list).includes('大学体育1'));
    assert.ok(names(list).includes('C语言程序设计'));
  }
  assert.equal(names(getTodaysCourses(makeDate('2026-10-09'))).includes('大学英语视听说A1'), false);
  assert.equal(names(getTodaysCourses(makeDate('2026-10-16'))).includes('大学英语视听说A1'), false);
  assert.equal(names(getTodaysCourses(makeDate('2026-10-23'))).includes('大学英语视听说A1'), false, '10-23 不在8次课内');
  assert.equal(names(getTodaysCourses(makeDate('2026-12-25'))).includes('大学英语视听说A1'), false, '12-25 不在8次课内');
});

test('学期后半段各课程按各自周次结束（不得统一截断）', () => {
  // 计算机科学导论最后一周为第14周
  assert.ok(names(getTodaysCourses(makeDate('2026-12-11'))).includes('计算机科学导论'));
  assert.equal(names(getTodaysCourses(makeDate('2026-12-18'))).includes('计算机科学导论'), false);
  assert.equal(names(getTodaysCourses(makeDate('2026-12-25'))).includes('计算机科学导论'), false);

  // 高数 / C语言 / 英语读写译 / 职业生涯按各自周次停止
  assert.equal(getSemesterWeek(makeDate('2026-11-24')), 12);
  assert.ok(names(getTodaysCourses(makeDate('2026-11-24'))).includes('大学英语读写译A1'));
  assert.ok(names(getTodaysCourses(makeDate('2026-11-24'))).includes('大学生职业生涯规划'));
  assert.equal(names(getTodaysCourses(makeDate('2026-12-01'))).includes('大学英语读写译A1'), false);
  assert.equal(names(getTodaysCourses(makeDate('2026-12-01'))).includes('大学生职业生涯规划'), false);

  assert.equal(getSemesterWeek(makeDate('2026-12-25')), 16);
  assert.ok(names(getTodaysCourses(makeDate('2026-12-25'))).includes('C语言程序设计'));
  const w17Fri = getTodaysCourses(makeDate('2027-01-01'));
  assert.equal(getSemesterWeek(makeDate('2027-01-01')), 17);
  assert.equal(names(w17Fri).includes('C语言程序设计'), false);
  assert.equal(names(w17Fri).includes('高等数学A1'), false);
  assert.ok(names(w17Fri).includes('大学体育1'), '体育应延续至第17周');

  // 电路分析基础C 与周六线上国安延续至第17周
  assert.equal(getSemesterWeek(makeDate('2026-12-30')), 17);
  assert.ok(names(getTodaysCourses(makeDate('2026-12-30'))).includes('电路分析基础C'));
  assert.equal(getSemesterWeek(makeDate('2027-01-02')), 17);
  assert.ok(names(getTodaysCourses(makeDate('2027-01-02'))).includes('国家安全教育（线上）'));
});

test('当前课程、下一节课与倒计时', () => {
  const before = getScheduleDetails(makeDate('2026-10-13', '07:30'));
  assert.equal(before.currentCourse, undefined);
  assert.equal(before.nextCourse?.name, 'C语言程序设计');
  assert.equal(before.minutesUntilNext, 30);

  const during = getScheduleDetails(makeDate('2026-10-13', '08:20'));
  assert.equal(during.currentCourse?.name, 'C语言程序设计');
  assert.equal(during.minutesUntilNext, 100, '上课中仍可给出距离下一节课开始的分钟数');

  const brk = getScheduleDetails(makeDate('2026-10-13', '08:50'));
  assert.equal(brk.currentCourse, undefined);
  assert.equal(brk.breakCourse?.name, 'C语言程序设计');

  // 下课后转入下一节课（09:40 下课 → 10:00 上课，中间有 10 分钟空闲）
  const gap = getScheduleDetails(makeDate('2026-10-13', '09:50'));
  assert.equal(gap.currentCourse, undefined);
  assert.equal(gap.breakCourse, undefined);
  assert.equal(gap.nextCourse?.name, '大学英语读写译A1');
  assert.equal(gap.minutesUntilNext, 10);

  // 高数 16:10 下课 → 职业生涯 16:30 上课，仅 20 分钟
  const change = getScheduleDetails(makeDate('2026-10-13', '16:20'));
  assert.equal(change.currentCourse, undefined);
  assert.equal(change.nextCourse?.name, '大学生职业生涯规划');
  assert.equal(change.minutesUntilNext, 10);

  const finished = getScheduleDetails(makeDate('2026-10-13', '18:30'));
  assert.equal(finished.currentCourse, undefined);
  assert.equal(finished.nextCourse, undefined);
  assert.equal(finished.minutesUntilNext, null);
  assert.equal(finished.todaysCourses.length, 4);

  // 当天无英语视听说时，不得把它算入下一节课
  const fri = getScheduleDetails(makeDate('2026-10-16', '09:50'));
  assert.equal(fri.nextCourse?.name, '计算机科学导论');
  assert.equal(fri.minutesUntilNext, 280);

  // 国庆假期
  const holiday = getScheduleDetails(makeDate('2026-10-06', '09:00'));
  assert.equal(holiday.isHoliday, true);
  assert.equal(holiday.todaysCourses.length, 0);
  assert.equal(holiday.currentCourse, undefined);
  assert.equal(holiday.nextCourse, undefined);
  assert.equal(holiday.minutesUntilNext, null);
});

test('集中实践不进入常规课程，也不抢占当前/下一节课', () => {
  const w7 = getScheduleDetails(makeDate('2026-10-20', '08:20'));
  assert.equal(w7.week, 7);
  assert.ok(w7.activePractices.some((p) => p.name === '电子实习B'));
  assert.equal(w7.todaysCourses.some((c) => c.name === '电子实习B'), false);
  assert.equal(w7.currentCourse?.name, 'C语言程序设计', '集中实践不得影响当前课程判定');

  const w8 = getScheduleDetails(makeDate('2026-10-28'));
  assert.equal(w8.week, 8);
  assert.ok(w8.activePractices.some((p) => p.name === '程序设计实训'));

  const w10 = getScheduleDetails(makeDate('2026-11-11'));
  assert.equal(w10.week, 10);
  assert.ok(w10.activePractices.some((p) => p.name === '专业见习'));

  // 集中实践不得虚构每日时刻
  for (const practice of practiceEvents) {
    assert.equal(practice.time, '未提供');
    assert.equal(practice.location, '未提供');
  }
});

test('课间休息与实际分段授课状态判定', () => {
  const cLangTuesday = courseById('tuesday-c-lang');
  assert.equal(isCourseInSession(cLangTuesday, 8 * 60 + 20), true);
  assert.equal(isCourseInSession(cLangTuesday, 8 * 60 + 50), false, '08:50 课间不能判定为正在上课');
  assert.equal(isCourseInBreak(cLangTuesday, 8 * 60 + 50), true, '08:50 应判定为课间休息');
  assert.equal(isCourseInSession(cLangTuesday, 9 * 60 + 0), true);

  const cLangFriday = courseById('friday-c-lang');
  assert.equal(isCourseInSession(cLangFriday, 17 * 60 + 20), false, '17:20 课间不能判定为正在上课');
  assert.equal(isCourseInBreak(cLangFriday, 17 * 60 + 20), true, '17:20 应判定为课间休息');
  assert.equal(isCourseInSession(cLangFriday, 17 * 60 + 30), true);

  // 周四线下国安为 14:00—18:00 连续时段（官方未提供节次结构，不虚构分段）
  const offline = courseById('thursday-national-security-offline');
  assert.equal(offline.segments, undefined);
  assert.equal(isCourseInSession(offline, 14 * 60 + 30), true);
  assert.equal(isCourseInSession(offline, 14 * 60 + 55), true);
  assert.equal(isCourseInBreak(offline, 14 * 60 + 55), false);
  assert.equal(isCourseInSession(offline, 16 * 60 + 30), true);
});

test('教室路线与换教室提醒', () => {
  const rooms = Object.keys(roomGuides);
  assert.equal(rooms.length, 9, '应为 9 个教室维护路线');
  for (const room of rooms) {
    assert.equal(roomGuides[room].room, room, '路线数据必须以教室自身为键');
    assert.ok(roomGuides[room].route.length > 0, room + ' 应有路线描述');
  }

  assert.equal(getRoomGuide('教三楼700').access, 'elevator');
  assert.equal(getRoomGuide('教三楼700').side, 'left');
  assert.equal(getRoomGuide('教三楼509').access, 'elevator');
  assert.equal(getRoomGuide('教三楼509').side, 'right');
  assert.equal(getRoomGuide('教三楼401').access, 'stairs');
  assert.equal(getRoomGuide('教三楼401').side, 'right');
  assert.equal(getRoomGuide('教一楼103').access, 'ground');
  assert.equal(getRoomGuide('大学体育1'), undefined, '不存在的教室应返回 undefined');
  assert.equal(getRoomGuide(undefined), undefined);

  assert.equal(roomChangeNotices.length, 1);
  assert.equal(roomChangeNotices[0].weekday, 2);
  assert.equal(roomChangeNotices[0].gapMinutes, 20);
  assert.equal(roomChangeNotices[0].fromRoom, '教三楼200');
  assert.equal(roomChangeNotices[0].toRoom, '教三楼401');

  // 周二：按今日课程给出教室路线，并命中换教室提醒
  const tue = getScheduleDetails(makeDate('2026-10-13', '12:00'));
  assert.deepEqual(tue.todayRoomGuides.map((g) => g.room), ['教三楼700', '教三楼504', '教三楼200', '教三楼401']);
  assert.equal(tue.roomChangeNotice?.gapMinutes, 20);

  // 周一：无换教室提醒
  const mon = getScheduleDetails(makeDate('2026-10-12', '12:00'));
  assert.equal(mon.roomChangeNotice, undefined);
  assert.deepEqual(mon.todayRoomGuides.map((g) => g.room), ['教三楼204']);

  // 周五：地点未提供的体育课不生成路线
  const fri = getScheduleDetails(makeDate('2026-10-09', '12:00'));
  assert.deepEqual(fri.todayRoomGuides.map((g) => g.room), ['教三楼608', '教三楼700']);

  // 假期与无课日不生成路线
  assert.deepEqual(getScheduleDetails(makeDate('2026-10-06')).todayRoomGuides, []);
});
