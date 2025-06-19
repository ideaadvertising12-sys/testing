
import type { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  category: "Yogurt" | "Drink" | "Ice Cream" | "Dessert" | "Curd" | "Other";
  price: number; // Retail price
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
  createdAt?: Date;
}

export interface CartItem extends Product {
  quantity: number;
  appliedPrice: number;
  saleType: 'retail' | 'wholesale';
}

export interface Sale {
  id:string;
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
  createdAt?: Date;
}

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
  type: StockTransactionType;
  quantity: number;
  transactionDate: Date;
  notes?: string;
  vehicleId?: string;
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

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName?: string;
  notes?: string;
}

export interface ManagedUser extends User {
  id: string;
  password?: string;
}

// Firestore-specific types
export interface FirestoreProduct extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp; // Mandatory for new Firestore documents
  updatedAt: Timestamp; // Mandatory for new/updated Firestore documents
}

export interface FirestoreSale extends Omit<Sale, 'id' | 'saleDate' | 'createdAt' | 'items'> {
  saleDate: Timestamp;
  createdAt: Timestamp; // Mandatory for new Firestore documents
  items: Omit<CartItem, 'createdAt' | 'updatedAt' | 'id'>[]; // Items in sale don't need their own product id or timestamps
}

export interface FirestoreCustomer extends Omit<Customer, 'id' | 'createdAt'> {
  createdAt: Timestamp; // Mandatory for new Firestore documents
}

// Firestore converters for type safety
export const productConverter = {
  toFirestore: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): FirestoreProduct => {
    return {
      name: productData.name,
      category: productData.category,
      price: productData.price,
      wholesalePrice: productData.wholesalePrice === undefined ? null : productData.wholesalePrice, // Use null for undefined in Firestore
      stock: productData.stock,
      imageUrl: productData.imageUrl === undefined ? null : productData.imageUrl,
      description: productData.description === undefined ? null : productData.description,
      sku: productData.sku === undefined ? null : productData.sku,
      reorderLevel: productData.reorderLevel === undefined ? null : productData.reorderLevel,
      aiHint: productData.aiHint === undefined ? null : productData.aiHint,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  },
  fromFirestore: (snapshot: any, options: any): Product => {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      name: data.name,
      category: data.category,
      price: data.price,
      wholesalePrice: data.wholesalePrice === null ? undefined : data.wholesalePrice,
      stock: data.stock,
      imageUrl: data.imageUrl === null ? undefined : data.imageUrl,
      description: data.description === null ? undefined : data.description,
      sku: data.sku === null ? undefined : data.sku,
      reorderLevel: data.reorderLevel === null ? undefined : data.reorderLevel,
      aiHint: data.aiHint === null ? undefined : data.aiHint,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
    };
  }
};

export const saleConverter = {
  toFirestore: (saleData: Omit<Sale, 'id' | 'createdAt'>): FirestoreSale => {
    const { items, ...restOfSaleData } = saleData;
    const firestoreItems = items.map(item => {
      const { id, createdAt, updatedAt, ...firestoreCartItemFields } = item; // Strip Product's id, createdAt, updatedAt
      return firestoreCartItemFields;
    });

    return {
      ...restOfSaleData,
      saleDate: Timestamp.fromDate(saleData.saleDate),
      items: firestoreItems,
      createdAt: Timestamp.now(),
    };
  },
  fromFirestore: (snapshot: any, options: any): Sale => {
    const data = snapshot.data(options)!;
    // Reconstruct CartItem with necessary fields from Product (like id, name, category, etc.)
    // Assuming the fields stored in firestoreItems are sufficient to display in cart context.
    // If full product details are needed for each cart item upon fetching a sale, this might need adjustment
    // or fetching products separately. For now, we assume stored item details are enough.
    const reconstructedItems: CartItem[] = data.items.map((item: any) => ({
      ...item, // This includes name, category, price, quantity, appliedPrice, saleType, etc.
      id: '', // Placeholder, as product ID is not stored per item in FirestoreSale.items
              // This might be an issue if CartItem expects a valid product ID.
              // For now, the original CartItem on Sale creation had the ID, but it's stripped for DB.
    }));

    return {
      id: snapshot.id,
      customerId: data.customerId,
      customerName: data.customerName,
      subTotal: data.subTotal,
      discountPercentage: data.discountPercentage,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      cashGiven: data.cashGiven,
      balanceReturned: data.balanceReturned,
      amountPaidOnCredit: data.amountPaidOnCredit,
      remainingCreditBalance: data.remainingCreditBalance,
      staffId: data.staffId,
      saleDate: data.saleDate.toDate(),
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
      items: reconstructedItems,
    };
  }
};

export const customerConverter = {
  toFirestore: (customerData: Omit<Customer, 'id' | 'createdAt'>): FirestoreCustomer => {
    return {
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address === undefined ? null : customerData.address,
      shopName: customerData.shopName === undefined ? null : customerData.shopName,
      avatar: customerData.avatar === undefined ? null : customerData.avatar,
      createdAt: Timestamp.now(),
    };
  },
  fromFirestore: (snapshot: any, options: any): Customer => {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      name: data.name,
      phone: data.phone,
      address: data.address === null ? undefined : data.address,
      shopName: data.shopName === null ? undefined : data.shopName,
      avatar: data.avatar === null ? undefined : data.avatar,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    };
  }
};
