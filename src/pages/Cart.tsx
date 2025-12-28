import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Trash2, MessageCircle, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { BRAND, WHATSAPP_BASE_URL } from "@/lib/constants";

export default function Cart() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const { data: allProducts = [] } = useProducts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const cartProducts = items.map((item) => {
    const product = allProducts.find((p) => p.id === item.product_id);
    return { ...item, product };
  }).filter((item) => item.product);

  const total = cartProducts.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleWhatsAppCheckout = () => {
    const itemsList = cartProducts
      .map((item, i) => `${i + 1}. ${item.product?.name} × ${item.quantity} – ${formatPrice((item.product?.price || 0) * item.quantity)}`)
      .join("\n");

    const message = `Hi, my name is ${profile?.name || "Customer"}

I would like to order the following items:
${itemsList}

Total: ${formatPrice(total)}

Please let me know the next steps.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`${WHATSAPP_BASE_URL}${BRAND.whatsapp}?text=${encodedMessage}`, "_blank");
  };

  if (authLoading) {
    return <Layout><div className="container py-16 text-center">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/catalogue"><ArrowLeft className="h-4 w-4 mr-2" />Continue Shopping</Link>
        </Button>

        <h1 className="font-heading text-3xl font-bold mb-8">Your Cart</h1>

        {cartProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button asChild><Link to="/catalogue">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="space-y-6">
            {cartProducts.map((item) => (
              <div key={item.product_id} className="flex gap-4 p-4 bg-card rounded-xl border">
                <img
                  src={item.product?.images?.[0] || "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=100&h=100&fit=crop"}
                  alt={item.product?.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.product?.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.product?.category}</p>
                  <p className="font-semibold mt-1">{formatPrice(item.product?.price || 0)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeFromCart(item.product_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">{formatPrice(total)}</span>
              </div>
              <Button size="lg" className="w-full" onClick={handleWhatsAppCheckout}>
                <MessageCircle className="h-5 w-5 mr-2" />
                Order via WhatsApp
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
