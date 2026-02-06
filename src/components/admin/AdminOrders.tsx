import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Search, Save, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

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
    user_id: string;
    status: 'pending' | 'confirmed' | 'dispatched' | 'delivered';
    total_amount: number;
    final_amount: number;
    discount_amount: number;
    items: OrderItem[];
    admin_message: string | null;
    profiles?: {
        name: string | null;
        email: string | null;
    } | null;
};

export function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingMessage, setUpdatingMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('orders')
                .select('*, profiles(name, email)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedOrders = (data || []).map((order: any) => ({
                ...order,
                items: order.items as unknown as OrderItem[]
            }));

            setOrders(formattedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await (supabase as any)
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const saveAdminMessage = async (orderId: string, message: string) => {
        setUpdatingMessage(orderId);
        try {
            const { error } = await (supabase as any)
                .from('orders')
                .update({ admin_message: message || null })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(orders.map(o => o.id === orderId ? { ...o, admin_message: message || null } : o));
            toast.success("Message saved");
        } catch (error) {
            console.error("Error updating message:", error);
            toast.error("Failed to save message");
        } finally {
            setUpdatingMessage(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            case 'confirmed': return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            case 'dispatched': return "bg-purple-100 text-purple-800 hover:bg-purple-100";
            case 'delivered': return "bg-green-100 text-green-800 hover:bg-green-100";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search by ID, Name, Email, or Product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order Info</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Message</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No orders found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span className="font-mono font-medium">{order.id.slice(0, 8)}...</span>
                                            <span className="text-muted-foreground">
                                                {format(new Date(order.created_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="font-medium">{order.profiles?.name || "Unknown"}</span>
                                            <span className="text-xs text-muted-foreground">{order.profiles?.email || "No email"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {order.items.slice(0, 2).map((item, idx) => (
                                                <span key={idx} className="text-xs">
                                                    {item.quantity}x {item.name}
                                                </span>
                                            ))}
                                            {order.items.length > 2 && (
                                                <span className="text-xs text-muted-foreground">
                                                    +{order.items.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>₹{order.final_amount}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2 items-start">
                                            <Badge variant="secondary" className={getStatusColor(order.status)}>
                                                {order.status.toUpperCase()}
                                            </Badge>
                                            <Select
                                                defaultValue={order.status}
                                                onValueChange={(val) => updateStatus(order.id, val)}
                                            >
                                                <SelectTrigger className="w-[120px] h-7 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                                    <SelectItem value="dispatched">Dispatched</SelectItem>
                                                    <SelectItem value="delivered">Delivered</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button size="sm" variant={order.admin_message ? "default" : "outline"} className="h-8 gap-2">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {order.admin_message ? "Edit" : "Add"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none">Message to Customer</h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        Sent to customer dashboard.
                                                    </p>
                                                    <Textarea
                                                        id={`msg-${order.id}`}
                                                        placeholder="e.g. Thanks! Tracking: 12345"
                                                        defaultValue={order.admin_message || ""}
                                                        className="min-h-[80px]"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button
                                                            size="sm"
                                                            disabled={updatingMessage === order.id}
                                                            onClick={() => {
                                                                const val = (document.getElementById(`msg-${order.id}`) as HTMLTextAreaElement).value;
                                                                saveAdminMessage(order.id, val);
                                                            }}
                                                        >
                                                            {updatingMessage === order.id ? <Loader2 className="animate-spin w-3 h-3" /> : <Save className="w-3 h-3 mr-1" />}
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {order.admin_message && (
                                            <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                                                "{order.admin_message}"
                                            </p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
