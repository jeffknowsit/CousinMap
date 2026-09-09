import FamilyRepository from '../db/repository.js';
import LocationService from '../services/location.js';
import { formatDistance, calculateDistanceToMember } from '../services/distance.js';
import { avatarHTML, formatDateTime, formatLocationSource, getSourceIcon } from '../utils/helpers.js';
import { showBottomSheet } from '../components/bottom-sheet.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { requirePin } from '../components/pin-modal.js';

let miniMap = null;

export default async function ProfileScreen(container, params) {
  const id = params.id;
  const member = await FamilyRepository.getById(id);
  if (!member) {
    container.innerHTML = `<div class="flex items-center justify-center min-h-screen"><p class="text-on-surface-variant">Member not found.</p></div>`;
    return;
  }

  let userLocation = null;
  try {
    const perm = await LocationService.checkPermission();
    if (perm === 'granted') {
      userLocation = await LocationService.getCurrentPosition({ timeout: 5000 });
    }
  } catch { /* silent */ }

  const hasLocation = member.latitude != null && member.longitude != null;
  const distance = calculateDistanceToMember(userLocation?.latitude, userLocation?.longitude, member.latitude, member.longitude);
  const distanceText = distance != null ? formatDistance(distance) : 'Distance unavailable';
  const avatar = avatarHTML(member, 80, 'full');

  container.innerHTML = `
    <main class="flex-1 flex flex-col relative w-full pb-8 bg-surface screen-enter">
      <!-- Top Bar -->
      <div class="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl px-screen-edge-padding pt-[max(env(safe-area-inset-top,0px),0.5rem)]">
        <div class="flex items-center justify-between h-14">
          <button class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant transition-transform active:scale-95 text-on-surface" onclick="history.back()">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <span class="font-label-lg text-label-lg text-on-surface">Family Member</span>
          <button class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant" id="profile-more-btn">
            <span class="material-symbols-outlined text-[22px]">more_vert</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col px-screen-edge-padding space-y-space-lg">
        <!-- Profile Header -->
        <div class="flex flex-col items-center text-center pt-space-sm">
          <div class="relative">
            <div class="w-20 h-20">${avatar}</div>
            ${hasLocation ? '<span class="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#10b981] ring-3 ring-surface flex items-center justify-center"><span class="w-2 h-2 rounded-full bg-white"></span></span>' : ''}
          </div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface mt-space-sm">${member.name}</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-2 max-w-[280px] leading-relaxed text-balance">${member.description || ''}</p>
          ${hasLocation ? `<p class="font-body-sm text-body-sm text-on-surface-variant mt-2 flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-primary">location_on</span>${member.location_name || 'Unknown'} • ${distanceText}</p>` : ''}
        </div>

        <!-- Contact Actions -->
        <div class="grid grid-cols-3 gap-space-xs">
          <button class="flex flex-col items-center justify-center h-[72px] rounded-2xl bg-surface-container-lowest shadow-sm active:scale-95 transition-all" onclick="window.location.href='tel:${member.phone_number}'">
            <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center mb-1">
              <span class="material-symbols-outlined text-primary text-[20px]">call</span>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface">Call</span>
          </button>
          <button class="flex flex-col items-center justify-center h-[72px] rounded-2xl bg-surface-container-lowest shadow-sm active:scale-95 transition-all" onclick="window.location.href='mailto:${member.email}'">
            <div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center mb-1">
              <span class="material-symbols-outlined text-secondary text-[20px]">mail</span>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface">Email</span>
          </button>
          <button class="flex flex-col items-center justify-center h-[72px] rounded-2xl bg-surface-container-lowest shadow-sm active:scale-95 transition-all" onclick="window.open('https://wa.me/${(member.phone_number || '').replace(/[^\\d]/g, '')}', '_blank')">
            <div class="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center mb-1">
              <span class="material-symbols-outlined text-tertiary text-[20px]">chat</span>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface">WhatsApp</span>
          </button>
        </div>

        <!-- Contact Info -->
        <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm space-y-space-sm">
          <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Contact Info</h3>
          ${member.phone_number ? `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-sm">
                <span class="material-symbols-outlined text-outline text-[20px]">phone</span>
                <div>
                  <p class="font-body-sm text-body-sm text-on-surface-variant">Phone</p>
                  <p class="font-body-md text-body-md text-on-surface">${member.phone_number}</p>
                </div>
              </div>
              <button class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center" onclick="window.location.href='tel:${member.phone_number}'">
                <span class="material-symbols-outlined text-primary text-[18px]">call</span>
              </button>
            </div>
          ` : ''}
          ${member.email ? `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-sm">
                <span class="material-symbols-outlined text-outline text-[20px]">mail</span>
                <div>
                  <p class="font-body-sm text-body-sm text-on-surface-variant">Email</p>
                  <p class="font-body-md text-body-md text-on-surface break-all">${member.email}</p>
                </div>
              </div>
              <button class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center" onclick="window.location.href='mailto:${member.email}'">
                <span class="material-symbols-outlined text-primary text-[18px]">mail</span>
              </button>
            </div>
          ` : ''}
          ${member.dob ? `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-sm">
                <span class="material-symbols-outlined text-outline text-[20px]">cake</span>
                <div>
                  <p class="font-body-sm text-body-sm text-on-surface-variant">Date of Birth</p>
                  <p class="font-body-md text-body-md text-on-surface">${new Date(member.dob).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ` : ''}
          ${member.wedding_anniversary ? `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-sm">
                <span class="material-symbols-outlined text-outline text-[20px]">celebration</span>
                <div>
                  <p class="font-body-sm text-body-sm text-on-surface-variant">Wedding Anniversary</p>
                  <p class="font-body-md text-body-md text-on-surface">${new Date(member.wedding_anniversary).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Location Section -->
        <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm space-y-space-sm">
          <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Location</h3>
          ${hasLocation ? `
            <div class="flex items-start gap-space-xs">
              <span class="material-symbols-outlined text-primary-container text-[24px] mt-0.5" style="font-variation-settings: 'FILL' 1;">location_on</span>
              <div class="flex-1">
                <p class="font-headline-md text-headline-md text-on-surface">${member.location_name || 'Unknown'}</p>
                <div class="grid grid-cols-2 gap-y-2 mt-space-xs">
                  <div>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">Latitude</p>
                    <p class="font-body-md text-body-md text-on-surface">${member.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">Longitude</p>
                    <p class="font-body-md text-body-md text-on-surface">${member.longitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">Source</p>
                    <p class="font-body-md text-body-md text-on-surface flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">${getSourceIcon(member.location_source)}</span>
                      ${formatLocationSource(member.location_source)}
                    </p>
                  </div>
                  <div>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">${member.location_accuracy ? 'Accuracy' : 'Updated'}</p>
                    <p class="font-body-md text-body-md text-on-surface">${member.location_accuracy ? member.location_accuracy + ' m' : formatDateTime(member.location_updated_at)}</p>
                  </div>
                </div>
                <p class="font-label-sm text-label-sm text-on-surface-variant mt-2">
                  Last updated: ${formatDateTime(member.location_updated_at || member.updated_at)}
                </p>
              </div>
            </div>
            <!-- Mini Map -->
            <div id="profile-minimap" class="w-full h-[160px] rounded-xl overflow-hidden shadow-inner mt-space-sm"></div>
          ` : `
            <div class="flex flex-col items-center py-space-lg text-center">
              <span class="material-symbols-outlined text-outline text-[32px] mb-2">location_off</span>
              <p class="font-body-md text-body-md text-on-surface-variant">No location added</p>
              <button class="mt-space-sm px-space-lg h-10 rounded-xl bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md font-semibold" onclick="window.location.hash='/update-location/${member.id}'">Add Location</button>
            </div>
          `}
        </div>

        <!-- Action Buttons -->
        <div class="space-y-space-xs pb-space-lg">
          ${hasLocation ? `
            <button class="w-full h-14 rounded-2xl bg-primary-container text-on-primary-container font-headline-md text-headline-md shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${member.latitude},${member.longitude}', '_blank')">
              <span class="material-symbols-outlined text-[22px]">turn_right</span>
              Get Directions
            </button>
          ` : ''}
          <button class="w-full h-12 rounded-2xl bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-outline-variant/30" id="profile-edit-location-btn">
            <span class="material-symbols-outlined text-[20px] text-primary">edit_location_alt</span>
            Edit Location
            <span class="material-symbols-outlined text-[14px] text-outline ml-auto mr-1" title="PIN required">lock</span>
          </button>
          <button class="w-full h-12 rounded-2xl bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-outline-variant/30" id="profile-edit-member-btn">
            <span class="material-symbols-outlined text-[20px] text-secondary">edit</span>
            Edit Member
            <span class="material-symbols-outlined text-[14px] text-outline ml-auto mr-1" title="PIN required">lock</span>
          </button>
        </div>
      </div>
    </main>
  `;

  // Init mini map
  if (hasLocation) {
    setTimeout(() => {
      const mapEl = document.getElementById('profile-minimap');
      if (!mapEl) return;
      miniMap = L.map(mapEl, {
        center: [member.latitude, member.longitude],
        zoom: 14,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(miniMap);
      L.circleMarker([member.latitude, member.longitude], { radius: 10, color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.8, weight: 3 }).addTo(miniMap);
    }, 100);
  }

  // Add listeners for edit/delete buttons in the main view
  document.getElementById('profile-edit-location-btn')?.addEventListener('click', async () => {
    if (await requirePin('Enter PIN to edit location.')) {
      window.location.hash = '/update-location/' + member.id;
    }
  });

  document.getElementById('profile-edit-member-btn')?.addEventListener('click', async () => {
    if (await requirePin('Enter PIN to edit member.')) {
      window.location.hash = '/edit/' + member.id;
    }
  });

  // More menu
  document.getElementById('profile-more-btn')?.addEventListener('click', () => {
    showBottomSheet(
      '<div class="space-y-1 py-space-xs">' +
        '<button class="w-full flex items-center gap-space-sm px-space-md py-space-sm rounded-xl hover:bg-surface-container-low transition-colors" id="bs-edit-member-btn">' +
          '<span class="material-symbols-outlined text-[20px] text-on-surface-variant">edit</span>' +
          '<span class="font-body-md text-body-md text-on-surface flex-1 text-left">Edit Member</span>' +
          '<span class="material-symbols-outlined text-[16px] text-outline" title="PIN required">lock</span>' +
        '</button>' +
        '<button class="w-full flex items-center gap-space-sm px-space-md py-space-sm rounded-xl hover:bg-surface-container-low transition-colors" id="bs-update-location-btn">' +
          '<span class="material-symbols-outlined text-[20px] text-on-surface-variant">edit_location_alt</span>' +
          '<span class="font-body-md text-body-md text-on-surface flex-1 text-left">Update Location</span>' +
          '<span class="material-symbols-outlined text-[16px] text-outline" title="PIN required">lock</span>' +
        '</button>' +
        '<button class="w-full flex items-center gap-space-sm px-space-md py-space-sm rounded-xl hover:bg-error-container/50 transition-colors" id="delete-member-btn">' +
          '<span class="material-symbols-outlined text-[20px] text-error">delete</span>' +
          '<span class="font-body-md text-body-md text-error flex-1 text-left">Delete Member</span>' +
          '<span class="material-symbols-outlined text-[16px] text-error/60" title="PIN required">lock</span>' +
        '</button>' +
      '</div>'
    );

    setTimeout(() => {
      document.getElementById('bs-edit-member-btn')?.addEventListener('click', async () => {
        const { hideBottomSheet } = await import('../components/bottom-sheet.js');
        hideBottomSheet();
        if (await requirePin('Enter PIN to edit member.')) {
          window.location.hash = '/edit/' + member.id;
        }
      });

      document.getElementById('bs-update-location-btn')?.addEventListener('click', async () => {
        const { hideBottomSheet } = await import('../components/bottom-sheet.js');
        hideBottomSheet();
        if (await requirePin('Enter PIN to edit location.')) {
          window.location.hash = '/update-location/' + member.id;
        }
      });

      document.getElementById('delete-member-btn')?.addEventListener('click', async () => {
        const { hideBottomSheet } = await import('../components/bottom-sheet.js');
        hideBottomSheet();
        if (await requirePin('Enter PIN to delete member.')) {
          if (confirm('Are you sure you want to delete ' + member.name + '?')) {
            await FamilyRepository.delete(member.id);
            const { showSnackbar } = await import('../components/snackbar.js');
            showSnackbar(member.name + ' deleted.', 'info');
            window.location.hash = '/family';
          }
        }
      });
    }, 100);
  });

  return () => {
    if (miniMap) { miniMap.remove(); miniMap = null; }
  };
}
