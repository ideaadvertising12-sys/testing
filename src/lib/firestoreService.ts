
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
import { db } from './firebase'; // Your Firebase config file
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

// --- Product Services ---

const productsCollection = collection(db, 'products').withConverter(productConverter);

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(productsCollection, productData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product: ", error);
    throw new Error("Failed to add product.");
  }
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, 'products', productId).withConverter(productConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting product: ", error);
    throw new Error("Failed to get product.");
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error getting products: ", error);
    throw new Error("Failed to get products.");
  }
};

export const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'products', productId).withConverter(productConverter);
    // Ensure updatedAt is updated
    const dataToUpdate = { ...productData, updatedAt: Timestamp.now() } as Partial<FirestoreProduct>;
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating product: ", error);
    throw new Error("Failed to update product.");
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting product: ", error);
    throw new Error("Failed to delete product.");
  }
};

// --- Customer Services ---

const customersCollection = collection(db, 'customers').withConverter(customerConverter);

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(customersCollection, customerData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding customer: ", error);
    throw new Error("Failed to add customer.");
  }
};

export const getCustomer = async (customerId: string): Promise<Customer | null> => {
  try {
    const docRef = doc(db, 'customers', customerId).withConverter(customerConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting customer: ", error);
    throw new Error("Failed to get customer.");
  }
};

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const q = query(customersCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error getting customers: ", error);
    throw new Error("Failed to get customers.");
  }
};

export const updateCustomer = async (customerId: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'customers', customerId).withConverter(customerConverter);
    // Ensure updatedAt logic if you add an updatedAt field to Customer
    await updateDoc(docRef, customerData as Partial<FirestoreCustomer>);
  } catch (error) {
    console.error("Error updating customer: ", error);
    throw new Error("Failed to update customer.");
  }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'customers', customerId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting customer: ", error);
    throw new Error("Failed to delete customer.");
  }
};

// --- Sale Services ---

const salesCollection = collection(db, 'sales').withConverter(saleConverter);

export const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>): Promise<string> => {
  const batch = writeBatch(db);

  // 1. Create the sale document
  const saleDocRef = doc(salesCollection); // Auto-generate ID for the sale
  batch.set(saleDocRef, { ...saleData, saleDate: Timestamp.fromDate(saleData.saleDate) });

  // 2. Update product stock for each item in the sale
  for (const item of saleData.items) {
    const productRef = doc(db, 'products', item.id).withConverter(productConverter);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const currentStock = productSnap.data().stock;
      const newStock = currentStock - item.quantity;
      if (newStock < 0) {
        console.error(`Not enough stock for product ${item.name} (ID: ${item.id}). Available: ${currentStock}, Required: ${item.quantity}`);
        throw new Error(`Not enough stock for product ${item.name}. Transaction rolled back.`);
      }
      // Firestore Partial<Product> expects plain JS Date for updatedAt, converter handles Timestamp
      const productUpdateData: Partial<Product> = { stock: newStock, updatedAt: new Date() };
      batch.update(productRef, productUpdateData);
    } else {
      console.error(`Product with ID ${item.id} not found during sale processing.`);
      throw new Error(`Product ${item.name} not found. Transaction rolled back.`);
    }
  }

  try {
    await batch.commit();
    return saleDocRef.id;
  } catch (error) {
    console.error("Error adding sale and updating stock: ", error);
    throw new Error("Failed to add sale. Transaction rolled back.");
  }
};


export const getSale = async (saleId: string): Promise<Sale | null> => {
  try {
    const docRef = doc(db, 'sales', saleId).withConverter(saleConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting sale: ", error);
    throw new Error("Failed to get sale.");
  }
};

export const getSales = async (count = 20): Promise<Sale[]> => {
  try {
    const q = query(salesCollection, orderBy('saleDate', 'desc'), limit(count));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error getting sales: ", error);
    throw new Error("Failed to get sales.");
  }
};

// --- Stock Transaction Services ---
// (Placeholder for future implementation if needed, e.g., logging stock movements)
// For now, stock updates are handled directly within addSale or dedicated product stock update functions.
// We might need to enhance this if complex stock logging/auditing is required.

export const updateProductStock = async (productId: string, newStockLevel: number): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId).withConverter(productConverter);
    await updateDoc(productRef, { stock: newStockLevel, updatedAt: Timestamp.now() });
  } catch (error) {
    console.error(`Error updating stock for product ${productId}: `, error);
    throw new Error("Failed to update product stock.");
  }
};
