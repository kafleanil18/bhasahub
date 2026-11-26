// Daily goal and streak maths. Dates are the student's own calendar days as YYYY-MM-DD strings.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const GOAL_CHOICES = [5, 10, 15, 20, 30];
const DEFAULT_GOAL = 10;
// One minute of learning is enough to keep a streak alive; the goal ring is the stretch target.
const STREAK_SECONDS = 60;
const MAX_DAY_SECONDS = 24 * 3600;

const toUtc = date => Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
const fromUtc = ms => new Date(ms).toISOString().slice(0, 10);
const addDays = (date, days) => fromUtc(toUtc(date) + days * 86400000);

function isValidDate(date) {
  if (typeof date !== 'string' || !DATE.test(date)) return false;
  return fromUtc(toUtc(date)) === date;
}

// A student's "today" must be within a day of the server's UTC date (time zones span about ±14h).
function isPlausibleToday(date, now = new Date()) {
  if (!isValidDate(date)) return false;
  const utcToday = fromUtc(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.abs(toUtc(date) - toUtc(utcToday)) <= 86400000;
}

const normalizeGoal = minutes => (GOAL_CHOICES.includes(minutes) ? minutes : DEFAULT_GOAL);

// rows: [{ date, seconds }]. Returns today's minutes, the current and best streaks, and the last 7 days.
function summarize(rows, today, goalMinutes) {
  const goal = normalizeGoal(goalMinutes);
  const seconds = new Map();
  for (const row of rows) if (isValidDate(row.date)) seconds.set(row.date, Math.min(MAX_DAY_SECONDS, (seconds.get(row.date) || 0) + Math.max(0, Number(row.seconds) || 0)));
  const practised = date => (seconds.get(date) || 0) >= STREAK_SECONDS;
  const minutesOn = date => Math.floor((seconds.get(date) || 0) / 60);

  // Today still counts as "in progress": the streak runs up to yesterday until today is practised.
  let streak = 0;
  for (let day = practised(today) ? today : addDays(today, -1); practised(day); day = addDays(day, -1)) streak++;

  let best = 0, run = 0, previous = null;
  for (const date of [...seconds.keys()].filter(practised).filter(date => date <= today).sort()) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }

  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const minutes = minutesOn(date);
    return { date, minutes, practised: practised(date), goalMet: minutes >= goal };
  });
  return {
    today: { date: today, minutes: minutesOn(today), practised: practised(today), goalMet: minutesOn(today) >= goal },
    goalMinutes: goal, goalChoices: GOAL_CHOICES,
    streak, bestStreak: Math.max(best, streak), week,
  };
}

module.exports = { GOAL_CHOICES, DEFAULT_GOAL, STREAK_SECONDS, MAX_DAY_SECONDS, addDays, isValidDate, isPlausibleToday, normalizeGoal, summarize };
