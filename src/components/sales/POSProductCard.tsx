
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import { PlusCircle } from "lucide-react";

interface POSProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  currentSaleType: 'retail' | 'wholesale';
}

export function POSProductCard({ product, onAddToCart, currentSaleType }: POSProductCardProps) {
  const displayPrice = (currentSaleType === 'wholesale' && product.wholesalePrice && product.wholesalePrice > 0)
    ? product.wholesalePrice
    : product.price;

  const isOutOfStock = product.stock <= 0;

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full border border-[hsl(30,20%,80%)] dark:border-[hsl(0,0%,50%)] rounded-xl bg-white dark:bg-[hsl(30,10%,15%)]">
      {/* Image with fixed dimensions and stock status badge */}
      <CardHeader className="p-0 relative h-48 w-full">
        <div className="relative h-full w-full">
          <Image
            src={product.imageUrl || "https://placehold.co/600x600.png?text=No+Image"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            style={{ objectFit: "cover" }}
            data-ai-hint={product.aiHint || `${product.category.toLowerCase()} product`}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <span className="bg-destructive text-white px-3 py-1 rounded-full text-xs font-bold">
                OUT OF STOCK
              </span>
            </div>
          )}
          {!isOutOfStock && product.stock < 10 && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              LOW STOCK
            </div>
          )}
        </div>
      </CardHeader>

      {/* Product Info */}
      <CardContent className="p-4 flex-grow space-y-2">
        <CardTitle className="text-base font-semibold line-clamp-2 leading-tight tracking-wide " title={product.name}>
          {product.name}
        </CardTitle>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-[hsl(0,0%,85%)] dark:text-[hsl(0,0%,30%)] px-2 py-1 rounded tracking-wide">
            {product.category}
          </span>
          <span className={`text-xs ${isOutOfStock ? 'text-destructive' : 'text-green-600 dark:text-green-500'}`}>
            {isOutOfStock ? 'Unavailable' : `${product.stock} in stock`}
          </span>
        </div>
      </CardContent>

      {/* Price and Add Button */}
      <CardFooter className="p-4 border-t border-gray-100 dark:border-[hsl(0,0%,50%)] flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-lg font-bold text-primary ">
            Rs. {displayPrice.toFixed(2)}
          </p>
          {currentSaleType === 'wholesale' && product.wholesalePrice && (
            <p className="text-xs text-muted-foreground line-through">
              Rs. {product.price.toFixed(2)}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className="rounded-full px-4 py-2 bg-primary hover:bg-primary/90 dark:bg-[hsl(0,0%,20%)] dark:hover:bg-[hsl(0,0%,30%)] transition-colors shadow-sm dark:text-[hsl(0,0%,95%)]"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span className="text-sm">Add</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
