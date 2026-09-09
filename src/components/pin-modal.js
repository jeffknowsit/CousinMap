export function promptPin(onSuccess, customMessage = 'Enter your security PIN to authorize this action.') {
  let modal = document.getElementById('global-pin-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-pin-modal';
    modal.className = 'fixed inset-0 bg-on-background/40 z-[100] flex items-center justify-center px-4 backdrop-blur-sm transition-opacity opacity-0 hidden';
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-sm shadow-lg transform transition-transform scale-95 translate-y-4" id="pin-modal-inner">
        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Security PIN Required</h3>
          <p id="pin-modal-message" class="font-body-sm text-body-sm text-on-surface-variant mb-6"></p>
          
          <input type="password" id="global-pin-input" class="w-full text-center text-2xl tracking-[0.5em] font-mono bg-surface-container-low border-2 border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-2 transition-all" placeholder="••••••" maxlength="6">
          <p id="global-pin-error" class="font-label-sm text-label-sm text-error h-4 opacity-0 transition-opacity">Incorrect PIN</p>
          <p id="global-pin-attempts" class="font-label-sm text-label-sm text-error h-4 mt-1 opacity-0 transition-opacity"></p>
          
          <div class="flex gap-3 w-full mt-6">
            <button id="global-cancel-pin" class="flex-1 py-2.5 rounded-full font-label-lg font-semibold text-on-surface-variant bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all">Cancel</button>
            <button id="global-confirm-pin" class="flex-1 py-2.5 rounded-full font-label-lg font-semibold text-on-error bg-error hover:opacity-90 active:scale-95 transition-all">Confirm</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const messageEl = document.getElementById('pin-modal-message');
  const inputEl = document.getElementById('global-pin-input');
  const errorEl = document.getElementById('global-pin-error');
  const attemptsEl = document.getElementById('global-pin-attempts');
  const cancelBtn = document.getElementById('global-cancel-pin');
  const confirmBtn = document.getElementById('global-confirm-pin');
  const innerEl = document.getElementById('pin-modal-inner');

  messageEl.textContent = customMessage;
  inputEl.value = '';
  inputEl.disabled = false;
  confirmBtn.disabled = false;
  errorEl.classList.add('opacity-0');
  attemptsEl.classList.add('opacity-0');

  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  const hideModal = () => {
    modal.classList.add('opacity-0');
    innerEl.classList.add('scale-95', 'translate-y-4');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  };

  const handleConfirm = () => {
    if (attempts >= MAX_ATTEMPTS) return;

    const val = inputEl.value;
    if (val === '981106') {
      hideModal();
      // small delay to let modal hide
      setTimeout(() => onSuccess(), 200);
    } else {
      attempts++;
      errorEl.classList.remove('opacity-0');
      inputEl.classList.add('border-error');
      inputEl.value = '';
      
      if (attempts >= MAX_ATTEMPTS) {
        attemptsEl.textContent = 'Maximum attempts reached. Try again later.';
        attemptsEl.classList.remove('opacity-0');
        inputEl.disabled = true;
        confirmBtn.disabled = true;
        setTimeout(hideModal, 2000);
      } else {
        attemptsEl.textContent = \`\${MAX_ATTEMPTS - attempts} attempt(s) remaining\`;
        attemptsEl.classList.remove('opacity-0');
      }

      setTimeout(() => inputEl.classList.remove('border-error'), 1500);
    }
  };

  const onCancel = () => {
    hideModal();
  };

  // Clear previous listeners by cloning nodes if needed, but simpler to just reassign onclick
  cancelBtn.onclick = onCancel;
  confirmBtn.onclick = handleConfirm;
  
  inputEl.onkeypress = (e) => {
    if (e.key === 'Enter') handleConfirm();
  };

  // Show
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    innerEl.classList.remove('scale-95', 'translate-y-4');
    inputEl.focus();
  }, 10);
}
