import { db } from "./firebase";
import { Timestamp } from 'firebase/firestore';
import { 
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { 
  stockTransactionConverter, 
  StockTransaction,
  FirestoreStockTransaction
} from "./types";

export const StockService = {
  async createTransaction(transaction: Omit<StockTransaction, 'id'>): Promise<string> {
    const firestoreTransaction: FirestoreStockTransaction = {
      ...transaction,
      transactionDate: Timestamp.fromDate(transaction.transactionDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(
      collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any),
      firestoreTransaction
    );
    return docRef.id;
  },

  async getTransactionsByProduct(productId: string): Promise<StockTransaction[]> {
    const q = query(
      collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any),
      where('productId', '==', productId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StockTransaction));
  },

  subscribeToTransactions(callback: (transactions: StockTransaction[]) => void): () => void {
    const q = query(
      collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StockTransaction));
      callback(transactions);
    });
    
    return unsubscribe;
  }
};