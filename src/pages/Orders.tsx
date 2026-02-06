import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type OrderItem = {
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
};

type Order = {
    id: string;
    created_at: string;
    status: 'pending' | 'confirmed' | 'dispatched' | 'delivered';
    total_amount: number;
    final_amount: number;
    discount_amount: number;
    items: OrderItem[];
};

export default function Orders() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
            return;
        }

        if (user) {
            fetchOrders();
        }
    }, [user, authLoading, navigate]);

    const fetchOrders = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Supabase returns items as JSON, we need to cast it
            const formattedOrders = (data || []).map(order => ({
                ...order,
                items: order.items as unknown as OrderItem[]
            }));

            setOrders(formattedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case 'confirmed': return "bg-blue-100 text-blue-800 border-blue-200";
            case 'dispatched': return "bg-purple-100 text-purple-800 border-purple-200";
            case 'delivered': return "bg-green-100 text-green-800 border-green-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-3 h-3 mr-1" />;
            case 'confirmed': return <CheckCircle className="w-3 h-3 mr-1" />;
            case 'dispatched': return <Truck className="w-3 h-3 mr-1" />;
            case 'delivered': return <Package className="w-3 h-3 mr-1" />;
            default: return null;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="container py-16 text-center">
                    <div className="animate-pulse">Loading orders...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-8 max-w-4xl">
                <Button variant="ghost" asChild className="mb-6">
                    <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Link>
                </Button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="font-heading text-3xl font-bold">My Orders</h1>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-16 border rounded-xl bg-card">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                        <p className="text-muted-foreground mb-6">Start shopping to see your orders here.</p>
                        <Button asChild>
                            <Link to="/catalogue">Browse Products</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="border rounded-xl bg-card overflow-hidden shadow-sm">
                                <div className="p-4 border-b bg-muted/30 flex flex-wrap gap-4 justify-between items-center">
                                    <div className="flex gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Order Placed</p>
                                            <p className="font-medium">{format(new Date(order.created_at), 'PPP')}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Total Amount</p>
                                            <p className="font-medium">{formatPrice(order.final_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Order ID</p>
                                            <p className="font-mono text-xs mt-1 text-muted-foreground">#{order.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className={`${getStatusColor(order.status)} flex items-center mb-2`}>
                                            {getStatusIcon(order.status)}
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Badge>
                                        {(order as any).admin_message && (
                                            <div className="text-xs bg-muted p-2 rounded text-left max-w-[200px] border border-l-4 border-l-primary">
                                                <p className="font-medium text-xs text-primary mb-0.5">Note from Admin:</p>
                                                <p>{(order as any).admin_message}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 items-center">
                                                <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                                            <Package className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-sm">{item.name}</h4>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {formatPrice(item.price * item.quantity)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout >
    );
}
