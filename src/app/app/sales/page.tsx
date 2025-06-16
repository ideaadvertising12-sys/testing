
"use client";

import { useState } from "react";
import { PackageSearch, ShoppingCart, Tag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { POSProductCard } from "@/components/sales/POSProductCard";
import { CartView } from "@/components/sales/CartView";
import { BillDialog } from "@/components/sales/BillDialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [currentSaleType, setCurrentSaleType] = useState<'retail' | 'wholesale'>('retail');


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
      tempProducts = tempProducts.filter(p => 
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(term.toLowerCase()))
      );
    }
    setFilteredProducts(tempProducts);
  };

  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id && item.saleType === currentSaleType);
      
      const priceToUse = (currentSaleType === 'wholesale' && product.wholesalePrice && product.wholesalePrice > 0)
        ? product.wholesalePrice
        : product.price;

      if (existingItem) {
        if (existingItem.quantity < product.stock) { 
          return prevItems.map(item =>
            item.id === product.id && item.saleType === currentSaleType 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
          );
        }
        return prevItems; 
      }
      if (product.stock > 0) { 
         return [...prevItems, { ...product, quantity: 1, appliedPrice: priceToUse, saleType: currentSaleType }];
      }
      return prevItems; 
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number, saleType: 'retail' | 'wholesale') => {
    const productInStock = allProducts.find(p => p.id === productId);
    if (!productInStock) return;

    const newQuantity = Math.max(0, Math.min(quantity, productInStock.stock)); 

    if (newQuantity === 0) {
      handleRemoveItem(productId, saleType);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId && item.saleType === saleType ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (productId: string, saleType: 'retail' | 'wholesale') => {
    setCartItems(prevItems => prevItems.filter(item => !(item.id === productId && item.saleType === saleType)));
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
    console.log("Checkout initiated:", cartItems, selectedCustomer, discountPercentage);
    setIsBillOpen(true);
  };

  const handleCancelOrder = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscountPercentage(0);
    setCurrentSaleType('retail'); 
    console.log("Order cancelled");
  };

  const handleSuccessfulSale = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscountPercentage(0);
    setCurrentSaleType('retail');
  };


  return (
    <div className="flex flex-col h-full"> 
      <PageHeader 
        title="Point of Sale" 
        description="Create new sales transactions quickly."
        icon={ShoppingCart}
      />
      <div className="flex-grow flex flex-col lg:grid lg:grid-cols-3 lg:gap-6 min-h-0">
        {/* Product Selection Area */}
        <div className="flex-1 min-h-0 lg:col-span-2 flex flex-col">
          <div className="px-4 pt-4 pb-2 sm:px-4 sm:pt-4 sm:pb-2 mb-4"> {/* Adjusted padding for consistency */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search products by name or SKU..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2 bg-muted p-2 rounded-md shrink-0">
                <Switch
                  id="sale-type-toggle"
                  checked={currentSaleType === 'wholesale'}
                  onCheckedChange={(checked) => setCurrentSaleType(checked ? 'wholesale' : 'retail')}
                  aria-label="Toggle sale type"
                />
                <Label htmlFor="sale-type-toggle" className="flex items-center gap-1 text-sm">
                  <Tag className="h-4 w-4" />
                  {currentSaleType === 'wholesale' ? 'Wholesale Pricing' : 'Retail Pricing'}
                </Label>
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

          <ScrollArea className="flex-grow p-4"> {/* Adjusted padding */}
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
                    <PackageSearch className="w-16 h-16 mb-4" />
                    <p className="text-xl">No products found.</p>
                    <p>Try adjusting your search or category filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                    <POSProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                      currentSaleType={currentSaleType} 
                    />
                ))}
                </div>
            )}
          </ScrollArea>
        </div>

        {/* Cart View Area */}
        <div className="flex flex-col min-h-0 lg:col-span-1 h-[40vh] lg:h-full">
          <CartView 
            cartItems={cartItems}
            selectedCustomer={selectedCustomer}
            discountPercentage={discountPercentage}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onSelectCustomer={handleSelectCustomer}
            onUpdateDiscountPercentage={setDiscountPercentage}
            onCheckout={handleCheckout}
            onCancelOrder={handleCancelOrder}
          />
        </div>
      </div>
      <BillDialog 
        isOpen={isBillOpen} 
        onOpenChange={(isOpen) => {
          setIsBillOpen(isOpen);
          if (!isOpen) { 
             handleSuccessfulSale(); 
          }
        }} 
        cartItems={cartItems} 
        customer={selectedCustomer}
        discountPercentage={discountPercentage}
        saleId={`SALE-${Date.now().toString().slice(-6)}`} 
      />
    </div>
  );
}
