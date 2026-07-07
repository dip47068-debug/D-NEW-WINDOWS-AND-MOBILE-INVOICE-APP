import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "axiomatic-hold-qkm1r",
  appId: "1:596458113237:web:3661a225dcbc9e8524ba5c",
  apiKey: "AIzaSyD0g2fUsl_Tnp8JsZaCyPMpeCqlolIuZjs",
  authDomain: "axiomatic-hold-qkm1r.firebaseapp.com",
  storageBucket: "axiomatic-hold-qkm1r.firebasestorage.app",
  messagingSenderId: "596458113237",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app, "ai-studio-indiangstbilling-8ed369e5-37eb-431d-bd90-d9a0b7550636");

