
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PackageSearch, ShoppingCart, Tag, X, Search, Maximize, Minimize, Loader2, Gift } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Helper function to reconcile offer items in the cart
function reconcileOfferItems(
  currentCart: CartItem[],
  offerActive: boolean,
  allProductsForLookup: Product[]
): CartItem[] {
  const paidItems = currentCart.filter(item => !item.isOfferItem);

  if (!offerActive || !allProductsForLookup || allProductsForLookup.length === 0) {
    return paidItems; // If offer is off or no products to lookup, return only paid items
  }

  const newOfferItems: CartItem[] = [];
  const productGroupCounts: Record<string, { count: number; productDetails: Product; saleType: 'retail' | 'wholesale' }> = {};

  paidItems.forEach(item => {
    const key = `${item.id}-${item.saleType}`; // Group by product ID and sale type
    if (!productGroupCounts[key]) {
      const baseProduct = allProductsForLookup.find(p => p.id === item.id);
      if (!baseProduct) return; 
      productGroupCounts[key] = { count: 0, productDetails: baseProduct, saleType: item.saleType };
    }
    productGroupCounts[key].count += item.quantity;
  });

  Object.values(productGroupCounts).forEach(group => {
    const numberOfFreeUnits = Math.floor(group.count / 12);
    if (numberOfFreeUnits > 0) {
      newOfferItems.push({
        ...group.productDetails, // Spread all product details for consistency
        id: group.productDetails.id,
        name: group.productDetails.name,
        category: group.productDetails.category,
        price: group.productDetails.price, // Original price for reference (though appliedPrice is 0)
        sku: group.productDetails.sku,
        imageUrl: group.productDetails.imageUrl,
        quantity: numberOfFreeUnits,
        appliedPrice: 0, // Free item
        saleType: group.saleType,
        isOfferItem: true,
      });
    }
  });
  return [...paidItems, ...newOfferItems];
}


export default function SalesPage() {
  const { 
    products: allProducts, 
    isLoading: isLoadingProducts, 
    error: productsError,
    refetch: refetchProducts 
  } = useProducts();
  
  const { 
    customers: allCustomersFromHook, 
    isLoading: isLoadingHookCustomers, 
    error: hookCustomersError 
  } = useCustomers();
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Product["category"] | "All">("All");
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [currentSaleType, setCurrentSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSalesPageFullScreen, setIsSalesPageFullScreen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [isBuy12Get1FreeActive, setIsBuy12Get1FreeActive] = useState(false);
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

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
        setCartItems(prevCart => reconcileOfferItems(prevCart, isBuy12Get1FreeActive, allProducts));
    }
  }, [isBuy12Get1FreeActive, allProducts]);


  const handleAddToCart = (productToAdd: Product) => {
    setCartItems(prevItems => {
      let updatedCart = [...prevItems];
      const existingItemIndex = updatedCart.findIndex(
        item => item.id === productToAdd.id && item.saleType === currentSaleType && !item.isOfferItem
      );
  
      const priceToUse = (currentSaleType === 'wholesale' && productToAdd.wholesalePrice && productToAdd.wholesalePrice > 0)
        ? productToAdd.wholesalePrice
        : productToAdd.price;
  
      if (existingItemIndex > -1) {
        const existingItem = updatedCart[existingItemIndex];
        if (productToAdd.stock > existingItem.quantity) {
          updatedCart[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + 1 };
        } else {
          toast({ variant: "destructive", title: "Out of Stock", description: `Cannot add more ${productToAdd.name}. Maximum stock reached.`});
          return reconcileOfferItems(prevItems, isBuy12Get1FreeActive, allProducts); 
        }
      } else {
        if (productToAdd.stock > 0) {
          updatedCart.push({
            ...productToAdd, // Spreads all Product fields, including name, category, price, sku, imageUrl
            quantity: 1,
            appliedPrice: priceToUse,
            saleType: currentSaleType,
            isOfferItem: false 
          });
        } else {
          toast({ variant: "destructive", title: "Out of Stock", description: `${productToAdd.name} is currently out of stock.`});
          return reconcileOfferItems(prevItems, isBuy12Get1FreeActive, allProducts); 
        }
      }
      return reconcileOfferItems(updatedCart, isBuy12Get1FreeActive, allProducts);
    });
  
    if (isMobile && !isCartOpen) {
      setIsCartOpen(true);
    }
  };
  
  const handleUpdateQuantity = (productId: string, quantity: number, saleType: 'retail' | 'wholesale') => {
    const productInStock = allProducts.find(p => p.id === productId);
    if (!productInStock) return;
  
    const targetQuantity = Math.max(0, Math.min(quantity, productInStock.stock));
  
    setCartItems(prevItems => {
      let updatedCart = prevItems
        .map(item =>
          item.id === productId && item.saleType === saleType && !item.isOfferItem
            ? { ...item, quantity: targetQuantity }
            : item
        )
        .filter(item => (item.isOfferItem) || (!item.isOfferItem && item.quantity > 0)); 
        
      return reconcileOfferItems(updatedCart, isBuy12Get1FreeActive, allProducts);
    });
  };
  
  const handleRemoveItem = (productId: string, saleType: 'retail' | 'wholesale') => {
    setCartItems(prevItems => {
      const updatedCart = prevItems.filter(item =>
        !(item.id === productId && item.saleType === saleType && !item.isOfferItem) 
      );
      return reconcileOfferItems(updatedCart, isBuy12Get1FreeActive, allProducts);
    });
  };

  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
  };

  const handleCheckout = () => {
    const actualCartItems = cartItems.filter(item => !item.isOfferItem || (item.isOfferItem && item.quantity > 0));
    if (actualCartItems.length === 0) {
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

  const currentSubtotal = useMemo(() => cartItems.filter(item => !item.isOfferItem).reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0), [cartItems]);
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
        sku: item.sku, 
        quantity: item.quantity,
        appliedPrice: item.appliedPrice,
        saleType: item.saleType,
        isOfferItem: item.isOfferItem || false,
      })),
      saleDate: new Date().toISOString(), 
      staffId: "staff001", 
      offerApplied: isBuy12Get1FreeActive,
    };

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) {
        let errorMessage = `Sale failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use statusText or a generic message
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const newSaleResponse = await response.json();
      
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

  const totalItemsInCartDisplay = cartItems.reduce((sum, item) => sum + item.quantity, 0);


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

               <div className="flex items-center space-x-2 bg-muted p-2 rounded-md shrink-0 self-start sm:self-center">
                <Switch
                  id="buy12get1free-toggle"
                  checked={isBuy12Get1FreeActive}
                  onCheckedChange={setIsBuy12Get1FreeActive}
                  aria-label="Toggle Buy 12 Get 1 Free Offer"
                  className="data-[state=checked]:bg-green-600"
                />
                <Label htmlFor="buy12get1free-toggle" className="flex items-center gap-1 text-sm font-medium">
                  <Gift className="h-4 w-4" />
                  Buy 12 Get 1 Free
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

      <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
        {isMobile && !isSalesPageFullScreen && (
         <DrawerTrigger asChild>
            <div onClick={(e) => e.stopPropagation()}> 
              <Button
                size="lg"
                className="fixed bottom-6 right-6 z-20 rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItemsInCartDisplay > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0">
                    {totalItemsInCartDisplay}
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
        offerApplied={isBuy12Get1FreeActive} 
      />
    </div>
  );
}

