// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSemesterWeek,
  getTodaysCourses,
  getScheduleDetails,
  isCourseInSession,
  isCourseInBreak,
  courses,
  practiceEvents,
  semesterInfo,
  courseMetas
} from '../src/lib/status/schedule.ts';

// 构造上海时区指定时间的 Date 对象
function makeDate(dateStr, timeStr = '12:00') {
  return new Date(`${dateStr}T${timeStr}:00+08:00`);
}

test('课程统计与学分核对', () => {
  assert.equal(semesterInfo.reportedCoursesCount, 11, '原始课表记录应为11门课程');
  assert.equal(semesterInfo.reportedCredits, 19.0, '原始课表记录应为19.0学分');

  // 明细中不同课程名称数量为10
  const distinctMetaNames = Object.keys(courseMetas);
  assert.equal(distinctMetaNames.length, 10, '明细中应有10门不同课程名称');
  assert.equal(semesterInfo.distinctCoursesCount, 10);

  // 每周常规固定排课时段数量为13个（不含单次课程；高数每周3次，C语言每周2次）
  assert.equal(semesterInfo.regularWeeklySlotsCount, 13, '常规每周固定时段应为13个');

  // 单次排课安排（仅第8周周四线下国家安全教育）
  assert.equal(semesterInfo.singleEventCount, 1, '单次排课安排应为1项');

  // 课表录入的全部排课记录总计为14条（13个常规固定时段 + 1项单次排课安排）
  assert.equal(courses.length, 14, '排课记录总计应为14条');
  assert.equal(semesterInfo.totalScheduleSlots, 14);

  // 计算明细学分总和：4.5+4.0+1.0+1.0+2.0+0.5+1.0+1.0+2.0+1.0 = 18.0
  const sumCredits = Object.values(courseMetas).reduce((acc, c) => acc + c.credit, 0);
  assert.equal(sumCredits, 18.0, '明细学分累加为18.0');
  assert.equal(semesterInfo.calculatedCredits, 18.0);
});

test('场景 A: 2026-10-09（星期五，第5周）', () => {
  const d = makeDate('2026-10-09');
  const week = getSemesterWeek(d);
  assert.equal(week, 5, '2026-10-09 应属于第5周');

  const todays = getTodaysCourses(d);
  const names = todays.map((c) => c.name);
  assert.deepEqual(names, ['大学体育1', '计算机科学导论', 'C语言程序设计']);
  assert.equal(names.includes('大学英语视听说A1'), false, '10月9日绝不能出现大学英语视听说A1');
});

test('场景 B: 2026-10-16（星期五，第6周）', () => {
  const d = makeDate('2026-10-16');
  const week = getSemesterWeek(d);
  assert.equal(week, 6, '2026-10-16 应属于第6周');

  const todays = getTodaysCourses(d);
  const names = todays.map((c) => c.name);
  assert.deepEqual(names, ['大学体育1', '计算机科学导论', 'C语言程序设计']);
  assert.equal(names.includes('大学英语视听说A1'), false, '10月16日绝不能出现大学英语视听说A1');
});

test('场景 C: 2026-10-29（星期四，第8周）单次线下国安', () => {
  const d = makeDate('2026-10-29');
  const week = getSemesterWeek(d);
  assert.equal(week, 8, '2026-10-29 应属于第8周');

  const todays = getTodaysCourses(d);
  const names = todays.map((c) => c.name);
  assert.deepEqual(names, ['高等数学A1', '形势与政策1', '国家安全教育（线下）']);

  // 前后周均不出现线下国安
  const prevThurs = getTodaysCourses(makeDate('2026-10-22'));
  assert.equal(prevThurs.map((c) => c.name).includes('国家安全教育（线下）'), false);
  const nextThurs = getTodaysCourses(makeDate('2026-11-05'));
  assert.equal(nextThurs.map((c) => c.name).includes('国家安全教育（线下）'), false);
});

test('场景 D: 2026-10-30（星期五，第8周）英语首课', () => {
  const d = makeDate('2026-10-30');
  const week = getSemesterWeek(d);
  assert.equal(week, 8, '2026-10-30 应属于第8周');

  const todays = getTodaysCourses(d);
  const names = todays.map((c) => c.name);
  assert.deepEqual(names, ['大学体育1', '大学英语视听说A1', '计算机科学导论', 'C语言程序设计']);
});

test('场景 E: 2026-10-10（星期六，第5周）线上国安独立存在', () => {
  const d = makeDate('2026-10-10');
  const week = getSemesterWeek(d);
  assert.equal(week, 5, '2026-10-10 应属于第5周');

  const todays = getTodaysCourses(d);
  assert.equal(todays.length, 1);
  assert.equal(todays[0].name, '国家安全教育（线上）');
  assert.equal(todays[0].start, '19:30');
  assert.equal(todays[0].end, '21:10');
  assert.equal(todays[0].isOnline, true);
});

test('场景 F: 国庆假期排课与第17周周次边界', () => {
  // 国庆假期无课
  assert.equal(getTodaysCourses(makeDate('2026-10-06')).length, 0, '10月6日国庆假期不应排课');
  assert.equal(getTodaysCourses(makeDate('2026-10-07')).length, 0, '10月7日国庆假期不应排课');

  // 第17周边界课程生效
  const d17Wed = makeDate('2026-12-30');
  assert.equal(getSemesterWeek(d17Wed), 17);
  assert.ok(getTodaysCourses(d17Wed).map((c) => c.name).includes('电路分析基础C'));

  const d17Sat = makeDate('2027-01-02');
  assert.equal(getSemesterWeek(d17Sat), 17);
  assert.ok(getTodaysCourses(d17Sat).map((c) => c.name).includes('国家安全教育（线上）'));
});

test('课间休息与实际分段授课状态判定', () => {
  const offlineCourse = courses.find((c) => c.id === 'thursday-national-security-offline');

  // 14:30 正在上课
  assert.equal(isCourseInSession(offlineCourse, 14 * 60 + 30), true);
  assert.equal(isCourseInBreak(offlineCourse, 14 * 60 + 30), false);

  // 14:55 第1节与第2节课间（14:50-15:00）
  assert.equal(isCourseInSession(offlineCourse, 14 * 60 + 55), false, '14:55课间不能判定为正在上课');
  assert.equal(isCourseInBreak(offlineCourse, 14 * 60 + 55), true, '14:55应判定为课间休息');

  // 15:55 大课间（15:50-16:10）
  assert.equal(isCourseInSession(offlineCourse, 15 * 60 + 55), false, '15:55大课间不能判定为正在上课');
  assert.equal(isCourseInBreak(offlineCourse, 15 * 60 + 55), true, '15:55应判定为课间休息');

  // 16:30 第3节正在上课
  assert.equal(isCourseInSession(offlineCourse, 16 * 60 + 30), true);

  // 周二C语言分段（08:00-08:50, 09:00-09:50）
  const cLangTuesday = courses.find((c) => c.id === 'tuesday-c-lang');
  assert.equal(isCourseInSession(cLangTuesday, 8 * 60 + 55), false, '08:55课间不能判定为正在上课');
  assert.equal(isCourseInBreak(cLangTuesday, 8 * 60 + 55), true, '08:55应判定为课间休息');
});

test('集中实践独立性判定', () => {
  // 集中实践不进入每日节次课程
  const d7 = makeDate('2026-10-20');
  const details7 = getScheduleDetails(d7);
  assert.ok(details7.activePractices.some((p) => p.name === '电子实习B'));
  assert.equal(details7.todaysCourses.some((c) => c.name === '电子实习B'), false, '实践不应混入固定排课');

  // 集中实践不占用 currentCourse 或 nextCourse
  assert.notEqual(details7.currentCourse?.name, '电子实习B');
});
