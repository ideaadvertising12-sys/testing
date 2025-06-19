
import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { productConverter, FirestoreProduct, Product } from "./types";

export const ProductService = {
  async getAllProducts(): Promise<Product[]> {
    const q = query(collection(db, 'products')).withConverter(productConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getProductById(id: string): Promise<Product | null> {
    const docRef = doc(db, 'products', id).withConverter(productConverter);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  },

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const dataToCreate = productConverter.toFirestore(productData as FirestoreProduct); 
    const docRef = await addDoc(
      collection(db, 'products'), 
      dataToCreate
    );
    return { id: docRef.id, ...productData }; 
  },

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      
      // Filter out undefined values from productData
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
        ...(cleanProductData as Partial<FirestoreProduct>), // Cast after cleaning
        updatedAt: Timestamp.now(),
      };
      
      // If cleanProductData is empty (e.g. only undefined values were passed), 
      // we still update `updatedAt`. updateDoc handles empty updates gracefully.
      // Firestore's updateDoc will only update fields present in dataToUpdate.

      console.log("Updating product with ID:", id);
      console.log("Update data for Firestore:", dataToUpdate);
      
      await updateDoc(docRef, dataToUpdate);
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  },

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const products = await this.getAllProducts();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  },

  subscribeToProducts(callback: (products: Product[]) => void): () => void {
    const q = query(collection(db, 'products')).withConverter(productConverter);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(products);
    }, (error) => {
      console.error("Error subscribing to products:", error);
    });
    return unsubscribe;
  }
};

