let currentSheet = null;

/**
 * Show a bottom sheet
 */
export function showBottomSheet(contentHTML, options = {}) {
  hideBottomSheet();

  const { onClose } = options;

  const backdrop = document.createElement('div');
  backdrop.className = 'bottom-sheet-backdrop';
  backdrop.onclick = () => hideBottomSheet(onClose);

  const sheet = document.createElement('div');
  sheet.className = 'bottom-sheet-content';
  sheet.innerHTML = `
    <div class="bg-surface-container-lowest rounded-t-[28px] shadow-2xl px-screen-edge-padding pt-space-xs pb-space-lg max-h-[80vh] overflow-y-auto">
      <div class="w-10 h-1 rounded-full bg-surface-dim mx-auto my-1 cursor-grab"></div>
      ${contentHTML}
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);
  currentSheet = { backdrop, sheet, onClose };
}

/**
 * Hide the current bottom sheet
 */
export function hideBottomSheet(callback) {
  if (!currentSheet) return;
  const { backdrop, sheet, onClose } = currentSheet;
  
  sheet.querySelector('.bg-surface-container-lowest').style.animation = 'slideDown 0.2s ease-in forwards';
  backdrop.style.animation = 'fadeIn 0.2s ease-in reverse';
  
  setTimeout(() => {
    backdrop.remove();
    sheet.remove();
    currentSheet = null;
    if (callback) callback();
    else if (onClose) onClose();
  }, 200);
}
