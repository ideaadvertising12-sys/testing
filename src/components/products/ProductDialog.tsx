
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
import { Loader2 } from "lucide-react"; // For loading state
import { useToast } from "@/hooks/use-toast";

interface ProductDialogProps {
  product?: Product | null; // Current product for editing, null for adding
  trigger?: React.ReactNode; // Optional trigger if dialog is not controlled externally
  onSave: (productData: Product) => Promise<void>; // Updated to be async for backend ops
  open?: boolean; // For controlled dialog
  onOpenChange?: (isOpen: boolean) => void; // For controlled dialog
}

const defaultInitialProduct: Product = {
  id: "", // Will be ignored for adds, used for edits
  name: "",
  category: "Other",
  price: 0,
  wholesalePrice: 0,
  stock: 0,
  description: "",
  sku: "",
  reorderLevel: 10,
  imageUrl: "https://images.unsplash.com/photo-1685967836586-aaefdda7b517?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx5b2d1cnQlMjBwcm9kdWN0fGVufDB8fHx8MTc1MDA5Mjk4MXww&ixlib=rb-4.1.0&q=80&w=1080",
  aiHint: "product image"
};

export function ProductDialog({
  product: initialProduct, // Renamed to initialProduct to avoid conflict
  trigger,
  onSave,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: ProductDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Product>(initialProduct || defaultInitialProduct);
  const [previewImage, setPreviewImage] = useState(initialProduct?.imageUrl || defaultInitialProduct.imageUrl);
  
  const isEditMode = !!(initialProduct && initialProduct.id);

  useEffect(() => {
    if (isOpen) {
      const dataToSet = initialProduct || defaultInitialProduct;
      setFormData(dataToSet);
      setPreviewImage(dataToSet.imageUrl || defaultInitialProduct.imageUrl);
    } else {
      // Reset form when dialog closes if not controlled externally by 'open' prop
      // This helps if dialog is re-used for add after an edit.
      // If controlled, parent should manage resetting initialProduct prop.
      if (controlledOpen === undefined) {
        setFormData(defaultInitialProduct);
        setPreviewImage(defaultInitialProduct.imageUrl);
      }
    }
  }, [isOpen, initialProduct, controlledOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'price' || name === 'stock' || name === 'reorderLevel' || name === 'wholesalePrice') 
               ? (value === '' ? '' : parseFloat(value)) // Allow empty string for easier editing, handle NaN on submit
               : value 
    }));
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
        setFormData(prev => ({...prev, imageUrl: result}));
      };
      reader.readAsDataURL(file);
    } else {
      // If no file is selected (e.g., user cancels file dialog), retain current image
      // This behavior might need adjustment based on desired UX (e.g., clear image button)
      const currentImageUrl = formData.imageUrl || initialProduct?.imageUrl || defaultInitialProduct.imageUrl;
      setPreviewImage(currentImageUrl);
      setFormData(prev => ({...prev, imageUrl: currentImageUrl}));
    }
  };

  const handleSubmit = async () => {
    const price = parseFloat(String(formData.price));
    const stock = parseInt(String(formData.stock), 10);
    const reorderLevel = parseInt(String(formData.reorderLevel || '0'), 10);
    const wholesalePrice = formData.wholesalePrice !== undefined && String(formData.wholesalePrice) !== '' ? parseFloat(String(formData.wholesalePrice)) : undefined;


    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Product Name is required."});
      return;
    }
    if (isNaN(price) || price < 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Valid Retail Price is required."});
      return;
    }
    if (wholesalePrice !== undefined && (isNaN(wholesalePrice) || wholesalePrice < 0)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Wholesale Price must be a valid non-negative number if provided."});
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Valid Stock Quantity is required."});
      return;
    }
     if (isNaN(reorderLevel) || reorderLevel < 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Valid Reorder Level is required."});
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure ID is correctly passed for edits, or is new for adds (parent might handle final ID generation for adds)
      const productToSave: Product = {
        ...formData,
        id: isEditMode ? initialProduct!.id : (formData.id || ""), // Let parent handle new ID if formData.id is empty
        price,
        stock,
        reorderLevel,
        wholesalePrice,
        imageUrl: previewImage || defaultInitialProduct.imageUrl, // Ensure imageUrl is set
      };
      await onSave(productToSave);
      // setIsOpen(false); // Parent component (ProductDataTable) handles closing dialog via onSave's success
    } catch (error) {
      // Error should be caught and toasted by the onSave implementation in ProductDataTable
      console.error("Error in ProductDialog submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of this product." : "Fill in the details for the new product."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select name="category" value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yogurt">Yogurt</SelectItem>
                  <SelectItem value="Drink">Drink</SelectItem>
                  <SelectItem value="Ice Cream">Ice Cream</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                  <SelectItem value="Curd">Curd</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">Retail Price (Rs.) *</Label>
              <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} className="mt-1" min="0" step="0.01" />
            </div>
            <div>
              <Label htmlFor="wholesalePrice">Wholesale Price (Rs.)</Label>
              <Input id="wholesalePrice" name="wholesalePrice" type="number" value={formData.wholesalePrice === undefined ? '' : formData.wholesalePrice} onChange={handleChange} className="mt-1" min="0" step="0.01" placeholder="Optional"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} className="mt-1" min="0" />
            </div>
             <div>
              <Label htmlFor="reorderLevel">Reorder Level *</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} className="mt-1" min="0" />
            </div>
          </div>

          <div>
            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
            <Input id="sku" name="sku" value={formData.sku || ""} onChange={handleChange} className="mt-1" placeholder="Optional"/>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description || ""} onChange={handleChange} className="mt-1" rows={3} placeholder="Optional"/>
          </div>
          
          <div>
            <Label htmlFor="aiHint">AI Hint for Image</Label>
            <Input id="aiHint" name="aiHint" value={formData.aiHint || ""} onChange={handleChange} className="mt-1" placeholder="e.g. yogurt product, fruit drink"/>
          </div>

          <div>
            <Label htmlFor="imageFile">Product Image</Label>
            <Input id="imageFile" name="imageFile" type="file" accept="image/*" onChange={handleImageChange} className="mt-1 file:text-sm file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-primary/10" />
            {previewImage && (
              <div className="mt-2 rounded-md overflow-hidden border border-muted aspect-video w-full max-w-sm mx-auto">
                <Image src={previewImage} alt="Product preview" width={400} height={300} className="object-cover w-full h-full" data-ai-hint={formData.aiHint || `${formData.category.toLowerCase()} product`} />
              </div>
            )}
             <p className="text-xs text-muted-foreground mt-1">
                If no file is uploaded, the current image or a default placeholder will be used.
                Use a placeholder like <code>https://placehold.co/600x400.png</code> or an Unsplash URL.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Adding..."}
              </>
            ) : (isEditMode ? "Update Product" : "Add Product")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
