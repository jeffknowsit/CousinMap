import { renderBottomNav } from '../components/bottom-nav.js';
import { showSnackbar } from '../components/snackbar.js';
import FamilyRepository from '../db/repository.js';
import LocationService from '../services/location.js';
import { reverseGeocode, searchLocation } from '../services/geocoding.js';
import { isValidLatitude, isValidLongitude, debounce, compressImage } from '../utils/helpers.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { storage } from '../firebase.js';


let locationData = {
  latitude: null,
  longitude: null,
  location_name: '',
  location_accuracy: null,
  location_source: null,
};

let pickerMap = null;
let pickerMarker = null;

let profileImageFile = null;
let profileImageUrl = null;

export default async function AddMemberScreen(container) {
  const memberCount = await FamilyRepository.getCount();
  locationData = { latitude: null, longitude: null, location_name: '', location_accuracy: null, location_source: null };
  profileImageFile = null;
  profileImageUrl = null;

  container.innerHTML = `
    ${renderAddMemberHTML(memberCount)}
    ${renderBottomNav('family', memberCount)}
  `;

  setupAddMemberEvents(container);

  return () => {
    if (pickerMap) { pickerMap.remove(); pickerMap = null; }
    pickerMarker = null;
  };
}

function renderAddMemberHTML(memberCount) {
  return `
    <main class="flex-1 flex flex-col relative w-full pt-0 pb-28 bg-surface screen-enter">
      <div class="flex flex-col w-full px-screen-edge-padding pb-8">
        <!-- Top Bar -->
        <div class="flex items-center justify-between py-space-sm pt-[max(env(safe-area-inset-top,0px),0.5rem)] mt-2">
          <button class="flex items-center justify-center w-11 h-11 rounded-full bg-surface-container hover:bg-surface-variant transition-transform active:scale-95 text-on-surface" onclick="history.back()">
            <span class="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight">Add Family Member</h1>
          <div class="w-11 h-11 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-[22px]" style="font-variation-settings: 'FILL' 1;">family_restroom</span>
          </div>
        </div>

        <!-- Photo Upload -->
        <div class="flex flex-col items-center justify-center my-space-md">
          <input type="file" accept="image/*" class="hidden" id="photo-input">
          <div class="relative group cursor-pointer" id="photo-upload-area" onclick="document.getElementById('photo-input').click()">
            <div class="w-24 h-24 rounded-full bg-surface-container flex flex-col items-center justify-center shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-surface-variant" id="photo-preview-container">
              <svg class="absolute inset-0 w-full h-full pointer-events-none stroke-outline-variant" fill="none" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="46" stroke-dasharray="6 6" stroke-linecap="round" stroke-width="2"></circle>
              </svg>
              <span class="material-symbols-outlined text-outline text-[32px] mb-1" id="photo-icon">person_add</span>
              <span class="font-label-sm text-[10px] text-on-surface-variant text-center px-2 leading-tight" id="photo-text">Add Photo</span>
            </div>
          </div>
          <span class="font-label-sm text-label-sm text-outline mt-2">Optional portrait or avatar</span>
        </div>



        <!-- Personal Info Form -->
        <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-1.5" for="full-name">
              Full Name <span class="text-error font-semibold">*</span>
            </label>
            <div class="relative flex items-center">
              <span class="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">badge</span>
              <input class="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors" id="full-name" placeholder="e.g. Jeff Joseph" type="text">
            </div>
          </div>

          <div class="space-y-1">
            <label class="block font-label-md text-label-md text-on-surface mb-1.5" for="description">
              Description <span class="text-error font-semibold">*</span>
            </label>
            <div class="relative">
              <textarea class="w-full h-24 p-3 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors resize-none" id="description" placeholder="Short description about this person" required></textarea>
            </div>
          </div>

          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-1.5" for="phone">Phone Number</label>
            <div class="flex gap-space-xs">
              <div class="h-12 px-3 bg-surface-container-low rounded-xl flex items-center gap-1">
                <span class="font-body-md text-body-md text-on-surface font-semibold">🇮🇳 +91</span>
              </div>
              <div class="relative flex-1 flex items-center">
                <input class="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors" id="phone" placeholder="98765 43210" type="tel">
              </div>
            </div>
          </div>



          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-1.5" for="email">Email Address</label>
            <div class="relative flex items-center">
              <span class="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">alternate_email</span>
              <input class="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors" id="email" placeholder="jeff.joseph@example.com" type="email">
            </div>
          </div>
        </div>

        <!-- Location Section -->
        <div class="mt-space-lg bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-[18px]">near_me</span>
                </div>
                <h2 class="font-headline-md text-headline-md text-on-surface">Location</h2>
              </div>
              <p class="font-body-sm text-body-sm text-outline mt-1">Choose how you want to pinpoint their whereabouts</p>
            </div>
          </div>

          <div class="space-y-space-sm pt-space-xs">
            <!-- Use Phone Location -->
            <button class="w-full text-left p-space-md rounded-xl bg-primary-fixed/25 hover:bg-primary-fixed/40 transition-all flex items-start gap-space-sm active:scale-[0.99] relative overflow-hidden" id="btn-phone-gps" type="button">
              <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <span class="material-symbols-outlined text-[22px]">my_location</span>
              </div>
              <div class="flex-1 min-w-0 pr-2">
                <div class="flex items-center gap-2">
                  <span class="font-label-lg text-label-lg text-on-surface">Use Phone Location</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-label-sm font-semibold bg-primary-container text-on-primary">Most Accurate</span>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Auto-fetch live coordinates from this device</p>
              </div>
              <span class="material-symbols-outlined text-primary-container text-[20px] self-center">chevron_right</span>
            </button>

            <!-- Select on Map -->
            <button class="w-full text-left p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-start gap-space-sm active:scale-[0.99]" id="btn-select-map" type="button">
              <div class="w-10 h-10 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <span class="material-symbols-outlined text-[22px]">explore</span>
              </div>
              <div class="flex-1 min-w-0 pr-2">
                <span class="font-label-lg text-label-lg text-on-surface block">Select on Map</span>
                <p class="font-body-sm text-body-sm text-outline mt-0.5">Drop a pin manually on the interactive map</p>
              </div>
              <span class="material-symbols-outlined text-outline text-[20px] self-center">chevron_right</span>
            </button>

            <!-- Search Location -->
            <button class="w-full text-left p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-start gap-space-sm active:scale-[0.99]" id="btn-search-loc" type="button">
              <div class="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <span class="material-symbols-outlined text-[22px]">search</span>
              </div>
              <div class="flex-1 min-w-0 pr-2">
                <span class="font-label-lg text-label-lg text-on-surface block">Search Location</span>
                <p class="font-body-sm text-body-sm text-outline mt-0.5">Search by town, landmark, or address</p>
              </div>
              <span class="material-symbols-outlined text-outline text-[20px] self-center">chevron_right</span>
            </button>
          </div>

          <!-- Enter Coordinates Manually -->
          <div class="pt-space-xs">
            <button class="flex items-center justify-between w-full py-2 text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors" id="toggle-coords" type="button">
              <span class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">tune</span>
                Enter Coordinates Manually
              </span>
              <span class="material-symbols-outlined text-[18px] transition-transform duration-200" id="toggle-chevron">expand_more</span>
            </button>
            <div class="hidden gap-space-sm pt-space-xs" id="coords-panel" style="display:none;">
              <div class="grid grid-cols-2 gap-space-sm">
                <div>
                  <label class="block font-label-sm text-label-sm text-outline mb-1" for="manual-lat">Latitude (-90 to 90)</label>
                  <input class="w-full h-11 px-3 bg-surface-container-low rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors" id="manual-lat" placeholder="10.527600" type="text">
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-outline mb-1" for="manual-lng">Longitude (-180 to 180)</label>
                  <input class="w-full h-11 px-3 bg-surface-container-low rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors" id="manual-lng" placeholder="76.214400" type="text">
                </div>
              </div>
              <button class="mt-2 w-full h-10 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors" id="apply-coords" type="button">Apply Coordinates</button>
            </div>
          </div>

          <!-- Location Preview -->
          <div id="location-preview" class="hidden mt-space-md pt-space-sm">
            <div class="rounded-xl bg-surface-container p-space-md relative overflow-hidden shadow-sm">
              <div class="flex items-start justify-between gap-space-sm">
                <div class="flex items-start gap-space-xs min-w-0">
                  <span class="material-symbols-outlined text-primary-container text-[24px] shrink-0 mt-0.5" style="font-variation-settings: 'FILL' 1;">location_on</span>
                  <div class="min-w-0">
                    <p class="font-headline-md text-headline-md text-on-surface truncate" id="preview-name">--</p>
                    <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5" id="preview-coords">--</p>
                    <div class="flex items-center gap-1.5 mt-2">
                      <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                      <span class="font-label-sm text-label-sm text-primary font-medium" id="preview-source">--</span>
                    </div>
                  </div>
                </div>
                <button class="shrink-0 text-primary hover:text-primary-container font-label-md text-label-md transition-colors py-1 px-2 rounded-lg bg-surface-container-lowest active:scale-95 shadow-sm" id="clear-location" type="button">Change</button>
              </div>
              <div id="preview-minimap" class="mt-3 w-full h-24 rounded-lg overflow-hidden relative shadow-inner bg-surface-container-low"></div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="mt-space-xl pt-space-xs sticky bottom-4 z-20">
          <button class="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline-md text-headline-md shadow-xl flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all" id="save-member-btn" type="button">
            <span class="material-symbols-outlined text-[22px]">check_circle</span>
            <span>Save Family Member</span>
          </button>
        </div>
      </div>

      <!-- Search Location Modal -->
      <div id="search-location-modal" class="fixed inset-0 z-[100] bg-surface hidden flex-col">
        <div class="flex items-center gap-space-xs p-space-md pt-[max(env(safe-area-inset-top,0px),0.75rem)]">
          <button class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center" id="close-search-modal" type="button">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div class="flex-1 relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input class="w-full h-12 pl-10 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container" id="search-loc-input" placeholder="Search city, landmark, address..." type="text" autofocus>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto px-space-md" id="search-results"></div>
      </div>

      <!-- Map Picker Modal -->
      <div id="map-picker-modal" class="fixed inset-0 z-[100] bg-surface hidden flex-col">
        <div class="absolute top-0 left-0 right-0 z-[1001] flex items-center gap-space-xs p-space-md pt-[max(env(safe-area-inset-top,0px),0.75rem)]">
          <button class="w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md flex items-center justify-center" id="close-map-picker" type="button">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <span class="font-headline-md text-headline-md text-on-surface bg-surface-container-lowest/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md">Select Location</span>
        </div>
        <div id="picker-map-container" class="w-full h-full"></div>
        <!-- Center crosshair -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] pointer-events-none">
          <div class="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center">
            <div class="w-3 h-3 rounded-full bg-primary-container shadow-lg"></div>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 z-[1001] p-space-md pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
          <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xl">
            <p class="font-body-sm text-body-sm text-on-surface-variant mb-2" id="picker-coords">Move the map to select a location</p>
            <button class="w-full h-12 rounded-2xl bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold shadow-md active:scale-[0.98] transition-all" id="confirm-map-pick" type="button">
              <span class="material-symbols-outlined text-[18px] align-middle mr-1">check</span>
              Confirm This Location
            </button>
          </div>
        </div>
      </div>

      <!-- GPS Location Modal -->
      <div id="gps-modal" class="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm hidden flex items-center justify-center">
        <div class="bg-surface-container-lowest rounded-2xl p-space-xl shadow-2xl mx-space-md max-w-[360px] w-full">
          <div id="gps-content" class="flex flex-col items-center text-center gap-space-md">
            <!-- Will be populated dynamically -->
          </div>
        </div>
      </div>
    </main>
  `;
}

function setupAddMemberEvents(container) {
  // Phone number input formatting
  const phoneInput = document.getElementById('phone');
  
  phoneInput?.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    e.target.value = val;
  });

  // Photo Upload Preview
  const photoInput = document.getElementById('photo-input');
  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      profileImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewContainer = document.getElementById('photo-preview-container');
        if (previewContainer) {
          previewContainer.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // Toggle coordinates panel
  const toggleBtn = document.getElementById('toggle-coords');
  const coordsPanel = document.getElementById('coords-panel');
  const chevron = document.getElementById('toggle-chevron');

  toggleBtn?.addEventListener('click', () => {
    const isHidden = coordsPanel.style.display === 'none';
    coordsPanel.style.display = isHidden ? 'block' : 'none';
    chevron?.classList.toggle('rotate-180', isHidden);
  });

  // Apply manual coordinates
  document.getElementById('apply-coords')?.addEventListener('click', async () => {
    const lat = document.getElementById('manual-lat')?.value;
    const lng = document.getElementById('manual-lng')?.value;

    if (!isValidLatitude(lat)) { showSnackbar('Invalid latitude. Must be between -90 and 90.', 'error'); return; }
    if (!isValidLongitude(lng)) { showSnackbar('Invalid longitude. Must be between -180 and 180.', 'error'); return; }

    const geo = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    locationData = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      location_name: geo.short_name || geo.display_name,
      location_accuracy: null,
      location_source: 'MANUAL',
    };
    updateLocationPreview();
    showSnackbar('Coordinates applied!', 'success');
  });

  // Clear location
  document.getElementById('clear-location')?.addEventListener('click', () => {
    locationData = { latitude: null, longitude: null, location_name: '', location_accuracy: null, location_source: null };
    document.getElementById('location-preview')?.classList.add('hidden');
  });

  // GPS Location
  document.getElementById('btn-phone-gps')?.addEventListener('click', () => getGPSLocation());

  // Map Picker
  document.getElementById('btn-select-map')?.addEventListener('click', () => openMapPicker());
  document.getElementById('close-map-picker')?.addEventListener('click', () => closeMapPicker());
  document.getElementById('confirm-map-pick')?.addEventListener('click', () => confirmMapPick());

  // Search Location
  document.getElementById('btn-search-loc')?.addEventListener('click', () => openSearchModal());
  document.getElementById('close-search-modal')?.addEventListener('click', () => closeSearchModal());
  setupSearchInput();

  // Save
  document.getElementById('save-member-btn')?.addEventListener('click', () => saveMember());
}

async function getGPSLocation() {
  const modal = document.getElementById('gps-modal');
  const content = document.getElementById('gps-content');
  if (!modal || !content) return;

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // Check permission first
  const perm = await LocationService.checkPermission();

  if (perm === 'denied') {
    content.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
        <span class="material-symbols-outlined text-on-error-container text-[32px]">location_disabled</span>
      </div>
      <h3 class="font-headline-md text-headline-md text-on-surface">Location Permission Denied</h3>
      <p class="font-body-md text-body-md text-on-surface-variant">Please enable location access in your browser settings to use GPS features.</p>
      <button class="w-full h-12 rounded-2xl bg-surface-container text-on-surface font-label-lg text-label-lg" onclick="document.getElementById('gps-modal').classList.add('hidden'); document.getElementById('gps-modal').classList.remove('flex');">Close</button>
    `;
    return;
  }

  // Show loading
  content.innerHTML = `
    <div class="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
      <span class="material-symbols-outlined text-primary text-[32px] animate-spin">my_location</span>
    </div>
    <h3 class="font-headline-md text-headline-md text-on-surface">Finding Location...</h3>
    <p class="font-body-md text-body-md text-on-surface-variant">Please wait while we get your current position.</p>
  `;

  try {
    const pos = await LocationService.getCurrentPosition();
    const geo = await reverseGeocode(pos.latitude, pos.longitude);

    content.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-[32px]">check_circle</span>
      </div>
      <h3 class="font-headline-md text-headline-md text-on-surface">Location Found</h3>
      <p class="font-body-md text-body-md text-on-surface-variant">📍 ${geo.short_name || geo.display_name}</p>
      <div class="w-full space-y-2 text-left">
        <div class="flex justify-between font-body-sm text-body-sm">
          <span class="text-on-surface-variant">Latitude</span>
          <span class="text-on-surface font-semibold">${pos.latitude.toFixed(6)}</span>
        </div>
        <div class="flex justify-between font-body-sm text-body-sm">
          <span class="text-on-surface-variant">Longitude</span>
          <span class="text-on-surface font-semibold">${pos.longitude.toFixed(6)}</span>
        </div>
        <div class="flex justify-between font-body-sm text-body-sm">
          <span class="text-on-surface-variant">Accuracy</span>
          <span class="text-on-surface font-semibold">${pos.accuracy} m</span>
        </div>
      </div>
      <button class="w-full h-12 rounded-2xl bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold shadow-md active:scale-[0.98] transition-all" id="use-gps-location">
        <span class="material-symbols-outlined text-[18px] align-middle mr-1">check</span>
        Use This Location
      </button>
      <button class="w-full h-10 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md" id="cancel-gps">Cancel</button>
    `;

    document.getElementById('use-gps-location')?.addEventListener('click', () => {
      locationData = {
        latitude: pos.latitude,
        longitude: pos.longitude,
        location_name: geo.short_name || geo.display_name,
        location_accuracy: pos.accuracy,
        location_source: 'GPS',
      };
      updateLocationPreview();
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      showSnackbar('GPS location set!', 'success');
    });

    document.getElementById('cancel-gps')?.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });

  } catch (err) {
    content.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
        <span class="material-symbols-outlined text-on-error-container text-[32px]">gps_off</span>
      </div>
      <h3 class="font-headline-md text-headline-md text-on-surface">Location Unavailable</h3>
      <p class="font-body-md text-body-md text-on-surface-variant">${err.message}</p>
      <button class="w-full h-12 rounded-2xl bg-surface-container text-on-surface font-label-lg text-label-lg" onclick="document.getElementById('gps-modal').classList.add('hidden'); document.getElementById('gps-modal').classList.remove('flex');">Close</button>
    `;
  }
}

function openMapPicker() {
  const modal = document.getElementById('map-picker-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  setTimeout(() => {
    if (pickerMap) { pickerMap.remove(); pickerMap = null; }
    const mapEl = document.getElementById('picker-map-container');
    if (!mapEl) return;

    const center = locationData.latitude ? [locationData.latitude, locationData.longitude] : [10.5, 76.3];
    pickerMap = L.map(mapEl, { center, zoom: 12, zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 19 }).addTo(pickerMap);

    // Update coords on map move
    pickerMap.on('moveend', () => {
      const c = pickerMap.getCenter();
      const coordsEl = document.getElementById('picker-coords');
      if (coordsEl) coordsEl.textContent = `Lat: ${c.lat.toFixed(6)}, Lng: ${c.lng.toFixed(6)}`;
    });
  }, 100);
}

function closeMapPicker() {
  const modal = document.getElementById('map-picker-modal');
  modal?.classList.add('hidden');
  modal?.classList.remove('flex');
  if (pickerMap) { pickerMap.remove(); pickerMap = null; }
}

async function confirmMapPick() {
  if (!pickerMap) return;
  const center = pickerMap.getCenter();
  const geo = await reverseGeocode(center.lat, center.lng);

  locationData = {
    latitude: center.lat,
    longitude: center.lng,
    location_name: geo.short_name || geo.display_name,
    location_accuracy: null,
    location_source: 'MAP_SELECTION',
  };

  closeMapPicker();
  updateLocationPreview();
  showSnackbar('Map location selected!', 'success');
}

function openSearchModal() {
  const modal = document.getElementById('search-location-modal');
  modal?.classList.remove('hidden');
  modal?.classList.add('flex');
  document.getElementById('search-loc-input')?.focus();
}

function closeSearchModal() {
  const modal = document.getElementById('search-location-modal');
  modal?.classList.add('hidden');
  modal?.classList.remove('flex');
}

function setupSearchInput() {
  const input = document.getElementById('search-loc-input');
  const resultsEl = document.getElementById('search-results');

  input?.addEventListener('input', debounce(async (e) => {
    const q = e.target.value.trim();
    if (!resultsEl) return;

    if (q.length < 2) {
      resultsEl.innerHTML = '<p class="font-body-md text-body-md text-outline text-center py-space-xl">Type at least 2 characters to search...</p>';
      return;
    }

    resultsEl.innerHTML = '<div class="flex justify-center py-space-xl"><span class="material-symbols-outlined text-primary text-[28px] animate-spin">progress_activity</span></div>';

    const results = await searchLocation(q);

    if (results.length === 0) {
      resultsEl.innerHTML = `
        <div class="flex flex-col items-center py-space-xl text-center">
          <span class="material-symbols-outlined text-outline text-[32px] mb-2">search_off</span>
          <p class="font-body-md text-body-md text-on-surface-variant">No results found for "${q}"</p>
        </div>
      `;
      return;
    }

    resultsEl.innerHTML = results.map(r => `
      <button class="search-result-item w-full text-left p-space-md rounded-xl hover:bg-surface-container-low transition-colors flex items-start gap-space-sm" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${r.short_name || r.display_name}" type="button">
        <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
          <span class="material-symbols-outlined text-primary text-[20px]">location_on</span>
        </div>
        <div class="min-w-0">
          <p class="font-label-lg text-label-lg text-on-surface truncate">${r.short_name || 'Unknown Location'}</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant truncate">${r.display_name}</p>
        </div>
      </button>
    `).join('');

    // Attach click handlers
    resultsEl.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        locationData = {
          latitude: parseFloat(item.dataset.lat),
          longitude: parseFloat(item.dataset.lng),
          location_name: item.dataset.name,
          location_accuracy: null,
          location_source: 'SEARCH',
        };
        closeSearchModal();
        updateLocationPreview();
        showSnackbar('Location selected!', 'success');
      });
    });
  }, 500));
}

function updateLocationPreview() {
  const preview = document.getElementById('location-preview');
  if (!preview || locationData.latitude == null) return;

  preview.classList.remove('hidden');
  document.getElementById('preview-name').textContent = locationData.location_name || 'Selected Location';
  document.getElementById('preview-coords').textContent = `Latitude: ${locationData.latitude.toFixed(6)} • Longitude: ${locationData.longitude.toFixed(6)}`;

  const sourceLabel = locationData.location_source === 'GPS' ? `GPS Verified (Accuracy: ±${locationData.location_accuracy || '?'}m)` :
    locationData.location_source === 'MAP_SELECTION' ? 'Selected on Map' :
      locationData.location_source === 'SEARCH' ? 'Found via Search' : 'Manual Entry';
  document.getElementById('preview-source').textContent = sourceLabel;

  // Mini map
  const minimapEl = document.getElementById('preview-minimap');
  if (minimapEl) {
    minimapEl.innerHTML = '';
    const miniMap = L.map(minimapEl, {
      center: [locationData.latitude, locationData.longitude],
      zoom: 14,
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(miniMap);
    L.circleMarker([locationData.latitude, locationData.longitude], { radius: 8, color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.8 }).addTo(miniMap);
    setTimeout(() => miniMap.invalidateSize(), 100);
  }
}

async function saveMember() {
  const name = document.getElementById('full-name')?.value?.trim();
  const description = document.getElementById('description')?.value;
  const phone = document.getElementById('phone')?.value?.trim();
  const email = document.getElementById('email')?.value?.trim();

  if (!name) { showSnackbar('Please enter a name.', 'error'); return; }

  const saveBtn = document.getElementById('save-member-btn');
    if (saveBtn) {
      saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[22px]">progress_activity</span><span>Saving member...</span>';
      saveBtn.disabled = true;
    }

    try {
      if (profileImageFile) {
        if (saveBtn) {
          saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[22px]">progress_activity</span><span>Processing photo...</span>';
        }
        profileImageUrl = await compressImage(profileImageFile, 300, 300, 0.7);
        if (saveBtn) {
          saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[22px]">progress_activity</span><span>Saving member...</span>';
        }
      }
    const member = await FamilyRepository.add({
      name,
      description,
      phone_number: phone ? `+91${phone.replace(/\s/g, '')}` : '',
      whatsapp_link: phone && phone.replace(/\s/g, '').length >= 10 ? `https://wa.me/91${phone.replace(/\s/g, '').slice(-10)}` : '',
      email,
      address: locationData.location_name || '',
      location_name: locationData.location_name || '',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      location_accuracy: locationData.location_accuracy,
      location_source: locationData.location_source,
      profile_image: profileImageUrl,
    });

    if (saveBtn) {
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-[22px]">done_all</span><span>Member Added!</span>';
    }

    showSnackbar(`${name} added successfully!`, 'success');

    setTimeout(() => {
      window.location.hash = `/profile/${member.id}`;
    }, 800);

  } catch (err) {
    showSnackbar('Failed to save. Please try again.', 'error');
    if (saveBtn) {
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-[22px]">check_circle</span><span>Save Family Member</span>';
      saveBtn.disabled = false;
    }
  }
}
