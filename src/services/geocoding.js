const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Reverse geocode coordinates to a location name
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{display_name: string, address: object}>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const resp = await fetch(
      `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'CousinMap/1.0' } }
    );
    if (!resp.ok) throw new Error('Geocoding failed');
    const data = await resp.json();
    return {
      display_name: data.display_name || '',
      short_name: formatShortName(data.address),
      address: data.address || {},
    };
  } catch (error) {
    console.warn('Reverse geocode error:', error);
    return { display_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, short_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, address: {} };
  }
}

/**
 * Search for a location by text query
 * @param {string} query
 * @returns {Promise<Array<{display_name: string, lat: number, lon: number}>>}
 */
export async function searchLocation(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const resp = await fetch(
      `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'CousinMap/1.0' } }
    );
    if (!resp.ok) throw new Error('Search failed');
    const data = await resp.json();
    return data.map(item => ({
      display_name: item.display_name,
      short_name: formatShortName(item.address),
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      address: item.address,
    }));
  } catch (error) {
    console.warn('Location search error:', error);
    return [];
  }
}

function formatShortName(address) {
  if (!address) return '';
  const parts = [];
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  if (address.state) {
    parts.push(address.state);
  }
  if (parts.length === 0 && address.county) {
    parts.push(address.county);
    if (address.state) parts.push(address.state);
  }
  return parts.join(', ') || address.country || '';
}
