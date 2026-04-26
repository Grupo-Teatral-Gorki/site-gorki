import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with explicit settings to prevent offline detection issues
export const db = initializeFirestore(app, {
  cacheSizeBytes: 10 * 1024 * 1024, // 10 MB
});

// Enable persistence but don't fail if it fails
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('Firestore persistence not supported');
    }
  });
}

export const storage = getStorage(app);
