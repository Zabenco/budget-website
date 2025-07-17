// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCLwewExgnXf3PBdP7FfXkWaNzD_WCCpjc",
  authDomain: "budget-tracker-18bac.firebaseapp.com",
  projectId: "budget-tracker-18bac",
  storageBucket: "budget-tracker-18bac.firebasestorage.app",
  messagingSenderId: "710661709830",
  appId: "1:710661709830:web:6aa84772f1823a7321a387",
  measurementId: "G-WY3Q37MSR7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
