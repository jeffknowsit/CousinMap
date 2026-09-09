import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import FamilyRepository from '../db/repository.js';
import { showSnackbar } from '../components/snackbar.js';
import themeService from '../services/theme.js';
import { requirePin } from '../components/pin-modal.js';
import { onInstallAvailable, installPWA, isInstallable } from '../services/pwa.js';

export default async function MoreScreen(container) {
  const memberCount = await FamilyRepository.getCount();

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;

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

  // Build the INSTALL section — always visible, adapts to device/state
  function buildInstallCard() {
    // Already running as installed PWA
    if (isInStandaloneMode) {
      return `
        <div class="space-y-space-2xs">
          <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-space-xs">INSTALL</h3>
          <div class="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-space-md flex items-center gap-space-sm">
            <div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md">
              <span class="material-symbols-outlined text-on-primary text-[24px]">check_circle</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-body-md text-body-md text-on-surface font-semibold">App Installed ✓</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant">CousinMap is running as a web app</p>
            </div>
          </div>
        </div>`;
    }

    // iOS Safari — no beforeinstallprompt, show inline steps
    if (isIOS) {
      return `
        <div class="space-y-space-2xs">
          <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-space-xs">INSTALL</h3>
          <div class="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-space-md">
            <div class="flex items-center gap-space-sm mb-space-sm">
              <div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md">
                <span class="material-symbols-outlined text-on-primary text-[24px]">install_mobile</span>
              </div>
              <div>
                <p class="font-body-md text-body-md text-on-surface font-semibold">Add to Home Screen</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Install CousinMap on iPhone / iPad</p>
              </div>
            </div>
            <ol class="space-y-2 mt-space-xs">
              <li class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">1</span>
                <p class="font-body-sm text-body-sm text-on-surface">Tap <strong>Share</strong> <span class="material-symbols-outlined text-[13px] align-text-bottom">ios_share</span> at the bottom of Safari</p>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">2</span>
                <p class="font-body-sm text-body-sm text-on-surface">Tap <strong>"Add to Home Screen"</strong></p>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">3</span>
                <p class="font-body-sm text-body-sm text-on-surface">Tap <strong>"Add"</strong> to confirm</p>
              </li>
            </ol>
          </div>
        </div>`;
    }

    // Android / Desktop — prominent card, button activates when prompt is ready
    return `
      <div class="space-y-space-2xs">
        <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-space-xs">INSTALL</h3>
        <button id="btn-pwa-install" type="button" class="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 p-space-md flex items-center gap-space-sm hover:from-primary/20 hover:to-primary/10 transition-all active:scale-[0.98] text-left">
          <div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md">
            <span class="material-symbols-outlined text-on-primary text-[24px]">install_desktop</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-body-md text-body-md text-on-surface font-semibold">Add as Web App</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant" id="install-sub">Tap to install CousinMap on this device</p>
          </div>
          <div id="install-action" class="shrink-0 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold">
            Install
          </div>
        </button>
      </div>`;
  }

  container.innerHTML = `
    ${renderHeader('more')}
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter">
      <div class="flex flex-col w-full px-screen-edge-padding space-y-space-lg">
        <div class="pt-space-xs">
          <h1 class="font-headline-xl-mobile text-headline-xl-mobile text-on-surface tracking-tight">More</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Settings &amp; preferences</p>
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

        <!-- PWA Install Card — always visible, adapts to device/state -->
        ${buildInstallCard()}

        <!-- DATA / Danger Zone -->
        <div class="space-y-space-2xs">
          <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-space-xs">DATA</h3>
          <div class="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
            <button class="w-full flex items-center gap-space-sm px-space-md py-space-sm hover:bg-error-container/20 transition-colors" id="btn-clear-data" type="button">
              <div class="w-10 h-10 rounded-xl bg-error-container/30 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-error text-[20px]">delete_forever</span>
              </div>
              <div class="flex-1 text-left">
                <p class="font-body-md text-body-md text-error">Clear All Data</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Delete all family members &amp; reset</p>
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
  `;

  // Wire up generic section item actions
  const allItems = sections.flatMap(s => s.items);
  container.querySelectorAll('.more-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const label = btn.dataset.label;
      const item = allItems.find(i => i.label === label);
      if (item?.action) item.action();
    });
  });

  // Dark Mode Toggle
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

  // ── Android / Desktop PWA Install ──────────────────────────────────────────
  const pwaInstallBtn = document.getElementById('btn-pwa-install');
  if (pwaInstallBtn) {
    const subEl = document.getElementById('install-sub');
    const actionEl = document.getElementById('install-action');

    // Update subtitle + install pill based on installability
    function updateInstallState(available) {
      if (subEl) {
        subEl.textContent = available
          ? 'Tap to install CousinMap on this device'
          : 'Open this page in Chrome / Edge to install';
      }
      if (actionEl) {
        actionEl.textContent = available ? 'Install' : 'N/A';
        actionEl.style.opacity = available ? '1' : '0.4';
      }
      pwaInstallBtn.disabled = !available;
      pwaInstallBtn.style.opacity = available ? '1' : '0.7';
      pwaInstallBtn.style.cursor = available ? 'pointer' : 'default';
    }

    // Set initial state immediately if already installable
    updateInstallState(isInstallable());

    // Subscribe to future changes
    onInstallAvailable((available) => updateInstallState(available));

    pwaInstallBtn.addEventListener('click', async () => {
      if (!isInstallable()) return;
      const installed = await installPWA();
      if (installed) {
        showSnackbar('CousinMap installed successfully! Find it on your home screen.', 'success', 4000);
      }
    });
  }

  // ── iOS Safari Manual Guide ─────────────────────────────────────────────────
  const iosInstallBtn = document.getElementById('btn-ios-install');
  if (iosInstallBtn) {
    iosInstallBtn.addEventListener('click', () => {
      // Show a bottom-sheet style guide for iOS
      const guide = document.createElement('div');
      guide.id = 'ios-install-guide';
      guide.className = 'fixed inset-0 bg-on-background/50 z-[200] flex items-end justify-center px-4 pb-4 backdrop-blur-sm';
      guide.innerHTML =
        '<div class="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-sm shadow-xl">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<h3 class="font-headline-md text-headline-md text-on-surface">Add to Home Screen</h3>' +
            '<button id="close-ios-guide" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">' +
              '<span class="material-symbols-outlined text-[18px]">close</span>' +
            '</button>' +
          '</div>' +
          '<ol class="space-y-4 text-left">' +
            '<li class="flex items-start gap-3">' +
              '<span class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shrink-0">1</span>' +
              '<p class="font-body-md text-body-md text-on-surface pt-0.5">Tap the <strong>Share</strong> button <span class="material-symbols-outlined text-[16px] align-text-bottom">ios_share</span> at the bottom of Safari</p>' +
            '</li>' +
            '<li class="flex items-start gap-3">' +
              '<span class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shrink-0">2</span>' +
              '<p class="font-body-md text-body-md text-on-surface pt-0.5">Scroll down and tap <strong>"Add to Home Screen"</strong></p>' +
            '</li>' +
            '<li class="flex items-start gap-3">' +
              '<span class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shrink-0">3</span>' +
              '<p class="font-body-md text-body-md text-on-surface pt-0.5">Tap <strong>"Add"</strong> to confirm</p>' +
            '</li>' +
          '</ol>' +
          '<p class="font-body-sm text-body-sm text-on-surface-variant mt-4 text-center">CousinMap will appear on your home screen like a native app.</p>' +
        '</div>';
      document.body.appendChild(guide);
      document.getElementById('close-ios-guide')?.addEventListener('click', () => guide.remove());
      guide.addEventListener('click', (e) => { if (e.target === guide) guide.remove(); });
    });
  }

  // ── Clear All Data ──────────────────────────────────────────────────────────
  const clearBtn = document.getElementById('btn-clear-data');
  clearBtn?.addEventListener('click', async () => {
    if (await requirePin('Enter your security PIN to authorize clearing all data.')) {
      clearBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>';
      try {
        const members = await FamilyRepository.getAll();
        for (const m of members) {
          await FamilyRepository.delete(m.id);
        }
        showSnackbar('All data cleared successfully.', 'success');
        setTimeout(() => { window.location.hash = '/home'; }, 500);
      } catch (err) {
        showSnackbar('Error clearing data.', 'error');
        clearBtn.innerHTML =
          '<div class="w-10 h-10 rounded-xl bg-error-container/30 flex items-center justify-center shrink-0">' +
            '<span class="material-symbols-outlined text-error text-[20px]">delete_forever</span>' +
          '</div>' +
          '<div class="flex-1 text-left">' +
            '<p class="font-body-md text-body-md text-error">Clear All Data</p>' +
            '<p class="font-body-sm text-body-sm text-on-surface-variant">Delete all family members &amp; reset</p>' +
          '</div>';
      }
    }
  });
}
