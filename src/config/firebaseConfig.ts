import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBWSGcvn-hlzPGSyC0o00CQhoJTUyvjwPM",
  authDomain: "bluehotel-2026.firebaseapp.com",
  projectId: "bluehotel-2026",
  storageBucket: "bluehotel-2026.firebasestorage.app",
  messagingSenderId: "210433821402",
  appId: "1:210433821402:web:92618675f996d179ce73e3",
  measurementId: "G-LT9T2QXM3M"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;