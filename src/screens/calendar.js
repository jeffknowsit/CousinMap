import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { renderEmptyState } from '../components/empty-state.js';
import FamilyRepository from '../db/repository.js';
import LocationService from '../services/location.js';
import { formatDistance, calculateDistanceToMember } from '../services/distance.js';
import { avatarHTML } from '../utils/helpers.js';
import {
  generateCalendarEvents,
  filterEvents,
  getEventsForDate,
  getEventsForMonth,
  getTodaysEvents,
  getUpcomingEvents,
  getEventCounts,
  daysUntil,
  getCalendarGrid,
  formatMonthYear,
  formatShortDate,
} from '../services/calendar.js';

// ─── Screen State ────────────────────────────────────────────────
let currentYear, currentMonth, selectedDay;
let activeFilter = 'all';
let allEvents = [];
let allMembers = [];
let userLocation = null;
let memberCount = 0;

export default async function CalendarScreen(container) {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth() + 1; // 1-indexed
  selectedDay = now.getDate();
  activeFilter = 'all';

  // Render skeleton immediately
  container.innerHTML = renderCalendarSkeleton();

  try {
    // Fetch data
    allMembers = await FamilyRepository.getAll();
    memberCount = allMembers.length;
    allEvents = generateCalendarEvents(allMembers, currentYear);

    // Try to get user location in background
    try {
      const perm = await LocationService.checkPermission();
      if (perm === 'granted') {
        userLocation = await LocationService.getCurrentPosition({ timeout: 5000 });
      }
    } catch { /* silent */ }

    // Render full screen
    container.innerHTML = renderCalendarPage();
    attachEventListeners(container);

  } catch (err) {
    console.error('Calendar load error:', err);
    container.innerHTML = renderErrorState(memberCount);
  }
}

// ─── Skeleton Loading State ──────────────────────────────────────
function renderCalendarSkeleton() {
  return `
    ${renderHeader('calendar')}
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter">
      <div class="flex flex-col w-full px-screen-edge-padding">
        <div class="pt-space-xs pb-space-sm">
          <div class="h-8 w-48 bg-surface-container rounded-lg animate-pulse mb-2"></div>
          <div class="h-4 w-64 bg-surface-container rounded-lg animate-pulse mb-3"></div>
          <div class="flex items-center gap-space-xs mt-space-xs py-1.5 px-3 bg-surface-container rounded-full w-fit">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed-dim opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span class="font-label-sm text-label-sm text-primary">Syncing family dates...</span>
          </div>
          <div class="flex gap-2 mt-space-sm">
            <div class="h-8 w-24 bg-surface-container rounded-full animate-pulse"></div>
            <div class="h-8 w-24 bg-surface-container rounded-full animate-pulse"></div>
            <div class="h-8 w-28 bg-surface-container rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm mb-space-md">
          <div class="h-6 w-36 bg-surface-container rounded-lg animate-pulse mb-4"></div>
          <div class="grid grid-cols-7 gap-y-3 gap-x-1">
            ${Array(35).fill('').map(() => '<div class="h-8 w-8 mx-auto bg-surface-container rounded-full animate-pulse"></div>').join('')}
          </div>
        </div>
        <div class="h-48 bg-surface-container rounded-2xl animate-pulse mb-space-md"></div>
      </div>
    </main>
    ${renderBottomNav('calendar', 0)}
  `;
}

// ─── Error State ─────────────────────────────────────────────────
function renderErrorState(count) {
  return `
    ${renderHeader('calendar')}
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter">
      <div class="flex flex-col items-center justify-center py-space-3xl px-space-xl text-center">
        <div class="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-space-md">
          <span class="material-symbols-outlined text-on-error-container text-[32px]">cloud_off</span>
        </div>
        <h3 class="font-headline-md text-headline-md text-on-surface mb-space-2xs">Unable to load family dates</h3>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-[280px]">Could not connect to the database. Please check your connection and try again.</p>
        <button class="mt-space-lg px-space-xl h-12 rounded-2xl bg-primary-container text-on-primary-container font-label-lg text-label-lg font-semibold shadow-md active:scale-[0.98] transition-all" onclick="window.location.hash='/calendar'">
          Try Again
        </button>
      </div>
    </main>
    ${renderBottomNav('calendar', count)}
  `;
}

// ─── Full Page Render ────────────────────────────────────────────
function renderCalendarPage() {
  const filtered = filterEvents(allEvents, activeFilter);
  const monthEvents = getEventsForMonth(filtered, currentYear, currentMonth);
  const counts = getEventCounts(allEvents);
  const todayEvents = getTodaysEvents(filtered);
  const upcoming = getUpcomingEvents(filtered, 6);
  const selectedEvents = getEventsForDate(filtered, currentYear, currentMonth, selectedDay);
  const now = new Date();
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;
  const todayStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const hasAnyDates = allMembers.some(m => m.dob || m.wedding_anniversary);

  return `
    ${renderHeader('calendar')}
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter">
      <div class="flex flex-col w-full">
        <!-- Title Area -->
        <div class="px-screen-edge-padding pt-space-xs pb-space-sm">
          <div class="flex items-center justify-between gap-space-sm mb-space-2xs">
            <div>
              <h1 class="font-headline-xl-mobile text-headline-xl-mobile text-on-surface tracking-tight">Family Calendar</h1>
              <p class="font-body-sm text-body-sm text-on-surface-variant">Never miss a cousin's birthday or reunion</p>
            </div>
            <button class="flex items-center gap-1.5 px-space-md py-2.5 bg-primary-container text-on-primary-container rounded-full shadow-sm hover:opacity-95 transition-all transform active:scale-95 shrink-0" type="button" onclick="window.location.hash='/add'">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span class="font-label-md text-label-md">Add Event</span>
            </button>
          </div>

          <!-- Sync Status -->
          <div class="flex items-center gap-space-xs mt-space-xs py-1.5 px-3 bg-surface-container rounded-full w-fit">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed-dim opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span class="font-label-sm text-label-sm text-primary">Synced with ${memberCount} family member profile${memberCount !== 1 ? 's' : ''}</span>
            <span class="material-symbols-outlined text-[14px] text-primary">cloud_done</span>
          </div>

          <!-- Filter Chips -->
          <div class="flex items-center gap-space-xs overflow-x-auto no-scrollbar pt-space-sm pb-space-2xs" id="cal-filter-row">
            ${renderFilterChip('all', 'All Events', counts.all)}
            ${renderFilterChip('birthday', 'Birthdays', counts.birthdays, 'bg-secondary-container')}
            ${renderFilterChip('anniversary', 'Anniversaries', counts.anniversaries, 'bg-tertiary-fixed-dim')}
          </div>
        </div>

        ${hasAnyDates ? `
          <!-- Calendar Grid -->
          <div class="px-screen-edge-padding mb-space-md" id="cal-grid-container">
            ${renderCalendarGrid(monthEvents, isCurrentMonth, todayStr)}
          </div>

          <!-- Selected Date Events -->
          <div class="px-screen-edge-padding mb-space-md" id="cal-selected-events">
            ${renderSelectedDateEvents(selectedEvents)}
          </div>

          <!-- Today's Celebrations -->
          <div class="mb-space-lg" id="cal-today-section">
            ${renderTodayCelebrations(todayEvents)}
          </div>

          <!-- Upcoming Milestones -->
          <div class="px-screen-edge-padding mb-space-lg" id="cal-upcoming-section">
            ${renderUpcomingMilestones(upcoming)}
          </div>
        ` : `
          <div class="px-screen-edge-padding">
            ${renderEmptyState('no-dates')}
          </div>
        `}
      </div>
    </main>
    ${renderBottomNav('calendar', memberCount)}
  `;
}

// ─── Filter Chip ─────────────────────────────────────────────────
function renderFilterChip(filter, label, count, dotColor) {
  const isActive = activeFilter === filter;
  const baseCls = isActive
    ? 'bg-primary-container text-on-primary-container'
    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high';
  const countCls = isActive
    ? 'bg-on-primary-container/20'
    : 'bg-surface-variant';

  return `
    <button class="cal-filter-chip flex items-center gap-1.5 px-space-md py-1.5 rounded-full ${baseCls} font-label-md text-label-md shrink-0 shadow-sm transition-colors" data-filter="${filter}" type="button">
      ${dotColor ? `<span class="w-2 h-2 rounded-full ${dotColor}"></span>` : ''}
      <span>${label}</span>
      <span class="px-1.5 py-0.5 rounded-full ${countCls} font-label-sm text-[10px]">${count}</span>
    </button>
  `;
}

// ─── Calendar Grid ───────────────────────────────────────────────
function renderCalendarGrid(monthEvents, isCurrentMonth, todayStr) {
  const grid = getCalendarGrid(currentYear, currentMonth);
  const now = new Date();
  const todayDay = now.getDate();
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Build event map: day -> types
  const eventMap = {};
  for (const e of monthEvents) {
    const d = e.date.getDate();
    if (!eventMap[d]) eventMap[d] = new Set();
    eventMap[d].add(e.type);
  }

  let gridHTML = '';

  // Previous month days
  for (const d of grid.prevDays) {
    gridHTML += `<div class="py-1 flex flex-col items-center justify-center opacity-30 text-on-surface font-body-sm text-body-sm">${d}</div>`;
  }

  // Current month days
  for (let d = 1; d <= grid.daysInMonth; d++) {
    const isToday = isCurrentMonth && d === todayDay;
    const isSelected = d === selectedDay;
    const types = eventMap[d];

    if (isSelected) {
      gridHTML += `
        <div class="py-1 flex flex-col items-center justify-center relative cursor-pointer cal-day" data-day="${d}">
          <div class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex flex-col items-center justify-center shadow-md font-label-md text-label-md scale-105">
            <span>${d}</span>
          </div>
          ${renderDots(types, true)}
        </div>`;
    } else if (isToday) {
      gridHTML += `
        <div class="py-1 flex flex-col items-center justify-center relative cursor-pointer cal-day" data-day="${d}">
          <div class="w-8 h-8 rounded-full ring-2 ring-primary-container flex flex-col items-center justify-center font-label-md text-label-md text-primary">
            <span>${d}</span>
          </div>
          ${renderDots(types, false)}
        </div>`;
    } else {
      gridHTML += `
        <div class="py-1 flex flex-col items-center justify-center cursor-pointer cal-day" data-day="${d}">
          <span>${d}</span>
          ${renderDots(types, false)}
        </div>`;
    }
  }

  // Next month days
  for (const d of grid.nextDays) {
    gridHTML += `<div class="py-1 flex flex-col items-center justify-center opacity-30 text-on-surface font-body-sm text-body-sm">${d}</div>`;
  }

  return `
    <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
      <!-- Month Header -->
      <div class="flex items-center justify-between mb-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-primary-container text-[22px]">calendar_month</span>
          <span class="font-headline-md text-headline-md text-on-surface">${formatMonthYear(currentYear, currentMonth)}</span>
        </div>
        <div class="flex items-center gap-1">
          <button class="px-2.5 py-1 bg-surface-container text-primary font-label-sm text-label-sm rounded-lg hover:bg-surface-container-high transition-colors" id="cal-today-btn" type="button">Today</button>
          <button aria-label="Previous Month" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors" id="cal-prev-btn" type="button">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button aria-label="Next Month" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors" id="cal-next-btn" type="button">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 gap-1 text-center mb-1">
        ${weekdays.map(w => `<span class="font-label-sm text-label-sm text-outline font-medium">${w}</span>`).join('')}
      </div>

      <!-- Day Grid -->
      <div class="grid grid-cols-7 gap-y-2 gap-x-1 text-center items-center font-body-sm text-body-sm text-on-surface" id="cal-day-grid">
        ${gridHTML}
      </div>

      <!-- Legend -->
      <div class="flex items-center justify-between pt-space-sm mt-space-xs bg-surface-container-low rounded-xl px-space-sm py-2">
        <div class="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-secondary-container"></span>
            Birthday
          </span>
          <span class="flex items-center gap-1 ml-1">
            <span class="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
            Anniversary
          </span>
        </div>
        <span class="font-label-sm text-label-sm text-primary font-semibold">Today: ${todayStr}</span>
      </div>
    </div>
  `;
}

function renderDots(types, isSelected) {
  if (!types || types.size === 0) return '';
  const dots = [];
  if (types.has('birthday')) {
    dots.push(`<span class="w-1${isSelected ? '.5' : ''} h-1${isSelected ? '.5' : ''} rounded-full bg-secondary-container mt-0.5"></span>`);
  }
  if (types.has('anniversary')) {
    dots.push(`<span class="w-1${isSelected ? '.5' : ''} h-1${isSelected ? '.5' : ''} rounded-full bg-tertiary-fixed-dim mt-0.5"></span>`);
  }
  if (dots.length === 1) return dots[0];
  return `<div class="flex gap-0.5">${dots.join('')}</div>`;
}

// ─── Selected Date Events ────────────────────────────────────────
function renderSelectedDateEvents(events) {
  if (events.length === 0) {
    const date = new Date(currentYear, currentMonth - 1, selectedDay);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return `
      <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm text-center">
        <p class="font-label-md text-label-md text-outline mb-1">${dateStr}</p>
        <p class="font-body-sm text-body-sm text-on-surface-variant">No family celebrations on this date</p>
      </div>
    `;
  }

  const date = new Date(currentYear, currentMonth - 1, selectedDay);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return `
    <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
      <p class="font-label-md text-label-md text-outline mb-space-sm">${dateStr}</p>
      <div class="space-y-space-xs">
        ${events.map(e => {
          const icon = e.type === 'birthday' ? '🎂' : '💍';
          return `
            <div class="flex items-center gap-space-sm p-space-xs rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer" onclick="window.location.hash='/profile/${e.memberId}'">
              <span class="text-lg">${icon}</span>
              <div class="min-w-0 flex-1">
                <p class="font-label-lg text-label-lg text-on-surface truncate">${e.memberName}</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">${e.subtitle}</p>
              </div>
              <span class="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ─── Today's Celebrations ────────────────────────────────────────
function renderTodayCelebrations(todayEvents) {
  if (todayEvents.length === 0) return '';

  const cardsHTML = todayEvents.map((e, idx) => {
    const avatar = e.profileImage
      ? `<img class="w-14 h-14 rounded-full object-cover shadow-sm bg-surface-container-highest" src="${e.profileImage}" alt="${e.memberName}">`
      : avatarHTML({ name: e.memberName, profile_image: null }, 56, 'full');

    const dist = calculateDistanceToMember(
      userLocation?.latitude, userLocation?.longitude,
      e.latitude, e.longitude
    );
    const distText = dist != null ? formatDistance(dist) : null;
    const locationText = e.locationName
      ? `${e.locationName}${distText ? ' • ' + distText : ''}`
      : (distText || '');

    const emoji = e.type === 'birthday' ? '🎉' : '💍';
    const gradient = e.type === 'birthday'
      ? 'from-primary-container via-[#0d6b63] to-primary'
      : 'from-tertiary-container via-[#825200] to-tertiary';
    const bigEmoji = e.type === 'birthday' ? '🎂' : '💍';

    // Build phone link
    const phoneHref = e.phone ? `tel:${e.phone}` : '#';
    // Build wish link (WhatsApp if phone available)
    const cleanPhone = (e.phone || '').replace(/[^\d]/g, '');
    const wishHref = cleanPhone ? `https://wa.me/${cleanPhone}` : (e.phone ? `sms:${e.phone}` : '#');

    return `
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} text-on-primary-container p-space-md shadow-md shrink-0 w-[310px] flex flex-col justify-between" style="scroll-snap-align: start;">
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-primary-fixed-dim/20 rounded-full blur-xl pointer-events-none"></div>
        <div class="absolute right-3 bottom-1 text-on-primary-container/10 select-none pointer-events-none font-headline-xl text-[54px]">${bigEmoji}</div>
        <div class="relative z-10">
          <div class="flex items-start gap-space-sm mb-space-sm">
            <div class="relative shrink-0">
              ${avatar}
              <span class="absolute -bottom-1 -right-1 text-sm bg-surface-container-lowest rounded-full p-0.5 shadow-sm">${emoji}</span>
            </div>
            <div class="flex-1 min-w-0">
              ${e.description ? `
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full bg-on-primary-container/90 text-primary-container font-label-sm text-[10px] font-bold tracking-wide shadow-sm uppercase">${e.description}</span>
                </div>
              ` : ''}
              <h3 class="font-headline-md text-headline-md text-on-primary-container font-bold mt-1 leading-tight truncate">${e.title}</h3>
              ${locationText ? `
                <div class="flex items-center gap-1 font-body-sm text-body-sm text-on-primary-container/80 mt-0.5 truncate">
                  <span class="material-symbols-outlined text-[14px] shrink-0">location_on</span>
                  <span class="truncate">${locationText}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        <div class="relative z-10 grid grid-cols-2 gap-space-xs mt-space-xs">
          <a class="flex items-center justify-center gap-1.5 py-2 px-space-xs bg-on-primary-container text-primary-container font-label-md text-label-md rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all text-center" href="${wishHref}" target="_blank" rel="noopener">
            <span class="material-symbols-outlined text-[18px]">chat</span>
            <span>Wish</span>
          </a>
          <a class="flex items-center justify-center gap-1.5 py-2 px-space-xs bg-on-primary-container/20 text-on-primary-container hover:bg-on-primary-container/30 font-label-md text-label-md rounded-xl font-semibold active:scale-95 transition-all text-center" href="${phoneHref}">
            <span class="material-symbols-outlined text-[18px]">call</span>
            <span>Call</span>
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Scroll indicators
  const indicatorDots = todayEvents.map((_, i) =>
    `<span class="w-${i === 0 ? '5' : '1.5'} h-1.5 rounded-full ${i === 0 ? 'bg-primary-container' : 'bg-surface-container-highest'}"></span>`
  ).join('');

  return `
    <div class="px-screen-edge-padding flex items-center justify-between mb-space-xs">
      <div class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-primary text-[18px]">celebration</span>
        <span class="font-headline-md text-headline-md text-on-surface">Today's Celebrations</span>
        <span class="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-[11px] font-semibold">${todayEvents.length}</span>
      </div>
      <div class="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
        <span class="material-symbols-outlined text-[16px]">swipe</span>
        <span>Swipe</span>
      </div>
    </div>
    <div class="flex gap-space-sm overflow-x-auto no-scrollbar px-screen-edge-padding pb-space-xs" style="scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;">
      ${cardsHTML}
    </div>
    ${todayEvents.length > 1 ? `<div class="flex items-center justify-center gap-1.5 mt-space-xs">${indicatorDots}</div>` : ''}
  `;
}

// ─── Upcoming Milestones ─────────────────────────────────────────
function renderUpcomingMilestones(upcoming) {
  if (upcoming.length === 0) return '';

  const cardsHTML = upcoming.map(e => {
    const days = daysUntil(e.date);
    const daysText = days === 1 ? 'Tomorrow' : `In ${days} days`;
    const dateStr = formatShortDate(e.date);
    const icon = e.type === 'birthday' ? '🎂' : '💍';
    const daysColor = e.type === 'birthday' ? 'text-primary' : 'text-tertiary';

    const avatarEl = e.profileImage
      ? `<img class="w-12 h-12 rounded-xl object-cover bg-surface-container" src="${e.profileImage}" alt="${e.memberName}">`
      : `<div class="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] bg-surface-container">${icon}</div>`;

    const badgeColor = e.type === 'birthday' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-fixed-dim text-on-tertiary-fixed';

    // Build phone link for greeting
    const cleanPhone = (e.phone || '').replace(/[^\d]/g, '');
    const greetHref = cleanPhone ? `https://wa.me/${cleanPhone}` : (e.phone ? `sms:${e.phone}` : '#');

    return `
      <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm transition-all hover:shadow-md cursor-pointer" onclick="window.location.hash='/profile/${e.memberId}'">
        <div class="flex items-start justify-between gap-space-xs">
          <div class="flex items-center gap-space-sm">
            <div class="relative">
              ${avatarEl}
              <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${badgeColor} flex items-center justify-center text-[10px]">${icon}</span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-headline-md text-headline-md text-on-surface">${e.memberName}</span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${e.title}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="inline-flex px-2 py-1 bg-surface-container-high ${daysColor} font-label-sm text-label-sm rounded-lg font-semibold">
              ${daysText}
            </span>
            <p class="font-label-sm text-[11px] text-outline mt-0.5">${dateStr}</p>
          </div>
        </div>
        <div class="mt-space-sm pt-space-sm bg-surface-container-low rounded-xl p-space-xs flex items-center justify-between" onclick="event.stopPropagation()">
          <span class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 pl-1">
            <span class="material-symbols-outlined text-[16px] text-primary">volunteer_activism</span>
            <span>${e.type === 'birthday' ? 'Wish' : 'Congratulate'} ${e.memberName.split(' ')[0]}</span>
          </span>
          <a class="px-space-md py-1.5 bg-surface-container-lowest text-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-surface-container transition-colors flex items-center gap-1" href="${greetHref}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
            <span class="material-symbols-outlined text-[16px]">chat</span>
            <span>Greet</span>
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="flex items-center justify-between mb-space-sm">
      <div class="flex items-center gap-2">
        <h2 class="font-headline-lg text-headline-lg text-on-surface">Upcoming Milestones</h2>
        <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">${upcoming.length}</span>
      </div>
    </div>
    <div class="space-y-space-sm">
      ${cardsHTML}
    </div>
  `;
}

// ─── Event Listeners ─────────────────────────────────────────────
function attachEventListeners(container) {
  // Month navigation
  document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 1) { currentMonth = 12; currentYear--; }
    selectedDay = 1;
    refreshCalendar(container);
  });

  document.getElementById('cal-next-btn')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    selectedDay = 1;
    refreshCalendar(container);
  });

  document.getElementById('cal-today-btn')?.addEventListener('click', () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth() + 1;
    selectedDay = now.getDate();
    // Regenerate events for this year if year changed
    allEvents = generateCalendarEvents(allMembers, currentYear);
    refreshCalendar(container);
  });

  // Day selection
  attachDayListeners(container);

  // Filter chips
  container.querySelectorAll('.cal-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      refreshCalendar(container);
    });
  });
}

function attachDayListeners(container) {
  container.querySelectorAll('.cal-day').forEach(el => {
    el.addEventListener('click', () => {
      const day = parseInt(el.dataset.day, 10);
      if (day && day !== selectedDay) {
        selectedDay = day;
        refreshCalendarSections(container);
      }
    });
  });
}

function refreshCalendar(container) {
  // Regenerate events when year changes
  allEvents = generateCalendarEvents(allMembers, currentYear);
  container.innerHTML = renderCalendarPage();
  attachEventListeners(container);
}

function refreshCalendarSections(container) {
  const filtered = filterEvents(allEvents, activeFilter);
  const monthEvents = getEventsForMonth(filtered, currentYear, currentMonth);
  const now = new Date();
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;
  const todayStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Update calendar grid
  const gridContainer = document.getElementById('cal-grid-container');
  if (gridContainer) {
    gridContainer.innerHTML = renderCalendarGrid(monthEvents, isCurrentMonth, todayStr);
    // Re-attach month nav + day listeners
    document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 1) { currentMonth = 12; currentYear--; }
      selectedDay = 1;
      refreshCalendar(container);
    });
    document.getElementById('cal-next-btn')?.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 12) { currentMonth = 1; currentYear++; }
      selectedDay = 1;
      refreshCalendar(container);
    });
    document.getElementById('cal-today-btn')?.addEventListener('click', () => {
      const now = new Date();
      currentYear = now.getFullYear();
      currentMonth = now.getMonth() + 1;
      selectedDay = now.getDate();
      allEvents = generateCalendarEvents(allMembers, currentYear);
      refreshCalendar(container);
    });
    attachDayListeners(container);
  }

  // Update selected date events
  const selectedContainer = document.getElementById('cal-selected-events');
  if (selectedContainer) {
    const selectedEvents = getEventsForDate(filtered, currentYear, currentMonth, selectedDay);
    selectedContainer.innerHTML = renderSelectedDateEvents(selectedEvents);
  }
}
