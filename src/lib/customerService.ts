
import { db, checkFirebase } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  onSnapshot,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { customerConverter, FirestoreCustomer, Customer } from "./types";

export const CustomerService = {
  async getAllCustomers(): Promise<Customer[]> {
    checkFirebase();
    const q = query(collection(db, 'customers')).withConverter(customerConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    checkFirebase();
    const docRef = doc(db, 'customers', id).withConverter(customerConverter);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    checkFirebase();
    const docRef = await addDoc(
      collection(db, 'customers').withConverter(customerConverter),
      customerData
    );
    const newDocSnap = await getDoc(docRef.withConverter(customerConverter));
    if (!newDocSnap.exists()) {
        throw new Error("Failed to create and fetch the new customer.");
    }
    return newDocSnap.data();
  },

  async updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
    checkFirebase();
    const docRef = doc(db, 'customers', id);
    // Directly pass partial data along with the timestamp. Firestore handles it.
    await updateDoc(docRef, {
        ...customerData,
        updatedAt: Timestamp.now()
    });
  },

  async deleteCustomer(id: string): Promise<void> {
    checkFirebase();
    const docRef = doc(db, 'customers', id);
    await deleteDoc(docRef);
  },

  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    checkFirebase();
    const q = query(collection(db, 'customers')).withConverter(customerConverter);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customers = snapshot.docs.map(docSnapshot => docSnapshot.data());
      callback(customers);
    }, (error) => {
      console.error("Error subscribing to customers:", error);
    });
    return unsubscribe;
  }
};
