let deferredPrompt;
const installCallbacks = [];

export function initPWA() {
  // Listen for the install prompt event — preventDefault() suppresses
  // the browser's native mini-infobar on ALL pages so users can only
  // install via the "Install App" option in the More screen.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Notify all registered listeners
    installCallbacks.forEach(cb => cb(true));
  });

  // Handle app already installed
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installCallbacks.forEach(cb => cb(false));
  });
}

/** Register a callback to know when PWA is installable. */
export function onInstallAvailable(callback) {
  installCallbacks.push(callback);
  // Fire immediately if prompt is already available
  if (deferredPrompt) callback(true);
  // Return unsubscribe function
  return () => {
    const idx = installCallbacks.indexOf(callback);
    if (idx !== -1) installCallbacks.splice(idx, 1);
  };
}

/** Returns true if the PWA can be installed right now. */
export function isInstallable() {
  return !!deferredPrompt;
}

/** Trigger the browser's install prompt. Call only from More screen. */
export async function installPWA() {
  if (!deferredPrompt) return false;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;

  installCallbacks.forEach(cb => cb(false));
  return outcome === 'accepted';
}
