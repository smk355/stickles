import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onSubCategoryChange: (subCategory: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
}: CategoryFilterProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(selectedCategory);

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      onCategoryChange(null);
      onSubCategoryChange(null);
      setExpandedCategory(null);
    } else {
      onCategoryChange(categoryName);
      onSubCategoryChange(null);
      setExpandedCategory(categoryName);
    }
  };

  const handleSubCategoryClick = (subCategory: string) => {
    if (selectedSubCategory === subCategory) {
      onSubCategoryChange(null);
    } else {
      onSubCategoryChange(subCategory);
    }
  };

  const clearFilters = () => {
    onCategoryChange(null);
    onSubCategoryChange(null);
    setExpandedCategory(null);
  };

  const hasActiveFilters = selectedCategory || selectedSubCategory;

  return (
    <div className="space-y-2">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full justify-start text-muted-foreground hover:text-foreground mb-2"
        >
          <X className="h-4 w-4 mr-2" />
          Clear filters
        </Button>
      )}

      {/* All Products */}
      <button
        onClick={() => clearFilters()}
        className={cn(
          "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          !selectedCategory
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        All Products
      </button>

      {/* Categories */}
      {categories.map((category) => (
        <div key={category.id} className="space-y-1">
          <button
            onClick={() => handleCategoryClick(category.name)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between",
              selectedCategory === category.name
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <span>{category.name}</span>
            {category.sub_categories.length > 0 && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedCategory === category.name && "rotate-180"
                )}
              />
            )}
          </button>

          {/* Sub Categories */}
          {expandedCategory === category.name && category.sub_categories.length > 0 && (
            <div className="ml-3 space-y-1 animate-fade-in">
              {category.sub_categories.map((subCategory) => (
                <button
                  key={subCategory}
                  onClick={() => handleSubCategoryClick(subCategory)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                    selectedSubCategory === subCategory
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {subCategory}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
