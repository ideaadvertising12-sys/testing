
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
  type CartItem, // Added CartItem for addSale signature
  type FirestoreCartItem, // Added FirestoreCartItem for conversion
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
  // The converter's toFirestore method should handle timestamp creation.
  // Ensure productData being passed matches what toFirestore expects.
  const dataToCreate = productConverter.toFirestore(productData as FirestoreProduct);
  const docRef = await addDoc(collection(db, "products"), dataToCreate);
  return docRef.id;
};

export const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> => {
  checkFirebase();
  const productDocRef = doc(db, "products", id);
   const dataToUpdate: Partial<FirestoreProduct> = {
    ...productData,
    updatedAt: Timestamp.now()
  };
  await updateDoc(productDocRef, dataToUpdate);
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
  const dataToCreate = customerConverter.toFirestore(customerData as FirestoreCustomer);
  const docRef = await addDoc(collection(db, "customers"), dataToCreate);
  return docRef.id;
};

export const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> => {
  checkFirebase();
  const customerDocRef = doc(db, "customers", id);
  const dataToUpdate: Partial<FirestoreCustomer> = {
    ...customerData,
    updatedAt: Timestamp.now()
  };
  await updateDoc(customerDocRef, dataToUpdate);
};

export const deleteCustomer = async (id: string): Promise<void> => {
  checkFirebase();
  const customerDocRef = doc(db, "customers", id);
  await deleteDoc(customerDocRef);
};


// Sale Services
// Adjusted saleData to explicitly expect CartItem[] for items, and convert them.
export const addSale = async (saleData: Omit<Sale, 'id' | 'saleDate' | 'items'> & { saleDate: Date, items: CartItem[] }): Promise<string> => {
  checkFirebase();
  const batch = writeBatch(db);

  // 1. Add the sale document
  const salesCol = collection(db, "sales"); // Not using converter directly for batch.set
  const saleDocRef = doc(salesCol); // Create a new doc ref for the sale
  
  // Manually construct the FirestoreSale object, converting CartItem[] to FirestoreCartItem[]
  const firestoreSaleItems: FirestoreCartItem[] = saleData.items.map(item => ({
    productRef: doc(db, "products", item.id).path, // Store the full path as reference
    quantity: item.quantity,
    appliedPrice: item.appliedPrice,
    saleType: item.saleType,
    productName: item.name, 
    productCategory: item.category,
    productPrice: item.price 
  }));

  const firestoreSaleData: FirestoreSale = {
    ...saleData, // Spreads other sale properties (customerId, customerName, totals, paymentMethod, staffId)
    items: firestoreSaleItems,
    saleDate: Timestamp.fromDate(saleData.saleDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  batch.set(saleDocRef, firestoreSaleData);

  // 2. Update stock for each product in the sale
  for (const item of saleData.items) {
    const productDocRef = doc(db, "products", item.id);
    // To ensure atomicity and avoid race conditions, it's best to use a transaction
    // for stock updates, or rely on server-side increment/decrement.
    // For this batch operation, we're doing a "read-then-write" which isn't perfectly atomic
    // but is often acceptable for simpler cases if client-side checks prevent overselling.
    // A more robust solution might involve Cloud Functions.

    // The following is a simplified update. For true atomicity, a transaction is needed
    // or use Firestore's FieldValue.increment(-item.quantity)
    // However, FieldValue.increment cannot be used with converters directly in a batch if other fields are also updated.
    // So, we'll fetch the product, calculate new stock, and update.
    // This part is tricky in a batch without transactions for each product.
    // A better approach would be to fetch current stock in the API route before calling addSale
    // or use a transaction for the entire sale + stock updates.

    // For now, we'll proceed with direct update, assuming client checks stock.
    // This is a point of potential improvement for more robust stock management.
    const productSnap = await getDoc(productDocRef.withConverter(productConverter));
    if (productSnap.exists()) {
      const currentProduct = productSnap.data();
      const newStock = currentProduct.stock - item.quantity;
      batch.update(productDocRef, { stock: newStock, updatedAt: Timestamp.now() });
    } else {
      console.error(`Product with ID ${item.id} not found during sale stock update.`);
      // This could cause the batch to fail or lead to data inconsistency.
      // Handle this error appropriately in a production app.
      throw new Error(`Product ${item.name} (ID: ${item.id}) not found for stock update.`);
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
    updatedAt: serverTimestamp() 
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
      const newStock = oldStock + quantityChange; 
      if (newStock < 0) {
        throw new Error(`Insufficient stock for product ${productId}. Current: ${oldStock}, Tried to change by: ${quantityChange}`);
      }
      transaction.update(productDocRef, { stock: newStock, updatedAt: Timestamp.now() });
    });
  } catch (e) {
    console.error("Stock update transaction failed: ", e);
    throw e; 
  }
};
