/**
 * Format a date for display
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a date with time for profile display
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
}

/**
 * Format location source for display
 */
export function formatLocationSource(source) {
  switch (source) {
    case 'GPS': return 'GPS';
    case 'MAP_SELECTION': return 'Map Selection';
    case 'SEARCH': return 'Search';
    case 'MANUAL': return 'Manual Entry';
    default: return source || 'Unknown';
  }
}

/**
 * Get source icon
 */
export function getSourceIcon(source) {
  switch (source) {
    case 'GPS': return 'sensors';
    case 'MAP_SELECTION': return 'edit_location_alt';
    case 'SEARCH': return 'manage_search';
    case 'MANUAL': return 'tune';
    default: return 'pin_drop';
  }
}

/**
 * Generate initials from a name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Generate a deterministic color from a name
 */
export function getAvatarColor(name) {
  const colors = [
    '#0f766e', '#316bf3', '#945d00', '#005c55', '#0051d5',
    '#734700', '#ba1a1a', '#006a63', '#003ea8', '#653e00',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Generate avatar HTML (image or initials)
 */
export function avatarHTML(member, size = 48, rounded = 'full') {
  const sizeClass = `w-[${size}px] h-[${size}px]`;
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-2xl';
  
  if (member.profile_image) {
    return `<img class="${sizeClass} ${roundedClass} object-cover shadow-sm" src="${member.profile_image}" alt="${member.name}">`;
  }
  
  const initials = getInitials(member.name);
  const color = getAvatarColor(member.name);
  return `<div class="initials-avatar ${sizeClass} ${roundedClass} shadow-sm" style="background-color: ${color}; width: ${size}px; height: ${size}px; min-width: ${size}px; min-height: ${size}px; font-size: ${Math.round(size * 0.38)}px;">${initials}</div>`;
}

/**
 * Validate latitude
 */
export function isValidLatitude(lat) {
  const num = parseFloat(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

/**
 * Validate longitude
 */
export function isValidLongitude(lng) {
  const num = parseFloat(lng);
  return !isNaN(num) && num >= -180 && num <= 180;
}

/**
 * Debounce a function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
