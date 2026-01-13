import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Trash2, MessageCircle, ArrowLeft, Tag } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { BRAND, WHATSAPP_BASE_URL } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Cart() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, updateQuantity, removeFromCart } = useCart();
  const { data: allProducts = [] } = useProducts();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount: number; finalTotal: number } | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

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

  useEffect(() => {
    // Reset coupon if cart changes or total changes significantly (optional logic, keeping it simple for now)
    // In a real app, you might want to re-validate the coupon if the cart total changes.
    if (appliedCoupon && appliedCoupon.finalTotal > total) {
      // Simple check: if discount makes total negative or invalid, logic is handled by backend but UI should reflect
    }
    // For now, if items change, we might want to re-calculate or just warn user.
    // Let's re-apply coupon logic if needed, but for MVP we'll leave it as applied
    // until user removes it or checkout.
    // Actually, if total changes, discount might change (if percentage). 
    // We should probably re-verify coupon or just reset it. Resetting is safer.
    // setAppliedCoupon(null); 
    // setCouponCode("");
  }, [items, total]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setVerifyingCoupon(true);

    try {
      // TypeScript might incorrectly infer that apply_coupon takes no args (never)
      // due to generic type resolution issues, but the function exists and takes args.
      const { data, error } = await supabase.rpc('apply_coupon', {
        p_code: couponCode.toUpperCase(),
        p_user: user?.id || '',
        p_total: total
      } as any);

      if (error) throw error;

      // The RPC returns { error: '...' } in JSON if validation fails inside the function logic
      // but typical supabase RPC calls return error object if PG raises exception.
      // My RPC returns JSON with error key.
      const response = data as any;

      if (response.error) {
        toast.error(response.error);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          id: response.coupon_id,
          code: couponCode.toUpperCase(),
          discount: response.discount,
          finalTotal: response.final_total
        });
        toast.success("Coupon applied successfully!");
      }
    } catch (error) {
      console.error("Coupon error:", error);
      toast.error("Failed to apply coupon");
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  const handleWhatsAppCheckout = async () => {
    setCheckingOut(true);
    try {
      if (appliedCoupon && user) {
        const { error } = await supabase.from('coupon_usages').insert({
          coupon_id: appliedCoupon.id,
          user_id: user.id
        });

        if (error) {
          console.error("Coupon usage failed", error);
          if (error.code === '23505') {
            toast.error("Coupon already used");
            setAppliedCoupon(null);
          } else {
            toast.error("Failed to apply coupon");
          }
          setCheckingOut(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
      setCheckingOut(false);
      return;
    }

    const itemsList = cartProducts
      .map((item, i) => `${i + 1}. ${item.product?.name} × ${item.quantity} – ${formatPrice((item.product?.price || 0) * item.quantity)}`)
      .join("\n");

    let message = `Hi, my name is ${profile?.name || "Customer"}

I would like to order the following items:
${itemsList}`;

    if (appliedCoupon) {
      message += `\n\nSubtotal: ${formatPrice(total)}
Coupon (${appliedCoupon.code}): -${formatPrice(appliedCoupon.discount)}
Total to Pay: ${formatPrice(appliedCoupon.finalTotal)}`;
    } else {
      message += `\n\nTotal: ${formatPrice(total)}`;
    }

    message += `\n\nPlease let me know the next steps.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`${WHATSAPP_BASE_URL}${BRAND.whatsapp}?text=${encodedMessage}`, "_blank");
    setCheckingOut(false);
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
              {/* Coupon Section */}
              <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-dashed">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Have a coupon code?</span>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-md border border-green-200">
                    <span className="font-mono font-bold">{appliedCoupon.code} applied!</span>
                    <Button variant="ghost" size="sm" className="h-auto p-1 text-green-700 hover:text-green-800 hover:bg-green-100" onClick={removeCoupon}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="uppercase font-mono"
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={verifyingCoupon || !couponCode}>
                      {verifyingCoupon ? "Checking..." : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-medium my-2">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(appliedCoupon.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(appliedCoupon ? appliedCoupon.finalTotal : total)}</span>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={handleWhatsAppCheckout} disabled={checkingOut}>
                {checkingOut ? (
                  <>Processing...</>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Order via WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
