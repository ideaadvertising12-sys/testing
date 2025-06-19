
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth"; // Added for Auth later

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
let auth: Auth; // Added for Auth later

// Check if Firebase has already been initialized
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error during initializeApp:", error);
    // Fallback or rethrow as appropriate for your error handling strategy
    throw error; // Rethrowing to make it clear initialization failed
  }
} else {
  app = getApp(); // If already initialized, get the existing app
}

try {
  db = getFirestore(app);
  auth = getAuth(app); // Initialize Auth
} catch (error) {
  console.error("Error getting Firestore or Auth instance:", error);
   // Fallback or rethrow
  throw error;
}

export { db, auth, app };
