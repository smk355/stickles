import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface CartItem {
  product_id: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemQuantity: (productId: string) => number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("cart")
      .select("items")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data && Array.isArray(data.items)) {
      setItems(data.items as unknown as CartItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const syncCart = async (newItems: CartItem[]) => {
    if (!user) return;

    // First check if cart exists
    const { data: existingCart } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const itemsJson = JSON.parse(JSON.stringify(newItems));

    if (existingCart) {
      await supabase
        .from("cart")
        .update({ items: itemsJson, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("cart")
        .insert([{ user_id: user.id, items: itemsJson }]);
    }
  };

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    const existingIndex = items.findIndex((item) => item.product_id === productId);
    let newItems: CartItem[];

    if (existingIndex >= 0) {
      newItems = items.map((item, index) =>
        index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newItems = [...items, { product_id: productId, quantity }];
    }

    setItems(newItems);
    await syncCart(newItems);
    toast.success("Added to cart");
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    const newItems = items.map((item) =>
      item.product_id === productId ? { ...item, quantity } : item
    );
    setItems(newItems);
    await syncCart(newItems);
  };

  const removeFromCart = async (productId: string) => {
    const newItems = items.filter((item) => item.product_id !== productId);
    setItems(newItems);
    await syncCart(newItems);
    toast.success("Removed from cart");
  };

  const clearCart = async () => {
    setItems([]);
    await syncCart([]);
  };

  const getItemQuantity = (productId: string) => {
    return items.find((item) => item.product_id === productId)?.quantity || 0;
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, removeFromCart, clearCart, getItemQuantity, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
