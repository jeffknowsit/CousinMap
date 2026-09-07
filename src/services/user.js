class UserService {
  getProfile() {
    const data = localStorage.getItem('user_profile');
    return data ? JSON.parse(data) : { name: '', phone: '', email: '', location: '' };
  }
  
  saveProfile(profile) {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }
}
export default new UserService();
