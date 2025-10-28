

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
  const tempCustomerForConversion: Customer = { id: 'temp', ...customerData };
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
    
    // --- START: New Robust Stock Update Logic ---
    const productQuantities = new Map<string, number>();
    for (const item of saleData.items) {
      if (!item.isOfferItem) {
          const currentQuantity = productQuantities.get(item.id) || 0;
          productQuantities.set(item.id, currentQuantity + item.quantity);
      }
    }
  
    // Pre-read all product documents to check stock availability
    const productReads: Promise<any>[] = [];
    const productRefs: DocumentReference[] = [];
    for (const productId of productQuantities.keys()) {
        const productRef = doc(db, 'products', productId).withConverter(productConverter);
        productRefs.push(productRef);
        productReads.push(transaction.get(productRef));
    }
    const productDocs = await Promise.all(productReads);

    // Now, write updates
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
              previousStock: currentProduct.stock, // Main inventory stock is unchanged
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
    
    // Set the sale document
    const saleObjectForConversion: Sale = { id: newCustomId, ...saleData };
    const firestoreSaleData = saleConverter.toFirestore(saleObjectForConversion);
    transaction.set(saleDocRef, firestoreSaleData);
  });

  return newCustomId;
};

const SALES_PAGE_SIZE = 50;
export const getSales = async (lastVisible?: QueryDocumentSnapshot<Sale>): Promise<{ sales: Sale[], lastVisible: QueryDocumentSnapshot<Sale> | null }> => {
  checkFirebase();
  const salesCol = collection(db, "sales").withConverter(saleConverter);
  
  const q = lastVisible 
    ? query(salesCol, orderBy("saleDate", "desc"), startAfter(lastVisible), limit(SALES_PAGE_SIZE))
    : query(salesCol, orderBy("saleDate", "desc"), limit(SALES_PAGE_SIZE));

  const salesSnapshot = await getDocs(q);
  
  const sales = salesSnapshot.docs.map(doc => doc.data());
  const newLastVisible = salesSnapshot.docs[salesSnapshot.docs.length - 1] || null;

  return { sales, lastVisible: newLastVisible };
};


export const getReturns = async (): Promise<ReturnTransaction[]> => {
  checkFirebase();
  const returnsCol = collection(db, "returns").withConverter(returnTransactionConverter);
  const returnsSnapshot = await getDocs(returnsCol);
  return returnsSnapshot.docs.map(doc => doc.data());
};

export const getExpenses = async (): Promise<Expense[]> => {
  checkFirebase();
  const q = query(collection(db, "expenses"), orderBy("expenseDate", "desc")).withConverter(expenseConverter);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};


// Return Services

async function generateCustomReturnId(): Promise<string> {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return randomNumber.toString();
}

interface ProcessReturnArgs {
  saleId: string;
  returnedItems: (CartItem & { isResellable: boolean })[];
  exchangedItems: CartItem[];
  staffId: string;
  customerId?: string;
  customerName?: string;
  customerShopName?: string;
  settleOutstandingAmount?: number;
  refundAmount?: number;
  cashPaidOut?: number;
  payment?: {
    amountPaid: number;
    paymentSummary: string;
    changeGiven?: number;
    chequeDetails?: ChequeInfo;
    bankTransferDetails?: BankTransferInfo;
  };
  vehicleId?: string;
}

export const processReturnTransaction = async ({
  saleId,
  returnedItems,
  exchangedItems,
  staffId,
  customerId,
  customerName,
  customerShopName,
  settleOutstandingAmount,
  refundAmount,
  cashPaidOut,
  payment,
  vehicleId,
}: ProcessReturnArgs): Promise<{ returnId: string, returnData: ReturnTransaction }> => {
  checkFirebase();
  const returnId = await generateCustomReturnId();
  let finalReturnData: ReturnTransaction | null = null;
  
  await runTransaction(db, async (transaction) => {
    // 1. READ ORIGINAL SALE
    const saleRef = doc(db, 'sales', saleId).withConverter(saleConverter);
    const saleDoc = await transaction.get(saleRef);
    if (!saleDoc.exists()) {
      throw new Error(`Sale with ID ${saleId} not found.`);
    }
    const currentSaleData = saleDoc.data();

    // 2. SETTLE OUTSTANDING BALANCE IF APPLICABLE
    if (settleOutstandingAmount && settleOutstandingAmount > 0) {
      if (currentSaleData.outstandingBalance < settleOutstandingAmount) {
        throw new Error(`Cannot settle ${settleOutstandingAmount}. Outstanding balance is only ${currentSaleData.outstandingBalance}.`);
      }
      const creditPayment: Payment = {
        amount: settleOutstandingAmount,
        method: 'ReturnCredit',
        date: new Date(),
        staffId: staffId,
        notes: `Credit from Return ID: ${returnId}`
      };
      
      const firestorePayment: FirestorePayment = { ...creditPayment, date: Timestamp.fromDate(creditPayment.date) };
      transaction.update(saleRef, {
        outstandingBalance: increment(-settleOutstandingAmount),
        totalAmountPaid: increment(settleOutstandingAmount),
        additionalPayments: arrayUnion(firestorePayment)
      });
    }

    // 3. HANDLE STOCK & SALE ITEM UPDATES
    const newSaleItems = [...currentSaleData.items];
    
    // Handle exchanged items (stock out)
    for (const item of exchangedItems) {
      const productRef = doc(db, 'products', item.id);
      if (!vehicleId) { // Main inventory exchange
        transaction.update(productRef, { stock: increment(-item.quantity) });
      } else { // Vehicle exchange
        const stockTx: Omit<StockTransaction, 'id'> = {
          productId: item.id, productName: item.name, productSku: item.sku,
          type: 'UNLOAD_FROM_VEHICLE', quantity: item.quantity,
          previousStock: -1, newStock: -1, // Not tracked directly here; relies on aggregate
          transactionDate: new Date(), notes: `Exchange in Return: ${returnId}`,
          vehicleId, userId: staffId,
        };
        const txDocRef = doc(collection(db, "stockTransactions"));
        transaction.set(txDocRef, stockTransactionConverter.toFirestore({id: 'temp', ...stockTx}));
      }
    }

    // Handle returned items (stock in)
    for (const item of returnedItems) {
      if (item.isResellable) {
        const productRef = doc(db, 'products', item.id);
        if (vehicleId) { // Return to vehicle
          const stockTx: Omit<StockTransaction, 'id'> = {
            productId: item.id, productName: item.name, productSku: item.sku,
            type: 'LOAD_TO_VEHICLE', quantity: item.quantity,
            previousStock: -1, newStock: -1, // Not tracked directly here
            transactionDate: new Date(), notes: `Resellable return to vehicle. Return ID: ${returnId}`,
            vehicleId, userId: staffId,
          };
          const txDocRef = doc(collection(db, "stockTransactions"));
          transaction.set(txDocRef, stockTransactionConverter.toFirestore({id: 'temp', ...stockTx}));
        } else { // Return to main inventory
          transaction.update(productRef, { stock: increment(item.quantity) });
        }
      }
      
      const saleItemIndex = newSaleItems.findIndex(si => si.id === item.id && si.saleType === item.saleType);
      if (saleItemIndex === -1) throw new Error(`Item ${item.name} not found in original sale.`);
      
      const originalSaleItem = newSaleItems[saleItemIndex];
      const alreadyReturned = originalSaleItem.returnedQuantity || 0;
      if ((alreadyReturned + item.quantity) > originalSaleItem.quantity) {
        throw new Error(`Cannot return ${item.quantity} of ${originalSaleItem.name}. Already returned: ${alreadyReturned}, Max: ${originalSaleItem.quantity}`);
      }
      newSaleItems[saleItemIndex] = { ...originalSaleItem, returnedQuantity: alreadyReturned + item.quantity };
    }
    
    // 4. WRITE UPDATED SALE AND NEW RETURN DOCUMENT
    transaction.update(saleRef, {
      items: newSaleItems.map(item => {
        const firestoreItem: FirestoreCartItem = {
          productRef: doc(db, "products", item.id).path, quantity: item.quantity,
          appliedPrice: item.appliedPrice, saleType: item.saleType, productName: item.name,
          productCategory: item.category, productPrice: item.price, isOfferItem: item.isOfferItem || false,
        };
        if (item.returnedQuantity !== undefined) firestoreItem.returnedQuantity = item.returnedQuantity;
        if (item.sku !== undefined) firestoreItem.productSku = item.sku;
        return firestoreItem;
      }),
      updatedAt: Timestamp.now(),
    });

    const returnDocRef = doc(db, 'returns', returnId);
    
    finalReturnData = {
      id: returnId,
      originalSaleId: saleId, returnDate: new Date(), staffId, customerId, customerName,
      customerShopName, returnedItems: returnedItems, exchangedItems: exchangedItems,
      settleOutstandingAmount, refundAmount, cashPaidOut, ...payment
    };

    transaction.set(returnDocRef, returnTransactionConverter.toFirestore(finalReturnData));
  });

  if (!finalReturnData) {
      throw new Error("Transaction failed and return data could not be constructed.");
  }

  return { returnId, returnData: finalReturnData };
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
