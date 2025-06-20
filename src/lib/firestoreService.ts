
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
  type CartItem, 
  type FirestoreCartItem, 
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
export const addSale = async (saleData: Omit<Sale, 'id' | 'saleDate' | 'items'> & { saleDate: Date, items: CartItem[] }): Promise<string> => {
  checkFirebase();
  const batch = writeBatch(db);
  const salesCol = collection(db, "sales");
  const saleDocRef = doc(salesCol); 
  
  const firestoreSaleItems: FirestoreCartItem[] = saleData.items.map(item => {
    const firestoreItem: FirestoreCartItem = {
      productRef: doc(db, "products", item.id).path, 
      quantity: item.quantity,
      appliedPrice: item.appliedPrice,
      saleType: item.saleType,
      productName: item.name, 
      productCategory: item.category,
      productPrice: item.price, 
      isOfferItem: item.isOfferItem || false, 
    };

    if (item.sku !== undefined) {
      firestoreItem.productSku = item.sku;
    }
    return firestoreItem;
  });

  const firestoreSaleData: FirestoreSale = {
    items: firestoreSaleItems,
    subTotal: saleData.subTotal,
    discountPercentage: saleData.discountPercentage,
    discountAmount: saleData.discountAmount,
    totalAmount: saleData.totalAmount,
    paymentMethod: saleData.paymentMethod,
    saleDate: Timestamp.fromDate(saleData.saleDate),
    staffId: saleData.staffId,
    offerApplied: saleData.offerApplied || false,
    createdAt: Timestamp.now(), 
    updatedAt: Timestamp.now()  
  };

  // Optional fields for the main sale document
  if (saleData.customerId !== undefined) firestoreSaleData.customerId = saleData.customerId;
  if (saleData.customerName !== undefined) firestoreSaleData.customerName = saleData.customerName;
  if (saleData.cashGiven !== undefined) firestoreSaleData.cashGiven = saleData.cashGiven;
  if (saleData.balanceReturned !== undefined) firestoreSaleData.balanceReturned = saleData.balanceReturned;
  if (saleData.amountPaidOnCredit !== undefined) firestoreSaleData.amountPaidOnCredit = saleData.amountPaidOnCredit;
  if (saleData.remainingCreditBalance !== undefined) firestoreSaleData.remainingCreditBalance = saleData.remainingCreditBalance;

  batch.set(saleDocRef, firestoreSaleData);

  for (const item of saleData.items) {
    if (!item.isOfferItem) { 
      const productDocRefToUpdate = doc(db, "products", item.id);
      const productSnap = await getDoc(productDocRefToUpdate.withConverter(productConverter));
      if (productSnap.exists()) {
        const currentProduct = productSnap.data();
        const newStock = currentProduct.stock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${item.name} (ID: ${item.id}). Available: ${currentProduct.stock}, Tried to sell: ${item.quantity}`);
        }
        batch.update(productDocRefToUpdate, { stock: newStock, updatedAt: Timestamp.now() });
      } else {
        throw new Error(`Product ${item.name} (ID: ${item.id}) not found for stock update.`);
      }
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

export const updateProductStock = async (productId: string, newStockLevel: number): Promise<void> => {
  checkFirebase();
  const productDocRef = doc(db, "products", productId);
  await updateDoc(productDocRef, { 
    stock: newStockLevel,
    updatedAt: serverTimestamp() 
  });
};

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

