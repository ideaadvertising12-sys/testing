
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PackageSearch, ShoppingCart, Tag, X, Search, Maximize, Minimize, Loader2 } from "lucide-react";
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
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Product, CartItem, Customer, Sale } from "@/lib/types";
import { placeholderSales } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers"; // Import useCustomers
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function SalesPage() {
  const { 
    products: allProducts, 
    isLoading: isLoadingProducts, 
    error: productsError,
    refetch: refetchProducts 
  } = useProducts();

  // SalesPage also needs useCustomers to potentially get customer details if needed elsewhere,
  // but primary selection object comes from CartView.
  const { 
    customers: allCustomersFromHook, 
    isLoading: isLoadingHookCustomers, 
    error: hookCustomersError 
  } = useCustomers();
  
  const [localSalesHistory, setLocalSalesHistory] = useState<Sale[]>(placeholderSales); 

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Product["category"] | "All">("All");
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null); // State for the selected customer object
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [currentSaleType, setCurrentSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSalesPageFullScreen, setIsSalesPageFullScreen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const { toast } = useToast();

  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const categories: (Product["category"] | "All")[] = useMemo(() => {
    if (isLoadingProducts || !allProducts) return ["All"];
    return ["All", ...new Set(allProducts.map(p => p.category))];
  }, [allProducts, isLoadingProducts]);


  const toggleSalesPageFullScreen = () => setIsSalesPageFullScreen(!isSalesPageFullScreen);

  useEffect(() => {
    if (!isLoadingProducts && allProducts) {
      let tempProducts = [...allProducts];
      if (selectedCategory !== "All") {
        tempProducts = tempProducts.filter(p => p.category === selectedCategory);
      }
      if (searchTerm) {
        tempProducts = tempProducts.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      setFilteredProducts(tempProducts);
    } else if (!isLoadingProducts && !allProducts) {
      setFilteredProducts([]); 
    }
  }, [searchTerm, selectedCategory, allProducts, isLoadingProducts]);

  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id && item.saleType === currentSaleType);

      const priceToUse = (currentSaleType === 'wholesale' && product.wholesalePrice && product.wholesalePrice > 0)
        ? product.wholesalePrice
        : product.price;

      if (existingItem) {
        if (product.stock > existingItem.quantity) { 
          return prevItems.map(item =>
            item.id === product.id && item.saleType === currentSaleType
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          toast({ variant: "destructive", title: "Out of Stock", description: `Cannot add more ${product.name}. Maximum stock reached.`});
          return prevItems;
        }
      }
      if (product.stock > 0) { 
        return [...prevItems, { ...product, quantity: 1, appliedPrice: priceToUse, saleType: currentSaleType }];
      } else {
         toast({ variant: "destructive", title: "Out of Stock", description: `${product.name} is currently out of stock.`});
         return prevItems;
      }
    });

    if (isMobile && !isCartOpen) {
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

  // Updated to accept a Customer object or null
  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
        toast({
            variant: "destructive",
            title: "Empty Cart",
            description: "Please add items to the cart before checkout.",
        });
        return;
    }
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

  const currentSubtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0), [cartItems]);
  const currentDiscountAmount = useMemo(() => currentSubtotal * (discountPercentage / 100), [currentSubtotal, discountPercentage]);
  const currentTotalAmount = useMemo(() => Math.max(0, currentSubtotal - currentDiscountAmount), [currentSubtotal, currentDiscountAmount]);

  const handleSuccessfulSale = async (saleDetails: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'>) => {
    setIsProcessingSale(true);
    const salePayload = {
      ...saleDetails,
      items: cartItems.map(item => ({ 
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        appliedPrice: item.appliedPrice,
        saleType: item.saleType,
        sku: item.sku, 
        imageUrl: item.imageUrl, 
      })),
      saleDate: new Date().toISOString(), 
      staffId: "staff001", 
    };

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Sale failed with status ${response.status}`);
      }

      const newSaleResponse = await response.json();
      
      setLocalSalesHistory(prevSales => [
        { ...newSaleResponse, saleDate: new Date(newSaleResponse.saleDate) }, 
        ...prevSales
      ]); 
      
      toast({
          title: "Sale Successful!",
          description: `Payment Method: ${newSaleResponse.paymentMethod}. Total: Rs. ${newSaleResponse.totalAmount.toFixed(2)}`,
      });

      setCartItems([]);
      setSelectedCustomer(null);
      setDiscountPercentage(0);
      setCurrentSaleType('retail');
      await refetchProducts(); 

    } catch (error: any) {
      console.error("Sale processing error:", error);
      toast({
          variant: "destructive",
          title: "Sale Failed",
          description: error.message || "An unexpected error occurred while processing the sale.",
      });
    } finally {
      setIsProcessingSale(false);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const fullscreenButton = (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleSalesPageFullScreen}
      className="h-9 w-9"
      title={isSalesPageFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isSalesPageFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      <span className="sr-only">{isSalesPageFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}</span>
    </Button>
  );

  if (isLoadingProducts && !allProducts?.length) { 
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading products for Point of Sale...</p>
        </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error Loading Products</AlertTitle>
          <AlertDescription>
            Could not load product data for the POS system. Please try refreshing the page or contact support.
            <p className="text-xs mt-1">Details: {productsError}</p>
          </AlertDescription>
        </Alert>
         <Button onClick={() => refetchProducts()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col",
      isSalesPageFullScreen 
        ? "fixed inset-0 z-50 bg-background p-4 sm:p-6 overflow-auto" 
        : "h-full bg-gray-50 dark:bg-transparent"
    )}>
      <PageHeader
        title="Point of Sale"
        description="Create new sales transactions quickly."
        icon={ShoppingCart}
        action={fullscreenButton}
      />

      <div className={cn(
        "flex-1 flex flex-col lg:flex-row lg:gap-4 min-h-0",
        isSalesPageFullScreen && "mt-0"
      )}>
        <div className="flex-1 lg:w-2/3 flex flex-col min-h-0">
          <div className="p-3 sm:p-4 border-b lg:border-b-0 lg:border-r bg-white dark:bg-transparent">
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
                <ScrollArea className="w-full pb-2 overflow-auto">
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

          <ScrollArea className="flex-1 p-3 sm:p-4 bg-white dark:bg-transparent">
            {isLoadingProducts && filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground pt-10 h-full">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-lg">Loading products...</p>
                </div>
            ) : !isLoadingProducts && filteredProducts.length === 0 ? (
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
      <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
        {isMobile && !isSalesPageFullScreen && (
         <DrawerTrigger asChild>
            <div onClick={(e) => e.stopPropagation()}> 
              <Button
                size="lg"
                className="fixed bottom-6 right-6 z-20 rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </DrawerTrigger>
        )}
        <DrawerContent className="h-[85%]">
           <DrawerHeader className="flex justify-between items-center p-4 border-b">
            <DrawerTitle className="text-lg font-semibold">Order Summary</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
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

      <BillDialog
        isOpen={isBillOpen}
        onOpenChange={(isOpenDialog) => {
          setIsBillOpen(isOpenDialog);
        }}
        cartItems={cartItems}
        customer={selectedCustomer}
        discountPercentage={discountPercentage}
        currentSubtotal={currentSubtotal}
        currentDiscountAmount={currentDiscountAmount}
        currentTotalAmount={currentTotalAmount}
        saleId={`SALE-${Date.now().toString().slice(-6)}`} 
        onConfirmSale={handleSuccessfulSale}
      />
    </div>
  );
}
