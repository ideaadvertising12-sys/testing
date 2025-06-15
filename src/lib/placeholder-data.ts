
import type { Product, Customer, Sale, StatsData, SalesChartData } from "./types";

export const placeholderProducts: Product[] = [
  { id: "prod001", name: "Yoghurt", category: "Yogurt", price: 1.50, wholesalePrice: 1.30, stock: 100, imageUrl: "https://placehold.co/300x200.png", description: "Classic creamy yoghurt.", sku: "YOG001", reorderLevel: 20 },
  { id: "prod002", name: "Jelly Yoghurt", category: "Yogurt", price: 1.80, wholesalePrice: 1.60, stock: 80, imageUrl: "https://placehold.co/300x200.png", description: "Yoghurt with fruit jelly.", sku: "YOG002", reorderLevel: 15 },
  { id: "prod003", name: "Drinking Yoghurt", category: "Yogurt", price: 2.00, wholesalePrice: 1.80, stock: 90, imageUrl: "https://placehold.co/300x200.png", description: "Refreshing drinkable yoghurt.", sku: "YOG003", reorderLevel: 20 },
  { id: "prod004", name: "Chocolate Drink", category: "Drink", price: 2.50, wholesalePrice: 2.20, stock: 70, imageUrl: "https://placehold.co/300x200.png", description: "Rich chocolate flavored milk drink.", sku: "DRK001", reorderLevel: 15 },
  { id: "prod005", name: "Glue Cola", category: "Drink", price: 1.20, wholesalePrice: 1.00, stock: 120, imageUrl: "https://placehold.co/300x200.png", description: "A popular cola beverage.", sku: "DRK002", reorderLevel: 25 },
  { id: "prod006", name: "Milk Ice Packet", category: "Ice Cream", price: 1.00, wholesalePrice: 0.80, stock: 150, imageUrl: "https://placehold.co/300x200.png", description: "Frozen milk ice treat.", sku: "ICE001", reorderLevel: 30 },
  { id: "prod007", name: "Chocolate Ice Packet", category: "Ice Cream", price: 1.20, wholesalePrice: 1.00, stock: 140, imageUrl: "https://placehold.co/300x200.png", description: "Frozen chocolate ice treat.", sku: "ICE002", reorderLevel: 30 },
  { id: "prod008", name: "Watalappan", category: "Dessert", price: 3.50, wholesalePrice: 3.20, stock: 50, imageUrl: "https://placehold.co/300x200.png", description: "Traditional coconut custard pudding.", sku: "DES001", reorderLevel: 10 },
  { id: "prod009", name: "Jelly Pudding", category: "Dessert", price: 2.80, wholesalePrice: 2.50, stock: 60, imageUrl: "https://placehold.co/300x200.png", description: "Colorful fruit jelly pudding.", sku: "DES002", reorderLevel: 10 },
  { id: "prod010", name: "Faluda", category: "Drink", price: 3.00, wholesalePrice: 2.70, stock: 40, imageUrl: "https://placehold.co/300x200.png", description: "Sweet rose-flavored milk drink with vermicelli and basil seeds.", sku: "DRK003", reorderLevel: 10 },
  { id: "prod011", name: "Iced Coffee", category: "Drink", price: 2.20, wholesalePrice: 2.00, stock: 60, imageUrl: "https://placehold.co/300x200.png", description: "Chilled coffee beverage.", sku: "DRK004", reorderLevel: 15 },
  { id: "prod012", name: "Curd", category: "Curd", price: 4.00, wholesalePrice: 3.70, stock: 70, imageUrl: "https://placehold.co/300x200.png", description: "Thick and creamy curd.", sku: "CRD001", reorderLevel: 15 },
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
      { ...placeholderProducts[0], quantity: 2, appliedPrice: placeholderProducts[0].price, saleType: 'retail' },
      { ...placeholderProducts[1], quantity: 1, appliedPrice: placeholderProducts[1].price, saleType: 'retail' },
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
      { ...placeholderProducts[7], quantity: 1, appliedPrice: placeholderProducts[7].price, saleType: 'retail' },
      { ...placeholderProducts[11], quantity: 1, appliedPrice: placeholderProducts[11].price, saleType: 'retail' },
    ], 
    totalAmount: placeholderProducts[7].price + placeholderProducts[11].price, 
    paymentMethod: "Cash", 
    saleDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    staffId: "staff002"
  },
];

export const placeholderStats: StatsData = {
  totalSales: 12500.75, // This value can be recalculated if needed, or kept as a general placeholder
  totalCustomers: placeholderCustomers.length,
  lowStockItems: placeholderProducts.filter(p => p.stock <= (p.reorderLevel || 10)).length,
  revenueToday: 350.50, // This value can be recalculated or kept as a general placeholder
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
