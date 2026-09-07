/**
 * Render an empty state
 */
export function renderEmptyState(type = 'no-members') {
  const states = {
    'no-members': {
      icon: 'group_off',
      title: 'No Family Members Yet',
      subtitle: 'Add your first family member to start building your family map.',
      action: { label: '+ Add Family Member', hash: '/add' },
    },
    'no-location': {
      icon: 'location_off',
      title: 'No Location Added',
      subtitle: 'Add a location to see this member on the map.',
      action: null,
    },
    'no-nearby': {
      icon: 'radar',
      title: 'No Family Members Nearby',
      subtitle: 'None of your family members are within range of your current location.',
      action: null,
    },
    'no-results': {
      icon: 'search_off',
      title: 'No Results Found',
      subtitle: 'Try searching with a different name, location, or relationship.',
      action: null,
    },
    'no-map-members': {
      icon: 'map',
      title: 'No Locations to Show',
      subtitle: 'Add locations for your family members to see them on the map.',
      action: { label: '+ Add Family Member', hash: '/add' },
    },
    'location-denied': {
      icon: 'location_disabled',
      title: 'Location Permission Denied',
      subtitle: 'Enable location access in your browser settings to use GPS features.',
      action: null,
    },
    'location-unavailable': {
      icon: 'gps_off',
      title: 'Location Unavailable',
      subtitle: 'Could not determine your current location. Please check your GPS settings.',
      action: null,
    },
  };

  const state = states[type] || states['no-members'];

  return `
    <div class="flex flex-col items-center justify-center py-space-3xl px-space-xl text-center">
      <div class="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-space-md">
        <span class="material-symbols-outlined text-outline text-[32px]">${state.icon}</span>
      </div>
      <h3 class="font-headline-md text-headline-md text-on-surface mb-space-2xs">${state.title}</h3>
      <p class="font-body-md text-body-md text-on-surface-variant max-w-[280px]">${state.subtitle}</p>
      ${state.action ? `
        <button class="mt-space-lg px-space-xl h-12 rounded-2xl bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold shadow-md active:scale-[0.98] transition-all" onclick="window.location.hash='${state.action.hash}'">
          ${state.action.label}
        </button>
      ` : ''}
    </div>
  `;
}
