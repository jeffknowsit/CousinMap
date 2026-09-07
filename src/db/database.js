import Dexie from 'dexie';

const db = new Dexie('CousinMapDB');

db.version(1).stores({
  family_members: '++id, name, relationship, phone_number, email, address, location_name, latitude, longitude, location_accuracy, location_source, location_updated_at, profile_image, created_at, updated_at',
});

export default db;
