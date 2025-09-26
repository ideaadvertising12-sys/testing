
import { db, checkFirebase } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  onSnapshot,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { vehicleConverter, FirestoreVehicle, Vehicle } from "./types";

export const VehicleService = {
  async getAllVehicles(): Promise<Vehicle[]> {
    checkFirebase();
    const q = query(collection(db, 'vehicles')).withConverter(vehicleConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    checkFirebase();
    const docRef = doc(db, 'vehicles', id).withConverter(vehicleConverter);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async createVehicle(vehicleData: Omit<Vehicle, 'id'>): Promise<string> {
    checkFirebase();
    
    // Manually construct the data for creation to ensure type safety.
    const dataToCreate: any = {
      vehicleNumber: vehicleData.vehicleNumber,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    if (vehicleData.driverName) dataToCreate.driverName = vehicleData.driverName;
    if (vehicleData.notes) dataToCreate.notes = vehicleData.notes;

    const docRef = await addDoc(collection(db, 'vehicles'), dataToCreate);
    return docRef.id;
  },

  async updateVehicle(id: string, vehicleData: Partial<Omit<Vehicle, 'id'>>): Promise<void> {
    checkFirebase();
    const docRef = doc(db, 'vehicles', id);
    
    // Explicitly build the update object to avoid type conflicts and unintended field updates.
    const dataToUpdate: { [key: string]: any } = {
      updatedAt: Timestamp.now()
    };
    if (vehicleData.vehicleNumber !== undefined) dataToUpdate.vehicleNumber = vehicleData.vehicleNumber;
    if (vehicleData.driverName !== undefined) dataToUpdate.driverName = vehicleData.driverName;
    if (vehicleData.notes !== undefined) dataToUpdate.notes = vehicleData.notes;

    await updateDoc(docRef, dataToUpdate);
  },

  async deleteVehicle(id: string): Promise<void> {
    checkFirebase();
    const docRef = doc(db, 'vehicles', id);
    await deleteDoc(docRef);
  },
};
