

import { db, checkFirebase } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  getDoc,
  Timestamp
} from "firebase/firestore";
import { customerConverter, type Customer } from "./types";

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
    // Explicitly build the clean object
    const cleanCustomerData: Omit<Customer, 'id'> = {
        name: customerData.name,
        phone: customerData.phone,
        status: customerData.status || 'active',
        address: customerData.address || undefined,
        shopName: customerData.shopName || undefined,
        avatar: customerData.avatar || undefined,
        createdAt: customerData.createdAt || new Date(),
        updatedAt: new Date(),
        name_lowercase: customerData.name.toLowerCase(),
        shopName_lowercase: customerData.shopName ? customerData.shopName.toLowerCase() : undefined,
    };

    const tempCustomerForConversion: Customer = {
        id: 'temp', 
        ...cleanCustomerData,
    };
    const docRef = await addDoc(
      collection(db, 'customers').withConverter(customerConverter),
      tempCustomerForConversion
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
    
    // Clean the update data to remove undefined values
    const cleanData: { [key: string]: any } = {};
    for (const key in customerData) {
        if (Object.prototype.hasOwnProperty.call(customerData, key)) {
            const value = customerData[key as keyof typeof customerData];
            if (value !== undefined) {
                cleanData[key] = value;
            }
        }
    }

    await updateDoc(docRef, {
        ...cleanData,
        updatedAt: Timestamp.now()
    });
  },

  async deleteCustomer(id: string): Promise<void> {
    checkFirebase();
    const docRef = doc(db, 'customers', id);
    await deleteDoc(docRef);
  }
};
