
import { db, checkFirebase } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDoc,
  Timestamp,
  runTransaction,
  setDoc
} from "firebase/firestore";
import { format } from 'date-fns';
import { productConverter, type FirestoreProduct, type Product } from "./types";

async function generateCustomProductId(): Promise<string> {
  checkFirebase();
  const today = new Date();
  const datePart = format(today, "MMdd");
  const counterDocId = format(today, "yyyy-MM-dd");

  const counterRef = doc(db, "dailyProductCounters", counterDocId);

  try {
    const newCount = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { count: 1 });
        return 1;
      } else {
        const count = counterDoc.data().count + 1;
        transaction.update(counterRef, { count });
        return count;
      }
    });
    return `prod-${datePart}-${newCount}`;
  } catch (e) {
    console.error("Custom product ID transaction failed: ", e);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `prod-${datePart}-err-${randomPart}`;
  }
}


export const ProductService = {
  async getAllProducts(): Promise<Product[]> {
    checkFirebase();
    const q = query(collection(db, 'products')).withConverter(productConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getProductById(id: string): Promise<Product | null> {
    checkFirebase();
    const docRef = doc(db, 'products', id).withConverter(productConverter);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    checkFirebase();
    const newCustomId = await generateCustomProductId();
    const productDocRef = doc(db, 'products', newCustomId);
    
    const productForConverter: Product = {
        id: newCustomId,
        ...productData,
    };
    
    await setDoc(productDocRef.withConverter(productConverter), productForConverter);

    return { id: newCustomId, ...productData }; 
  },

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
    checkFirebase();
    try {
      const docRef = doc(db, 'products', id);
      
      const cleanProductData: Partial<Omit<Product, 'id'>> = {};
      for (const key in productData) {
        if (Object.prototype.hasOwnProperty.call(productData, key)) {
          const value = productData[key as keyof typeof productData];
          if (value !== undefined) {
            (cleanProductData as any)[key] = value;
          }
        }
      }
      
      const dataToUpdate: Partial<FirestoreProduct> = {
        ...(cleanProductData as Partial<FirestoreProduct>),
        updatedAt: Timestamp.now(),
      };
      
      console.log("Updating product with ID:", id);
      console.log("Update data for Firestore:", dataToUpdate);
      
      await updateDoc(docRef, dataToUpdate);
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    checkFirebase();
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  },

  async searchProducts(searchTerm: string): Promise<Product[]> {
    checkFirebase();
    const products = await this.getAllProducts();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
};
