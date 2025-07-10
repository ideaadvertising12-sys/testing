

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
  const docRef = await addDoc(collection(db, "products").withConverter(productConverter), productData);
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
  const docRef = await addDoc(collection(db, "customers").withConverter(customerConverter), customerData);
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
  const batch = writeBatch(db);
  const saleDocRef = doc(db, "sales", newCustomId);

  const saleObjectForConversion: Sale = {
    id: newCustomId,
    ...saleData,
  };
  
  const firestoreSaleData = saleConverter.toFirestore(saleObjectForConversion);
  
  batch.set(saleDocRef, firestoreSaleData);

  // --- START: New Robust Stock Update Logic ---
  
  // 1. Aggregate total quantity sold for each product ID
  const productQuantities = new Map<string, number>();
  for (const item of saleData.items) {
    const currentQuantity = productQuantities.get(item.id) || 0;
    productQuantities.set(item.id, currentQuantity + item.quantity);
  }

  // 2. Process stock updates for each unique product
  for (const [productId, totalQuantitySold] of productQuantities.entries()) {
    const productInfo = saleData.items.find(i => i.id === productId); // Get any item instance for details
    if (!productInfo) continue; // Should not happen

    if (saleData.vehicleId) {
      // Vehicle Sale: Create a single stock transaction for the total quantity unloaded
      const productDetails = await getProduct(productId);
      if (!productDetails) {
          throw new Error(`Product ${productInfo.name} not found for stock transaction.`);
      }
      
      const transaction: Omit<StockTransaction, 'id'> = {
        productId: productId,
        productName: productInfo.name,
        productSku: productInfo.sku,
        type: 'UNLOAD_FROM_VEHICLE',
        quantity: totalQuantitySold,
        previousStock: productDetails.stock, // Main inventory stock is unchanged
        newStock: productDetails.stock,
        transactionDate: saleData.saleDate,
        notes: `Sale: ${saleDocRef.id}`,
        vehicleId: saleData.vehicleId,
        userId: saleData.staffId,
      };

      const transactionDocRef = doc(collection(db, "stockTransactions"));
      const firestoreTx = stockTransactionConverter.toFirestore(transaction);
      batch.set(transactionDocRef, firestoreTx);

    } else {
      // Main Inventory Sale: Decrement stock from the product itself
      const productDocRefToUpdate = doc(db, "products", productId);
      const productSnap = await getDoc(productDocRefToUpdate.withConverter(productConverter));
      if (productSnap.exists()) {
        const currentProduct = productSnap.data();
        const newStock = currentProduct.stock - totalQuantitySold;
        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${productInfo.name} (ID: ${productId}). Available: ${currentProduct.stock}, Tried to sell: ${totalQuantitySold}`);
        }
        batch.update(productDocRefToUpdate, { stock: newStock, updatedAt: Timestamp.now() });
      } else {
        throw new Error(`Product ${productInfo.name} (ID: ${productId}) not found for stock update.`);
      }
    }
  }
  // --- END: New Robust Stock Update Logic ---

  await batch.commit();
  return saleDocRef.id;
};


export const getSales = async (): Promise<Sale[]> => {
  checkFirebase();
  const salesCol = collection(db, "sales").withConverter(saleConverter);
  const salesSnapshot = await getDocs(salesCol);
  return salesSnapshot.docs.map(doc => doc.data());
};

export const getReturns = async (): Promise<ReturnTransaction[]> => {
  checkFirebase();
  const returnsCol = collection(db, "returns").withConverter(returnTransactionConverter);
  const returnsSnapshot = await getDocs(returnsCol);
  return returnsSnapshot.docs.map(doc => doc.data());
};


// Return Services

async function generateCustomReturnId(): Promise<string> {
  checkFirebase();
  const today = new Date();
  const datePart = format(today, "MM.dd");
  const counterDocId = format(today, "yyyy-MM-dd");

  const counterRef = doc(db, "dailyReturnCounters", counterDocId);

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
    return `return-${datePart}-${newCount}`;
  } catch (e) {
    console.error("Custom return ID transaction failed: ", e);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `return-${datePart}-err-${randomPart}`;
  }
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
    // 1. GATHER ALL REFS & PERFORM READS
    const saleRef = doc(db, 'sales', saleId).withConverter(saleConverter);
    const productRefs = new Map<string, ReturnType<typeof doc>>();
    const allProductIds = new Set([
      ...returnedItems.map(i => i.id),
      ...exchangedItems.map(i => i.id)
    ]);
    allProductIds.forEach(id => {
      productRefs.set(id, doc(db, 'products', id).withConverter(productConverter));
    });

    const saleDoc = await transaction.get(saleRef);
    if (!saleDoc.exists()) {
      throw new Error(`Sale with ID ${saleId} not found.`);
    }

    const productDocs = await Promise.all(
      Array.from(productRefs.values()).map(ref => transaction.get(ref))
    );

    const productDataMap = new Map<string, { doc: Product, newStock: number }>();
    productDocs.forEach(docSnap => {
      if (docSnap.exists()) {
        const data = productConverter.fromFirestore(docSnap);
        productDataMap.set(docSnap.id, { doc: data, newStock: data.stock });
      } else {
        const failedId = Array.from(productRefs.entries()).find(([, ref]) => ref.path === docSnap.ref.path)?.[0];
        throw new Error(`Product with ID ${failedId} not found.`);
      }
    });
    
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
      
      const firestorePayment: FirestorePayment = { 
          ...creditPayment, 
          date: Timestamp.fromDate(creditPayment.date) 
      };

      transaction.update(saleRef, {
        outstandingBalance: currentSaleData.outstandingBalance - settleOutstandingAmount,
        totalAmountPaid: currentSaleData.totalAmountPaid + settleOutstandingAmount,
        additionalPayments: arrayUnion(firestorePayment)
      });
    }

    // 3. CALCULATE STOCK CHANGES & VALIDATE
    productDataMap.forEach((info) => {
        info.newStock = info.doc.stock;
    });

    for (const item of exchangedItems) {
      const productInfo = productDataMap.get(item.id);
      if (!productInfo) throw new Error(`Product ID ${item.id} for exchange not found.`);
      if (!vehicleId) { // Only check main inventory if not a vehicle exchange
        if (productInfo.newStock < item.quantity) {
          throw new Error(`Insufficient stock for ${productInfo.doc.name}. Available: ${productInfo.newStock}, Requested: ${item.quantity}`);
        }
        productInfo.newStock -= item.quantity;
      }
    }

    const newSaleItems = [...currentSaleData.items];
    for (const item of returnedItems) {
      // If the item is resellable, handle stock update
      if (item.isResellable) {
        const productInfo = productDataMap.get(item.id);
        if (!productInfo) throw new Error(`Product ID ${item.id} for return not found.`);

        // If a vehicle is involved, return stock to the vehicle
        if (vehicleId) {
          const stockTx: Omit<StockTransaction, 'id'> = {
            productId: item.id,
            productName: item.name,
            productSku: item.sku,
            type: 'LOAD_TO_VEHICLE', // Item is being loaded back onto the vehicle
            quantity: item.quantity,
            previousStock: productInfo.doc.stock, // Main inventory stock is unaffected
            newStock: productInfo.doc.stock,      // Main inventory stock is unaffected
            transactionDate: new Date(),
            notes: `Resellable return to vehicle. Return ID: ${returnId}`,
            vehicleId: vehicleId,
            userId: staffId,
          };
          const txDocRef = doc(collection(db, "stockTransactions"));
          const firestoreTx = stockTransactionConverter.toFirestore(stockTx);
          transaction.set(txDocRef, firestoreTx);
        } else {
          // Otherwise, return stock to the main inventory
          productInfo.newStock += item.quantity;
        }
      }

      // Track the returned quantity on the original sale document
      const saleItemIndex = newSaleItems.findIndex(si => si.id === item.id && si.saleType === item.saleType);
      if (saleItemIndex === -1) throw new Error(`Item ${item.name} not found in original sale.`);
      
      const originalSaleItem = newSaleItems[saleItemIndex];
      const alreadyReturned = originalSaleItem.returnedQuantity || 0;
      if ((alreadyReturned + item.quantity) > originalSaleItem.quantity) {
        throw new Error(`Cannot return ${item.quantity} of ${originalSaleItem.name}. Already returned: ${alreadyReturned}, Max: ${originalSaleItem.quantity}`);
      }
      newSaleItems[saleItemIndex] = { ...originalSaleItem, returnedQuantity: alreadyReturned + item.quantity };
    }


    // 4. PERFORM WRITES
    // Update main inventory stock levels for returns and non-vehicle exchanges
    productDataMap.forEach((info, id) => {
      if (info.doc.stock !== info.newStock) {
        const prodRef = productRefs.get(id);
        if (prodRef) transaction.update(prodRef, { stock: info.newStock, updatedAt: Timestamp.now() });
      }
    });

    // If vehicle exchange, create stock transactions for the vehicle
    if (vehicleId) {
      for (const item of exchangedItems) {
        const productInfo = productDataMap.get(item.id);
        if (!productInfo) throw new Error(`Product ID ${item.id} for exchange not found.`);
        const stockTx: Omit<StockTransaction, 'id'> = {
          productId: item.id,
          productName: item.name,
          productSku: item.sku,
          type: 'UNLOAD_FROM_VEHICLE',
          quantity: item.quantity,
          previousStock: productInfo.doc.stock, // Main stock is unchanged
          newStock: productInfo.doc.stock,
          transactionDate: new Date(),
          notes: `Exchange in Return: ${returnId}`,
          vehicleId: vehicleId,
          userId: staffId,
        };
        const txDocRef = doc(collection(db, "stockTransactions"));
        const firestoreTx = stockTransactionConverter.toFirestore(stockTx);
        transaction.set(txDocRef, firestoreTx);
      }
    }
    
    // Update the original sale with new returned quantities
    transaction.update(saleRef, {
      items: newSaleItems.map(item => {
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
        if (item.returnedQuantity !== undefined) {
          firestoreItem.returnedQuantity = item.returnedQuantity;
        }
        if (item.sku !== undefined) {
          firestoreItem.productSku = item.sku;
        }
        return firestoreItem;
      }),
      updatedAt: Timestamp.now(),
    });

    const returnDocRef = doc(db, 'returns', returnId);
    
    const returnDataForTx: ReturnTransaction = {
      id: returnId,
      originalSaleId: saleId, returnDate: new Date(), staffId, customerId, customerName,
      customerShopName,
      returnedItems: returnedItems,
      exchangedItems: exchangedItems,
      settleOutstandingAmount, 
      refundAmount,
      cashPaidOut,
      ...payment
    };

    transaction.set(returnDocRef, returnTransactionConverter.toFirestore(returnDataForTx));
    finalReturnData = returnDataForTx;
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
