import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-XPZaxdBEi_eY0fBnJi_gTOADbDqUT4c",
  authDomain: "m2gdp-g3-log-3963b.firebaseapp.com",
  projectId: "m2gdp-g3-log-3963b",
  storageBucket: "m2gdp-g3-log-3963b.firebasestorage.app",
  messagingSenderId: "170698978374",
  appId: "1:170698978374:web:958cd526f88285ec990647"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);