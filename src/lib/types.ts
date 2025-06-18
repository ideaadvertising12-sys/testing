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
}

export interface Customer {
  id: string;
  avatar?: string;
  name: string;
  phone: string;
  address?: string;
  shopName?: string;
}

export interface CartItem extends Product {
  quantity: number;
  appliedPrice: number; // Price used for this item in the cart (retail or wholesale)
  saleType: 'retail' | 'wholesale'; // How this item was added
}

export interface Sale {
  id:string;
  customerId?: string;
  customerName?: string; // Denormalized for quick display
  items: CartItem[];
  totalAmount: number;
  paymentMethod: "Cash" | "Card" | "Credit"; // Updated payment methods
  saleDate: Date;
  staffId: string; // Or staff name
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
  username: string;
  role: UserRole;
  name: string; // Display name, e.g., "Admin User"
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
