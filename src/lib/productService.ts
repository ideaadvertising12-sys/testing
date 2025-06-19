
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
    // For create, we expect a more complete productData, so using the converter makes sense.
    // The converter should ensure all necessary fields for FirestoreProduct are present.
    const dataToCreate = productConverter.toFirestore(productData as FirestoreProduct); // Cast is okay if ProductDialog sends all needed fields
    const docRef = await addDoc(
      collection(db, 'products'), // .withConverter(productConverter) might be redundant if dataToCreate is already Firestore-ready
      dataToCreate
    );
    return { id: docRef.id, ...productData }; // Return the app-level Product type
  },

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
    try {
      const docRef = doc(db, 'products', id); // Get a simple DocumentReference
      
      // Construct the update object directly.
      // Firestore's updateDoc handles partial objects.
      // We only need to ensure `updatedAt` is included.
      const dataToUpdate: Partial<FirestoreProduct> = {
        ...productData, // Spread the fields to be updated
        updatedAt: Timestamp.now(), // Always set/update the updatedAt timestamp
      };
      
      // Optional: remove any keys that might have explicit undefined values if productData could have them
      // Object.keys(dataToUpdate).forEach(key => (dataToUpdate as any)[key] === undefined && delete (dataToUpdate as any)[key]);
      // For { stock: newStock }, this cleanup isn't strictly necessary as 'stock' will have a value.

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
