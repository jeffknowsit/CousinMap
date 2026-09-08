let deferredPrompt;

export function initPWA() {
  // Listen for the install prompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    showInstallPromotion();
  });
}

function showInstallPromotion() {
  // Check if we already have a prompt UI
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:w-96 bg-primary text-on-primary p-4 rounded-xl shadow-lg flex items-center justify-between z-50 animate-fade-in';
  
  banner.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-3xl">app_shortcut</span>
      <div>
        <h4 class="font-bold">Add CousinMap to Home Screen</h4>
        <p class="text-sm opacity-90">Install as a web app for easy access</p>
      </div>
    </div>
    <div class="flex gap-2">
      <button id="pwa-dismiss" class="p-2 hover:bg-white/10 rounded-full transition-colors">
        <span class="material-symbols-outlined">close</span>
      </button>
      <button id="pwa-install" class="bg-white text-primary px-4 py-2 rounded-full font-bold hover:bg-surface transition-colors">
        Install
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('pwa-install').addEventListener('click', async () => {
    // Hide the app provided install promotion
    banner.remove();
    // Show the install prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      deferredPrompt = null;
    }
  });

  document.getElementById('pwa-dismiss').addEventListener('click', () => {
    banner.remove();
  });
}
