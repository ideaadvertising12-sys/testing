
"use client";

import { useState, useEffect } from "react";
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

  return (
    <div className="flex flex-col h-full"> 
      <PageHeader 
        title="Point of Sale" 
        description="Create new sales transactions quickly."
        icon={ShoppingCart}
      />
      {/* Main content area: Product Selection and Cart */}
      <div className="flex-1 flex flex-col lg:flex-row lg:gap-4 min-h-0" >
        
        {/* Product Selection Section (Mobile: Top, LG: Left Column) */}
        <div className="flex-1 lg:w-2/3 flex flex-col ">
          {/* Controls: Search, Sale Type, Tabs */}
          <div className="p-3 sm:p-4 border-b lg:border-b-0 lg:border-r">
            <div className="relative mb-3 sm:mb-4">
              <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search products by name or SKU..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 bg-muted p-2 rounded-md shrink-0 self-start sm:self-center">
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
              <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Product["category"] | "All")} className="w-full sm:w-auto">
                <TabsList className="whitespace-nowrap overflow-x-auto h-auto py-1 px-1">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5">{cat}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Product Grid Area */}
          <ScrollArea className="flex-1 p-3 sm:p-4 h-[500px] overflow-auto">
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground pt-10 h-[400px] overflow-auto">
                    <PackageSearch className="w-16 h-16 mb-4" />
                    <p className="text-xl">No products found.</p>
                    <p>Try adjusting your search or category filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4  ">
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

        {/* Cart Section (Mobile: Bottom Panel, LG: Right Column) */}
        <div className="h-[45vh] lg:h-auto lg:w-1/3 flex flex-col min-h-0 border-t lg:border-t-0 bg-card">
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
            className="flex-1 min-h-0" // Ensures CartView itself manages its height within this container
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
