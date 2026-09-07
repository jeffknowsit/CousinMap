/**
 * Renders the bottom navigation bar
 * @param {string} active - 'home' | 'map' | 'family' | 'more'
 * @param {number} familyCount - Badge count for family tab
 */
export function renderBottomNav(active = 'home', familyCount = 0) {
  const tabs = [
    { key: 'home', icon: 'home', label: 'Home', path: '/home' },
    { key: 'map', icon: 'explore', label: 'Map', path: '/map' },
    { key: 'family', icon: 'group', label: 'Family', path: '/family', badge: familyCount },
    { key: 'more', icon: 'more_horiz', label: 'More', path: '/more' },
  ];

  const tabsHTML = tabs.map(tab => {
    const isActive = tab.key === active;
    const activeClasses = isActive
      ? 'text-primary-container'
      : 'text-outline';
    const indicatorScale = isActive ? 'scale-100' : 'scale-0';

    let badgeHTML = '';
    if (tab.badge && tab.badge > 0) {
      const badgeBg = isActive ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant';
      badgeHTML = `<span class="absolute -top-1 -right-2.5 px-1 py-0.5 min-w-[16px] text-center font-label-sm text-[10px] rounded-full ${badgeBg} font-semibold">${tab.badge}</span>`;
    }

    return `
      <a class="flex flex-col items-center justify-center min-w-touch-target-min min-h-touch-target-min transition-all duration-200 ${activeClasses} cursor-pointer" data-nav="${tab.key}" onclick="window.location.hash='${tab.path}'">
        <div class="relative flex items-center justify-center">
          <span class="material-symbols-outlined text-[24px]">${tab.icon}</span>
          ${badgeHTML}
          <span class="indicator absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary-container ${indicatorScale} transition-transform duration-200"></span>
        </div>
        <span class="font-label-sm text-label-sm mt-0.5">${tab.label}</span>
      </a>
    `;
  }).join('');

  return `
    <nav class="fixed bottom-0 w-full z-50 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <div class="flex justify-around items-center h-16 px-screen-edge-padding">
        ${tabsHTML}
      </div>
    </nav>
  `;
}
