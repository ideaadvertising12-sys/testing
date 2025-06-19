import { Timestamp } from 'firebase/firestore';

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
}

export interface Customer {
  id: string;
  avatar?: string;
  name: string;
  phone: string;
  address?: string;
  shopName?: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  appliedPrice: number;
  saleType: 'retail' | 'wholesale';
  name: string;
  category: Product["category"];
  price: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subTotal: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: "Cash" | "Card" | "Credit";
  cashGiven?: number;
  balanceReturned?: number;
  amountPaidOnCredit?: number;
  remainingCreditBalance?: number;
  saleDate: Date;
  staffId: string;
}

// Stock Transaction Types
export type StockTransactionType =
  | "ADD_STOCK_INVENTORY"
  | "LOAD_TO_VEHICLE"
  | "UNLOAD_FROM_VEHICLE"
  | "REMOVE_STOCK_WASTAGE"
  | "STOCK_ADJUSTMENT_MANUAL";

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
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName?: string;
  notes?: string;
}

// Firestore-specific types
export interface FirestoreProduct extends Omit<Product, 'id'> {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreCustomer extends Omit<Customer, 'id'> {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreCartItem {
  productRef: string;
  quantity: number;
  appliedPrice: number;
  saleType: 'retail' | 'wholesale';
  productName: string;
  productCategory: Product["category"];
  productPrice: number;
}

export interface FirestoreSale extends Omit<Sale, 'id' | 'saleDate' | 'items'> {
  items: FirestoreCartItem[];
  saleDate: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreStockTransaction {
  productId: string;
  productName: string;
  productSku?: string;
  type: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  transactionDate: Timestamp;
  notes?: string;
  vehicleId?: string;
  userId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Data Converters
export const productConverter = {
  toFirestore: (product: FirestoreProduct): Partial<FirestoreProduct> => {
    const firestoreProduct: Partial<FirestoreProduct> = {
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      updatedAt: Timestamp.now(),
    };

    // Optional fields
    if (product.wholesalePrice !== undefined) firestoreProduct.wholesalePrice = product.wholesalePrice;
    if (product.imageUrl) firestoreProduct.imageUrl = product.imageUrl;
    if (product.description) firestoreProduct.description = product.description;
    if (product.sku) firestoreProduct.sku = product.sku;
    if (product.reorderLevel !== undefined) firestoreProduct.reorderLevel = product.reorderLevel;
    if (product.aiHint) firestoreProduct.aiHint = product.aiHint;
    if (!product.createdAt) firestoreProduct.createdAt = Timestamp.now();

    return firestoreProduct;
  },
  fromFirestore: (snapshot: any, options: any): Product => {
    const data = snapshot.data(options);
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
      aiHint: data.aiHint
    };
  }
};

export const customerConverter = {
  toFirestore: (customer: FirestoreCustomer): Partial<FirestoreCustomer> => {
    const firestoreCustomer: Partial<FirestoreCustomer> = {
      name: customer.name,
      phone: customer.phone,
      updatedAt: Timestamp.now(),
    };

    // Optional fields
    if (customer.avatar) firestoreCustomer.avatar = customer.avatar;
    if (customer.address) firestoreCustomer.address = customer.address;
    if (customer.shopName) firestoreCustomer.shopName = customer.shopName;
    if (!customer.createdAt) firestoreCustomer.createdAt = Timestamp.now();

    return firestoreCustomer;
  },
  fromFirestore: (snapshot: any, options: any): Customer => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      address: data.address,
      shopName: data.shopName
    };
  }
};

export const saleConverter = {
  toFirestore: (sale: FirestoreSale): Partial<FirestoreSale> => {
    const firestoreSale: Partial<FirestoreSale> = {
      items: sale.items,
      subTotal: sale.subTotal,
      discountPercentage: sale.discountPercentage,
      discountAmount: sale.discountAmount,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      saleDate: sale.saleDate,
      staffId: sale.staffId,
      updatedAt: Timestamp.now(),
    };

    // Optional fields
    if (sale.customerId) firestoreSale.customerId = sale.customerId;
    if (sale.customerName) firestoreSale.customerName = sale.customerName;
    if (sale.cashGiven !== undefined) firestoreSale.cashGiven = sale.cashGiven;
    if (sale.balanceReturned !== undefined) firestoreSale.balanceReturned = sale.balanceReturned;
    if (sale.amountPaidOnCredit !== undefined) firestoreSale.amountPaidOnCredit = sale.amountPaidOnCredit;
    if (sale.remainingCreditBalance !== undefined) firestoreSale.remainingCreditBalance = sale.remainingCreditBalance;
    if (!sale.createdAt) firestoreSale.createdAt = Timestamp.now();

    return firestoreSale;
  },
  fromFirestore: async (snapshot: any, options: any): Promise<Sale> => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      items: data.items.map((item: FirestoreCartItem) => ({
        id: item.productRef.split('/')[1],
        quantity: item.quantity,
        appliedPrice: item.appliedPrice,
        saleType: item.saleType,
        name: item.productName,
        category: item.productCategory,
        price: item.productPrice,
        stock: 0,
        wholesalePrice: undefined,
        imageUrl: undefined,
        description: undefined,
        sku: undefined,
        reorderLevel: undefined,
        aiHint: undefined
      })),
      subTotal: data.subTotal,
      discountPercentage: data.discountPercentage,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      cashGiven: data.cashGiven,
      balanceReturned: data.balanceReturned,
      amountPaidOnCredit: data.amountPaidOnCredit,
      remainingCreditBalance: data.remainingCreditBalance,
      saleDate: data.saleDate.toDate(),
      staffId: data.staffId,
      customerId: data.customerId,
      customerName: data.customerName
    };
  }
};

export const stockTransactionConverter = {
  toFirestore: (transaction: FirestoreStockTransaction): FirestoreStockTransaction => {
    return {
      productId: transaction.productId,
      productName: transaction.productName,
      productSku: transaction.productSku,
      type: transaction.type,
      quantity: transaction.quantity,
      previousStock: transaction.previousStock,
      newStock: transaction.newStock,
      transactionDate: transaction.transactionDate,
      notes: transaction.notes,
      vehicleId: transaction.vehicleId,
      userId: transaction.userId,
      updatedAt: Timestamp.now(),
      createdAt: transaction.createdAt || Timestamp.now()
    };
  },
  fromFirestore: (snapshot: { id: string; data(): any }): StockTransaction => {
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
      transactionDate: data.transactionDate.toDate(),
      notes: data.notes,
      vehicleId: data.vehicleId,
      userId: data.userId
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
  saleId: string;
  saleDate: string;
  saleTime: string;
  customerName: string;
  productSku: string;
  productName: string;
  productCategory: Product["category"];
  quantity: number;
  appliedPrice: number;
  lineTotal: number;
  saleType: 'retail' | 'wholesale';
  paymentMethod: Sale["paymentMethod"];
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
  cashSales: { count: number; amount: number; cashReceived: number; balanceReturned: number };
  cardSales: { count: number; amount: number };
  creditSales: { count: number; amount: number; amountPaidOnCredit: number; remainingCreditBalance: number };
  overallTotalSales: number;
  overallTotalCashReceived: number;
  overallTotalBalanceReturned: number;
  overallTotalCreditOutstanding: number;
  totalTransactions: number;
}

export interface ManagedUser extends User {
  id: string;
  password?: string;
}