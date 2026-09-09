export function requirePin(message = 'Enter your security PIN.') {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 3;

    // Check if modal already exists, remove it
    const existing = document.getElementById('global-pin-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'global-pin-modal';
    modal.className = 'fixed inset-0 bg-on-background/40 z-[100] flex items-center justify-center px-4 backdrop-blur-sm transition-opacity opacity-0';
    
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-sm shadow-lg transform transition-transform scale-95 translate-y-4" id="global-pin-modal-inner">
        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Security PIN Required</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-6">${message}</p>
          
          <input type="password" id="global-pin-input" class="w-full text-center text-2xl tracking-[0.5em] font-mono bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-2 transition-all" placeholder="••••••" maxlength="6">
          <p id="global-pin-error" class="font-label-sm text-label-sm text-error h-4 opacity-0 transition-opacity">Incorrect PIN</p>
          <p id="global-pin-attempts" class="font-label-sm text-label-sm text-on-surface-variant mt-1 text-center w-full h-4">${maxAttempts} attempts remaining</p>
          
          <div class="flex gap-3 w-full mt-6">
            <button id="global-cancel-pin" class="flex-1 py-2.5 rounded-full font-label-lg font-semibold text-on-surface-variant bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all">Cancel</button>
            <button id="global-confirm-pin" class="flex-1 py-2.5 rounded-full font-label-lg font-semibold text-on-primary bg-primary hover:opacity-90 active:scale-95 transition-all">Confirm</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = document.getElementById('global-pin-input');
    const cancelBtn = document.getElementById('global-cancel-pin');
    const confirmBtn = document.getElementById('global-confirm-pin');
    const errorMsg = document.getElementById('global-pin-error');
    const attemptsMsg = document.getElementById('global-pin-attempts');
    const modalInner = document.getElementById('global-pin-modal-inner');

    // Show with animation
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modalInner.classList.remove('scale-95', 'translate-y-4');
      input.focus();
    }, 10);

    const closeModal = (result) => {
      modal.classList.add('opacity-0');
      modalInner.classList.add('scale-95', 'translate-y-4');
      setTimeout(() => {
        modal.remove();
        resolve(result);
      }, 200);
    };

    cancelBtn.onclick = () => closeModal(false);

    const handleConfirm = () => {
      if (input.value === '981106') {
        closeModal(true);
      } else {
        attempts++;
        const remaining = maxAttempts - attempts;
        
        if (remaining <= 0) {
          errorMsg.textContent = 'Too many incorrect attempts. Access denied.';
          errorMsg.classList.remove('opacity-0');
          attemptsMsg.textContent = 'No attempts remaining';
          attemptsMsg.className = 'font-label-sm text-label-sm text-error font-semibold mt-1 text-center w-full h-4';
          input.disabled = true;
          confirmBtn.disabled = true;
          confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
          setTimeout(() => closeModal(false), 2000);
          return;
        }

        errorMsg.textContent = 'Incorrect PIN. Try again.';
        errorMsg.classList.remove('opacity-0');
        attemptsMsg.textContent = `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`;
        // Visual warning: amber for 2 remaining, red for 1 remaining
        attemptsMsg.className = `font-label-sm text-label-sm mt-1 text-center w-full h-4 ${remaining === 1 ? 'text-error font-semibold' : 'text-amber-500'}`;
        input.classList.add('border-error');
        input.value = '';
        setTimeout(() => {
          input.classList.remove('border-error');
          input.focus();
        }, 1000);
      }
    };

    confirmBtn.onclick = handleConfirm;
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleConfirm();
    });
  });
}
