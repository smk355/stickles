import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const placeholderImage = "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=400&fit=crop";

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary mb-3">
        <img
          src={product.images?.[0] || placeholderImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Quick Add Button */}
        {user && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-medium"
            onClick={handleAddToCart}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium bg-background/90 backdrop-blur-sm rounded-full text-muted-foreground">
          {product.category}
        </span>
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {product.sub_category || product.category}
        </p>
        <p className="font-semibold text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
}
