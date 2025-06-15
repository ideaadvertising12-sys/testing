
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/lib/types";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ProductDialogProps {
  product?: Product | null;
  trigger: React.ReactNode;
  onSave: (product: Product) => void; // Simplified for UI
}

const defaultProduct: Product = {
  id: "",
  name: "",
  category: "Other",
  price: 0,
  wholesalePrice: 0,
  stock: 0,
  description: "",
  sku: "",
  reorderLevel: 10,
  imageUrl: "https://placehold.co/400x300.png"
};

export function ProductDialog({ product, trigger, onSave }: ProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(product || defaultProduct);
  const [previewImage, setPreviewImage] = useState(product?.imageUrl || defaultProduct.imageUrl);

  useEffect(() => {
    if (isOpen) {
      setFormData(product || defaultProduct);
      setPreviewImage(product?.imageUrl || defaultProduct.imageUrl);
    }
  }, [isOpen, product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' || name === 'reorderLevel' || name === 'wholesalePrice' ? parseFloat(value) || 0 : value }));
  };

  const handleCategoryChange = (value: Product["category"]) => {
    setFormData(prev => ({ ...prev, category: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setFormData(prev => ({...prev, imageUrl: result})); // In real app, upload and set URL
      };
      reader.readAsDataURL(file);
    } else {
        // If no file is selected, or selection is cancelled, revert to original or default
        setPreviewImage(product?.imageUrl || defaultProduct.imageUrl);
        setFormData(prev => ({...prev, imageUrl: product?.imageUrl || defaultProduct.imageUrl}));
    }
  };

  const handleSubmit = () => {
    // Basic validation (can be expanded with Zod)
    if (!formData.name || formData.price <= 0) {
      alert("Name and a valid price are required."); // Replace with toast in real app
      return;
    }
    onSave({ ...formData, id: product?.id || Date.now().toString() }); // Mock ID generation
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update the details of this product." : "Fill in the details for the new product."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Milk">Milk</SelectItem>
                  <SelectItem value="Yogurt">Yogurt</SelectItem>
                  <SelectItem value="Watallappan">Watallappan</SelectItem>
                  <SelectItem value="Ghee">Ghee</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">Retail Price (Rs.)</Label>
              <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} className="mt-1" min="0" step="0.01" />
            </div>
            <div>
              <Label htmlFor="wholesalePrice">Wholesale Price (Rs.)</Label>
              <Input id="wholesalePrice" name="wholesalePrice" type="number" value={formData.wholesalePrice} onChange={handleChange} className="mt-1" min="0" step="0.01" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} className="mt-1" min="0" />
            </div>
             <div>
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} className="mt-1" min="0" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
            <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1" rows={3} />
          </div>

          <div>
            <Label htmlFor="imageUrl">Product Image</Label>
            <Input id="imageUrl" name="imageUrl" type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
            {previewImage && (
              <div className="mt-2 rounded-md overflow-hidden border border-muted aspect-video w-full max-w-xs mx-auto">
                <Image src={previewImage} alt="Product preview" width={400} height={300} className="object-cover w-full h-full" data-ai-hint="product image" />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
