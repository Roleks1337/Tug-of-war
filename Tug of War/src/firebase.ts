import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAZycg5rrZLNaK7g0EfKsy6U78sJwa-OAM",
  authDomain: "classroom-2-309c4.firebaseapp.com",
  databaseURL: "https://classroom-2-309c4-default-rtdb.firebaseio.com",
  projectId: "classroom-2-309c4",
  storageBucket: "classroom-2-309c4.firebasestorage.app",
  messagingSenderId: "883368806224",
  appId: "1:883368806224:web:db38ef23def71fee460e55",
  measurementId: "G-SZL7R03FHK"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
