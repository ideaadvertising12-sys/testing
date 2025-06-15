
"use client";

import { useState } from "react";
import { PackageSearch, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { POSProductCard } from "@/components/sales/POSProductCard";
import { CartView } from "@/components/sales/CartView";
import { BillDialog } from "@/components/sales/BillDialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product, CartItem, Customer } from "@/lib/types";
import { placeholderProducts, placeholderCustomers } from "@/lib/placeholder-data";

export default function SalesPage() {
  const [allProducts] = useState<Product[]>(placeholderProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(placeholderProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Product["category"] | "All">("All");
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);


  const categories: (Product["category"] | "All")[] = ["All", ...new Set(allProducts.map(p => p.category))];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterAndCategorizeProducts(term, selectedCategory);
  };

  const handleCategorySelect = (category: Product["category"] | "All") => {
    setSelectedCategory(category);
    filterAndCategorizeProducts(searchTerm, category);
  };

  const filterAndCategorizeProducts = (term: string, category: Product["category"] | "All") => {
    let tempProducts = allProducts;
    if (category !== "All") {
      tempProducts = tempProducts.filter(p => p.category === category);
    }
    if (term) {
      tempProducts = tempProducts.filter(p => p.name.toLowerCase().includes(term.toLowerCase()));
    }
    setFilteredProducts(tempProducts);
  };

  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) { // Check stock before incrementing
          return prevItems.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return prevItems; // Do nothing if stock limit reached
      }
      if (product.stock > 0) { // Check stock before adding new item
         return [...prevItems, { ...product, quantity: 1 }];
      }
      return prevItems; // Do nothing if stock is 0
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const productInStock = allProducts.find(p => p.id === productId);
    if (!productInStock) return;

    const newQuantity = Math.max(0, Math.min(quantity, productInStock.stock)); // Ensure quantity is within 0 and stock limit

    if (newQuantity === 0) {
      handleRemoveItem(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };
  
  const handleSelectCustomer = (customerId: string | null) => {
    if (customerId === null) {
      setSelectedCustomer(null);
    } else {
      const customer = placeholderCustomers.find(c => c.id === customerId);
      setSelectedCustomer(customer || null);
    }
  };

  const handleCheckout = () => {
    // In a real app: process payment, update inventory, save sale
    console.log("Checkout initiated:", cartItems, selectedCustomer, discountAmount);
    setIsBillOpen(true);
    // Optionally clear cart after successful checkout:
    // setCartItems([]);
    // setSelectedCustomer(null);
    // setDiscountAmount(0);
  };

  const handleCancelOrder = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscountAmount(0);
    console.log("Order cancelled");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]"> {/* Full height minus header */}
      <PageHeader 
        title="Point of Sale" 
        description="Create new sales transactions quickly."
        icon={ShoppingCart}
      />
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="min-h-[450px] lg:min-h-0 lg:col-span-2 flex flex-col">
          <div className="p-1 mb-4">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-grow">
                <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search products by name..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Tabs value={selectedCategory} onValueChange={(value) => handleCategorySelect(value as Product["category"] | "All")}>
              <TabsList className="whitespace-nowrap overflow-x-auto">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-grow p-1 w-full lg:max-w-md lg:mx-auto">
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <PackageSearch className="w-16 h-16 mb-4" />
                    <p className="text-xl">No products found.</p>
                    <p>Try adjusting your search or category filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4"> {/* Adjusted lg/xl cols for constrained width */}
                {filteredProducts.map(product => (
                    <POSProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
                </div>
            )}
          </ScrollArea>
        </div>

        <div className="lg:col-span-1 flex flex-col min-h-0 overflow-y-auto">
          <CartView 
            cartItems={cartItems}
            selectedCustomer={selectedCustomer}
            discountAmount={discountAmount}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onSelectCustomer={handleSelectCustomer}
            onUpdateDiscountAmount={setDiscountAmount}
            onCheckout={handleCheckout}
            onCancelOrder={handleCancelOrder}
          />
        </div>
      </div>
      <BillDialog 
        isOpen={isBillOpen} 
        onOpenChange={(isOpen) => {
          setIsBillOpen(isOpen);
          if (!isOpen) { // If dialog is closed, consider sale complete or cancelled from dialog
            // Potentially clear cart here if checkout was "successful" from dialog perspective
            // For now, relies on SalesPage explicit clear via onCancelOrder or post-checkout logic
          }
        }} 
        cartItems={cartItems} 
        customer={selectedCustomer}
        discountAmount={discountAmount}
        saleId={`SALE-${Date.now().toString().slice(-6)}`} // Mock sale ID
      />
    </div>
  );
}
