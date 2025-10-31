
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PackageSearch, ShoppingCart, Tag, X, Search, Maximize, Minimize, Loader2, Gift, Truck, Warehouse, AlertCircle, CreditCard } from "lucide-react";
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
import type { Product, CartItem, Customer, Sale, ChequeInfo, BankTransferInfo, StockTransaction, Vehicle, ReturnTransaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesData } from "@/hooks/useSalesData";
import { useReturns } from "@/hooks/useReturns";

// Helper function to reconcile offer items in the cart
function reconcileOfferItems(
  currentCart: CartItem[],
  offerActive: boolean,
  allProductsForLookup: Product[],
  excludedProductIds: Set<string>
): CartItem[] {
  const paidItems = currentCart.filter(item => !item.isOfferItem);

  if (!offerActive || !allProductsForLookup || allProductsForLookup.length === 0) {
    return paidItems; // If offer is off, return only paid items
  }

  const newOfferItems: CartItem[] = [];
  const productGroupCounts: Record<string, { count: number; productDetails: Product; saleType: 'retail' | 'wholesale' }> = {};

  paidItems.forEach(item => {
    const key = `${item.id}-${item.saleType}`; // Group by product ID and sale type
    const baseProduct = allProductsForLookup.find(p => p.id === item.id);
    if (!baseProduct) return;
    
    if (!productGroupCounts[key]) {
      productGroupCounts[key] = { count: 0, productDetails: baseProduct, saleType: item.saleType };
    }
    productGroupCounts[key].count += item.quantity;
  });

  Object.values(productGroupCounts).forEach(group => {
    if (excludedProductIds.has(group.productDetails.id)) {
        return; // Skip generating offer for this item
    }
    
    const numberOfFreeUnits = Math.floor(group.count / 12);
    if (numberOfFreeUnits > 0) {
      // Stock check: Ensure adding free items doesn't exceed stock
      if ((group.count + numberOfFreeUnits) <= group.productDetails.stock) {
        newOfferItems.push({
          ...group.productDetails,
          id: group.productDetails.id,
          name: group.productDetails.name,
          category: group.productDetails.category,
          price: group.productDetails.price,
          sku: group.productDetails.sku,
          imageUrl: group.productDetails.imageUrl,
          quantity: numberOfFreeUnits,
          appliedPrice: 0,
          saleType: group.saleType,
          isOfferItem: true,
        });
      }
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
  
  
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { currentUser } = useAuth();
  const isCashier = currentUser?.role === 'cashier';
  
  // OPTIMIZATION: Set fetchAll to false by default for these hooks.
  const { sales: allSales, refetchSales } = useSalesData(true); // Still fetch all for balance calculation
  const { returns, refetchReturns } = useReturns(true); // Still fetch all for balance calculation
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Product["category"] | "All">("All");
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentSaleType, setCurrentSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSalesPageFullScreen, setIsSalesPageFullScreen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [isBuy12Get1FreeActive, setIsBuy12Get1FreeActive] = useState(false);
  const [excludedOfferProductIds, setExcludedOfferProductIds] = useState<Set<string>>(new Set<string>());

  // New states for vehicle stock view
  const [viewMode, setViewMode] = useState<'main' | 'vehicle'>(isCashier ? 'vehicle' : 'main');
  const [vehicleStock, setVehicleStock] = useState<Product[] | null>(null);
  const [isVehicleStockLoading, setIsVehicleStockLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // OPTIMIZATION: Fetch sales and returns data only when a customer is selected is not fully possible
  // as we need all of them to calculate balance correctly across all sales.
  // We will keep fetching them on page load for now to ensure balance accuracy.
  
  const categories: (Product["category"] | "All")[] = useMemo(() => {
    if (isLoadingProducts || !allProducts) return ["All"];
    return ["All", ...new Set(allProducts.map(p => p.category))];
  }, [allProducts, isLoadingProducts]);

  const customerOutstandingBalance = useMemo(() => {
    if (!selectedCustomer || !allSales || allSales.length === 0) {
      return 0;
    }
    return allSales
      .filter(sale => sale.customerId === selectedCustomer.id && sale.status !== 'cancelled')
      .reduce((total, sale) => total + (sale.outstandingBalance || 0), 0);
  }, [selectedCustomer, allSales]);

  const customerCreditBalance = useMemo(() => {
    if (!selectedCustomer || !allSales || !returns) return 0;

    const totalRefunds = returns
      .filter(r => r.customerId === selectedCustomer.id && r.refundAmount)
      .reduce((sum, r) => sum + r.refundAmount!, 0);

    const totalCreditUsed = allSales
      .filter(s => s.customerId === selectedCustomer.id && s.creditUsed)
      .reduce((sum, s) => sum + s.creditUsed!, 0);
      
    return totalRefunds - totalCreditUsed;
  }, [selectedCustomer, allSales, returns]);


  const toggleSalesPageFullScreen = () => setIsSalesPageFullScreen(!isSalesPageFullScreen);

  useEffect(() => {
    if (isCashier) {
        setViewMode('vehicle');
    }
  }, [isCashier]);
  
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

  const handleToggleOffer = (checked: boolean) => {
    setIsBuy12Get1FreeActive(checked);
    const newExclusions = checked ? excludedOfferProductIds : new Set<string>();
    if (!checked) {
      // Clear exclusions when turning the offer off
      setExcludedOfferProductIds(newExclusions);
    }
    // Re-run reconciliation on the cart with the new offer status
    setCartItems(prev => reconcileOfferItems(prev, checked, allProducts, newExclusions));
  };


  const handleFetchVehicleStock = async (vehicleId: string) => {
    if (!vehicleId) {
      setVehicleStock(null);
      setSelectedVehicleId(null);
      return;
    }

    setIsVehicleStockLoading(true);
    setVehicleStock(null);
    setSelectedVehicleId(vehicleId);

    const targetVehicle = vehicles.find(v => v.id === vehicleId);

    if (!targetVehicle) {
      toast({ variant: "destructive", title: "Error", description: `Vehicle not found.` });
      setIsVehicleStockLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/stock-transactions?vehicleId=${targetVehicle.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.details || errorData.error || 'Failed to fetch vehicle stock data.';
        throw new Error(message);
      }
      const transactions: StockTransaction[] = await response.json();

      if (transactions.length === 0) {
        setVehicleStock([]);
        setIsVehicleStockLoading(false);
        return;
      }
      
      const stockMap = new Map<string, number>();
      transactions.forEach(tx => {
        const currentQty = stockMap.get(tx.productId) || 0;
        if (tx.type === 'LOAD_TO_VEHICLE') {
          stockMap.set(tx.productId, currentQty + tx.quantity);
        } else if (tx.type === 'UNLOAD_FROM_VEHICLE' || tx.type === 'ISSUE_SAMPLE') {
          stockMap.set(tx.productId, currentQty - tx.quantity);
        }
      });

      const vehicleProducts: Product[] = [];
      for (const [productId, vehicleQty] of stockMap.entries()) {
        const baseProduct = allProducts.find(p => p.id === productId);
        if (baseProduct && vehicleQty > 0) {
          vehicleProducts.push({
            ...baseProduct,
            stock: vehicleQty,
          });
        }
      }
      setVehicleStock(vehicleProducts);

    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Could not load vehicle stock." });
      setVehicleStock([]);
    } finally {
      setIsVehicleStockLoading(false);
    }
  };

  const productsForDisplay = viewMode === 'vehicle' ? vehicleStock : filteredProducts;
  
  const handleAddToCart = (productToAdd: Product) => {
    // Corrected stock check: Count ALL items of this product in cart (paid and free)
    const totalQuantityOfProductInCart = cartItems
      .filter(item => item.id === productToAdd.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    // Check against available stock
    if (totalQuantityOfProductInCart >= productToAdd.stock) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: `Cannot add more ${productToAdd.name}. All available stock (${productToAdd.stock} units) is already in the cart.`,
      });
      return; // Exit if no more stock is available
    }

    setCartItems(prevItems => {
      let updatedCart = [...prevItems];
      const existingItemIndex = updatedCart.findIndex(
        item => item.id === productToAdd.id && item.saleType === currentSaleType && !item.isOfferItem
      );
  
      const priceToUse = (currentSaleType === 'wholesale' && productToAdd.wholesalePrice && productToAdd.wholesalePrice > 0)
        ? productToAdd.wholesalePrice
        : productToAdd.price;
  
      if (existingItemIndex > -1) {
        updatedCart[existingItemIndex] = { 
            ...updatedCart[existingItemIndex], 
            quantity: updatedCart[existingItemIndex].quantity + 1 
        };
      } else {
        updatedCart.push({
          ...productToAdd, 
          quantity: 1,
          appliedPrice: priceToUse,
          saleType: currentSaleType,
          isOfferItem: false 
        });
      }
      return reconcileOfferItems(updatedCart, isBuy12Get1FreeActive, allProducts, excludedOfferProductIds);
    });
  
    if (isMobile && !isCartOpen) {
      setIsCartOpen(true);
    }
  };
  
  const handleUpdateQuantity = (productId: string, quantity: number, saleType: 'retail' | 'wholesale') => {
    const sourceProducts = viewMode === 'vehicle' ? vehicleStock : allProducts;
    if (!sourceProducts) return;

    const productInStock = sourceProducts.find(p => p.id === productId);
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
        
      return reconcileOfferItems(updatedCart, isBuy12Get1FreeActive, allProducts, excludedOfferProductIds);
    });
  };

  const handleUpdateItemPrice = (productId: string, saleType: 'retail' | 'wholesale', newPrice: number) => {
    setCartItems(prevItems => {
      const updatedCart = prevItems.map(item => {
        if (item.id === productId && item.saleType === saleType && !item.isOfferItem) {
          const validatedPrice = Math.max(0, newPrice); // Price cannot be negative
          return { ...item, appliedPrice: validatedPrice };
        }
        return item;
      });
      // No need to reconcile offers here as price doesn't affect offer logic
      return updatedCart;
    });
  };
  
  const handleRemoveItem = (productId: string, saleType: 'retail' | 'wholesale', isOfferItem: boolean) => {
    const newExclusions = isOfferItem ? new Set(excludedOfferProductIds).add(productId) : excludedOfferProductIds;
    if (isOfferItem) {
        setExcludedOfferProductIds(newExclusions);
    }

    setCartItems(prevItems => {
        const updatedCart = prevItems.filter(item =>
            !(item.id === productId && item.saleType === saleType && item.isOfferItem === isOfferItem)
        );
        return reconcileOfferItems(updatedCart, isBuy12Get1FreeActive, allProducts, newExclusions);
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
    setCurrentSaleType('retail');
    setIsBuy12Get1FreeActive(false); 
    setExcludedOfferProductIds(new Set<string>());
  };

  // The subtotal before any manual per-item discounts are applied.
  const currentSubtotal = useMemo(() => {
    return cartItems.filter(item => !item.isOfferItem).reduce((sum, item) => {
      const originalProduct = allProducts.find(p => p.id === item.id);
      if (!originalProduct) return sum; // Should not happen if cart is consistent
      
      const priceToUse = (item.saleType === 'wholesale' && originalProduct.wholesalePrice && originalProduct.wholesalePrice > 0)
        ? originalProduct.wholesalePrice
        : originalProduct.price;

      return sum + (priceToUse * item.quantity);
    }, 0);
  }, [cartItems, allProducts]);

  // The final total after manual per-item discounts.
  const currentTotalAmountDue = useMemo(() => {
    return cartItems.filter(item => !item.isOfferItem).reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
  }, [cartItems]);
  
  // The total discount amount, which is the difference.
  const currentDiscountAmount = useMemo(() => {
    return Math.max(0, currentSubtotal - currentTotalAmountDue);
  }, [currentSubtotal, currentTotalAmountDue]);


  const handleSuccessfulSale = async (
    salePaymentDetails: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items' | 'subTotal' | 'discountPercentage' | 'discountAmount' | 'totalAmount' | 'offerApplied'> & 
                        { creditUsed?: number } &
                        Pick<Sale, 'paidAmountCash' | 'paidAmountCheque' | 'chequeDetails' | 'bankTransferDetails' | 'totalAmountPaid' | 'outstandingBalance' | 'changeGiven' | 'paymentSummary'>
  ): Promise<Sale | null> => {
    setIsProcessingSale(true);
    const salePayload = {
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerShopName: selectedCustomer?.shopName,
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
      subTotal: currentSubtotal,
      discountPercentage: 0, // No longer using global percentage
      discountAmount: currentDiscountAmount,
      totalAmount: currentTotalAmountDue,
      
      paidAmountCash: salePaymentDetails.paidAmountCash,
      paidAmountCheque: salePaymentDetails.paidAmountCheque,
      chequeDetails: salePaymentDetails.chequeDetails,
      paidAmountBankTransfer: salePaymentDetails.paidAmountBankTransfer,
      bankTransferDetails: salePaymentDetails.bankTransferDetails,
      creditUsed: salePaymentDetails.creditUsed,
      totalAmountPaid: salePaymentDetails.totalAmountPaid,
      outstandingBalance: salePaymentDetails.outstandingBalance,
      initialOutstandingBalance: salePaymentDetails.initialOutstandingBalance,
      changeGiven: salePaymentDetails.changeGiven,
      paymentSummary: salePaymentDetails.paymentSummary,

      saleDate: new Date().toISOString(), 
      staffId: currentUser?.username || "unknown_user",
      staffName: currentUser?.name || "Unknown User",
      offerApplied: isBuy12Get1FreeActive,
      vehicleId: viewMode === 'vehicle' ? selectedVehicleId : undefined,
    };

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) {
        let detailedErrorMessage = `Sale processing failed. Status: ${response.status}`; 
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText); 
          if (errorData.error) {
            detailedErrorMessage = errorData.error;
            if (errorData.details) {
              detailedErrorMessage += ` (Details: ${errorData.details})`;
            }
          } else if (errorData.message) {
            detailedErrorMessage = errorData.message;
          } else if (responseText) { 
            detailedErrorMessage = responseText;
          }
        } catch (jsonParseError) {
          if (responseText.trim()) {
            detailedErrorMessage = responseText.trim();
          } else if (response.statusText) { 
              detailedErrorMessage = response.statusText;
          }
        }
        throw new Error(detailedErrorMessage);
      }

      const newSaleResponse: Sale = await response.json();
      
      toast({
          title: "Sale Successful!",
          description: `Sale ID: ${newSaleResponse.id}`,
      });

      handleCancelOrder(); 
      await refetchProducts();
      await Promise.all([refetchSales(), refetchReturns()]);
      if (viewMode === 'vehicle' && selectedVehicleId) {
        await handleFetchVehicleStock(selectedVehicleId); // Refresh vehicle stock after sale
      }
      return newSaleResponse;

    } catch (error: any) {
      console.error("Sale processing error:", error);
      toast({
          variant: "destructive",
          title: "Sale Failed",
          description: error.message || "An unexpected error occurred while processing the sale.",
      });
      throw error;
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
            <p className="text-xs mt-1">{productsError}</p>
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
        description={isCashier ? "Select a vehicle to begin a sale." : "Create new sales transactions quickly."}
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
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center space-x-2 bg-muted p-2 rounded-md shrink-0">
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

                 <div className="flex items-center space-x-2 bg-muted p-2 rounded-md shrink-0">
                  <Switch
                    id="buy12get1free-toggle"
                    checked={isBuy12Get1FreeActive}
                    onCheckedChange={handleToggleOffer}
                    aria-label="Toggle Buy 12 Get 1 Free Offer"
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Label htmlFor="buy12get1free-toggle" className="flex items-center gap-1 text-sm font-medium">
                    <Gift className="h-4 w-4" />
                    Buy 12 Get 1 Free
                  </Label>
                </div>

                {!isCashier && (
                  <div className="flex items-center space-x-2 bg-muted p-2 rounded-md shrink-0">
                    <Switch
                      id="view-mode-toggle"
                      checked={viewMode === 'vehicle'}
                      onCheckedChange={(checked) => {
                        setViewMode(checked ? 'vehicle' : 'main');
                        setVehicleStock(null);
                        setSelectedVehicleId(null);
                      }}
                      aria-label="Toggle View Mode"
                    />
                    <Label htmlFor="view-mode-toggle" className="flex items-center gap-1 text-sm font-medium">
                      {viewMode === 'vehicle' ? <Truck className="h-4 w-4" /> : <Warehouse className="h-4 w-4" />}
                      {viewMode === 'vehicle' ? 'Vehicle Stock' : 'Main Inventory'}
                    </Label>
                  </div>
                )}
              </div>
              
              {!isCashier && (
                <Tabs
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as Product["category"] | "All")}
                  className={cn("w-full sm:w-auto", viewMode === 'vehicle' ? 'hidden' : 'block')}
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
              )}
            </div>
             {viewMode === 'vehicle' && (
              <div className="flex gap-2 mt-3 sm:mt-4">
                <Select 
                  value={selectedVehicleId ?? ''} 
                  onValueChange={handleFetchVehicleStock} 
                  disabled={isVehicleStockLoading || isLoadingVehicles}
                >
                  <SelectTrigger className="h-12 text-sm">
                    <SelectValue placeholder={isLoadingVehicles ? "Loading vehicles..." : "Select a vehicle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 p-3 sm:p-4 bg-white dark:bg-transparent">
            { isVehicleStockLoading ? (
               <div className="flex flex-col items-center justify-center text-muted-foreground pt-10 h-full">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-lg">Loading stock for {vehicles.find(v => v.id === selectedVehicleId)?.vehicleNumber}...</p>
              </div>
            ) : viewMode === 'vehicle' && vehicleStock === null ? (
               <div className="flex flex-col items-center justify-center text-muted-foreground pt-10 h-full">
                  <AlertCircle className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-xl font-medium text-gray-500 dark:text-gray-400">Please select a vehicle to view its stock.</p>
               </div>
            ) : productsForDisplay === null || productsForDisplay.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground pt-10 h-full">
                <PackageSearch className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-xl font-medium text-gray-500 dark:text-gray-400">No products found</p>
                <p className="text-gray-400 dark:text-gray-500">
                  {viewMode === 'vehicle' 
                    ? `No stock found for vehicle "${vehicles.find(v => v.id === selectedVehicleId)?.vehicleNumber || ''}".`
                    : "Try adjusting your search or category filters."
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {productsForDisplay.map(product => (
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
              customerOutstandingBalance={customerOutstandingBalance}
              customerCreditBalance={customerCreditBalance}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onSelectCustomer={handleSelectCustomer} 
              onCheckout={handleCheckout}
              onCancelOrder={handleCancelOrder}
              onUpdatePrice={handleUpdateItemPrice}
              subtotal={currentSubtotal}
              discountAmount={currentDiscountAmount}
              totalAmount={currentTotalAmountDue}
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
              customerOutstandingBalance={customerOutstandingBalance}
              customerCreditBalance={customerCreditBalance}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onSelectCustomer={handleSelectCustomer} 
              onCheckout={handleCheckout}
              onCancelOrder={handleCancelOrder}
              onUpdatePrice={handleUpdateItemPrice}
              subtotal={currentSubtotal}
              discountAmount={currentDiscountAmount}
              totalAmount={currentTotalAmountDue}
              className="flex-1 min-h-0"
            />
          </div>
        </DrawerContent>
      </Drawer>

      <BillDialog
        isOpen={isBillOpen}
        onOpenChange={(isOpenDialog) => {
          if (!isOpenDialog) setIsProcessingSale(false); 
          setIsBillOpen(isOpenDialog);
        }}
        cartItems={cartItems}
        customer={selectedCustomer}
        currentSubtotal={currentSubtotal}
        currentDiscountAmount={currentDiscountAmount}
        currentTotalAmount={currentTotalAmountDue} 
        onConfirmSale={handleSuccessfulSale}
        offerApplied={isBuy12Get1FreeActive} 
        customerCreditBalance={customerCreditBalance}
      />
    </div>
  );
}
