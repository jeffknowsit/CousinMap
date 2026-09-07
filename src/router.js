const Router = {
  routes: {},
  currentRoute: null,
  currentCleanup: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  async navigate(path) {
    window.location.hash = path;
  },

  getParams() {
    const hash = window.location.hash.slice(1) || '/home';
    const parts = hash.split('/').filter(Boolean);
    return parts;
  },

  getCurrentPath() {
    return window.location.hash.slice(1) || '/home';
  },

  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/home';
    const mainEl = document.getElementById('app');
    if (!mainEl) return;

    // Clean up previous screen
    if (this.currentCleanup && typeof this.currentCleanup === 'function') {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    // Match route
    let handler = null;
    let params = {};

    for (const [pattern, h] of Object.entries(this.routes)) {
      const match = this.matchRoute(pattern, hash);
      if (match) {
        handler = h;
        params = match;
        break;
      }
    }

    if (!handler) {
      handler = this.routes['/home'] || Object.values(this.routes)[0];
      params = {};
    }

    this.currentRoute = hash;

    if (handler) {
      // Show loading state immediately to prevent frozen UI feeling
      mainEl.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center min-h-screen bg-surface w-full h-full">
          <span class="material-symbols-outlined text-primary text-[40px] animate-spin mb-4">progress_activity</span>
          <p class="font-body-md text-on-surface-variant">Loading...</p>
        </div>
      `;
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timed out. If you are using an ad blocker (like uBlock Origin or Brave Shields), please disable it for this site to allow Firebase to connect.')), 4000)
        );
        
        const result = await Promise.race([
          handler(mainEl, params),
          timeoutPromise
        ]);
        
        if (typeof result === 'function') {
          this.currentCleanup = result;
        }
      } catch (err) {
        console.error("Navigation error:", err);
        mainEl.innerHTML = `
          <div class="flex-1 flex flex-col items-center justify-center min-h-screen bg-surface w-full h-full p-6 text-center">
            <span class="material-symbols-outlined text-error text-[56px] mb-4">wifi_off</span>
            <h2 class="font-headline-md text-on-surface mb-3">Connection Failed</h2>
            <p class="font-body-md text-on-surface-variant mb-6 max-w-[400px]">${err.message || 'An error occurred while loading the page.'}</p>
            <button class="px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-lg font-semibold shadow-sm active:scale-95 transition-transform" onclick="window.location.reload(true)">
              Refresh Page
            </button>
          </div>
        `;
      }
    }
  },

  matchRoute(pattern, hash) {
    const patternParts = pattern.split('/').filter(Boolean);
    const hashParts = hash.split('/').filter(Boolean);

    if (patternParts.length !== hashParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = hashParts[i];
      } else if (patternParts[i] !== hashParts[i]) {
        return null;
      }
    }
    return params;
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    if (!window.location.hash) {
      window.location.hash = '/home';
    }
    this.handleRoute();
  },
};

export default Router;
