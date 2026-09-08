let currentSnackbar = null;

/**
 * Show a snackbar notification
 * @param {string} message
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {number} duration - ms
 */
export function showSnackbar(message, type = 'info', duration = 3000) {
  hideSnackbar();

  const colors = {
    success: 'bg-primary-container text-on-primary-container',
    error: 'bg-error text-on-error',
    info: 'bg-inverse-surface text-inverse-on-surface',
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  const el = document.createElement('div');
  el.className = `snackbar ${colors[type] || colors.info}`;
  el.innerHTML = `
    <div class="flex items-center gap-space-xs px-space-md py-space-sm rounded-2xl shadow-xl min-w-[200px] max-w-[340px]">
      <span class="material-symbols-outlined text-[20px]">${icons[type] || icons.info}</span>
      <span class="font-body-md text-body-md flex-1">${message}</span>
    </div>
  `;

  document.body.appendChild(el);
  currentSnackbar = el;

  if (duration > 0) {
    setTimeout(() => hideSnackbar(), duration);
  }
}

export function hideSnackbar() {
  if (!currentSnackbar) return;
  currentSnackbar.classList.add('hiding');
  const el = currentSnackbar;
  currentSnackbar = null;
  setTimeout(() => el.remove(), 200);
}
