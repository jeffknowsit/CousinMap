import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import FamilyRepository from '../db/repository.js';
import { showSnackbar } from '../components/snackbar.js';
import themeService from '../services/theme.js';

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

    <!-- PIN Modal -->
    <div id="pin-modal" class="fixed inset-0 bg-on-background/40 z-[100] hidden flex items-center justify-center px-4 backdrop-blur-sm transition-opacity opacity-0">
      <div class="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-sm shadow-lg transform transition-transform scale-95 translate-y-4">
        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Security PIN Required</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-6">Enter your security PIN to authorize clearing all data.</p>
          
          <input type="password" id="pin-input" class="w-full text-center text-2xl tracking-[0.5em] font-mono bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-2 transition-all" placeholder="••••••" maxlength="6">
          <p id="pin-error" class="font-label-sm text-label-sm text-error h-4 opacity-0 transition-opacity">Incorrect PIN</p>
          
          <div class="flex gap-3 w-full mt-6">
            <button id="cancel-pin" class="flex-1 py-2.5 rounded-full font-label-lg font-semibold text-on-surface-variant bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all">Cancel</button>
            <button id="confirm-pin" class="flex-1 py-2.5 rounded-full font-label-lg font-semibold text-on-error bg-error hover:opacity-90 active:scale-95 transition-all">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  `;

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

  // Clear all data logic with PIN modal
  const clearBtn = document.getElementById('btn-clear-data');
  const modal = document.getElementById('pin-modal');
  const cancelBtn = document.getElementById('cancel-pin');
  const confirmBtn = document.getElementById('confirm-pin');
  const pinInput = document.getElementById('pin-input');
  const pinError = document.getElementById('pin-error');
  const modalInner = modal.querySelector('div');

  const showModal = () => {
    modal.classList.remove('hidden');
    // small delay for transition
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modalInner.classList.remove('scale-95', 'translate-y-4');
      pinInput.value = '';
      pinInput.focus();
      pinError.classList.add('opacity-0');
    }, 10);
  };

  const hideModal = () => {
    modal.classList.add('opacity-0');
    modalInner.classList.add('scale-95', 'translate-y-4');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200); // match transition duration
  };

  clearBtn?.addEventListener('click', showModal);
  cancelBtn?.addEventListener('click', hideModal);

  confirmBtn?.addEventListener('click', async () => {
    const enteredPin = pinInput.value;
    if (enteredPin === '981106') {
      // Valid PIN
      hideModal();
      confirmBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>';
      
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
    } else {
      // Invalid PIN
      pinError.classList.remove('opacity-0');
      pinInput.classList.add('border-error');
      pinInput.value = '';
      setTimeout(() => pinInput.classList.remove('border-error'), 1500);
    }
  });

  // Allow pressing Enter to confirm PIN
  pinInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      confirmBtn.click();
    }
  });
}
