import { avatarHTML, formatDate, getSourceIcon } from '../utils/helpers.js';
import { formatDistance, calculateDistanceToMember } from '../services/distance.js';

/**
 * Renders a family member card matching the Stitch Family Directory design
 */
export function renderMemberCard(member, userLocation = null, options = {}) {
  const { showFooter = true, onClick = null, onDirections = null } = options;

  const distance = calculateDistanceToMember(
    userLocation?.latitude, userLocation?.longitude,
    member.latitude, member.longitude
  );
  const distanceText = distance != null ? formatDistance(distance) : 'Distance unavailable';


  const hasLocation = member.latitude != null && member.longitude != null;

  const avatar = avatarHTML(member, 52, '2xl');
  const sourceIcon = getSourceIcon(member.location_source);
  const sourceText = member.location_source === 'GPS' ? 'GPS' :
    member.location_source === 'MAP_SELECTION' ? 'Manual Map' :
    member.location_source === 'SEARCH' ? 'Search' : 'Manual';
  const updatedText = formatDate(member.location_updated_at || member.updated_at);

  const footerHTML = showFooter && hasLocation ? `
    <div class="mt-3 pt-3 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low/60 -mx-space-md -mb-space-md px-space-md py-2.5 rounded-b-2xl">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1 text-primary font-medium">
          <span class="material-symbols-outlined text-[15px]">${sourceIcon}</span>
          ${sourceText} • ${updatedText}
        </span>
        <span class="text-outline/40">•</span>
        <span class="inline-flex items-center gap-1 text-on-surface font-semibold">
          ${distance != null ? `<span class="material-symbols-outlined text-[15px] text-tertiary">near_me</span>` : ''}
          ${distanceText}
        </span>
      </div>
    </div>
  ` : '';

  return `
    <div class="group relative bg-surface-container-lowest rounded-2xl p-space-md shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer" data-member-id="${member.id}" onclick="window.location.hash='/profile/${member.id}'">
      <div class="flex items-start justify-between gap-space-sm">
        <div class="flex items-center gap-space-sm min-w-0">
          <div class="relative flex-shrink-0">
            ${avatar}
            ${hasLocation ? `
              <span class="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-lowest ring-2 ring-surface-container-lowest">
                <span class="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
              </span>
            ` : `
              <span class="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-lowest ring-2 ring-surface-container-lowest">
                <span class="h-2.5 w-2.5 rounded-full bg-outline"></span>
              </span>
            `}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <h2 class="font-headline-md text-headline-md text-on-surface truncate">${member.name}</h2>
              <p class="font-body-sm text-[13px] text-on-surface-variant truncate max-w-[200px] mt-0.5">${member.description || ''}</p>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
              <span class="text-tertiary-container font-semibold">📍</span>
              <span class="truncate">${member.location_name || member.address || 'No location'}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          ${hasLocation ? `
            <button aria-label="Directions to ${member.name}" class="w-10 h-10 rounded-xl bg-surface-container-low text-primary-container flex items-center justify-center hover:bg-surface-container transition-colors active:scale-95 shadow-sm" type="button" onclick="event.stopPropagation(); window.open('https://www.google.com/maps/dir/?api=1&destination=${member.latitude},${member.longitude}', '_blank')">
              <span class="material-symbols-outlined text-[20px]">near_me</span>
            </button>
          ` : ''}
          <button aria-label="View member profile" class="w-8 h-10 flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button" onclick="event.stopPropagation(); window.location.hash='/profile/${member.id}'">
            <span class="material-symbols-outlined text-[22px]">chevron_right</span>
          </button>
        </div>
      </div>
      ${footerHTML}
    </div>
  `;
}
