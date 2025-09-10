import { db, checkFirebase } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { userConverter, type FirestoreUser, type User } from "./types";

export const UserService = {
  async getAllUsers(): Promise<User[]> {
    checkFirebase();
    const q = query(collection(db, 'users')).withConverter(userConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getUserById(id: string): Promise<User | null> {
    checkFirebase();
    const docRef = doc(db, 'users', id).withConverter(userConverter);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    checkFirebase();
    const q = query(
      collection(db, 'users').withConverter(userConverter),
      where('username', '==', username)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    return snapshot.docs[0].data();
  },

  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    checkFirebase();
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
        throw new Error("Username already exists.");
    }
    
    // Create a temporary full user object for the converter
    const tempUserForConversion: User = {
        id: 'temp', // This won't be saved
        ...userData
    };
    
    const dataWithTimestamp = userConverter.toFirestore(tempUserForConversion);
    
    const usersCollection = collection(db, 'users');
    const docRef = await addDoc(usersCollection, dataWithTimestamp);
    return docRef.id;
  },

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    checkFirebase();
    const docRef = doc(db, 'users', id);
    const dataToUpdate: any = {
      ...userData,
      updatedAt: Timestamp.now()
    };
    if (userData.password_hashed_or_plain === undefined) {
      delete dataToUpdate.password_hashed_or_plain;
    }
    await updateDoc(docRef, dataToUpdate);
  },
  
  async deleteUser(id: string): Promise<void> {
    checkFirebase();
    const docRef = doc(db, 'users', id);
    await deleteDoc(docRef);
  },
};
