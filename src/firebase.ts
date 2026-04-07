import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBur8QCwtniQcUxZGtQwsF54P4f1wB7Peg",
  authDomain: "edulens-544ff.firebaseapp.com",
  projectId: "edulens-544ff",
  storageBucket: "edulens-544ff.firebasestorage.app",
  messagingSenderId: "1027223862383",
  appId: "1:1027223862383:web:6a553af04836a6b36a219a",
  measurementId: "G-FKW93VZY4F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
