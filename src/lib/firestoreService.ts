

import { db, checkFirebase } from "./firebase";
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
  runTransaction,
  setDoc,
  arrayUnion,
  DocumentReference,
  query,
  onSnapshot,
  orderBy,
  increment,
  limit,
  QueryDocumentSnapshot,
  startAfter,
  where
} from "firebase/firestore";
import { format } from 'date-fns';
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
  type FirestoreCustomer,
  type ChequeInfo,
  type FirestoreChequeInfo,
  type BankTransferInfo,
  type FirestoreBankTransferInfo,
  type StockTransaction,
  stockTransactionConverter,
  type ReturnTransaction,
  returnTransactionConverter,
  type FirestoreReturnTransaction,
  type Payment,
  type FirestorePayment,
  expenseConverter,
  type Expense,
} from "./types";
import type { DateRange } from "react-day-picker";

const PAGE_SIZE = 50;

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
  const tempProductForConversion: Product = { id: 'temp', ...productData };
  const docRef = await addDoc(collection(db, "products").withConverter(productConverter), tempProductForConversion);
  return docRef.id;
};

export const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> => {
  checkFirebase();
  const productDocRef = doc(db, "products", id);
  const dataWithTimestamp = {
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
  const q = query(customersCol, orderBy("createdAt", "desc"));
  const customerSnapshot = await getDocs(q);
  return customerSnapshot.docs.map(doc => doc.data());
};


export const getPaginatedCustomers = async (lastVisible?: QueryDocumentSnapshot<Customer>): Promise<{ customers: Customer[], lastVisible: QueryDocumentSnapshot<Customer> | null }> => {
  checkFirebase();
  const customersCol = collection(db, "customers").withConverter(customerConverter);
  const constraints = [
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
  ];
  if (lastVisible) {
      constraints.splice(1, 0, startAfter(lastVisible));
  }
  const q = query(customersCol, ...constraints);
  const customerSnapshot = await getDocs(q);
  
  const customers = customerSnapshot.docs.map(doc => doc.data());
  const newLastVisible = customerSnapshot.docs[customerSnapshot.docs.length - 1] || null;

  return { customers, lastVisible: newLastVisible };
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  checkFirebase();
  const customerDocRef = doc(db, "customers", id).withConverter(customerConverter);
  const customerSnap = await getDoc(customerDocRef);
  return customerSnap.exists() ? customerSnap.data() : null;
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<string> => {
  checkFirebase();
  const tempCustomerForConversion: Customer = { id: 'temp', ...customerData, createdAt: new Date(), updatedAt: new Date() };
  const docRef = await addDoc(collection(db, "customers").withConverter(customerConverter), tempCustomerForConversion);
  return docRef.id;
};

export const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> => {
  checkFirebase();
  const customerDocRef = doc(db, "customers", id);
  const dataWithTimestamp = {
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

async function generateCustomSaleId(): Promise<string> {
  checkFirebase();
  const today = new Date();
  const datePart = format(today, "MMdd"); // Format: MMDD
  const counterDocId = format(today, "yyyy-MM-dd"); // Doc ID for the counter for a specific day

  const counterRef = doc(db, "dailySalesCounters", counterDocId);

  try {
    const newCount = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists() || counterDoc.data()?.count === undefined) {
        transaction.set(counterRef, { count: 1 });
        return 1;
      } else {
        const currentCount = counterDoc.data()?.count;
        const newCount = (typeof currentCount === 'number' ? currentCount : 0) + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
      }
    });
    return `sale-${datePart}-${newCount}`;
  } catch (e) {
    console.error("Custom sale ID transaction failed: ", e);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `sale-${datePart}-err-${randomPart}`;
  }
}

export const addSale = async (saleData: Omit<Sale, 'id'>): Promise<string> => {
  checkFirebase();
  const newCustomId = await generateCustomSaleId();
  
  await runTransaction(db, async (transaction) => {
    const saleDocRef = doc(db, "sales", newCustomId);
    
    const productQuantities = new Map<string, number>();
    for (const item of saleData.items) {
      if (!item.isOfferItem) {
          const currentQuantity = productQuantities.get(item.id) || 0;
          productQuantities.set(item.id, currentQuantity + item.quantity);
      }
    }
  
    const productReads: Promise<any>[] = [];
    const productRefs: DocumentReference[] = [];
    for (const productId of productQuantities.keys()) {
        const productRef = doc(db, 'products', productId).withConverter(productConverter);
        productRefs.push(productRef);
        productReads.push(transaction.get(productRef));
    }
    const productDocs = await Promise.all(productReads);

    for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        const productRef = productRefs[i];
        const totalQuantitySold = productQuantities.get(productRef.id);

        if (!productDoc.exists()) {
            throw new Error(`Product with ID ${productRef.id} not found.`);
        }
        const currentProduct = productDoc.data();
        if (totalQuantitySold === undefined) continue;

        if (saleData.vehicleId) {
            const transactionData: Omit<StockTransaction, 'id'> = {
              productId: productRef.id,
              productName: currentProduct.name,
              productSku: currentProduct.sku,
              type: 'UNLOAD_FROM_VEHICLE',
              quantity: totalQuantitySold,
              previousStock: currentProduct.stock,
              newStock: currentProduct.stock,
              transactionDate: saleData.saleDate,
              notes: `Sale: ${newCustomId}`,
              vehicleId: saleData.vehicleId,
              userId: saleData.staffId,
            };
            const txDocRef = doc(collection(db, "stockTransactions"));
            const firestoreTx = stockTransactionConverter.toFirestore({ id: 'temp', ...transactionData });
            transaction.set(txDocRef, firestoreTx);
        } else {
            const newStock = currentProduct.stock - totalQuantitySold;
            if (newStock < 0) {
                throw new Error(`Insufficient stock for ${currentProduct.name}. Available: ${currentProduct.stock}, Tried to sell: ${totalQuantitySold}`);
            }
            transaction.update(productRef, { stock: newStock, updatedAt: Timestamp.now() });
        }
    }
    
    const saleObjectForConversion: Sale = { id: newCustomId, ...saleData };
    const firestoreSaleData = saleConverter.toFirestore(saleObjectForConversion);
    transaction.set(saleDocRef, firestoreSaleData);
  });

  return newCustomId;
};

export const getSales = async (lastVisible?: QueryDocumentSnapshot<Sale> | undefined, dateRange?: DateRange, staffId?: string): Promise<{ sales: Sale[], lastVisible: QueryDocumentSnapshot<Sale> | null }> => {
  checkFirebase();
  const salesCol = collection(db, "sales").withConverter(saleConverter);
  
  const constraints: any[] = [orderBy("saleDate", "desc")];
  if(dateRange?.from) constraints.push(where("saleDate", ">=", dateRange.from));
  if(dateRange?.to) constraints.push(where("saleDate", "<=", dateRange.to));
  if(staffId) constraints.push(where("staffId", "==", staffId));
  
  // If lastVisible is not provided, we don't paginate (fetch all)
  if (lastVisible !== undefined) {
    constraints.push(limit(PAGE_SIZE));
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }
  }


  const q = query(salesCol, ...constraints);

  const salesSnapshot = await getDocs(q);
  
  const sales = salesSnapshot.docs.map(doc => doc.data());
  const newLastVisible = salesSnapshot.docs[salesSnapshot.docs.length - 1] || null;

  return { sales, lastVisible: newLastVisible };
};


export const getReturns = async (lastVisible?: QueryDocumentSnapshot<ReturnTransaction>, dateRange?: DateRange, staffId?: string): Promise<{ returns: ReturnTransaction[], lastVisible: QueryDocumentSnapshot<ReturnTransaction> | null }> => {
  checkFirebase();
  const returnsCol = collection(db, "returns").withConverter(returnTransactionConverter);

  const constraints: any[] = [orderBy("returnDate", "desc")];
  if(dateRange?.from) constraints.push(where("returnDate", ">=", dateRange.from));
  if(dateRange?.to) constraints.push(where("returnDate", "<=", dateRange.to));
  if(staffId) constraints.push(where("staffId", "==", staffId));
  if(lastVisible) constraints.push(startAfter(lastVisible));
  constraints.push(limit(PAGE_SIZE));
  
  const q = query(returnsCol, ...constraints);
  
  const returnsSnapshot = await getDocs(q);

  const returns = returnsSnapshot.docs.map(doc => doc.data());
  const newLastVisible = returnsSnapshot.docs[returnsSnapshot.docs.length - 1] || null;
  
  return { returns, lastVisible: newLastVisible };
};

export const getExpenses = async (dateRange?: DateRange, staffId?: string): Promise<Expense[]> => {
  checkFirebase();
  const expensesCol = collection(db, "expenses").withConverter(expenseConverter);

  const constraints: any[] = [orderBy("expenseDate", "desc")];
  if (dateRange?.from) constraints.push(where("expenseDate", ">=", dateRange.from));
  if (dateRange?.to) constraints.push(where("expenseDate", "<=", dateRange.to));
  if (staffId) constraints.push(where("staffId", "==", staffId));

  const q = query(expensesCol, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
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
