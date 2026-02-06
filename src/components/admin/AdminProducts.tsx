import { useState, useRef, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAllProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUpload {
  id: string;
  file?: File;
  url: string;
  uploading: boolean;
}

export function AdminProducts() {
  const { data: products = [], isLoading } = useAllProducts();
  const { data: categories = [] } = useCategories();
  const { session } = useAuth();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", sub_category: "", is_active: true });
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", category: "", sub_category: "", is_active: true });
    setImages([]);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      category: product.category,
      sub_category: product.sub_category || "",
      is_active: product.is_active,
    });
    setImages(product.images.map((url, i) => ({ id: `existing-${i}`, url, uploading: false })));
    setDialogOpen(true);
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // 🔑 REQUIRED: unsigned preset
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    const folder = form.sub_category
      ? `${form.category}/${form.sub_category}`
      : form.category || "uncategorized";

    formData.append("folder", `products/${folder}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Upload failed");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Failed to upload image:", error);
    return null;
  }
};
  const handleFilesSelected = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => f.type.startsWith("image/"));
    
    if (validFiles.length === 0) {
      toast.error("Please select valid image files");
      return;
    }

    // Add files to state with uploading status
    const newImages: ImageUpload[] = validFiles.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      file,
      url: URL.createObjectURL(file),
      uploading: true,
    }));

    setImages(prev => [...prev, ...newImages]);
    setIsUploading(true);

    // Upload each file
    for (const img of newImages) {
      if (img.file) {
        const url = await uploadToCloudinary(img.file);
        if (url) {
          setImages(prev => prev.map(p => 
            p.id === img.id ? { ...p, url, uploading: false, file: undefined } : p
          ));
        } else {
          // Remove failed upload
          setImages(prev => prev.filter(p => p.id !== img.id));
          toast.error(`Failed to upload ${img.file?.name}`);
        }
      }
    }

    setIsUploading(false);
  }, [form.category, form.sub_category]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }, [handleFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.error("Please fill required fields: Name, Price, and Category");
      return;
    }

    if (images.some(img => img.uploading)) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    const productData = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      category: form.category,
      sub_category: form.sub_category || null,
      images: images.map(img => img.url).filter(Boolean),
      is_active: form.is_active,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync(productData);
        toast.success("Product created successfully");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, is_active: !product.is_active });
      toast.success(product.is_active ? "Product hidden" : "Product visible");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const selectedCategory = categories.find((c) => c.name === form.category);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} total products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit" : "Add"} Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name"
                  placeholder="Product name" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Product description" 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input 
                  id="price"
                  placeholder="299" 
                  type="number" 
                  value={form.price} 
                  onChange={(e) => setForm({ ...form, price: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, sub_category: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory && selectedCategory.sub_categories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sub Category</Label>
                    <Select value={form.sub_category} onValueChange={(v) => setForm({ ...form, sub_category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategory.sub_categories.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Image Upload Area */}
              <div className="space-y-2">
                <Label>Product Images</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                  />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop images here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: JPG, PNG, WebP
                  </p>
                </div>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img 
                        src={img.url} 
                        alt="Preview" 
                        className={`w-20 h-20 object-cover rounded-lg border ${img.uploading ? "opacity-50" : ""}`}
                      />
                      {img.uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Switch 
                  id="active"
                  checked={form.is_active} 
                  onCheckedChange={(c) => setForm({ ...form, is_active: c })} 
                />
                <Label htmlFor="active">Active (visible to customers)</Label>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmit} 
                disabled={createProduct.isPending || updateProduct.isPending || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : createProduct.isPending || updateProduct.isPending ? (
                  "Saving..."
                ) : (
                  "Save Product"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-dashed">
          <p className="text-muted-foreground mb-4">No products yet</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add your first product
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border hover:shadow-soft transition-shadow">
              <img 
                src={product.images?.[0] || "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=80&h=80&fit=crop"} 
                alt={product.name} 
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {product.category}{product.sub_category && ` / ${product.sub_category}`}
                </p>
                <p className="font-semibold text-primary">{formatPrice(product.price)}</p>
              </div>
              <Badge variant={product.is_active ? "default" : "secondary"} className="flex-shrink-0">
                {product.is_active ? "Active" : "Hidden"}
              </Badge>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleToggleActive(product)}
                  title={product.is_active ? "Hide product" : "Show product"}
                >
                  {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
