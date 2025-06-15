
import type { Product, Customer, Sale, StatsData, SalesChartData } from "./types";

export const placeholderProducts: Product[] = [
  { id: "1", name: "Fresh Milk (1L)", category: "Milk", price: 2.50, stock: 120, imageUrl: "https://placehold.co/300x200.png", description: "Pasteurized full cream milk.", sku: "MILK001", reorderLevel: 20 },
  { id: "2", name: "Natural Yogurt (500g)", category: "Yogurt", price: 3.00, stock: 80, imageUrl: "https://placehold.co/300x200.png", description: "Creamy natural yogurt.", sku: "YOG001", reorderLevel: 15 },
  { id: "3", name: "Watallappan Delight", category: "Watallappan", price: 4.50, stock: 50, imageUrl: "https://placehold.co/300x200.png", description: "Traditional Sri Lankan coconut custard pudding.", sku: "WAT001", reorderLevel: 10 },
  { id: "4", name: "Pure Ghee (250g)", category: "Ghee", price: 7.00, stock: 60, imageUrl: "https://placehold.co/300x200.png", description: "Clarified butter made from cow's milk.", sku: "GHEE001", reorderLevel: 10 },
  { id: "5", name: "Skimmed Milk (1L)", category: "Milk", price: 2.30, stock: 75, imageUrl: "https://placehold.co/300x200.png", description: "Low-fat skimmed milk.", sku: "MILK002", reorderLevel: 20 },
  { id: "6", name: "Fruit Yogurt (Pack of 4)", category: "Yogurt", price: 5.00, stock: 40, imageUrl: "https://placehold.co/300x200.png", description: "Assorted fruit flavored yogurts.", sku: "YOG002", reorderLevel: 10 },
];

export const placeholderCustomers: Customer[] = [
  { id: "1", name: "John Doe", phone: "555-1234", email: "john.doe@example.com", address: "123 Main St, Anytown", loyaltyPoints: 150 },
  { id: "2", name: "Jane Smith", phone: "555-5678", email: "jane.smith@example.com", address: "456 Oak Ave, Anytown", loyaltyPoints: 230 },
  { id: "3", name: "Alice Johnson", phone: "555-8765", email: "alice.j@example.com", loyaltyPoints: 75 },
  { id: "4", name: "Bob Brown", phone: "555-4321", email: "bob.b@example.com", address: "789 Pine Ln, Anytown" },
];

export const placeholderSales: Sale[] = [
  { 
    id: "1", 
    customerId: "1", 
    customerName: "John Doe",
    items: [
      { ...placeholderProducts[0], quantity: 2 },
      { ...placeholderProducts[1], quantity: 1 },
    ], 
    totalAmount: (placeholderProducts[0].price * 2) + placeholderProducts[1].price, 
    paymentMethod: "Card", 
    saleDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    staffId: "staff001" 
  },
  { 
    id: "2", 
    customerId: "2", 
    customerName: "Jane Smith",
    items: [
      { ...placeholderProducts[2], quantity: 1 },
      { ...placeholderProducts[3], quantity: 1 },
    ], 
    totalAmount: placeholderProducts[2].price + placeholderProducts[3].price, 
    paymentMethod: "Cash", 
    saleDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    staffId: "staff002"
  },
];

export const placeholderStats: StatsData = {
  totalSales: 12500.75,
  totalCustomers: placeholderCustomers.length,
  lowStockItems: placeholderProducts.filter(p => p.stock < (p.reorderLevel || 15)).length,
  revenueToday: 350.50,
};

export const placeholderSalesChartData: SalesChartData[] = [
  { name: "Mon", sales: 400 },
  { name: "Tue", sales: 300 },
  { name: "Wed", sales: 200 },
  { name: "Thu", sales: 278 },
  { name: "Fri", sales: 189 },
  { name: "Sat", sales: 239 },
  { name: "Sun", sales: 349 },
];

export const placeholderMonthlySalesData: SalesChartData[] = [
  { name: "Jan", sales: 2400 },
  { name: "Feb", sales: 1398 },
  { name: "Mar", sales: 9800 },
  { name: "Apr", sales: 3908 },
  { name: "May", sales: 4800 },
  { name: "Jun", sales: 3800 },
  { name: "Jul", sales: 4300 },
];
