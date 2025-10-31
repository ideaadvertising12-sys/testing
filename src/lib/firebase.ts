import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  // Enable Firestore's built-in offline persistence
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one.
      // This is a normal scenario, no need to panic.
      console.warn("Firestore persistence failed: multiple tabs open?");
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence.
      console.warn("Firestore persistence not supported in this browser.");
    } else {
        console.error("Firestore persistence error:", err);
    }
  });
} catch (error) {
  console.error("Firebase initialization error", error);
}

export function checkFirebase() {
  if (!db) {
    const errorMessage = "Firestore database instance (db) is not available. Firebase might not be initialized correctly, possibly due to missing environment variables.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export { db };
