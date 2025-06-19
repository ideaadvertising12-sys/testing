
import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  runTransaction
} from "firebase/firestore";
import { 
  productConverter, 
  type Product, 
  type FirestoreProduct,
  saleConverter,
  type Sale,
  type FirestoreSale,
  customerConverter,
  type Customer,
  type FirestoreCustomer
} from "./types";


function checkFirebase() {
  if (!db) {
    console.error("Firestore database instance (db) is not available. Firebase might not be initialized correctly or there was an initialization error.");
    throw new Error("Firestore database instance is not available. Firebase might not be initialized correctly or there was an initialization error.");
  }
}

// Product Services
export const getProducts = async (): Promise<Product[]> => {
  checkFirebase();
  const productsCol = collection(db, "products").withConverter(productConverter);
  const productSnapshot = await getDocs(productsCol);
  return productSnapshot.docs.map(doc => doc.data());
};

export const getProduct = async (id: string): Promise<Product | null> => {
  checkFirebase();
  const productDocRef = doc(db, "products", id).withConverter(productConverter);
  const productSnap = await getDoc(productDocRef);
  return productSnap.exists() ? productSnap.data() : null;
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
  checkFirebase();
  const productsCol = collection(db, "products").withConverter(productConverter);
  // FirestoreProduct includes timestamps, Omit<Product, 'id'> does not explicitly
  const dataWithTimestamps: FirestoreProduct = {
    ...productData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  const docRef = await addDoc(productsCol, dataWithTimestamps);
  return docRef.id;
};

export const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> => {
  checkFirebase();
  const productDocRef = doc(db, "products", id).withConverter(productConverter);
  const dataWithTimestamp: Partial<FirestoreProduct> = {
    ...productData,
    updatedAt: Timestamp.now()
  };
  await updateDoc(productDocRef, dataWithTimestamp);
};

export const deleteProduct = async (id: string): Promise<void> => {
  checkFirebase();
  const productDocRef = doc(db, "products", id);
  await deleteDoc(productDocRef);
};

// Customer Services
export const getCustomers = async (): Promise<Customer[]> => {
  checkFirebase();
  const customersCol = collection(db, "customers").withConverter(customerConverter);
  const customerSnapshot = await getDocs(customersCol);
  return customerSnapshot.docs.map(doc => doc.data());
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  checkFirebase();
  const customerDocRef = doc(db, "customers", id).withConverter(customerConverter);
  const customerSnap = await getDoc(customerDocRef);
  return customerSnap.exists() ? customerSnap.data() : null;
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<string> => {
  checkFirebase();
  const customersCol = collection(db, "customers").withConverter(customerConverter);
  const dataWithTimestamps: FirestoreCustomer = {
    ...customerData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now() // Added updatedAt for consistency
  };
  const docRef = await addDoc(customersCol, dataWithTimestamps);
  return docRef.id;
};

export const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> => {
  checkFirebase();
  const customerDocRef = doc(db, "customers", id).withConverter(customerConverter);
   const dataWithTimestamp: Partial<FirestoreCustomer> = {
    ...customerData,
    updatedAt: Timestamp.now()
  };
  await updateDoc(customerDocRef, dataWithTimestamp);
};

export const deleteCustomer = async (id: string): Promise<void> => {
  checkFirebase();
  const customerDocRef = doc(db, "customers", id);
  await deleteDoc(customerDocRef);
};


// Sale Services
export const addSale = async (saleData: Omit<Sale, 'id' | 'saleDate'> & { saleDate: Date }): Promise<string> => {
  checkFirebase();
  const batch = writeBatch(db);

  // 1. Add the sale document
  const salesCol = collection(db, "sales").withConverter(saleConverter);
  const saleDocRef = doc(salesCol); // Create a new doc ref for the sale
  
  const firestoreSaleData: FirestoreSale = {
    ...saleData,
    saleDate: Timestamp.fromDate(saleData.saleDate), // Convert Date to Timestamp
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  batch.set(saleDocRef, firestoreSaleData);

  // 2. Update stock for each product in the sale
  for (const item of saleData.items) {
    const productDocRef = doc(db, "products", item.id).withConverter(productConverter);
    // It's generally safer to read the current stock and decrement atomically,
    // but for simplicity in batch, we assume client-side stock check was sufficient.
    // For truly atomic stock updates with read, use a transaction instead of a batch for this part.
    
    // Fetch current product to get current stock
    const productSnap = await getDoc(productDocRef);
    if (productSnap.exists()) {
      const currentProduct = productSnap.data();
      const newStock = currentProduct.stock - item.quantity;
      if (newStock < 0) {
        console.warn(`Stock for product ${item.id} (${item.name}) would go negative. Sale might be problematic.`);
        // Decide how to handle this: throw error, log, or proceed with negative stock (not recommended)
        // For now, we'll proceed but log a warning. A transaction would be better here.
      }
      batch.update(productDocRef, { stock: newStock, updatedAt: Timestamp.now() });
    } else {
      console.error(`Product with ID ${item.id} not found during sale stock update.`);
      // This would cause the batch to fail if we throw here, or data inconsistency.
      // Consider how to handle this error case (e.g., rollback or specific error reporting).
    }
  }

  await batch.commit();
  return saleDocRef.id;
};


export const getSales = async (): Promise<Sale[]> => {
  checkFirebase();
  const salesCol = collection(db, "sales").withConverter(saleConverter);
  const salesSnapshot = await getDocs(salesCol);
  return salesSnapshot.docs.map(doc => doc.data());
};

// More specific stock update, could be used for manual adjustments
export const updateProductStock = async (productId: string, newStockLevel: number): Promise<void> => {
  checkFirebase();
  const productDocRef = doc(db, "products", productId);
  await updateDoc(productDocRef, { 
    stock: newStockLevel,
    updatedAt: serverTimestamp() // Use serverTimestamp for accuracy
  });
};

// Transactional stock update (safer for concurrent operations)
export const updateProductStockTransactional = async (productId: string, quantityChange: number): Promise<void> => {
  checkFirebase();
  const productDocRef = doc(db, "products", productId);
  try {
    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productDocRef.withConverter(productConverter));
      if (!productSnap.exists()) {
        throw new Error(`Product with ID ${productId} does not exist!`);
      }
      const oldStock = productSnap.data().stock;
      const newStock = oldStock + quantityChange; // quantityChange can be negative for decrease
      if (newStock < 0) {
        throw new Error(`Insufficient stock for product ${productId}. Current: ${oldStock}, Tried to change by: ${quantityChange}`);
      }
      transaction.update(productDocRef, { stock: newStock, updatedAt: Timestamp.now() });
    });
  } catch (e) {
    console.error("Stock update transaction failed: ", e);
    throw e; // Re-throw the error to be handled by the caller
  }
};

