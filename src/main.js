import './styles/main.css';
import Router from './router.js';
import FamilyRepository from './db/repository.js';
import './services/theme.js';

// Import screens
import HomeScreen from './screens/home.js';
import MapScreen from './screens/map.js';
import FamilyScreen from './screens/family.js';
import AddMemberScreen from './screens/add-member.js';
import ProfileScreen from './screens/profile.js';
import UpdateLocationScreen from './screens/update-location.js';
import MoreScreen from './screens/more.js';
import EditMemberScreen from './screens/edit-member.js';
import UserProfileScreen from './screens/user-profile.js';
import CalendarScreen from './screens/calendar.js';

// Initialize the application
async function init() {
  // Register routes
  Router.register('/home', HomeScreen);
  Router.register('/map', MapScreen);
  Router.register('/family', FamilyScreen);
  Router.register('/calendar', CalendarScreen);
  Router.register('/add', AddMemberScreen);
  Router.register('/profile/:id', ProfileScreen);
  Router.register('/update-location/:id', UpdateLocationScreen);
  Router.register('/more', MoreScreen);
  Router.register('/edit/:id', EditMemberScreen);
  Router.register('/user-profile', UserProfileScreen);

  // Start the router
  Router.init();
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
