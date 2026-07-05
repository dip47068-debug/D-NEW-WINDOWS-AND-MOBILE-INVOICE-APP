import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBI9TcXpGUJtRbOqhpUGdJf_5TtAfyUYb4",
  authDomain: "d-dolphin.firebaseapp.com",
  projectId: "d-dolphin",
  storageBucket: "d-dolphin.firebasestorage.app",
  messagingSenderId: "207362879519",
  appId: "1:207362879519:web:951478544a0bc316c5652a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// If the user is using their own d-dolphin project, initialize with the default database.
// Otherwise, use the custom Firestore database ID.
export const db = firebaseConfig.projectId === "d-dolphin"
  ? getFirestore(app)
  : getFirestore(app, "ai-studio-indiangstbilling-8ed369e5-37eb-431d-bd90-d9a0b7550636");
