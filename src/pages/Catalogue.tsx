import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const selectedCategory = searchParams.get("category");
  const selectedSubCategory = searchParams.get("subCategory");

  const { data: products = [], isLoading: productsLoading } = useProducts({
    category: selectedCategory || undefined,
    subCategory: selectedSubCategory || undefined,
  });
  const { data: categories = [] } = useCategories();

  const handleCategoryChange = (category: string | null) => {
    if (category) {
      searchParams.set("category", category);
    } else {
      searchParams.delete("category");
    }
    searchParams.delete("subCategory");
    setSearchParams(searchParams);
  };

  const handleSubCategoryChange = (subCategory: string | null) => {
    if (subCategory) {
      searchParams.set("subCategory", subCategory);
    } else {
      searchParams.delete("subCategory");
    }
    setSearchParams(searchParams);
  };

  const FilterContent = (
    <CategoryFilter
      categories={categories}
      selectedCategory={selectedCategory}
      selectedSubCategory={selectedSubCategory}
      onCategoryChange={handleCategoryChange}
      onSubCategoryChange={handleSubCategoryChange}
    />
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {selectedCategory || "All Products"}
            </h1>
            {selectedSubCategory && (
              <p className="text-muted-foreground mt-1">{selectedSubCategory}</p>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <h2 className="font-heading text-lg font-semibold mb-4">Categories</h2>
              {FilterContent}
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="font-heading text-lg font-semibold mb-4">Categories</h2>
              {FilterContent}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <ProductGrid products={products} loading={productsLoading} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
