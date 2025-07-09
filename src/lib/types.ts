
// location src/lib/types.ts
import { Timestamp, DocumentReference, doc } from 'firebase/firestore';
import { db } from './firebase';

// Helper function to safely convert Firestore Timestamps or other date representations to a JS Date.
const safeTimestampToDate = (field: any): Date | undefined => {
  if (!field) {
    return undefined;
  }
  // If it has a toDate method (like a Firestore Timestamp)
  if (typeof field.toDate === 'function') {
    return field.toDate();
  }
  // If it's already a Date object
  if (field instanceof Date) {
    return field;
  }
  // Try to parse from string/number (which is what JSON.stringify(new Date()) becomes)
  const d = new Date(field);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return undefined;
};


// Base Interfaces
export interface Product {
  id: string;
  name: string;
  category: "Yogurt" | "Drink" | "Ice Cream" | "Dessert" | "Curd" | "Other";
  price: number;
  wholesalePrice?: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  sku?: string;
  reorderLevel?: number;
  aiHint?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  avatar?: string;
  name: string;
  phone: string;
  address?: string;
  shopName?: string;
  status?: 'active' | 'pending';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id: string; // Product ID
  quantity: number;
  appliedPrice: number; // Price after any sale-specific adjustments (usually same as original or wholesale)
  saleType: 'retail' | 'wholesale';
  
  // Denormalized product details at the time of sale
  name: string; 
  category: Product["category"];
  price: number; // Original retail price of the product at time of sale
  sku?: string; // Original SKU
  imageUrl?: string; // Original Image URL
  
  isOfferItem?: boolean; // Added for "Buy 12 Get 1 Free"
  returnedQuantity?: number;
}

export interface ChequeInfo {
  number?: string;
  bank?: string;
  date?: Date; 
  amount?: number; 
}

export interface FirestoreChequeInfo extends Omit<ChequeInfo, 'date' | 'amount'> {
  date?: Timestamp; 
  amount?: number;
}

export interface BankTransferInfo {
  bankName?: string;
  referenceNumber?: string;
  amount?: number;
}

export interface FirestoreBankTransferInfo extends Omit<BankTransferInfo, 'amount'> {
   amount?: number;
}

export interface Payment {
  amount: number;
  method: 'Cash' | 'Cheque' | 'BankTransfer' | 'ReturnCredit';
  date: Date;
  notes?: string;
  details?: ChequeInfo | BankTransferInfo;
  staffId: string;
}

export interface FirestorePayment extends Omit<Payment, 'date' | 'details'> {
  date: Timestamp;
  details?: FirestoreChequeInfo | FirestoreBankTransferInfo;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  customerShopName?: string;
  items: CartItem[];
  subTotal: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number; // Total amount due for the sale
  
  paidAmountCash?: number;
  paidAmountCheque?: number;
  chequeDetails?: ChequeInfo; 
  paidAmountBankTransfer?: number;
  bankTransferDetails?: BankTransferInfo;
  creditUsed?: number;

  additionalPayments?: Payment[];

  totalAmountPaid: number; // Sum of all payments made
  outstandingBalance: number; // totalAmount - totalAmountPaid (if positive, amount due)
  initialOutstandingBalance?: number;
  changeGiven?: number; // If cash_tendered > totalAmount and paid fully by cash (considering cash was the only or last part of payment)

  paymentSummary: string; // e.g., "Cash", "Cheque (123)", "Partial (Cash + Cheque)", "Full Credit"
  
  saleDate: Date;
  staffId: string;
  staffName?: string;
  offerApplied?: boolean;
  vehicleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Stock Transaction Types
export type StockTransactionType =
  | "ADD_STOCK_INVENTORY"
  | "LOAD_TO_VEHICLE"
  | "UNLOAD_FROM_VEHICLE"
  | "REMOVE_STOCK_WASTAGE"
  | "STOCK_ADJUSTMENT_MANUAL"
  | "ISSUE_SAMPLE";

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  type: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  transactionDate: Date;
  notes?: string;
  vehicleId?: string;
  userId?: string;
  startMeter?: number;
  endMeter?: number;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReturnTransaction {
  id: string; // The generated ID like "return-06.25-1"
  originalSaleId: string;
  returnDate: Date;
  staffId: string;
  customerId?: string;
  customerName?: string;
  customerShopName?: string;
  returnedItems: CartItem[];
  exchangedItems: CartItem[];
  notes?: string;
  // Fields for payment made during exchange
  amountPaid?: number;
  paymentSummary?: string;
  chequeDetails?: ChequeInfo;
  bankTransferDetails?: BankTransferInfo;
  changeGiven?: number;
  // New fields for credit settlement
  settleOutstandingAmount?: number;
  refundAmount?: number; // Credit added to customer account
  cashPaidOut?: number; // Cash given back to customer
  createdAt?: Date;
}

// Firestore-specific types
export interface FirestoreProduct extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreCustomer extends Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
  status?: 'active' | 'pending';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreVehicle extends Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> {
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// Stored in Firestore for each item in a sale
export interface FirestoreCartItem {
  productRef: string | DocumentReference; // Can accept a string path or a DocumentReference
  quantity: number;
  appliedPrice: number;
  saleType: 'retail' | 'wholesale';
  
  // Denormalized fields stored at the time of sale for historical accuracy
  productName: string; 
  productCategory: Product["category"];
  productPrice: number; // Original retail price of the product at time of sale
  productSku?: string; // Original SKU at time of sale
  
  isOfferItem?: boolean;
  returnedQuantity?: number;
}

export interface FirestoreSale extends Omit<Sale, 'id' | 'saleDate' | 'createdAt' | 'updatedAt' | 'items' | 'chequeDetails' | 'bankTransferDetails' | 'additionalPayments' | 'customerShopName'> {
  items: FirestoreCartItem[];
  saleDate: Timestamp;
  chequeDetails?: FirestoreChequeInfo;
  bankTransferDetails?: FirestoreBankTransferInfo;
  additionalPayments?: FirestorePayment[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  customerShopName?: string;
}

export interface FirestoreStockTransaction extends Omit<StockTransaction, 'id' | 'transactionDate'> {
  transactionDate: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreUser extends Omit<User, 'id'> {
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface FirestoreReturnTransaction extends Omit<ReturnTransaction, 'id' | 'returnDate' | 'createdAt' | 'returnedItems' | 'exchangedItems' | 'chequeDetails' | 'bankTransferDetails' | 'customerShopName'> {
  returnDate: Timestamp;
  createdAt: Timestamp;
  returnedItems: FirestoreCartItem[];
  exchangedItems: FirestoreCartItem[];
  chequeDetails?: FirestoreChequeInfo;
  bankTransferDetails?: BankTransferInfo;
  customerShopName?: string;
}


// Data Converters
export const productConverter = {
  toFirestore: (product: Omit<Product, 'id'>): Partial<FirestoreProduct> => {
    const firestoreProduct: Partial<FirestoreProduct> = {
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      updatedAt: Timestamp.now(),
    };

    if (product.wholesalePrice !== undefined) firestoreProduct.wholesalePrice = product.wholesalePrice;
    if (product.imageUrl) firestoreProduct.imageUrl = product.imageUrl;
    if (product.description) firestoreProduct.description = product.description;
    if (product.sku) firestoreProduct.sku = product.sku;
    if (product.reorderLevel !== undefined) firestoreProduct.reorderLevel = product.reorderLevel;
    if (product.aiHint) firestoreProduct.aiHint = product.aiHint;
    if (!product.createdAt) firestoreProduct.createdAt = Timestamp.now();

    return firestoreProduct;
  },
  fromFirestore: (snapshot: any): Product => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      category: data.category,
      price: data.price,
      wholesalePrice: data.wholesalePrice,
      stock: data.stock,
      imageUrl: data.imageUrl,
      description: data.description,
      sku: data.sku,
      reorderLevel: data.reorderLevel,
      aiHint: data.aiHint,
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
    };
  }
};

export const customerConverter = {
  toFirestore: (customer: Omit<Customer, 'id'>): Partial<FirestoreCustomer> => {
    const firestoreCustomer: Partial<FirestoreCustomer> = {
      name: customer.name,
      phone: customer.phone,
      status: customer.status || 'active',
      updatedAt: Timestamp.now(),
    };

    if (customer.avatar) firestoreCustomer.avatar = customer.avatar;
    if (customer.address) firestoreCustomer.address = customer.address;
    if (customer.shopName) firestoreCustomer.shopName = customer.shopName;
    if (!customer.createdAt) firestoreCustomer.createdAt = Timestamp.now();

    return firestoreCustomer;
  },
  fromFirestore: (snapshot: any): Customer => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      address: data.address,
      shopName: data.shopName,
      status: data.status || 'active',
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
    };
  }
};

export const vehicleConverter = {
    toFirestore: (vehicle: Omit<Vehicle, 'id'>): Partial<FirestoreVehicle> => {
        const firestoreVehicle: Partial<FirestoreVehicle> = {
            vehicleNumber: vehicle.vehicleNumber,
            updatedAt: Timestamp.now(),
        };
        if (vehicle.driverName) firestoreVehicle.driverName = vehicle.driverName;
        if (vehicle.notes) firestoreVehicle.notes = vehicle.notes;
        if (!vehicle.createdAt) firestoreVehicle.createdAt = Timestamp.now();
        return firestoreVehicle;
    },
    fromFirestore: (snapshot: any): Vehicle => {
        const data = snapshot.data();
        return {
            id: snapshot.id,
            vehicleNumber: data.vehicleNumber,
            driverName: data.driverName,
            notes: data.notes,
            createdAt: safeTimestampToDate(data.createdAt),
            updatedAt: safeTimestampToDate(data.updatedAt),
        };
    }
};

export const saleConverter = {
  toFirestore: (sale: Sale): Partial<FirestoreSale> => {
    const firestoreSaleItems: FirestoreCartItem[] = sale.items.map(item => {
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
    });
    
    let firestoreChequeDetails: FirestoreChequeInfo | undefined;
    if (sale.chequeDetails) {
        const { number, bank, date, amount } = sale.chequeDetails;
        const details: FirestoreChequeInfo = {};
        if (number) details.number = number;
        if (bank) details.bank = bank;
        if (date) details.date = Timestamp.fromDate(date);
        if (amount) details.amount = amount;
        
        if (Object.keys(details).length > 0) {
            firestoreChequeDetails = details;
        }
    }

    let firestoreBankTransferDetails: BankTransferInfo | undefined;
    if (sale.bankTransferDetails) {
        const { bankName, referenceNumber, amount } = sale.bankTransferDetails;
        const details: BankTransferInfo = {};
        if (bankName) details.bankName = bankName;
        if (referenceNumber) details.referenceNumber = referenceNumber;
        if (amount) details.amount = amount;

        if (Object.keys(details).length > 0) {
            firestoreBankTransferDetails = details;
        }
    }

    const firestoreSale: Partial<FirestoreSale> = {
      items: firestoreSaleItems,
      subTotal: sale.subTotal,
      discountPercentage: sale.discountPercentage,
      discountAmount: sale.discountAmount,
      totalAmount: sale.totalAmount,
      paidAmountCash: sale.paidAmountCash,
      paidAmountCheque: sale.paidAmountCheque,
      chequeDetails: firestoreChequeDetails,
      paidAmountBankTransfer: sale.paidAmountBankTransfer,
      bankTransferDetails: firestoreBankTransferDetails,
      creditUsed: sale.creditUsed,
      totalAmountPaid: sale.totalAmountPaid,
      outstandingBalance: sale.outstandingBalance,
      initialOutstandingBalance: sale.initialOutstandingBalance,
      changeGiven: sale.changeGiven,
      paymentSummary: sale.paymentSummary,
      saleDate: Timestamp.fromDate(sale.saleDate),
      staffId: sale.staffId,
      staffName: sale.staffName,
      offerApplied: sale.offerApplied,
      vehicleId: sale.vehicleId,
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerShopName: sale.customerShopName,
      updatedAt: Timestamp.now(),
      additionalPayments: sale.additionalPayments?.map(p => {
          const firestorePayment: FirestorePayment = { ...p, date: Timestamp.fromDate(p.date) };
          if (firestorePayment.details && 'date' in firestorePayment.details && firestorePayment.details.date) {
              (firestorePayment.details as FirestoreChequeInfo).date = Timestamp.fromDate(p.details!.date!);
          }
          return firestorePayment;
      }),
    };

    if (!sale.createdAt) {
      firestoreSale.createdAt = Timestamp.now();
    }

    // Clean up undefined fields at the top level
    Object.keys(firestoreSale).forEach(keyStr => {
        const key = keyStr as keyof typeof firestoreSale;
        if (firestoreSale[key] === undefined) {
            delete firestoreSale[key];
        }
    });

    return firestoreSale;
  },
  fromFirestore: (snapshot: any): Sale => {
    const data = snapshot.data();
    let chequeDetails;
    if (data.chequeDetails) {
      chequeDetails = {
        ...data.chequeDetails,
        date: safeTimestampToDate(data.chequeDetails.date),
      };
    }

    return {
      id: snapshot.id,
      items: Array.isArray(data.items) ? data.items.map((item: FirestoreCartItem): CartItem => {
        let id = 'unknown_id';
        if (typeof item.productRef === 'string') {
          id = item.productRef.split('/')[1];
        } else if (item.productRef instanceof DocumentReference) {
          id = item.productRef.id;
        }
        return {
          id,
          quantity: item.quantity,
          appliedPrice: item.appliedPrice,
          saleType: item.saleType,
          name: item.productName || "N/A",
          category: item.productCategory || "Other",
          price: typeof item.productPrice === 'number' ? item.productPrice : 0,
          sku: item.productSku,
          isOfferItem: item.isOfferItem || false,
          returnedQuantity: item.returnedQuantity,
          imageUrl: undefined,
        };
      }) : [],
      subTotal: data.subTotal,
      discountPercentage: data.discountPercentage,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      paidAmountCash: data.paidAmountCash,
      paidAmountCheque: data.paidAmountCheque,
      chequeDetails: chequeDetails,
      paidAmountBankTransfer: data.paidAmountBankTransfer,
      bankTransferDetails: data.bankTransferDetails,
      creditUsed: data.creditUsed,
      additionalPayments: Array.isArray(data.additionalPayments) ? data.additionalPayments.map((p: FirestorePayment): Payment => {
        let paymentDetails: ChequeInfo | BankTransferInfo | undefined;
        if (p.details) {
            if (p.method === 'Cheque' && 'date' in p.details && p.details.date) {
                paymentDetails = {
                    ...(p.details as ChequeInfo),
                    date: safeTimestampToDate(p.details.date),
                };
            } else {
                paymentDetails = p.details as BankTransferInfo;
            }
        }
        return {
            amount: p.amount,
            method: p.method,
            date: safeTimestampToDate(p.date) || new Date(),
            staffId: p.staffId,
            notes: p.notes,
            details: paymentDetails,
        };
      }) : undefined,
      totalAmountPaid: data.totalAmountPaid,
      outstandingBalance: data.outstandingBalance,
      initialOutstandingBalance: data.initialOutstandingBalance,
      changeGiven: data.changeGiven,
      paymentSummary: data.paymentSummary || "N/A",
      saleDate: safeTimestampToDate(data.saleDate) || new Date(),
      staffId: data.staffId,
      staffName: data.staffName,
      customerId: data.customerId,
      customerName: data.customerName,
      customerShopName: data.customerShopName,
      offerApplied: data.offerApplied || false,
      vehicleId: data.vehicleId,
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
    };
  }
};

export const stockTransactionConverter = {
  toFirestore: (transaction: Omit<StockTransaction, 'id'>): Partial<FirestoreStockTransaction> => {
    const firestoreTransaction: Partial<FirestoreStockTransaction> = {
      productId: transaction.productId,
      productName: transaction.productName,
      type: transaction.type,
      quantity: transaction.quantity,
      previousStock: transaction.previousStock,
      newStock: transaction.newStock,
      transactionDate: Timestamp.fromDate(transaction.transactionDate),
      userId: transaction.userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    if (transaction.productSku) firestoreTransaction.productSku = transaction.productSku;
    if (transaction.notes) firestoreTransaction.notes = transaction.notes;
    if (transaction.vehicleId) firestoreTransaction.vehicleId = transaction.vehicleId;
    if (transaction.startMeter) firestoreTransaction.startMeter = transaction.startMeter;
    if (transaction.endMeter) firestoreTransaction.endMeter = transaction.endMeter;

    return firestoreTransaction;
  },
  fromFirestore: (snapshot: any): StockTransaction => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      productId: data.productId,
      productName: data.productName,
      productSku: data.productSku,
      type: data.type,
      quantity: data.quantity,
      previousStock: data.previousStock,
      newStock: data.newStock,
      transactionDate: safeTimestampToDate(data.transactionDate) || new Date(),
      notes: data.notes,
      vehicleId: data.vehicleId,
      userId: data.userId,
      startMeter: data.startMeter,
      endMeter: data.endMeter,
    };
  }
};

export const returnTransactionConverter = {
  toFirestore: (returnData: ReturnTransaction): Partial<FirestoreReturnTransaction> => {
      const mapItems = (items: CartItem[]): FirestoreCartItem[] => {
        return items.map(item => {
            const firestoreItem: FirestoreCartItem = {
              productRef: doc(db, 'products', item.id).path,
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
        });
      };

    let firestoreChequeDetails: FirestoreChequeInfo | undefined;
    if (returnData.chequeDetails) {
        const { number, bank, date, amount } = returnData.chequeDetails;
        const details: FirestoreChequeInfo = {};
        if (number) details.number = number;
        if (bank) details.bank = bank;
        if (date) details.date = Timestamp.fromDate(date);
        if (amount) details.amount = amount;
        if (Object.keys(details).length > 0) firestoreChequeDetails = details;
    }

    let firestoreBankTransferDetails: BankTransferInfo | undefined;
    if (returnData.bankTransferDetails) {
        const { bankName, referenceNumber, amount } = returnData.bankTransferDetails;
        const details: BankTransferInfo = {};
        if (bankName) details.bankName = bankName;
        if (referenceNumber) details.referenceNumber = referenceNumber;
        if (amount) details.amount = amount;
        if (Object.keys(details).length > 0) firestoreBankTransferDetails = details;
    }

    const dataToSave: Partial<FirestoreReturnTransaction> = {
      originalSaleId: returnData.originalSaleId,
      returnDate: Timestamp.fromDate(returnData.returnDate),
      createdAt: returnData.createdAt ? Timestamp.fromDate(returnData.createdAt) : Timestamp.now(),
      staffId: returnData.staffId,
      customerId: returnData.customerId,
      customerName: returnData.customerName,
      customerShopName: returnData.customerShopName,
      returnedItems: mapItems(returnData.returnedItems),
      exchangedItems: mapItems(returnData.exchangedItems),
      notes: returnData.notes,
      amountPaid: returnData.amountPaid,
      paymentSummary: returnData.paymentSummary,
      chequeDetails: firestoreChequeDetails,
      bankTransferDetails: firestoreBankTransferDetails,
      changeGiven: returnData.changeGiven,
      settleOutstandingAmount: returnData.settleOutstandingAmount,
      refundAmount: returnData.refundAmount,
      cashPaidOut: returnData.cashPaidOut,
    };
    Object.keys(dataToSave).forEach(key => ((dataToSave as any)[key] === undefined) && delete (dataToSave as any)[key]);
    return dataToSave;
  },
  fromFirestore: (snapshot: any): ReturnTransaction => {
    const data = snapshot.data();
    let chequeDetails;
    if (data.chequeDetails) {
        chequeDetails = {
            ...data.chequeDetails,
            date: safeTimestampToDate(data.chequeDetails.date),
        }
    }
    
    const processItems = (items: FirestoreCartItem[] = []): CartItem[] => {
        return items.map((item: FirestoreCartItem): CartItem => {
            let id = 'unknown_id';
            if (typeof item.productRef === 'string') {
              id = item.productRef.split('/')[1];
            } else if (item.productRef instanceof DocumentReference) {
              id = item.productRef.id;
            }
            return {
              id,
              quantity: item.quantity,
              appliedPrice: item.appliedPrice,
              saleType: item.saleType,
              name: item.productName || "N/A", 
              category: item.productCategory || "Other",
              price: typeof item.productPrice === 'number' ? item.productPrice : 0, 
              sku: item.productSku, 
              isOfferItem: false,
            };
        });
    };

    return {
      id: snapshot.id,
      originalSaleId: data.originalSaleId,
      returnDate: safeTimestampToDate(data.returnDate) || new Date(),
      staffId: data.staffId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerShopName: data.customerShopName,
      returnedItems: processItems(data.returnedItems),
      exchangedItems: processItems(data.exchangedItems),
      notes: data.notes,
      amountPaid: data.amountPaid,
      paymentSummary: data.paymentSummary,
      chequeDetails: chequeDetails,
      bankTransferDetails: data.bankTransferDetails,
      changeGiven: data.changeGiven,
      settleOutstandingAmount: data.settleOutstandingAmount,
      refundAmount: data.refundAmount,
      cashPaidOut: data.cashPaidOut,
      createdAt: safeTimestampToDate(data.createdAt),
    };
  }
};

export const userConverter = {
    toFirestore: (user: Omit<User, 'id'>): Partial<FirestoreUser> => {
      const firestoreUser: Partial<FirestoreUser> = {
        username: user.username,
        name: user.name,
        role: user.role,
        password_hashed_or_plain: user.password_hashed_or_plain,
        updatedAt: Timestamp.now(),
      };
      // Note: We don't set createdAt here as this converter could be used for updates.
      // The creation logic should handle setting the initial createdAt timestamp.
      return firestoreUser;
    },
    fromFirestore: (snapshot: any): User & { id: string } => {
      const data = snapshot.data();
      return {
        id: snapshot.id,
        username: data.username,
        name: data.name,
        role: data.role,
        password_hashed_or_plain: data.password_hashed_or_plain,
      };
    }
};

// Rest of interfaces remain unchanged
export interface StatsData {
  totalSales: number;
  totalCustomers: number;
  lowStockItems: number;
  revenueToday: number;
}

export interface SalesChartData {
  name: string;
  sales: number;
}

export type UserRole = "admin" | "cashier";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  password_hashed_or_plain?: string;
}

export interface NavItemConfig {
  href?: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
  children?: NavItemConfig[];
  id: string;
}

export interface FullReportEntry {
  transactionId: string;
  transactionType: 'Sale' | 'Return' | 'Sample';
  transactionDate: string; 
  transactionTime: string; 
  relatedId?: string; 
  invoiceCloseDate?: string;
  customerName: string;
  productName: string;
  productCategory: Product["category"];
  quantity: number;
  appliedPrice: number;
  discountOnItem?: number;
  lineTotal: number;
  saleType?: 'retail' | 'wholesale';
  paymentSummary?: Sale["paymentSummary"];
  paymentDetails?: {
    date: Date;
    summary: string;
  }[];
  staffId: string;
}


export interface ActivityItem {
  id: string;
  type: "sale" | "new_product" | "new_customer";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
  avatarUrl?: string;
  avatarFallback?: string;
  aiHint?: string;
}

export interface DayEndReportSummary {
  reportDate: Date;
  totalTransactions: number;
  grossSalesValue: number;
  totalDiscountsToday?: number;
  refundsForTodaySales: number;
  refundsForPastSales: number;
  netSalesValue: number;
  totalCashIn: number;
  totalChequeIn: number;
  totalBankTransferIn: number;
  totalChangeGiven: number;
  totalRefundsPaidToday: number;
  netCashInHand: number;
  newCreditIssued: number;
  paidAgainstNewCredit: number;
  netOutstandingFromToday: number;
  chequeNumbers: string[];
  bankTransferRefs: string[];
  creditSalesCount: number;
  samplesIssuedCount?: number;
  sampleTransactionsCount?: number;
}


export interface ManagedUser extends Omit<User, 'id'> {
  id: string;
  password?: string;
}

export interface VehicleReportItem {
  productId: string;
  productName: string;
  productSku?: string;
  totalLoaded: number;
  totalUnloaded: number;
  netChange: number;
}
