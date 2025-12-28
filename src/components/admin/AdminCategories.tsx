import { useState } from "react";
import { Plus, Pencil, Trash2, X, GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAllCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from "@/hooks/useCategories";
import { toast } from "sonner";

export function AdminCategories() {
  const { data: categories = [], isLoading } = useAllCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", sub_categories: [] as string[], display_order: 0, is_active: true });
  const [newSubCategory, setNewSubCategory] = useState("");

  const resetForm = () => {
    setForm({ name: "", sub_categories: [], display_order: 0, is_active: true });
    setEditingCategory(null);
    setNewSubCategory("");
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      sub_categories: category.sub_categories || [],
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  const addSubCategory = () => {
    const trimmed = newSubCategory.trim();
    if (trimmed && !form.sub_categories.includes(trimmed)) {
      setForm({ ...form, sub_categories: [...form.sub_categories, trimmed] });
      setNewSubCategory("");
    }
  };

  const removeSubCategory = (sub: string) => {
    setForm({ ...form, sub_categories: form.sub_categories.filter((s) => s !== sub) });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...form });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync(form);
        toast.success("Category created");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in this category will need to be reassigned.")) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await updateCategory.mutateAsync({ id: category.id, is_active: !category.is_active });
      toast.success(category.is_active ? "Category hidden" : "Category visible");
    } catch {
      toast.error("Failed to update category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit" : "Add"} Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name *</Label>
                <Input 
                  id="category-name"
                  placeholder="e.g., Phone Charms" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input 
                  id="order"
                  placeholder="0" 
                  type="number" 
                  value={form.display_order} 
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} 
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
              
              <div className="space-y-2">
                <Label>Sub Categories</Label>
                {form.sub_categories.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {form.sub_categories.map((sub) => (
                      <Badge key={sub} variant="secondary" className="gap-1 pr-1">
                        {sub}
                        <button 
                          onClick={() => removeSubCategory(sub)} 
                          className="ml-1 hover:bg-foreground/10 rounded p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add sub category" 
                    value={newSubCategory} 
                    onChange={(e) => setNewSubCategory(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubCategory(); }}} 
                  />
                  <Button type="button" variant="secondary" onClick={addSubCategory}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch 
                  id="category-active"
                  checked={form.is_active} 
                  onCheckedChange={(c) => setForm({ ...form, is_active: c })} 
                />
                <Label htmlFor="category-active">Active (visible in filters)</Label>
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={createCategory.isPending || updateCategory.isPending}>
                {createCategory.isPending || updateCategory.isPending ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-dashed">
          <p className="text-muted-foreground mb-4">No categories yet</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add your first category
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {categories.sort((a, b) => a.display_order - b.display_order).map((category) => (
            <div key={category.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border hover:shadow-soft transition-shadow">
              <GripVertical className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{category.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Order: {category.display_order}
                  </span>
                  {category.sub_categories && category.sub_categories.length > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {category.sub_categories.length} sub categories
                      </span>
                    </>
                  )}
                </div>
                {category.sub_categories && category.sub_categories.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {category.sub_categories.slice(0, 3).map((sub) => (
                      <Badge key={sub} variant="outline" className="text-xs">
                        {sub}
                      </Badge>
                    ))}
                    {category.sub_categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{category.sub_categories.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Badge variant={category.is_active ? "default" : "secondary"} className="flex-shrink-0">
                {category.is_active ? "Active" : "Hidden"}
              </Badge>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleToggleActive(category)}
                  title={category.is_active ? "Hide category" : "Show category"}
                >
                  {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(category.id)}>
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
