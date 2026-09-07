import { renderHeader } from '../components/header.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { renderEmptyState } from '../components/empty-state.js';
import { showBottomSheet, hideBottomSheet } from '../components/bottom-sheet.js';
import FamilyRepository from '../db/repository.js';
import LocationService from '../services/location.js';
import { formatDistance, calculateDistanceToMember } from '../services/distance.js';
import { avatarHTML, getInitials, getAvatarColor, debounce } from '../utils/helpers.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let map = null;
let markers = [];
let userMarker = null;

export default async function MapScreen(container) {
  const members = await FamilyRepository.getAll();
  const membersWithLocation = members.filter(m => m.latitude != null && m.longitude != null);
  const memberCount = members.length;

  let userLocation = null;
  try {
    const perm = await LocationService.checkPermission();
    if (perm === 'granted') {
      userLocation = await LocationService.getCurrentPosition({ timeout: 5000 });
    }
  } catch { /* silent */ }

  let activeFilter = 'All';

  container.innerHTML = `
    ${renderHeader('map')}
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-16 bg-surface">
      <div class="flex flex-col w-full relative select-none" style="height: calc(100vh - 128px);">
        <!-- Map Container -->
        <div id="leaflet-map" class="w-full h-full"></div>

        <!-- Search & Filters Overlay -->
        <div class="absolute top-3 inset-x-0 z-[1000] flex flex-col gap-space-xs px-screen-edge-padding">
          <div class="flex items-center h-[52px] w-full px-space-md bg-surface-container-lowest/95 backdrop-blur-md rounded-full shadow-md">
            <span class="material-symbols-outlined text-outline mr-space-xs">search</span>
            <input id="map-search-input" class="w-full bg-transparent text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none" placeholder="Search family, spots or address..." type="text">
            <button class="flex items-center justify-center w-8 h-8 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors" type="button" id="map-clear-search">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div class="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-0.5 -mx-screen-edge-padding px-screen-edge-padding" id="map-filters">
            <button class="map-filter-chip shrink-0 flex items-center gap-1.5 h-8 px-space-md rounded-full bg-primary-container text-on-primary font-label-md text-label-md shadow-sm" data-filter="All" type="button">
              <span class="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
              <span>All (${membersWithLocation.length})</span>
            </button>
            <button class="map-filter-chip shrink-0 flex items-center gap-1.5 h-8 px-space-md rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-md text-label-md shadow-sm" data-filter="Cousin" type="button">
              <span>Cousins</span>
            </button>
            <button class="map-filter-chip shrink-0 flex items-center gap-1.5 h-8 px-space-md rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-md text-label-md shadow-sm" data-filter="Parent" type="button">
              <span>Parents</span>
            </button>
            <button class="map-filter-chip shrink-0 flex items-center gap-1.5 h-8 px-space-md rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-md text-label-md shadow-sm" data-filter="Sibling" type="button">
              <span>Siblings</span>
            </button>
            <button class="map-filter-chip shrink-0 flex items-center gap-1.5 h-8 px-space-md rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-md text-label-md shadow-sm" data-filter="Nearby" type="button">
              <span class="material-symbols-outlined text-[15px] text-primary-container">near_me</span>
              <span>Nearby</span>
            </button>
          </div>
        </div>

        <!-- Map Controls -->
        <div class="absolute right-screen-edge-padding top-[140px] z-[1000] flex flex-col gap-space-xs">
          <div class="flex flex-col bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl shadow-md overflow-hidden">
            <button id="map-zoom-in" class="flex items-center justify-center w-11 h-10 text-on-surface hover:bg-surface-container transition-colors" type="button">
              <span class="material-symbols-outlined text-[20px]">add</span>
            </button>
            <div class="w-7 h-[1px] bg-surface-dim mx-auto"></div>
            <button id="map-zoom-out" class="flex items-center justify-center w-11 h-10 text-on-surface hover:bg-surface-container transition-colors" type="button">
              <span class="material-symbols-outlined text-[20px]">remove</span>
            </button>
          </div>
          <button id="map-my-location" class="flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-lowest text-primary-container shadow-xl hover:scale-105 transition-transform mt-1" type="button">
            <span class="material-symbols-outlined text-[24px]">my_location</span>
          </button>
        </div>
      </div>
    </main>
    ${renderBottomNav('map', memberCount)}
  `;

  // Initialize Leaflet Map
  await initMap(membersWithLocation, userLocation);

  // Event Listeners
  setupMapEvents(members, membersWithLocation, userLocation);

  return () => {
    if (map) {
      map.remove();
      map = null;
    }
    markers = [];
  };
}

async function initMap(membersWithLocation, userLocation) {
  const mapEl = document.getElementById('leaflet-map');
  if (!mapEl) return;

  // Default center: Kerala, India
  let center = [10.5, 76.3];
  let zoom = 8;

  if (userLocation) {
    center = [userLocation.latitude, userLocation.longitude];
    zoom = 10;
  } else if (membersWithLocation.length > 0) {
    center = [membersWithLocation[0].latitude, membersWithLocation[0].longitude];
  }

  map = L.map(mapEl, {
    center,
    zoom,
    zoomControl: false,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);

  // Add user location marker
  if (userLocation) {
    const userIcon = L.divIcon({
      className: 'current-location-marker',
      html: '<div class="current-location-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon }).addTo(map);
  }

  // Add family markers
  addFamilyMarkers(membersWithLocation, userLocation);

  // Fit bounds
  if (membersWithLocation.length > 0) {
    const bounds = membersWithLocation.map(m => [m.latitude, m.longitude]);
    if (userLocation) bounds.push([userLocation.latitude, userLocation.longitude]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
  }
}

function addFamilyMarkers(membersWithLocation, userLocation) {
  // Clear existing markers
  markers.forEach(m => m.remove());
  markers = [];

  membersWithLocation.forEach(member => {
    const initials = getInitials(member.name);
    const color = getAvatarColor(member.name);
    const distance = calculateDistanceToMember(
      userLocation?.latitude, userLocation?.longitude,
      member.latitude, member.longitude
    );
    const distText = distance != null ? formatDistance(distance).replace(' away', '') : '';

    const icon = L.divIcon({
      className: 'family-marker',
      html: `
        <div class="family-marker-inner" data-member-id="${member.id}">
          <div class="family-marker-avatar">
            ${member.profile_image
              ? `<img src="${member.profile_image}" alt="${member.name}">`
              : `<div class="initials-avatar" style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; font-size: 16px;">${initials}</div>`
            }
          </div>
          <span class="family-marker-status"></span>
          <div class="family-marker-label">${member.name.split(' ')[0]}${distText ? ' • ' + distText : ''}</div>
        </div>
      `,
      iconSize: [44, 66],
      iconAnchor: [22, 66],
    });

    const marker = L.marker([member.latitude, member.longitude], { icon })
      .addTo(map)
      .on('click', () => showMemberSheet(member, userLocation));

    markers.push(marker);
  });
}

function showMemberSheet(member, userLocation) {
  const distance = calculateDistanceToMember(
    userLocation?.latitude, userLocation?.longitude,
    member.latitude, member.longitude
  );
  const distanceText = distance != null ? formatDistance(distance) : 'Distance unavailable';
  const avatar = avatarHTML(member, 52, 'full');

  const content = `
    <div class="flex flex-col gap-space-md">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-space-sm">
          <div class="relative">
            <div class="w-[52px] h-[52px] rounded-full p-0.5 bg-surface-container shadow">
              ${avatar}
            </div>
            <span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10b981] ring-2 ring-surface-container-lowest"></span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <h2 class="font-headline-md text-headline-md text-on-surface">${member.name}</h2>
              <p class="font-body-sm text-[12px] text-on-surface-variant truncate max-w-[120px] mt-0.5">${member.description || ''}</p>
            </div>
            <div class="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm mt-0.5">
              <span class="material-symbols-outlined text-[15px] text-primary-container">location_on</span>
              <span class="truncate">${member.location_name || 'Unknown'} • ${distanceText}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-space-xs items-center">
        <button class="col-span-8 flex items-center justify-center gap-2 h-12 px-space-md rounded-2xl bg-primary-container text-on-primary font-headline-md text-headline-md shadow hover:brightness-105 active:scale-[0.99] transition-all" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${member.latitude},${member.longitude}', '_blank')">
          <span class="material-symbols-outlined text-[20px]">turn_right</span>
          <span>Directions</span>
        </button>
        <button class="col-span-4 flex items-center justify-center gap-1.5 h-12 px-space-sm rounded-2xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors" onclick="window.location.hash='/profile/${member.id}'">
          <span class="material-symbols-outlined text-[18px]">person</span>
          <span>Profile</span>
        </button>
      </div>

      <div class="flex items-center justify-between gap-space-xs pt-1">
        <button class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors" onclick="window.location.href='tel:${member.phone_number}'">
          <span class="material-symbols-outlined text-[18px] text-primary-container">call</span>
          <span>Call</span>
        </button>
        <button class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors" onclick="window.location.href='mailto:${member.email}'">
          <span class="material-symbols-outlined text-[18px] text-primary-container">mail</span>
          <span>Email</span>
        </button>
        <button class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors" onclick="navigator.share ? navigator.share({title: '${member.name}', text: '${member.name} Location', url: 'https://www.google.com/maps?q=${member.latitude},${member.longitude}'}) : null">
          <span class="material-symbols-outlined text-[18px] text-secondary">share_location</span>
          <span>Share</span>
        </button>
      </div>
    </div>
  `;

  showBottomSheet(content);
}

function setupMapEvents(allMembers, membersWithLocation, userLocation) {
  // Zoom controls
  document.getElementById('map-zoom-in')?.addEventListener('click', () => map?.zoomIn());
  document.getElementById('map-zoom-out')?.addEventListener('click', () => map?.zoomOut());

  // My location
  document.getElementById('map-my-location')?.addEventListener('click', async () => {
    try {
      const pos = await LocationService.getCurrentPosition();
      if (map) {
        map.setView([pos.latitude, pos.longitude], 14, { animate: true });
        if (userMarker) userMarker.setLatLng([pos.latitude, pos.longitude]);
        else {
          const icon = L.divIcon({
            className: 'current-location-marker',
            html: '<div class="current-location-dot"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          userMarker = L.marker([pos.latitude, pos.longitude], { icon }).addTo(map);
        }
        userLocation = pos;
      }
    } catch (err) {
      const { showSnackbar } = await import('../components/snackbar.js');
      showSnackbar(err.message, 'error');
    }
  });

  // Search
  const searchInput = document.getElementById('map-search-input');
  const clearBtn = document.getElementById('map-clear-search');

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    addFamilyMarkers(membersWithLocation, userLocation);
  });

  searchInput?.addEventListener('input', debounce((e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      addFamilyMarkers(membersWithLocation, userLocation);
      return;
    }
    const filtered = membersWithLocation.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.location_name || '').toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
    addFamilyMarkers(filtered, userLocation);
  }, 300));

  // Filter chips
  document.getElementById('map-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.map-filter-chip');
    if (!chip) return;

    const filter = chip.dataset.filter;
    activeFilter = filter;

    // Update chip styles
    document.querySelectorAll('.map-filter-chip').forEach(c => {
      c.className = c.className.replace('bg-primary-container text-on-primary', 'bg-surface-container-lowest/90 text-on-surface');
    });
    chip.className = chip.className.replace('bg-surface-container-lowest/90 text-on-surface', 'bg-primary-container text-on-primary');

    let filtered = membersWithLocation;
    if (filter === 'Nearby' && userLocation) {
      filtered = membersWithLocation.filter(m => {
        const d = calculateDistanceToMember(userLocation.latitude, userLocation.longitude, m.latitude, m.longitude);
        return d != null && d <= 15;
      });
    } else if (filter !== 'All') {
      filtered = membersWithLocation.filter(m =>
        (m.description || '').toLowerCase().includes(filter.toLowerCase())
      );
    }

    addFamilyMarkers(filtered, userLocation);
    if (filtered.length > 0) {
      const bounds = filtered.map(m => [m.latitude, m.longitude]);
      map?.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }
  });
}
