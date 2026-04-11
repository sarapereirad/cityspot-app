import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWePnoQL012cpbXOQP-SB8rIBfFA5uhuI",
  authDomain: "cityspot-211d5.firebaseapp.com",
  projectId: "cityspot-211d5",
  storageBucket: "cityspot-211d5.firebasestorage.app",
  messagingSenderId: "140772304030",
  appId: "1:140772304030:web:ac6ac871123b5a9480878f",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
