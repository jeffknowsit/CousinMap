import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { renderMemberCard } from '../components/member-card.js';
import { renderEmptyState } from '../components/empty-state.js';
import FamilyRepository from '../db/repository.js';
import LocationService from '../services/location.js';
import { debounce } from '../utils/helpers.js';

export default async function FamilyScreen(container) {
  let userLocation = null;
  try {
    const perm = await LocationService.checkPermission();
    if (perm === 'granted') {
      userLocation = await LocationService.getCurrentPosition({ timeout: 5000 });
    }
  } catch { /* silent */ }

  const allMembers = await FamilyRepository.getAll();
  let filteredMembers = [...allMembers];
  let activeFilter = 'All';
  const memberCount = allMembers.length;


  function renderMembers(members) {
    const listEl = document.getElementById('family-list');
    if (!listEl) return;
    if (members.length === 0) {
      listEl.innerHTML = renderEmptyState(activeFilter === 'All' ? 'no-members' : 'no-results');
      return;
    }
    listEl.innerHTML = members.map(m => renderMemberCard(m, userLocation)).join('');
  }

  container.innerHTML = `
    ${renderHeader('family')}
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter">
      <div class="flex flex-col w-full px-screen-edge-padding space-y-space-md">
        <!-- Header -->
        <div class="flex items-center justify-between pt-space-xs">
          <div>
            <h1 class="font-headline-xl-mobile text-headline-xl-mobile text-on-surface tracking-tight">Family</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <span class="inline-block w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              ${memberCount} family member${memberCount !== 1 ? 's' : ''} connected
            </p>
          </div>
          <div class="flex items-center gap-space-2xs bg-surface-container px-3 py-1.5 rounded-full shadow-sm">
            <span class="material-symbols-outlined text-primary text-[18px]">cell_tower</span>
            <span class="font-label-sm text-label-sm text-primary font-semibold">Live Sync</span>
          </div>
        </div>

        <!-- Search -->
        <div class="space-y-space-sm">
          <div class="relative w-full">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">search</span>
            <input id="family-search-input" class="w-full h-12 pl-11 pr-10 rounded-2xl bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="Search family by name, city, relationship..." type="text">
            <button class="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors" type="button" id="family-clear-search">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>


        </div>

        <!-- Members List -->
        <div class="space-y-space-sm pb-16" id="family-list">
          ${filteredMembers.length > 0
            ? filteredMembers.map(m => renderMemberCard(m, userLocation)).join('')
            : renderEmptyState('no-members')
          }
        </div>
      </div>

      <!-- FAB -->
      <div class="fixed bottom-20 right-4 z-40">
        <button class="group relative flex items-center gap-2 px-5 h-14 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline-md text-body-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200" onclick="window.location.hash='/add'" type="button">
          <span class="material-symbols-outlined text-[26px] group-hover:rotate-90 transition-transform duration-300">add</span>
          <span class="pr-1 text-sm font-semibold tracking-wide">Add Member</span>
        </button>
      </div>
    </main>
    ${renderBottomNav('family', memberCount)}
  `;

  // Search
  const searchInput = document.getElementById('family-search-input');
  const clearBtn = document.getElementById('family-clear-search');

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    filteredMembers = [...allMembers];
    renderMembers(filteredMembers);
  });

  searchInput?.addEventListener('input', debounce(async (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      filteredMembers = [...allMembers];
      renderMembers(filteredMembers);
      return;
    }
    filteredMembers = await FamilyRepository.search(q);
    renderMembers(filteredMembers);
  }, 300));

}
