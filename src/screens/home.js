import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { renderMemberCard } from '../components/member-card.js';
import { renderEmptyState } from '../components/empty-state.js';
import FamilyRepository from '../db/repository.js';
import LocationService from '../services/location.js';
import { formatDistance, calculateDistanceToMember } from '../services/distance.js';

export default async function HomeScreen(container) {
  let userLocation = null;

  const members = await FamilyRepository.getAll();
  const memberCount = members.length;
  const locationsCount = members.filter(m => m.latitude != null).length;
  const updatedToday = await FamilyRepository.getUpdatedTodayCount();
  const recentMembers = await FamilyRepository.getRecentlyUpdated(4);

  // Nearby count
  let nearbyCount = 0;
  if (userLocation) {
    nearbyCount = members.filter(m => {
      const d = calculateDistanceToMember(userLocation.latitude, userLocation.longitude, m.latitude, m.longitude);
      return d != null && d <= 10;
    }).length;
  }

  const recentCardsHTML = recentMembers.length > 0
    ? recentMembers.map(m => renderMemberCard(m, userLocation, { showFooter: true })).join('')
    : renderEmptyState('no-members');

  container.innerHTML = `
    ${renderHeader('home')}
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter">
      <div class="flex flex-col w-full px-screen-edge-padding space-y-space-lg">
        <!-- Header Overview -->
        <div class="flex flex-col space-y-space-2xs mt-space-xs">
          <div class="flex items-center justify-between">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant">
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              <span class="font-label-sm text-label-sm font-semibold tracking-wide uppercase">Live Sync Active</span>
            </div>
            <span class="font-label-sm text-label-sm text-outline">Refreshed just now</span>
          </div>
          <h1 class="font-headline-xl-mobile text-headline-xl-mobile text-on-surface">Your Family Map</h1>
          <p class="font-body-md text-body-md text-on-surface-variant">Keep track of your family locations in one place.</p>
        </div>

        <!-- Compact Statistics Card -->
        <div class="w-full bg-surface-container-lowest rounded-2xl shadow-sm p-space-md">
          <div class="grid grid-cols-3 divide-x-0 gap-space-xs">
            <div class="flex flex-col items-center text-center p-space-xs rounded-xl bg-surface-container-low transition-transform active:scale-95">
              <div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant mb-1">
                <span class="material-symbols-outlined text-[18px]">group</span>
              </div>
              <span class="font-headline-lg text-headline-lg text-on-surface">${memberCount}</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant leading-tight">Family Members</span>
            </div>
            <div class="flex flex-col items-center text-center p-space-xs rounded-xl bg-surface-container-low transition-transform active:scale-95">
              <div class="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant mb-1">
                <span class="material-symbols-outlined text-[18px]">pin_drop</span>
              </div>
              <span class="font-headline-lg text-headline-lg text-on-surface">${locationsCount}</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant leading-tight">Locations Added</span>
            </div>
            <div class="flex flex-col items-center text-center p-space-xs rounded-xl bg-surface-container-low relative transition-transform active:scale-95">
              <div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant mb-1 relative">
                <span class="material-symbols-outlined text-[18px]">bolt</span>
                ${updatedToday > 0 ? '<span class="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface-container-lowest"></span>' : ''}
              </div>
              <div class="flex items-center gap-1">
                <span class="font-headline-lg text-headline-lg text-on-surface">${updatedToday}</span>
                ${updatedToday > 0 ? '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>' : ''}
              </div>
              <span class="font-label-sm text-label-sm text-on-surface-variant leading-tight">Updated Today</span>
            </div>
          </div>
        </div>

        <!-- Primary Action Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
          <button class="flex items-center justify-between w-full h-[52px] px-space-md rounded-2xl bg-primary-container text-on-primary-container shadow-md active:scale-[0.98] transition-all" type="button" onclick="window.location.hash='/map'">
            <div class="flex items-center gap-space-xs">
              <div class="w-8 h-8 rounded-full bg-on-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">explore</span>
              </div>
              <span class="font-label-lg text-label-lg font-semibold">View Family Map</span>
            </div>
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <button class="flex items-center justify-center gap-space-xs w-full h-[52px] px-space-md rounded-2xl bg-primary-fixed text-on-primary-fixed-variant active:scale-[0.98] transition-all" type="button" onclick="window.location.hash='/add'">
            <span class="material-symbols-outlined text-[20px]">person_add</span>
            <span class="font-label-lg text-label-lg font-semibold">Add Family Member</span>
          </button>
        </div>

        <!-- Nearby Radar (Placeholder initially) -->
        <div id="nearby-radar-container"></div>

        <!-- Recently Added & Updated -->
        <div class="flex flex-col space-y-space-sm">
          <div class="flex items-center justify-between px-0.5">
            <div class="flex items-center gap-space-xs">
              <h2 class="font-headline-md text-headline-md text-on-surface">Recently Added & Updated</h2>
              <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">${recentMembers.length}</span>
            </div>
            <a class="font-label-md text-label-md text-primary font-semibold flex items-center gap-0.5 cursor-pointer" onclick="window.location.hash='/family'">
              View All
              <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            </a>
          </div>
          <div class="flex flex-col space-y-space-xs" id="recent-cards-container">
            ${recentCardsHTML}
          </div>
        </div>

        <!-- Privacy Notice -->
        <div class="w-full bg-surface-container-low rounded-2xl p-space-md flex items-center justify-between gap-space-sm mb-space-sm">
          <div class="flex items-center gap-space-xs min-w-0">
            <span class="material-symbols-outlined text-primary text-[22px] shrink-0">verified_user</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant truncate">Family privacy mode is turned on for all circles</span>
          </div>
          <button class="font-label-sm text-label-sm font-semibold text-primary shrink-0" type="button" onclick="window.location.hash='/more'">Settings</button>
        </div>
      </div>
    </main>
    ${renderBottomNav('home', memberCount)}
  `;

  // Fetch location in background so we don't block render
  LocationService.checkPermission().then(async perm => {
    if (perm === 'granted') {
      try {
        userLocation = await LocationService.getCurrentPosition({ timeout: 5000 });
        
        // Update radar
        const radarCount = members.filter(m => {
          const d = calculateDistanceToMember(userLocation.latitude, userLocation.longitude, m.latitude, m.longitude);
          return d != null && d <= 10;
        }).length;

        const radarContainer = document.getElementById('nearby-radar-container');
        if (radarContainer) {
          radarContainer.innerHTML = `
            <div class="w-full bg-surface-container-high rounded-2xl p-space-md shadow-sm relative overflow-hidden mb-space-sm">
              <div class="flex items-start gap-space-sm">
                <div class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
                  <span class="material-symbols-outlined text-[22px]">radar</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="font-label-md text-label-md text-primary font-semibold uppercase tracking-wider">Nearby Radar</span>
                    <span class="inline-flex items-center gap-1 text-primary text-label-sm font-semibold">Within 10 km</span>
                  </div>
                  <p class="font-body-md text-body-md text-on-surface mt-0.5">
                    <strong class="font-semibold text-primary">${radarCount} member${radarCount !== 1 ? 's' : ''}</strong> ${radarCount !== 1 ? 'are' : 'is'} within 10 km of your location.
                  </p>
                </div>
              </div>
            </div>
          `;
        }

        // Update cards with distances
        const recentCardsContainer = document.getElementById('recent-cards-container');
        if (recentCardsContainer && recentMembers.length > 0) {
          recentCardsContainer.innerHTML = recentMembers.map(m => renderMemberCard(m, userLocation, { showFooter: true })).join('');
        }
      } catch { /* silent */ }
    }
  });
}
