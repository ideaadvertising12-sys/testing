
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: Error | null = null;

if (typeof window !== "undefined" || !getApps().length) { // Ensure this runs once, typically server-side for API routes or client-side.
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    const detail = !firebaseConfig.projectId ? "projectId" : "apiKey";
    firebaseInitializationError = new Error(
      `Firebase ${detail} is not defined. Please check your .env.local file and corresponding NEXT_PUBLIC_FIREBASE_ variable.`
    );
    console.error(firebaseInitializationError.message);
  } else {
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }
    } catch (e) {
      firebaseInitializationError = e instanceof Error ? e : new Error("Failed to initialize Firebase app: " + String(e));
      console.error("Firebase initialization error during initializeApp:", firebaseInitializationError);
      app = null;
    }
  }
} else {
  app = getApp();
}

if (app && !firebaseInitializationError) {
  try {
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    firebaseInitializationError = e instanceof Error ? e : new Error("Failed to get Firestore/Auth instance: " + String(e));
    console.error("Error getting Firestore or Auth instance:", firebaseInitializationError);
    db = null;
    auth = null;
  }
} else if (!app && !firebaseInitializationError) {
    firebaseInitializationError = new Error("Firebase app was not properly initialized or retrieved, but no specific error was caught during initialization attempts.");
    console.error(firebaseInitializationError.message);
}

export { db, auth, app, firebaseInitializationError };
