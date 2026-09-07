import FamilyRepository from '../db/repository.js';
import { showSnackbar } from '../components/snackbar.js';
import { storage } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default async function EditMemberScreen(container, params) {
  const id = params.id;
  const member = await FamilyRepository.getById(id);
  if (!member) {
    container.innerHTML = '<div class="flex items-center justify-center min-h-screen"><p>Member not found.</p></div>';
    return;
  }

  // Extract phone without prefix
  let phoneDisplay = member.phone_number || '';
  if (phoneDisplay.startsWith('+91')) phoneDisplay = phoneDisplay.slice(3);

  let profileImageFile = null;
  const currentImageUrl = member.profile_image || '';

  container.innerHTML = `
    <main class="flex-1 flex flex-col relative w-full pb-8 bg-surface screen-enter">
      <div class="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl px-screen-edge-padding pt-[max(env(safe-area-inset-top,0px),0.5rem)]">
        <div class="flex items-center justify-between h-14">
          <button class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant transition-transform active:scale-95 text-on-surface" onclick="history.back()">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <span class="font-headline-md text-headline-md text-on-surface">Edit Member</span>
          <div class="w-10"></div>
        </div>
      </div>

      <div class="flex flex-col px-screen-edge-padding space-y-space-lg">


        <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-1.5" for="edit-name">
              Full Name <span class="text-error font-semibold">*</span>
            </label>
            <div class="relative flex items-center">
              <span class="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">badge</span>
              <input class="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container" id="edit-name" value="${member.name}" type="text">
            </div>
          </div>

          <div class="space-y-1">
            <label class="block font-label-md text-label-md text-on-surface mb-1.5" for="edit-description">Description</label>
            <div class="relative">
              <textarea class="w-full h-24 p-3 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors resize-none" id="edit-description" placeholder="Short description about this person" required>${member.description || ''}</textarea>
            </div>
          </div>

          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-1.5" for="edit-phone">Phone Number</label>
            <div class="flex gap-space-xs">
              <div class="h-12 px-3 bg-surface-container-low rounded-xl flex items-center gap-1">
                <span class="font-body-md text-body-md text-on-surface font-semibold">🇮🇳 +91</span>
              </div>
              <div class="relative flex-1 flex items-center">
                <input class="w-full h-12 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container" id="edit-phone" placeholder="98765 43210" type="tel" value="${(member.phone_number || '').replace('+91', '')}">
              </div>
            </div>
          </div>



          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-1.5" for="edit-email">Email</label>
            <div class="relative flex items-center">
              <span class="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">alternate_email</span>
              <input class="w-full h-12 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container" id="edit-email" value="${member.email || ''}" type="email">
            </div>
          </div>
        </div>

        <button class="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline-md text-headline-md shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all" id="edit-save-btn" type="button">
          <span class="material-symbols-outlined text-[22px]">check_circle</span>
          Save Changes
        </button>
      </div>
    </main>
  `;

  // Photo Upload Preview
  const photoInput = document.getElementById('edit-photo-input');
  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      profileImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewContainer = document.getElementById('edit-photo-preview-container');
        if (previewContainer) {
          previewContainer.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // Phone number input formatting
  const phoneInput = document.getElementById('edit-phone');
  
  phoneInput?.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    e.target.value = val;
  });

  document.getElementById('edit-save-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('edit-name')?.value?.trim();
    if (!name) { showSnackbar('Name is required.', 'error'); return; }

    const phone = document.getElementById('edit-phone')?.value?.trim();
    const updates = {
      name,
      description: document.getElementById('edit-description')?.value,
      phone_number: phone ? `+91${phone.replace(/\s/g, '')}` : '',
      whatsapp_link: phone && phone.replace(/\s/g, '').length >= 10 ? `https://wa.me/91${phone.replace(/\s/g, '').slice(-10)}` : '',
      email: document.getElementById('edit-email')?.value?.trim() || '',
    };

    const saveBtn = document.getElementById('edit-save-btn');
    if (saveBtn) {
      saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[22px]">progress_activity</span><span>Saving...</span>';
      saveBtn.disabled = true;
    }

    try {
      await FamilyRepository.update(member.id, updates);
      showSnackbar('Member updated!', 'success');
      setTimeout(() => { window.location.hash = `/profile/${member.id}`; }, 600);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to save changes.', 'error');
      if (saveBtn) {
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-[22px]">check_circle</span>Save Changes';
        saveBtn.disabled = false;
      }
    }
  });
}
