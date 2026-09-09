import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import FamilyRepository from '../db/repository.js';
import { showSnackbar } from '../components/snackbar.js';
import themeService from '../services/theme.js';
import { promptPin } from '../components/pin-modal.js';
import { installPWA } from '../services/pwa.js';

export default async function MoreScreen(container) {
  const memberCount = await FamilyRepository.getCount();

  const sections = [
    {
      title: 'FAMILY',
      items: [
        { icon: 'group', label: 'Manage Family', subtitle: `${memberCount} members`, action: () => { window.location.hash = '/family'; } },
      ],
    },
    {
      title: 'APP SETTINGS',
      items: [
        { 
          icon: themeService.isDarkMode ? 'light_mode' : 'dark_mode', 
          label: 'Appearance', 
          subtitle: themeService.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode', 
          id: 'toggle-theme' 
        },
        { icon: 'app_shortcut', label: 'Install App', subtitle: 'Add to Home Screen', action: () => { installPWA(); } },
        { icon: 'info', label: 'About', subtitle: 'CousinMap v1.0.0', action: () => { showSnackbar('Developed by Jeff Joseph<br><a href="https://github.com/jeffknowsit/" target="_blank" class="font-bold underline mt-1 block">github.com/jeffknowsit/</a>', 'info', 6000); } },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: 'support_agent', label: 'Contact Support', subtitle: 'Chat with us on WhatsApp', action: () => { window.open('https://wa.me/7012293909', '_blank'); } },
      ],
    },
  ];

  container.innerHTML = `
    ${renderHeader('more')}
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter">
      <div class="flex flex-col w-full px-screen-edge-padding space-y-space-lg">
        <div class="pt-space-xs">
          <h1 class="font-headline-xl-mobile text-headline-xl-mobile text-on-surface tracking-tight">More</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Settings & preferences</p>
        </div>

        ${sections.map(section => `
          <div class="space-y-space-2xs">
            <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-space-xs">${section.title}</h3>
            <div class="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
              ${section.items.map((item, idx) => `
                <button class="more-item w-full flex items-center gap-space-sm px-space-md py-space-sm hover:bg-surface-container-low transition-colors active:scale-[0.99] ${idx > 0 ? 'border-t border-surface-container-low' : ''}" data-label="${item.label}" id="${item.id || ''}" type="button">
                  <div class="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary text-[20px]" id="icon-${item.id || item.label.replace(/\s+/g, '-')}">${item.icon}</span>
                  </div>
                  <div class="flex-1 text-left min-w-0">
                    <p class="font-body-md text-body-md text-on-surface">${item.label}</p>
                    <p class="font-body-sm text-body-sm text-on-surface-variant truncate" id="sub-${item.id || item.label.replace(/\s+/g, '-')}">${item.subtitle}</p>
                  </div>
                  <span class="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <!-- Danger Zone -->
        <div class="space-y-space-2xs">
          <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-space-xs">DATA</h3>
          <div class="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
            <button class="w-full flex items-center gap-space-sm px-space-md py-space-sm hover:bg-error-container/20 transition-colors" id="btn-clear-data" type="button">
              <div class="w-10 h-10 rounded-xl bg-error-container/30 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-error text-[20px]">delete_forever</span>
              </div>
              <div class="flex-1 text-left">
                <p class="font-body-md text-body-md text-error">Clear All Data</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Delete all family members & reset</p>
              </div>
            </button>
          </div>
        </div>

        <!-- App Info Footer -->
        <div class="flex flex-col items-center py-space-lg text-center">
          <div class="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-2">
            <span class="material-symbols-outlined text-on-primary text-[24px]">explore</span>
          </div>
          <p class="font-headline-md text-headline-md text-on-surface">CousinMap</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-1">Family Location Manager</p>
          <p class="font-label-sm text-label-sm text-outline mt-2">Developed by Jeff Joseph</p>
          <a href="https://github.com/jeffknowsit/" target="_blank" class="font-label-sm text-label-sm text-primary hover:underline mt-1 flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-full mt-2 transition-colors hover:bg-surface-container">
            <span class="material-symbols-outlined text-[14px]">code</span>
            View GitHub Portfolio
          </a>
        </div>
      </div>
    </main>
    ${renderBottomNav('more', memberCount)}
  \`;

  // Wire up generic actions
  const allItems = sections.flatMap(s => s.items);
  container.querySelectorAll('.more-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const label = btn.dataset.label;
      const item = allItems.find(i => i.label === label);
      if (item?.action) item.action();
    });
  });

  // Dark Mode Toggle Logic
  const themeToggleBtn = document.getElementById('toggle-theme');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = themeService.toggle();
      const icon = document.getElementById('icon-toggle-theme');
      const sub = document.getElementById('sub-toggle-theme');
      if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
      if (sub) sub.textContent = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  }

  // Clear all data logic with shared PIN modal
  const clearBtn = document.getElementById('btn-clear-data');
  
  clearBtn?.addEventListener('click', () => {
    promptPin(async () => {
      try {
        const members = await FamilyRepository.getAll();
        for (const m of members) {
          await FamilyRepository.delete(m.id);
        }
        showSnackbar('All data cleared successfully.', 'success');
        setTimeout(() => { window.location.hash = '/home'; }, 500);
      } catch (err) {
        showSnackbar('Error clearing data.', 'error');
      }
    }, 'Enter your security PIN to authorize clearing all data.');
  });
}
