/**
 * Renders the app header with CousinMap branding
 */
export function renderHeader(activeTab = 'home') {
  return `
    <header class="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-16 px-screen-edge-padding flex items-center justify-between">
        <div class="flex items-center gap-space-xs cursor-pointer" onclick="window.location.hash='/home'">
          <div class="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary-container text-[18px]">explore</span>
          </div>
          <span class="font-headline-md text-headline-md tracking-tight text-on-surface">CousinMap</span>
        </div>
        <div class="flex items-center gap-space-xs">
          <button class="flex items-center justify-center p-space-2xs min-w-touch-target-min min-h-touch-target-min rounded-full hover:bg-surface-container transition-colors" type="button" onclick="window.location.hash='/more'">
            <div class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary-container text-[16px]">person</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  `;
}
