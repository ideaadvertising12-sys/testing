
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

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full max-w-sm mx-auto w-full">
      <CardHeader className="p-0 relative aspect-[3/2] hidden sm:block">
        <Image
          src={product.imageUrl || "https://placehold.co/300x200.png"}
          alt={product.name}
          width={300}
          height={200}
          className="object-cover w-full h-full"
          data-ai-hint={`${product.category.toLowerCase()} product image`}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-base font-semibold mb-1 truncate" title={product.name}>{product.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{product.category}</p>
        <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
      </CardContent>
      <CardFooter className="p-4 border-t flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:items-center">
        <p className="text-lg font-bold text-primary">Rs. {displayPrice.toFixed(2)}</p>
        <Button 
          size="sm" 
          onClick={() => onAddToCart(product)} 
          disabled={product.stock <= 0}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add
        </Button>
      </CardFooter>
    </Card>
  );
}
