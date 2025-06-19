
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  WriteBatch,
  writeBatch
} from 'firebase/firestore';
import { db, firebaseInitializationError } from './firebase'; // Your Firebase config file
import {
  type Product,
  type Customer,
  type Sale,
  type FirestoreProduct,
  type FirestoreCustomer,
  type FirestoreSale,
  productConverter,
  customerConverter,
  saleConverter
} from './types';

function checkFirestoreInitialization() {
  if (firebaseInitializationError) {
    console.error("Firestore Initialization Error in service:", firebaseInitializationError.message);
    throw new Error(`Firestore is not initialized: ${firebaseInitializationError.message}`);
  }
  if (!db) {
    console.error("Firestore database instance is not available in service.");
    throw new Error("Firestore database instance is not available. Initialization might have failed.");
  }
}

// --- Product Services ---

const productsCollection = collection(db!, 'products').withConverter(productConverter); // Added non-null assertion assuming checkFirestoreInitialization handles null db

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  checkFirestoreInitialization();
  try {
    const docRef = await addDoc(productsCollection, productData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product in service: ", error);
    throw new Error("Failed to add product in service.");
  }
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  checkFirestoreInitialization();
  try {
    const docRef = doc(db!, 'products', productId).withConverter(productConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting product in service: ", error);
    throw new Error("Failed to get product in service.");
  }
};

export const getProducts = async (): Promise<Product[]> => {
  checkFirestoreInitialization();
  try {
    const q = query(productsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error getting products in service: ", error);
    throw new Error("Failed to get products in service.");
  }
};

export const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  checkFirestoreInitialization();
  try {
    const docRef = doc(db!, 'products', productId).withConverter(productConverter);
    const dataToUpdate: Partial<FirestoreProduct> = {
      ...productData,
      updatedAt: Timestamp.now()
    };
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating product in service: ", error);
    throw new Error("Failed to update product in service.");
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  checkFirestoreInitialization();
  try {
    const docRef = doc(db!, 'products', productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting product in service: ", error);
    throw new Error("Failed to delete product in service.");
  }
};

// --- Customer Services ---

const customersCollection = collection(db!, 'customers').withConverter(customerConverter);

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<string> => {
  checkFirestoreInitialization();
  try {
    const docRef = await addDoc(customersCollection, customerData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding customer in service: ", error);
    throw new Error("Failed to add customer in service.");
  }
};

export const getCustomer = async (customerId: string): Promise<Customer | null> => {
  checkFirestoreInitialization();
  try {
    const docRef = doc(db!, 'customers', customerId).withConverter(customerConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting customer in service: ", error);
    throw new Error("Failed to get customer in service.");
  }
};

export const getCustomers = async (): Promise<Customer[]> => {
  checkFirestoreInitialization();
  try {
    const q = query(customersCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error getting customers in service: ", error);
    throw new Error("Failed to get customers in service.");
  }
};

export const updateCustomer = async (customerId: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void> => {
  checkFirestoreInitialization();
  try {
    const docRef = doc(db!, 'customers', customerId).withConverter(customerConverter);
    await updateDoc(docRef, customerData as Partial<FirestoreCustomer>);
  } catch (error) {
    console.error("Error updating customer in service: ", error);
    throw new Error("Failed to update customer in service.");
  }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  checkFirestoreInitialization();
  try {
    const docRef = doc(db!, 'customers', customerId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting customer in service: ", error);
    throw new Error("Failed to delete customer in service.");
  }
};

// --- Sale Services ---

const salesCollection = collection(db!, 'sales').withConverter(saleConverter);

export const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>): Promise<string> => {
  checkFirestoreInitialization();
  const batch = writeBatch(db!);

  const saleDocRef = doc(salesCollection);
  batch.set(saleDocRef, saleData);

  for (const item of saleData.items) {
    const productRef = doc(db!, 'products', item.id).withConverter(productConverter);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const currentStock = productSnap.data().stock;
      const newStock = currentStock - item.quantity;
      if (newStock < 0) {
        console.error(`Not enough stock for product ${item.name} (ID: ${item.id}). Available: ${currentStock}, Required: ${item.quantity}`);
        throw new Error(`Not enough stock for product ${item.name}. Transaction rolled back.`);
      }
      const productUpdateData = { stock: newStock };
      batch.update(productRef, { ...productUpdateData, updatedAt: Timestamp.now() } as Partial<FirestoreProduct>);
    } else {
      console.error(`Product with ID ${item.id} not found during sale processing.`);
      throw new Error(`Product ${item.name} not found. Transaction rolled back.`);
    }
  }

  try {
    await batch.commit();
    return saleDocRef.id;
  } catch (error) {
    console.error("Error adding sale and updating stock in service: ", error);
    throw new Error("Failed to add sale in service. Transaction rolled back.");
  }
};


export const getSale = async (saleId: string): Promise<Sale | null> => {
  checkFirestoreInitialization();
  try {
    const docRef = doc(db!, 'sales', saleId).withConverter(saleConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting sale in service: ", error);
    throw new Error("Failed to get sale in service.");
  }
};

export const getSales = async (count = 20): Promise<Sale[]> => {
  checkFirestoreInitialization();
  try {
    const q = query(salesCollection, orderBy('saleDate', 'desc'), limit(count));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error getting sales in service: ", error);
    throw new Error("Failed to get sales in service.");
  }
};

// --- Stock Transaction Services ---
export const updateProductStock = async (productId: string, newStockLevel: number): Promise<void> => {
  checkFirestoreInitialization();
  try {
    const productRef = doc(db!, 'products', productId).withConverter(productConverter);
    await updateDoc(productRef, { stock: newStockLevel, updatedAt: Timestamp.now() } as Partial<FirestoreProduct>);
  } catch (error) {
    console.error(`Error updating stock for product ${productId} in service: `, error);
    throw new Error("Failed to update product stock in service.");
  }
};
