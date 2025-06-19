
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
  aiHint?: string; // Added for specific AI hints
  createdAt?: Date; // For FirestoreProduct fromFirestore conversion
  updatedAt?: Date; // For FirestoreProduct fromFirestore conversion
}

export interface Customer {
  id: string;
  avatar?: string;
  name: string;
  phone: string;
  address?: string;
  shopName?: string;
  createdAt?: Date; // For FirestoreCustomer fromFirestore conversion
}

export interface CartItem extends Product {
  quantity: number;
  appliedPrice: number; // Price used for this item in the cart (retail or wholesale)
  saleType: 'retail' | 'wholesale'; // How this item was added
}

export interface Sale {
  id:string;
  customerId?: string; // Mandatory for credit sales
  customerName?: string; // Denormalized for quick display, mandatory for credit
  items: CartItem[];
  subTotal: number; // Subtotal before discount
  discountPercentage: number; // Discount applied
  discountAmount: number; // Calculated discount amount
  totalAmount: number; // Final amount after discount
  paymentMethod: "Cash" | "Card" | "Credit";
  cashGiven?: number; // For cash payment
  balanceReturned?: number; // For cash payment
  amountPaidOnCredit?: number; // For credit payment
  remainingCreditBalance?: number; // For credit payment
  saleDate: Date;
  staffId: string; // Or staff name
  createdAt?: Date; // For FirestoreSale fromFirestore conversion
}

export interface StatsData {
  totalSales: number;
  totalCustomers: number;
  lowStockItems: number;
  revenueToday: number;
}

export interface SalesChartData {
  name: string; // e.g., 'Jan', 'Feb', 'Mon', 'Tue'
  sales: number;
}

export type UserRole = "admin" | "cashier";

export interface User {
  username: string; // Acts as ID
  role: UserRole;
  name: string; // Display name, e.g., "Admin User"
  password_hashed_or_plain?: string; // For user management forms, actual storage in mock is separate
}


export interface NavItemConfig {
  href?: string; // Optional: if not provided, it's a parent/header for children
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
  children?: NavItemConfig[]; // For sub-menus
  id: string; // Unique ID for accordion items
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
  productName: string; // Denormalized
  type: StockTransactionType;
  quantity: number;
  transactionDate: Date;
  notes?: string;
  vehicleId?: string; // Optional, for vehicle loading/unloading
}

export interface FullReportEntry {
  saleId: string;
  saleDate: string; // Formatted date string
  saleTime: string; // Formatted time string
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

// For RecentActivity component
export interface ActivityItem {
  id: string;
  type: "sale" | "new_product" | "new_customer";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
  avatarUrl?: string;
  avatarFallback?: string;
  aiHint?: string; // Added for product images
}

export interface DayEndReportSummary {
  reportDate: Date;
  cashSales: { count: number; amount: number; cashReceived: number; balanceReturned: number };
  cardSales: { count: number; amount: number };
  creditSales: { count: number; amount: number; amountPaidOnCredit: number; remainingCreditBalance: number };
  overallTotalSales: number;
  overallTotalCashReceived: number; // Cash from Cash Sales + Amount Paid on Credit Sales
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

// For User Management
export interface ManagedUser extends User {
  id: string; // Typically the username
  password?: string; // Used in forms, not directly stored
}

// Firestore-specific types
export interface FirestoreProduct extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreSale extends Omit<Sale, 'id' | 'saleDate' | 'createdAt' | 'items'> {
  saleDate: Timestamp;
  createdAt?: Timestamp;
  items: Omit<CartItem, 'createdAt' | 'updatedAt'>[]; // Cart items in FirestoreSale won't have timestamps from Product directly
}

export interface FirestoreCustomer extends Omit<Customer, 'id' | 'createdAt'> {
  createdAt?: Timestamp;
}

// Firestore converters for type safety
export const productConverter = {
  toFirestore: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp, updatedAt?: Timestamp }) => {
    const { ...data } = product; // Destructure to remove id and specific Date fields if they exist
    return {
      ...data,
      name: product.name,
      category: product.category,
      price: product.price,
      wholesalePrice: product.wholesalePrice,
      stock: product.stock,
      imageUrl: product.imageUrl,
      description: product.description,
      sku: product.sku,
      reorderLevel: product.reorderLevel,
      aiHint: product.aiHint,
      createdAt: product.createdAt instanceof Date ? Timestamp.fromDate(product.createdAt) : (product.createdAt || Timestamp.now()),
      updatedAt: Timestamp.now()
    };
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
      aiHint: data.aiHint,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Product; // Cast to Product type
  }
};

export const saleConverter = {
  toFirestore: (sale: Omit<Sale, 'id' | 'createdAt' | 'items'> & { createdAt?: Timestamp, items: Omit<CartItem, 'createdAt' | 'updatedAt'>[] }) => {
    const { ...data } = sale;
    return {
      ...data,
      saleDate: sale.saleDate instanceof Date ? Timestamp.fromDate(sale.saleDate) : sale.saleDate,
      createdAt: sale.createdAt instanceof Date ? Timestamp.fromDate(sale.createdAt) : (sale.createdAt || Timestamp.now()),
      items: sale.items.map(item => { // Ensure items are plain objects
        const {...itemData} = item;
        return itemData;
      })
    };
  },
  fromFirestore: (snapshot: any, options: any): Sale => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      saleDate: data.saleDate.toDate(),
      createdAt: data.createdAt?.toDate(),
      items: data.items.map((item: any) => ({ // Ensure items are mapped correctly
        ...item
      }))
    } as Sale;
  }
};

export const customerConverter = {
  toFirestore: (customer: Omit<Customer, 'id' | 'createdAt'> & { createdAt?: Timestamp }) => {
    const { ...data } = customer;
    return {
      ...data,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      shopName: customer.shopName,
      avatar: customer.avatar,
      createdAt: customer.createdAt instanceof Date ? Timestamp.fromDate(customer.createdAt) : (customer.createdAt || Timestamp.now())
    };
  },
  fromFirestore: (snapshot: any, options: any): Customer => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate()
    } as Customer;
  }
};
