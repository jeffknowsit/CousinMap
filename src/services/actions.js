import { getWhatsAppLink } from '../utils/helpers.js';

/**
 * Open Google Maps for directions to given coordinates
 */
export function openDirections(lat, lng, label = '') {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
}

/**
 * Open phone dialer with the given number
 */
export function callPhone(phoneNumber) {
  if (!phoneNumber) return;
  window.location.href = `tel:${phoneNumber}`;
}

/**
 * Open email client with the given email
 */
export function sendEmail(email) {
  if (!email) return;
  window.location.href = `mailto:${email}`;
}

/**
 * Open WhatsApp chat with the given number
 */
export function openWhatsApp(phoneNumber) {
  if (!phoneNumber) return;
  window.open(getWhatsAppLink(phoneNumber), '_blank');
}

/**
 * Share location via Web Share API (if available)
 */
export async function shareLocation(name, lat, lng) {
  const text = `${name}'s location: https://www.google.com/maps?q=${lat},${lng}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `${name}'s Location`, text, url: `https://www.google.com/maps?q=${lat},${lng}` });
      return true;
    } catch {
      return false;
    }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
