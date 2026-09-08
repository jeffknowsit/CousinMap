import FamilyRepository from '../db/repository.js';
import { showSnackbar } from '../components/snackbar.js';
import LocationService from '../services/location.js';
import { reverseGeocode, searchLocation } from '../services/geocoding.js';
import { isValidLatitude, isValidLongitude, debounce, formatLocationSource, getSourceIcon, formatDateTime } from '../utils/helpers.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let pickerMap = null;

export default async function UpdateLocationScreen(container, params) {
  const id = params.id;
  const member = await FamilyRepository.getById(id);
  if (!member) {
    container.innerHTML = '<div class="flex items-center justify-center min-h-screen"><p>Member not found.</p></div>';
    return;
  }

  const hasOldLocation = member.latitude != null && member.longitude != null;
  let newLocation = null;

  container.innerHTML = `
    <main class="flex-1 flex flex-col relative w-full pb-8 bg-surface screen-enter">
      <div class="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl px-screen-edge-padding pt-[max(env(safe-area-inset-top,0px),0.5rem)]">
        <div class="flex items-center justify-between h-14">
          <button class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant transition-transform active:scale-95 text-on-surface" onclick="history.back()">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <span class="font-headline-md text-headline-md text-on-surface">Update Location</span>
          <div class="w-10"></div>
        </div>
      </div>

      <div class="flex flex-col px-screen-edge-padding space-y-space-lg">
        <!-- Member Info -->
        <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
          <div class="flex items-center gap-space-sm">
            <div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-headline-md text-headline-md">${member.name.charAt(0)}</div>
            <div>
              <h2 class="font-headline-md text-headline-md text-on-surface">${member.name}</h2>
              <p class="font-body-sm text-body-sm text-on-surface-variant">${member.relationship}</p>
            </div>
          </div>
        </div>

        <!-- Current Location -->
        ${hasOldLocation ? `
          <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
            <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-space-xs">Current Location</h3>
            <div class="flex items-start gap-space-xs">
              <span class="material-symbols-outlined text-primary text-[20px] mt-0.5">location_on</span>
              <div>
                <p class="font-body-md text-body-md text-on-surface">${member.location_name || 'Unknown'}</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  ${formatLocationSource(member.location_source)} • Updated ${formatDateTime(member.location_updated_at)}
                </p>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- New Location Preview -->
        <div id="new-location-preview" class="hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border-2 border-primary-container/30">
          <h3 class="font-label-md text-label-md text-primary uppercase tracking-wider mb-space-xs flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">arrow_forward</span> New Location
          </h3>
          <div class="flex items-start gap-space-xs">
            <span class="material-symbols-outlined text-primary-container text-[20px] mt-0.5" style="font-variation-settings:'FILL' 1;">location_on</span>
            <div>
              <p class="font-body-md text-body-md text-on-surface" id="new-loc-name">--</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5" id="new-loc-coords">--</p>
            </div>
          </div>
        </div>

        <!-- Location Methods -->
        <div class="space-y-space-sm">
          <h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Choose Method</h3>

          <button class="w-full text-left p-space-md rounded-xl bg-primary-fixed/25 hover:bg-primary-fixed/40 transition-all flex items-start gap-space-sm active:scale-[0.99]" id="ul-phone-gps" type="button">
            <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">my_location</span>
            </div>
            <div class="flex-1">
              <span class="font-label-lg text-label-lg text-on-surface">Use Phone Location</span>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Get current device GPS coordinates</p>
            </div>
          </button>

          <button class="w-full text-left p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-start gap-space-sm active:scale-[0.99]" id="ul-select-map" type="button">
            <div class="w-10 h-10 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">explore</span>
            </div>
            <div class="flex-1">
              <span class="font-label-lg text-label-lg text-on-surface">Select on Map</span>
              <p class="font-body-sm text-body-sm text-outline mt-0.5">Drop a pin on the interactive map</p>
            </div>
          </button>

          <button class="w-full text-left p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-start gap-space-sm active:scale-[0.99]" id="ul-search-loc" type="button">
            <div class="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">search</span>
            </div>
            <div class="flex-1">
              <span class="font-label-lg text-label-lg text-on-surface">Search Location</span>
              <p class="font-body-sm text-body-sm text-outline mt-0.5">Search by address or landmark</p>
            </div>
          </button>

          <!-- Manual coords -->
          <div class="bg-surface-container-low rounded-xl p-space-md">
            <p class="font-label-md text-label-md text-on-surface-variant mb-2">Enter Coordinates Manually</p>
            <div class="grid grid-cols-2 gap-space-sm">
              <input class="h-10 px-3 bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container" id="ul-lat" placeholder="Latitude" type="text">
              <input class="h-10 px-3 bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container" id="ul-lng" placeholder="Longitude" type="text">
            </div>
            <button class="mt-2 w-full h-10 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" id="ul-apply-coords" type="button">Apply</button>
          </div>
        </div>

        <!-- Save Button -->
        <button class="w-full h-14 rounded-2xl bg-primary-container text-on-primary-container font-headline-md text-headline-md shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50" id="ul-save-btn" type="button" disabled>
          <span class="material-symbols-outlined text-[22px]">check_circle</span>
          Update Location
        </button>
      </div>

      <!-- Map Picker Modal -->
      <div id="ul-map-modal" class="fixed inset-0 z-[100] bg-surface hidden flex-col">
        <div class="absolute top-0 left-0 right-0 z-[1001] flex items-center gap-space-xs p-space-md pt-[max(env(safe-area-inset-top,0px),0.75rem)]">
          <button class="w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md flex items-center justify-center" id="ul-close-map">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <span class="font-headline-md text-headline-md bg-surface-container-lowest/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md">Select Location</span>
        </div>
        <div id="ul-picker-map" class="w-full h-full"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] pointer-events-none">
          <div class="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center">
            <div class="w-3 h-3 rounded-full bg-primary-container shadow-lg"></div>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 z-[1001] p-space-md pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
          <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-xl">
            <p class="font-body-sm text-body-sm text-on-surface-variant mb-2" id="ul-picker-coords">Move map to select</p>
            <button class="w-full h-12 rounded-2xl bg-primary-container text-on-primary-container font-label-lg text-label-lg font-semibold shadow-md" id="ul-confirm-map">Confirm This Location</button>
          </div>
        </div>
      </div>

      <!-- Search Modal -->
      <div id="ul-search-modal" class="fixed inset-0 z-[100] bg-surface hidden flex-col">
        <div class="flex items-center gap-space-xs p-space-md pt-[max(env(safe-area-inset-top,0px),0.75rem)]">
          <button class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center" id="ul-close-search">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div class="flex-1 relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input class="w-full h-12 pl-10 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container" id="ul-search-input" placeholder="Search location..." type="text">
          </div>
        </div>
        <div class="flex-1 overflow-y-auto px-space-md" id="ul-search-results"></div>
      </div>
    </main>
  `;

  // Event handlers
  function setNewLocation(loc) {
    newLocation = loc;
    const preview = document.getElementById('new-location-preview');
    preview?.classList.remove('hidden');
    document.getElementById('new-loc-name').textContent = loc.location_name || 'Selected Location';
    document.getElementById('new-loc-coords').textContent = `Lat: ${loc.latitude.toFixed(6)}, Lng: ${loc.longitude.toFixed(6)} • ${formatLocationSource(loc.location_source)}`;
    document.getElementById('ul-save-btn').disabled = false;
  }

  // GPS
  document.getElementById('ul-phone-gps')?.addEventListener('click', async () => {
    try {
      showSnackbar('Getting GPS location...', 'info', 2000);
      const pos = await LocationService.getCurrentPosition();
      const geo = await reverseGeocode(pos.latitude, pos.longitude);
      setNewLocation({ latitude: pos.latitude, longitude: pos.longitude, location_name: geo.short_name || geo.display_name, location_accuracy: pos.accuracy, location_source: 'GPS' });
      showSnackbar('GPS location found!', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  });

  // Map picker
  document.getElementById('ul-select-map')?.addEventListener('click', () => {
    document.getElementById('ul-map-modal')?.classList.remove('hidden');
    document.getElementById('ul-map-modal')?.classList.add('flex');
    setTimeout(() => {
      if (pickerMap) { pickerMap.remove(); pickerMap = null; }
      const el = document.getElementById('ul-picker-map');
      if (!el) return;
      const center = member.latitude ? [member.latitude, member.longitude] : [10.5, 76.3];
      pickerMap = L.map(el, { center, zoom: 12, zoomControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(pickerMap);
      pickerMap.on('moveend', () => {
        const c = pickerMap.getCenter();
        document.getElementById('ul-picker-coords').textContent = `Lat: ${c.lat.toFixed(6)}, Lng: ${c.lng.toFixed(6)}`;
      });
    }, 100);
  });

  document.getElementById('ul-close-map')?.addEventListener('click', () => {
    document.getElementById('ul-map-modal')?.classList.add('hidden');
    if (pickerMap) { pickerMap.remove(); pickerMap = null; }
  });

  document.getElementById('ul-confirm-map')?.addEventListener('click', async () => {
    if (!pickerMap) return;
    const c = pickerMap.getCenter();
    const geo = await reverseGeocode(c.lat, c.lng);
    setNewLocation({ latitude: c.lat, longitude: c.lng, location_name: geo.short_name || geo.display_name, location_accuracy: null, location_source: 'MAP_SELECTION' });
    document.getElementById('ul-map-modal')?.classList.add('hidden');
    if (pickerMap) { pickerMap.remove(); pickerMap = null; }
    showSnackbar('Location selected!', 'success');
  });

  // Search
  document.getElementById('ul-search-loc')?.addEventListener('click', () => {
    document.getElementById('ul-search-modal')?.classList.remove('hidden');
    document.getElementById('ul-search-modal')?.classList.add('flex');
    document.getElementById('ul-search-input')?.focus();
  });

  document.getElementById('ul-close-search')?.addEventListener('click', () => {
    document.getElementById('ul-search-modal')?.classList.add('hidden');
  });

  document.getElementById('ul-search-input')?.addEventListener('input', debounce(async (e) => {
    const q = e.target.value.trim();
    const el = document.getElementById('ul-search-results');
    if (!el || q.length < 2) { if (el) el.innerHTML = '<p class="text-center py-8 text-outline">Type to search...</p>'; return; }
    el.innerHTML = '<div class="flex justify-center py-8"><span class="material-symbols-outlined text-primary animate-spin">progress_activity</span></div>';
    const results = await searchLocation(q);
    if (results.length === 0) { el.innerHTML = '<p class="text-center py-8 text-outline">No results found</p>'; return; }
    el.innerHTML = results.map(r => `
      <button class="ul-search-item w-full text-left p-space-md rounded-xl hover:bg-surface-container-low flex items-start gap-space-sm" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${r.short_name || r.display_name}">
        <span class="material-symbols-outlined text-primary text-[20px] mt-1">location_on</span>
        <div><p class="font-label-lg text-label-lg text-on-surface">${r.short_name}</p><p class="font-body-sm text-body-sm text-outline truncate">${r.display_name}</p></div>
      </button>
    `).join('');
    el.querySelectorAll('.ul-search-item').forEach(item => {
      item.addEventListener('click', () => {
        setNewLocation({ latitude: parseFloat(item.dataset.lat), longitude: parseFloat(item.dataset.lng), location_name: item.dataset.name, location_accuracy: null, location_source: 'SEARCH' });
        document.getElementById('ul-search-modal')?.classList.add('hidden');
        showSnackbar('Location selected!', 'success');
      });
    });
  }, 500));

  // Manual coordinates
  document.getElementById('ul-apply-coords')?.addEventListener('click', async () => {
    const lat = document.getElementById('ul-lat')?.value;
    const lng = document.getElementById('ul-lng')?.value;
    if (!isValidLatitude(lat)) { showSnackbar('Invalid latitude (-90 to 90)', 'error'); return; }
    if (!isValidLongitude(lng)) { showSnackbar('Invalid longitude (-180 to 180)', 'error'); return; }
    const geo = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    setNewLocation({ latitude: parseFloat(lat), longitude: parseFloat(lng), location_name: geo.short_name || geo.display_name, location_accuracy: null, location_source: 'MANUAL' });
    showSnackbar('Coordinates applied!', 'success');
  });

  // Save
  document.getElementById('ul-save-btn')?.addEventListener('click', async () => {
    if (!newLocation) return;
    const btn = document.getElementById('ul-save-btn');
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[22px]">progress_activity</span><span>Saving...</span>';
    btn.disabled = true;
    try {
      await FamilyRepository.updateLocation(member.id, newLocation);
      showSnackbar('Location updated!', 'success');
      setTimeout(() => { window.location.hash = `/profile/${member.id}`; }, 600);
    } catch (err) {
      showSnackbar('Failed to update location.', 'error');
      btn.innerHTML = '<span class="material-symbols-outlined text-[22px]">check_circle</span>Update Location';
      btn.disabled = false;
    }
  });

  return () => { if (pickerMap) { pickerMap.remove(); pickerMap = null; } };
}
