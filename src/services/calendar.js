/**
 * Calendar Service — generates recurring family events from existing member data.
 * No separate database; events are derived from DOB and wedding_anniversary fields.
 */

/**
 * @typedef {Object} CalendarEvent
 * @property {string} id
 * @property {'birthday'|'anniversary'} type
 * @property {string} memberId
 * @property {string} memberName
 * @property {Date} date          — this year's occurrence
 * @property {string} originalDate — raw stored value (YYYY-MM-DD)
 * @property {string} title
 * @property {string} subtitle
 * @property {number|null} age
 * @property {string|null} profileImage
 * @property {string|null} phone
 * @property {string|null} email
 * @property {string|null} locationName
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {string|null} description
 */

/**
 * Check if a year is a leap year
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get the ordinal suffix for a number (1st, 2nd, 3rd, 22nd…)
 */
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Build a Date for this year's occurrence of a month/day.
 * Handles Feb 29 → Feb 28 in non-leap years.
 */
function thisYearDate(month, day, referenceYear) {
  const year = referenceYear ?? new Date().getFullYear();
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28); // Feb 28
  }
  return new Date(year, month - 1, day);
}

/**
 * Parse a YYYY-MM-DD string safely. Returns null on invalid input.
 */
function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { year: y, month: m, day: d };
}

/**
 * Generate CalendarEvent objects from the existing family member array.
 * Each member may produce 0–2 events (birthday + anniversary).
 * @param {Array} members — array from FamilyRepository.getAll()
 * @param {number} [year] — target year (defaults to current year)
 * @returns {CalendarEvent[]}
 */
export function generateCalendarEvents(members, year) {
  const targetYear = year ?? new Date().getFullYear();
  const events = [];

  for (const m of members) {
    // Birthday from DOB
    const dob = parseDate(m.dob);
    if (dob) {
      const eventDate = thisYearDate(dob.month, dob.day, targetYear);
      const age = targetYear - dob.year;
      const hasValidAge = dob.year > 1900 && age > 0 && age < 150;
      const title = hasValidAge
        ? `${m.name.split(' ')[0]}'s ${ordinal(age)} Birthday`
        : `${m.name.split(' ')[0]}'s Birthday`;

      events.push({
        id: `bday-${m.id}-${targetYear}`,
        type: 'birthday',
        memberId: m.id,
        memberName: m.name,
        date: eventDate,
        originalDate: m.dob,
        title,
        subtitle: hasValidAge ? `${ordinal(age)} Birthday` : 'Birthday',
        age: hasValidAge ? age : null,
        profileImage: m.profile_image || null,
        phone: m.phone_number || null,
        email: m.email || null,
        locationName: m.location_name || null,
        latitude: m.latitude ?? null,
        longitude: m.longitude ?? null,
        description: m.description || null,
      });
    }

    // Wedding Anniversary
    const anniv = parseDate(m.wedding_anniversary);
    if (anniv) {
      const eventDate = thisYearDate(anniv.month, anniv.day, targetYear);
      const yearsMarried = targetYear - anniv.year;
      const hasValidYears = anniv.year > 1900 && yearsMarried > 0 && yearsMarried < 200;
      const title = hasValidYears
        ? `${ordinal(yearsMarried)} Wedding Anniversary`
        : 'Wedding Anniversary';

      events.push({
        id: `anniv-${m.id}-${targetYear}`,
        type: 'anniversary',
        memberId: m.id,
        memberName: m.name,
        date: eventDate,
        originalDate: m.wedding_anniversary,
        title,
        subtitle: hasValidYears ? `${ordinal(yearsMarried)} Anniversary` : 'Anniversary',
        age: hasValidYears ? yearsMarried : null,
        profileImage: m.profile_image || null,
        phone: m.phone_number || null,
        email: m.email || null,
        locationName: m.location_name || null,
        latitude: m.latitude ?? null,
        longitude: m.longitude ?? null,
        description: m.description || null,
      });
    }
  }

  return events;
}

/**
 * Filter events by type.
 * @param {CalendarEvent[]} events
 * @param {'all'|'birthday'|'anniversary'} filter
 */
export function filterEvents(events, filter) {
  if (filter === 'all') return events;
  return events.filter(e => e.type === filter);
}

/**
 * Get events for a specific date (month 0-indexed internally but accepts 1-indexed).
 */
export function getEventsForDate(events, year, month, day) {
  return events.filter(e =>
    e.date.getFullYear() === year &&
    e.date.getMonth() === month - 1 &&
    e.date.getDate() === day
  );
}

/**
 * Get events for a specific month (1-indexed).
 */
export function getEventsForMonth(events, year, month) {
  return events.filter(e =>
    e.date.getFullYear() === year &&
    e.date.getMonth() === month - 1
  );
}

/**
 * Get today's events.
 */
export function getTodaysEvents(events) {
  const now = new Date();
  return getEventsForDate(events, now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Get upcoming events (after today), sorted by date.
 * @param {CalendarEvent[]} events
 * @param {number} [limit=10]
 */
export function getUpcomingEvents(events, limit = 10) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const today = now.getTime();

  return events
    .filter(e => e.date.getTime() > today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

/**
 * Get dynamic event counts.
 */
export function getEventCounts(events) {
  return {
    all: events.length,
    birthdays: events.filter(e => e.type === 'birthday').length,
    anniversaries: events.filter(e => e.type === 'anniversary').length,
  };
}

/**
 * Calculate days until an event from today.
 * Returns 0 for today, negative for past events.
 */
export function daysUntil(eventDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

/**
 * Calendar grid helper: returns info for rendering a month grid.
 * @returns {{ year, month, daysInMonth, startDayOfWeek (0=Mon), prevMonthDays, nextMonthDays }}
 */
export function getCalendarGrid(year, month) {
  // month is 1-indexed
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // getDay() returns 0=Sun. Convert to Mon-based: Mon=0, Sun=6
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  // Previous month trailing days
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const prevDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevDays.push(daysInPrevMonth - i);
  }

  // Next month leading days
  const totalCells = prevDays.length + daysInMonth;
  const nextDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextDays = [];
  for (let i = 1; i <= nextDaysCount; i++) {
    nextDays.push(i);
  }

  return {
    year,
    month,
    daysInMonth,
    startDayOfWeek,
    prevDays,
    nextDays,
  };
}

/**
 * Format a month name.
 */
export function formatMonthYear(year, month) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Short month name for cards.
 */
export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
