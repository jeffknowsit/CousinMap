import { renderHeader } from '../components/header.js';
import userService from '../services/user.js';
import { showSnackbar } from '../components/snackbar.js';

export default function UserProfileScreen(container) {
  const profile = userService.getProfile();

  container.innerHTML = `
    <header class="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-16 px-screen-edge-padding flex items-center">
        <button class="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors -ml-2 mr-2" onclick="window.history.back()">
          <span class="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <h1 class="font-headline-md text-headline-md text-on-surface">My Profile</h1>
      </div>
    </header>
    <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter overflow-y-auto">
      <div class="flex flex-col w-full px-screen-edge-padding space-y-space-lg pt-space-md">
        
        <div class="flex justify-center mb-4">
          <div class="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center border-4 border-surface shadow-sm">
            <span class="material-symbols-outlined text-[48px] text-on-primary-container">person</span>
          </div>
        </div>

        <form id="profile-form" class="space-y-space-md">
          <div class="space-y-1">
            <label class="font-label-md text-label-md text-on-surface-variant uppercase px-2">Full Name</label>
            <input type="text" id="profile-name" value="${profile.name || ''}" placeholder="Enter your name" required class="w-full bg-surface-container-low border border-outline-variant rounded-2xl px-4 py-3.5 text-on-surface font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
          </div>
          
          <div class="space-y-1">
            <label class="font-label-md text-label-md text-on-surface-variant uppercase px-2">Phone Number</label>
            <input type="tel" id="profile-phone" value="${profile.phone || ''}" placeholder="Enter your phone number" class="w-full bg-surface-container-low border border-outline-variant rounded-2xl px-4 py-3.5 text-on-surface font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
          </div>

          <div class="space-y-1">
            <label class="font-label-md text-label-md text-on-surface-variant uppercase px-2">Email Address</label>
            <input type="email" id="profile-email" value="${profile.email || ''}" placeholder="Enter your email" class="w-full bg-surface-container-low border border-outline-variant rounded-2xl px-4 py-3.5 text-on-surface font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
          </div>
          
          <div class="space-y-1">
            <label class="font-label-md text-label-md text-on-surface-variant uppercase px-2">Home Location</label>
            <input type="text" id="profile-location" value="${profile.location || ''}" placeholder="Enter your default city or address" class="w-full bg-surface-container-low border border-outline-variant rounded-2xl px-4 py-3.5 text-on-surface font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
          </div>

          <div class="pt-space-md">
            <button type="submit" class="w-full bg-primary text-on-primary py-3.5 rounded-full font-label-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[20px]">save</span>
              Save Profile
            </button>
          </div>
        </form>

      </div>
    </main>
  `;

  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newProfile = {
      name: document.getElementById('profile-name').value.trim(),
      phone: document.getElementById('profile-phone').value.trim(),
      email: document.getElementById('profile-email').value.trim(),
      location: document.getElementById('profile-location').value.trim()
    };
    userService.saveProfile(newProfile);
    showSnackbar('Profile saved successfully', 'success');
    setTimeout(() => { window.location.hash = '/more'; }, 800);
  });
}
