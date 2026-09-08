import { db } from '../firebase.js';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy
} from 'firebase/firestore';

const COLLECTION_NAME = 'family_members';
const getCollection = () => collection(db, COLLECTION_NAME);

const FamilyRepository = {
  async getAll() {
    const q = query(getCollection(), orderBy('updated_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getById(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async add(member) {
    const now = new Date().toISOString();
    const record = {
      name: member.name || '',
      description: member.description || '',
      phone_number: member.phone_number || '',
      whatsapp_link: member.whatsapp_link || '',
      email: member.email || '',
      dob: member.dob || null,
      wedding_anniversary: member.wedding_anniversary || null,
      address: member.address || '',
      location_name: member.location_name || '',
      latitude: member.latitude ?? null,
      longitude: member.longitude ?? null,
      location_accuracy: member.location_accuracy ?? null,
      location_source: member.location_source || null,
      location_updated_at: member.latitude ? now : null,
      profile_image: member.profile_image || null,
      created_at: now,
      updated_at: now,
    };
    
    const docRef = await addDoc(getCollection(), record);
    return { ...record, id: docRef.id };
  },

  async update(id, updates) {
    const now = new Date().toISOString();
    updates.updated_at = now;
    
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
    return await this.getById(id);
  },

  async updateLocation(id, locationData) {
    const now = new Date().toISOString();
    const updates = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      location_name: locationData.location_name || '',
      location_accuracy: locationData.location_accuracy ?? null,
      location_source: locationData.location_source || 'MANUAL',
      location_updated_at: now,
      updated_at: now,
    };
    if (locationData.address) {
      updates.address = locationData.address;
    }
    
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
    return await this.getById(id);
  },

  async delete(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async search(queryStr) {
    const q = queryStr.toLowerCase().trim();
    if (!q) return this.getAll();
    const all = await this.getAll();
    return all.filter(m =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.location_name && m.location_name.toLowerCase().includes(q)) ||
      (m.address && m.address.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  },



  async getCount() {
    const all = await this.getAll();
    return all.length;
  },

  async getWithLocation() {
    const all = await this.getAll();
    return all.filter(m => m.latitude != null && m.longitude != null);
  },

  async getRecentlyUpdated(limit = 4) {
    const all = await this.getAll();
    return all.slice(0, limit);
  },

  async getUpdatedTodayCount() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const all = await this.getAll();
    return all.filter(m => new Date(m.updated_at) >= today).length;
  }
};

export default FamilyRepository;
