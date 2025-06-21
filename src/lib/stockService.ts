
import { db } from "./firebase";
import { Timestamp, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { 
  stockTransactionConverter, 
  StockTransaction,
  FirestoreStockTransaction
} from "./types";

export const StockService = {
  async createTransaction(transaction: Omit<StockTransaction, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any),
      transaction
    );
    return docRef.id;
  },

  async getAllTransactions(): Promise<StockTransaction[]> {
    const q = query(
      collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any),
      orderBy('transactionDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StockTransaction);
  },

  async getTransactionsByProduct(productId: string): Promise<StockTransaction[]> {
    const q = query(
      collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any),
      where('productId', '==', productId),
      orderBy('transactionDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StockTransaction);
  },

  async getTransactionsByVehicleId(vehicleId: string): Promise<StockTransaction[]> {
    const q = query(
      collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any),
      where('vehicleId', '==', vehicleId),
      orderBy('transactionDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StockTransaction);
  },

  // Note: Real-time subscription might be intensive for all transactions.
  // Use with caution or with more specific queries if performance becomes an issue.
  subscribeToAllTransactions(callback: (transactions: StockTransaction[]) => void): () => void {
    const q = query(
      collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any),
      orderBy('transactionDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => doc.data() as StockTransaction);
      callback(transactions);
    });
    
    return unsubscribe;
  }
};
