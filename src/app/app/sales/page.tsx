
"use client";

import React, { useState, useEffect } from "react";
import { PackageSearch, ShoppingCart, Tag, X, Search, Plus, Minus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { POSProductCard } from "@/components/sales/POSProductCard";
import { CartView } from "@/components/sales/CartView";
import { BillDialog } from "@/components/sales/BillDialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const isMobile = useMediaQuery("(max-width: 768px)");
  const categories: (Product["category"] | "All")[] = ["All", ...new Set(allProducts.map(p => p.category))];

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

  useEffect(() => {
    filterAndCategorizeProducts(searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory, allProducts]);

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
    
    if (isMobile) {
      setIsCartOpen(true);
    }
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
    setIsBillOpen(true);
    if (isMobile) {
      setIsCartOpen(false);
    }
  };

  const handleCancelOrder = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscountPercentage(0);
    setCurrentSaleType('retail'); 
  };

  const handleSuccessfulSale = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscountPercentage(0);
    setCurrentSaleType('retail');
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900"> 
        <PageHeader 
          title="Point of Sale" 
          description="Create new sales transactions quickly."
          icon={ShoppingCart}
        />
        
        {/* Mobile Cart Button */}
        {isMobile && (
          <div className="fixed bottom-6 right-6 z-20">
            <DrawerTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full h-14 w-14 shadow-lg relative"
                // onClick={() => setIsCartOpen(true)} // DrawerTrigger handles this
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </DrawerTrigger>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row lg:gap-4 min-h-0" >
          {/* Products Section */}
          <div className="flex-1 lg:w-2/3 flex flex-col min-h-0">
            <div className="p-3 sm:p-4 border-b lg:border-b-0 lg:border-r bg-white dark:bg-gray-800">
              <div className="relative mb-3 sm:mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search products by name or SKU..." 
                  className="pl-10 pr-8 h-12 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-2 bg-muted p-2 rounded-md shrink-0 self-start sm:self-center">
                  <Switch
                    id="sale-type-toggle"
                    checked={currentSaleType === 'wholesale'}
                    onCheckedChange={(checked) => setCurrentSaleType(checked ? 'wholesale' : 'retail')}
                    aria-label="Toggle sale type"
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="sale-type-toggle" className="flex items-center gap-1 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    {currentSaleType === 'wholesale' ? 'Wholesale' : 'Retail'}
                  </Label>
                </div>
                
                <Tabs 
                  value={selectedCategory} 
                  onValueChange={(value) => setSelectedCategory(value as Product["category"] | "All")} 
                  className="w-full sm:w-auto"
                >
                  <ScrollArea orientation="horizontal" className="w-full pb-2">
                    <TabsList className="whitespace-nowrap h-auto py-1 px-1 bg-transparent">
                      {categories.map(cat => (
                        <TabsTrigger 
                          key={cat} 
                          value={cat} 
                          className="text-xs sm:text-sm px-3 py-1.5 rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                          {cat}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </ScrollArea>
                </Tabs>
              </div>
            </div>

            <ScrollArea className="flex-1 p-3 sm:p-4 bg-white dark:bg-gray-800">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground pt-10 h-full">
                  <PackageSearch className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-xl font-medium text-gray-500 dark:text-gray-400">No products found</p>
                  <p className="text-gray-400 dark:text-gray-500">Try adjusting your search or category filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
          
          {/* Cart Section - Desktop */}
          {!isMobile && (
            <div className="flex-shrink-0 basis-[360px] lg:w-1/3 flex flex-col min-h-0 border-t lg:border-t-0 bg-white dark:bg-gray-800 shadow-left">
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
                className="flex-1 min-h-0" 
              />
            </div>
          )}
        </div>
        
        {/* Mobile Cart Drawer */}
        {isMobile && (
          <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
            <DrawerContent className="h-[85%]">
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Order Summary</h3>
                  <button onClick={() => setIsCartOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
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
                  className="flex-1 min-h-0" 
                />
              </div>
            </DrawerContent>
          </Drawer>
        )}
        
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
      <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
    </>
  );
}
