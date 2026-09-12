import { renderBottomNav } from '../components/bottom-nav.js';
import FamilyRepository from '../db/repository.js';
import LocationService from '../services/location.js';
import { formatDistance, calculateDistanceToMember } from '../services/distance.js';
import { getWhatsAppLink } from '../utils/helpers.js';

function getAvatarHtml(member, sizeClasses) {
  if (member && member.profile_image) {
    return `<img alt="${member.name}" class="${sizeClasses} object-cover" src="${member.profile_image}">`;
  }
  const nameStr = member ? member.name || 'Unknown' : 'You';
  const initials = nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const hue = [...nameStr].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  return `<div class="${sizeClasses} flex items-center justify-center font-bold tracking-wider" style="background-color: hsl(${hue}, 70%, 90%); color: hsl(${hue}, 70%, 30%);">${initials}</div>`;
}

export default async function HomeScreen(container) {
  let userLocation = null;

  const members = await FamilyRepository.getAll();
  const memberCount = members.length;
  const activeLocationsCount = members.filter(m => m.latitude != null).length;

  const staticYouAvatar = "https://lh3.googleusercontent.com/aida/AEtjO1X1ZjQem_MFFH6JLSudXhKVdzjYtMOrQ5B0ENKp5HXnOHv73ZckY1FdGoePUMcpxrTgIfvwA_K3DWTj_PCPBt0Z31eqVEK4JPhVxeAp5ZoRoxytH1_3dCMCLrKv745tMfwUL73juoLEQGOS1tmVvPaijHsZhzFEi3YO1uZCbCAaHRR0NmTF-jpz7agRXuUb3SsprJhz55DNfUaXCJZNL5lB0W5Mvxgxm3h7yo7_uTWQ_xl8GNFzsNWJAQ";

  // Check birthdays
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  
  const birthdayMembers = members.filter(m => {
    if (!m.dob) return false;
    const [year, month, day] = m.dob.split('-');
    return parseInt(month) === currentMonth && parseInt(day) === currentDay;
  });

  // Calculate nearby (placeholder for now until location resolves)
  let nearbyCount = 0;
  let sortedMembers = [...members];
  let radarMembers = [];

  const updateRadarAndClosest = () => {
    if (!userLocation) return;
    
    // Calculate distances
    const membersWithDist = members.map(m => {
      const dist = calculateDistanceToMember(userLocation.latitude, userLocation.longitude, m.latitude, m.longitude);
      return { ...m, dist };
    }).filter(m => m.dist !== null);

    nearbyCount = membersWithDist.filter(m => m.dist <= 10).length;
    sortedMembers = membersWithDist.sort((a, b) => a.dist - b.dist);
    radarMembers = sortedMembers.slice(0, 3); // top 3 for radar
  };

  const renderBirthdayCards = () => {
    if (birthdayMembers.length === 0) {
      return `<div class="p-4 w-full text-center text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-2xl border border-outline-variant/20">No birthdays today.</div>`;
    }
    return birthdayMembers.map((m, idx) => {
      let ageText = "Celebrating Today!";
      if (m.dob) {
        const [year] = m.dob.split('-');
        if (year) {
          const age = today.getFullYear() - parseInt(year);
          ageText = `Turning ${age} Today!`;
        }
      }
      const avatarHtml = getAvatarHtml(m, "w-12 h-12 rounded-[14px] bg-surface-container");
      // Pick a random gradient for variety based on index
      const bgGradient = idx % 2 === 0 ? 'from-amber-400 via-rose-400 to-primary' : 'from-teal-400 via-primary-fixed to-blue-500';
      const tintBg = idx % 2 === 0 ? 'to-amber-50/40' : 'to-primary-fixed/20';
      
      let phone = (m.phone_number || '').replace(/[^\d]/g, '');
      const waLink = getWhatsAppLink(phone, `Happy Birthday ${m.name}! 🎉🎂`);
      const callLink = phone ? `tel:${phone}` : '#';

      return `
        <div class="min-w-[85%] sm:min-w-[320px] max-w-[340px] snap-center bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest ${tintBg} rounded-2xl p-4 border border-amber-200/60 shadow-md relative overflow-hidden flex flex-col justify-between shrink-0">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-amber-200/30 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div class="flex items-start gap-3">
              <div class="relative shrink-0">
                <div class="w-13 h-13 rounded-2xl p-0.5 bg-gradient-to-tr ${bgGradient} shadow-sm">
                  ${avatarHtml}
                </div>
                <span class="absolute -bottom-1 -right-1 text-[15px] filter drop-shadow-sm leading-none select-none">🎂</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                  <h3 class="font-headline-md text-[16px] text-on-surface truncate font-bold">${m.name}</h3>
                </div>
                <div class="flex items-center gap-1.5 text-amber-700 font-semibold text-[13px] mt-0.5">
                  <span class="">${ageText}</span>
                  <span class="text-xs">✨</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Actions Row -->
          <div class="mt-3.5 pt-3 border-t border-outline-variant/20 flex items-center gap-2">
            <a class="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-label-sm text-[12px] font-semibold shadow-sm shadow-emerald-600/20 active:scale-95 transition-all" href="${waLink}" ${phone ? 'target="_blank"' : ''}>
              <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"></path></svg>
              <span class="">Wish</span>
            </a>
            <a class="w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center justify-center shrink-0 active:scale-90 transition-all border border-outline-variant/30" href="${callLink}" title="Direct Call">
              <span class="material-symbols-outlined text-[18px]">call</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderClosestCards = () => {
    const closest = sortedMembers.slice(0, 2);
    if (closest.length === 0) {
      return `<div class="p-4 text-center text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-2xl border border-outline-variant/20">No locations available.</div>`;
    }
    return closest.map(m => {
      const avatarHtml = getAvatarHtml(m, "w-12 h-12 rounded-2xl ring-1 ring-outline-variant/30");
      const distStr = m.dist != null ? `${formatDistance(m.dist)} away` : 'Location unknown';
      let phone = (m.phone_number || '').replace(/[^\d]/g, '');
      const callLink = phone ? `tel:${phone}` : '#';
      
      return `
        <div class="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col gap-3 active:bg-surface-container-low transition-all cursor-pointer">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3.5 min-w-0 flex-1">
              <div class="relative w-13 h-13 shrink-0">
                ${avatarHtml}
                <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest flex items-center justify-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-white ${m.dist != null ? 'animate-ping' : ''}"></span>
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-headline-md text-[16px] text-on-surface font-semibold">${m.name}</h3>
                </div>
                <div class="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-[13px] mt-1 flex-wrap">
                  <span class="font-semibold text-primary">${distStr}</span>
                  ${m.location_name ? `<span class="text-outline/50">•</span><span class="truncate">${m.location_name}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
            <button class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-[13px] font-semibold active:scale-95 transition-all" type="button" onclick="window.location.hash='/profile/${m.id}'">
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
              <span class="">Profile</span>
            </button>
            <a class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary hover:bg-[#0d6861] text-on-primary font-label-sm text-[13px] font-semibold active:scale-95 transition-all shadow-sm" href="${callLink}">
              <span class="material-symbols-outlined text-[18px]">call</span>
              <span class="">Call</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderRadarBeacons = () => {
    // We use the 3 preset absolute positions from Stitch
    const positions = [
      "top-6 right-8",   // Position 1 (North-East)
      "bottom-6 right-6",// Position 2 (South-East)
      "top-16 left-3"    // Position 3 (West)
    ];

    if (radarMembers.length === 0) return '';
    return radarMembers.slice(0,3).map((m, i) => {
      const avatarHtml = getAvatarHtml(m, "w-9 h-9 rounded-full object-cover ring-2 ring-primary-fixed shadow-md overflow-hidden");
      const distStr = formatDistance(m.dist);
      const posClass = positions[i] || positions[0];
      return `
        <div class="absolute ${posClass} z-20 flex flex-col items-center cursor-pointer group active:scale-95 transition-transform" onclick="window.location.hash='/profile/${m.id}'">
          <div class="relative">
            ${avatarHtml}
            <span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary-fixed ring-2 ring-primary-container flex items-center justify-center">
              <span class="w-1 h-1 rounded-full bg-primary"></span>
            </span>
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-md font-label-sm text-[10px] text-white font-medium tracking-tight whitespace-nowrap">${m.name.split(' ')[0]} • ${distStr}</span>
        </div>
      `;
    }).join('');
  };

  const renderContent = () => {
    container.innerHTML = `
      <!-- Fixed Header from Stitch Design -->
      <header class="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div class="h-16 px-screen-edge-padding flex items-center justify-between">
          <div class="flex items-center gap-space-xs">
            <img src="/logo.png" alt="CousinMap Logo" class="w-10 h-10 object-contain" />
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
      
      <main class="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface screen-enter">
        <div class="flex flex-col w-full px-screen-edge-padding space-y-space-lg">
          <!-- Welcome Title Section -->
          <div class="flex flex-col mt-space-sm">
            <div class="flex items-center justify-between">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed/70 text-on-primary-fixed-variant">
                <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span class="font-label-sm text-label-sm font-semibold tracking-wide uppercase">Live Compass</span>
              </div>
              <span class="font-label-sm text-label-sm text-outline">Updated just now</span>
            </div>
            ${(() => {
              const hour = new Date().getHours();
              const timeGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
              const crispPhrases = ['Welcome back', "Glad you're here", 'Ready to connect?', "Let's explore", 'Stay close'];
              const randomPhrase = crispPhrases[Math.floor(Math.random() * crispPhrases.length)];
              return `
                <h1 class="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mt-2 tracking-tight">${timeGreeting}</h1>
                <h2 class="text-[20px] font-semibold text-on-surface-variant mt-1 tracking-tight">${randomPhrase}!</h2>
              `;
            })()}
            <p class="font-body-md text-body-md text-on-surface-variant mt-0.5">Everyone you love is on the map.</p>
          </div>

          <!-- DYNAMIC RADAR COMPASS HERO ENTRANCE -->
          <div class="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-primary-container via-[#0d6b63] to-[#084c47] p-5 text-on-primary shadow-xl shadow-primary-container/15">
            <!-- Topographic Subtle Contours & Compass Coordinates Overlay -->
            <div class="absolute inset-0 opacity-15 pointer-events-none">
              <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50%" cy="50%" fill="none" r="40" stroke="#a3faef" stroke-dasharray="3 4" stroke-width="1"></circle>
                <circle cx="50%" cy="50%" fill="none" r="80" stroke="#a3faef" stroke-dasharray="4 6" stroke-width="1"></circle>
                <circle cx="50%" cy="50%" fill="none" r="120" stroke="#a3faef" stroke-opacity="0.5" stroke-width="1"></circle>
                <line stroke="#a3faef" stroke-opacity="0.3" stroke-width="0.8" x1="50%" x2="50%" y1="10%" y2="90%"></line>
                <line stroke="#a3faef" stroke-opacity="0.3" stroke-width="0.8" x1="10%" x2="90%" y1="50%" y2="50%"></line>
              </svg>
            </div>
            <div class="relative z-10 flex flex-col items-center">
              <!-- Radar Wave Canvas Container -->
              <div class="relative w-56 h-56 flex items-center justify-center my-1" id="radar-container">
                <!-- Outer expanding pulse waves -->
                <div class="absolute w-44 h-44 rounded-full border border-primary-fixed/40 animate-radar-ring-1 pointer-events-none"></div>
                <div class="absolute w-44 h-44 rounded-full border border-primary-fixed/30 animate-radar-ring-2 pointer-events-none"></div>
                <!-- Concentric Radar Rings -->
                <div class="absolute w-52 h-52 rounded-full border border-white/10 flex items-center justify-center">
                  <span class="absolute top-1 font-label-sm text-[10px] text-primary-fixed/70 tracking-widest uppercase">N</span>
                  <span class="absolute bottom-1 font-label-sm text-[10px] text-primary-fixed/70 tracking-widest uppercase">S</span>
                  <span class="absolute left-2 font-label-sm text-[10px] text-primary-fixed/70 tracking-widest uppercase">W</span>
                  <span class="absolute right-2 font-label-sm text-[10px] text-primary-fixed/70 tracking-widest uppercase">E</span>
                </div>
                <div class="absolute w-36 h-36 rounded-full border border-primary-fixed/20 bg-primary/15 backdrop-blur-[1px]"></div>
                <div class="absolute w-20 h-20 rounded-full border border-primary-fixed/40 bg-primary/30"></div>
                <!-- Rotating soft sweeping beam -->
                <div class="absolute inset-0 rounded-full animate-radar-beam pointer-events-none flex items-center justify-center">
                  <div class="w-28 h-28 bg-gradient-to-tr from-transparent via-primary-fixed/10 to-primary-fixed/30 rounded-full origin-bottom-right transform -rotate-45" style="clip-path: polygon(50% 50%, 100% 0, 100% 50%);"></div>
                </div>
                
                <!-- Center Node: You -->
                <div class="relative z-20 flex flex-col items-center">
                  <div class="w-12 h-12 rounded-full ring-3 ring-on-primary shadow-lg overflow-hidden bg-primary-container">
                    ${getAvatarHtml({ name: 'You' }, "w-full h-full")}
                  </div>
                  <div class="absolute -bottom-2 px-2 py-0.2 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-sm text-[10px] font-bold shadow">
                    You
                  </div>
                </div>

                <!-- Dynamic Radar Beacons -->
                ${renderRadarBeacons()}
              </div>

              <!-- Hero Compass Headline Pill -->
              <div class="flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                <span class="material-symbols-outlined text-[16px] text-primary-fixed">radar</span>
                <span class="font-label-sm text-label-sm font-semibold text-primary-fixed" id="radar-status-text">${radarMembers.length} Cousins Nearby</span>
              </div>
            </div>
          </div>

          <!-- FOCUSED METRICS: Clean Frosted Glass Bar -->
          <div class="w-full bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant/30 shadow-sm p-space-sm">
            <div class="grid grid-cols-3 divide-x divide-outline-variant/30 text-center">
              <div class="flex flex-col items-center justify-center px-1 cursor-pointer hover:bg-surface-container/50 rounded-lg transition-colors" onclick="window.location.hash='/family'">
                <span class="font-headline-md text-headline-md text-on-surface">${memberCount}</span>
                <span class="font-label-sm text-[11px] text-on-surface-variant">in Circle</span>
              </div>
              <div class="flex flex-col items-center justify-center px-1" id="metric-nearby">
                <div class="flex items-center gap-1">
                  <span class="font-headline-md text-headline-md text-primary">${nearbyCount}</span>
                  ${nearbyCount > 0 ? '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>' : ''}
                </div>
                <span class="font-label-sm text-[11px] text-on-surface-variant font-medium text-primary">Nearby</span>
              </div>
              <div class="flex flex-col items-center justify-center px-1 cursor-pointer hover:bg-surface-container/50 rounded-lg transition-colors" onclick="window.location.hash='/map'">
                <div class="flex items-center gap-1 text-primary">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse"></span>
                  <span class="font-label-md text-label-md font-semibold text-on-surface">${activeLocationsCount}</span>
                </div>
                <span class="font-label-sm text-[11px] text-on-surface-variant">Live GPS</span>
              </div>
            </div>
          </div>

          <!-- HIGH-IMPACT PRIMARY ACTION -->
          <div>
            <div class="flex items-center gap-3 w-full">
              <button class="flex-1 flex items-center justify-between px-5 py-3.5 rounded-full bg-[#0F766E] text-white shadow-md active:scale-[0.98] transition-all hover:bg-[#0d6861]" type="button" onclick="window.location.hash='/map'">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path></svg>
                  </div>
                  <div class="flex flex-col text-left">
                    <span class="font-bold text-[15px] leading-tight text-white">Explore Live Map</span>
                    <span class="text-[12px] text-teal-100 font-medium leading-tight mt-0.5">View real-time spatial pins</span>
                  </div>
                </div>
                <svg class="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
              </button>
              <button class="h-[54px] w-[54px] rounded-2xl bg-surface-container-lowest border border-slate-100 shadow-sm flex items-center justify-center text-[#0F766E] hover:bg-surface-container transition-all active:scale-95 shrink-0" title="Add Cousin" type="button" onclick="window.location.hash='/add'">
                <svg class="w-6 h-6 text-[#0F766E]" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" x2="20" y1="8" y2="14"></line><line x1="23" x2="17" y1="11" y2="11"></line></svg>
              </button>
            </div>
          </div>

          <!-- BIRTHDAY CELEBRATION SECTION -->
          <div class="flex flex-col space-y-3">
            <div class="flex items-center justify-between px-1">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">cake</span>
                </div>
                <h2 class="font-headline-md text-headline-md text-on-surface tracking-tight">Today's Events</h2>
              </div>
              ${birthdayMembers.length > 0 ? `
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-[11px] font-semibold shadow-xs">
                  🎉 ${birthdayMembers.length} Celebrating Today
                </span>
              ` : ''}
            </div>
            
            <div class="relative -mx-screen-edge-padding px-screen-edge-padding">
              <div class="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1" id="birthday-carousel">
                ${renderBirthdayCards()}
              </div>
            </div>
          </div>

          <!-- STREAMLINED ESSENTIALS: Closest to You Spotlight -->
          <div class="flex flex-col space-y-3 mb-space-sm">
            <div class="flex items-center justify-between px-1">
              <h2 class="font-headline-md text-headline-md text-on-surface">Closest to You</h2>
              <a class="font-label-md text-label-md text-primary font-semibold flex items-center gap-0.5 hover:underline cursor-pointer" onclick="window.location.hash='/family'">
                View All
                <span class="material-symbols-outlined text-[16px]">chevron_right</span>
              </a>
            </div>
            
            <div id="closest-cards-container" class="flex flex-col gap-3">
              ${renderClosestCards()}
            </div>
          </div>

        </div>
      </main>
      ${renderBottomNav('home', memberCount)}
    `;
  };

  // Render initial static state
  renderContent();

  // Fetch location (will prompt for permission if not yet granted)
  LocationService.getCurrentPosition({ timeout: 15000 }).then(pos => {
    userLocation = pos;
    updateRadarAndClosest();
    renderContent();
  }).catch(() => { /* silent */ });
}
