export interface Product {
  id: string;
  name: string;
  category: "Milk" | "Yogurt" | "Watallappan" | "Ghee" | "Other";
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  sku?: string;
  reorderLevel?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyaltyPoints?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string; // Denormalized for quick display
  items: CartItem[];
  totalAmount: number;
  paymentMethod: "Cash" | "Card" | "Online";
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

export interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}
