class ThemeService {
  constructor() {
    const stored = localStorage.getItem('theme');
    if (stored) {
      this.isDark = stored === 'dark';
    } else {
      this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    if (this.isDark) {
      document.documentElement.classList.add('dark');
    }
    
    // Listen for system theme changes if not explicitly overridden by user
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.isDark = e.matches;
        if (this.isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        
        // Update the toggle button if we are on the More screen
        const icon = document.getElementById('icon-toggle-theme');
        const sub = document.getElementById('sub-toggle-theme');
        if (icon) icon.textContent = this.isDark ? 'light_mode' : 'dark_mode';
        if (sub) sub.textContent = this.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      }
    });
  }

  toggle() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    return this.isDark;
  }

  get isDarkMode() {
    return this.isDark;
  }
}

const themeService = new ThemeService();
export default themeService;
