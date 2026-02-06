import { useState, useEffect } from "react";
import { Plus, Loader2, Trash2, Power, PowerOff, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { TablesUpdate } from "@/integrations/supabase/types";

type Coupon = {
    id: string;
    code: string;
    discount_type: "percent" | "flat";
    discount_value: number;
    max_uses: number | null;
    used_count: number;
    starts_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    min_order_value: number;
    is_visible: boolean;
};

export function AdminCoupons() {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form State
    const [code, setCode] = useState("");
    const [type, setType] = useState<"percent" | "flat">("percent");
    const [value, setValue] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [minOrderValue, setMinOrderValue] = useState("");
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCoupons((data as unknown as Coupon[]) || []);
        } catch (error) {
            console.error("Error fetching coupons:", error);
            toast.error("Failed to load coupons");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCode("");
        setType("percent");
        setValue("");
        setMaxUses("");
        setExpiresAt("");
        setMinOrderValue("0");
        setIsVisible(false);
        setEditingCoupon(null);
    };

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setCode(coupon.code);
        setType(coupon.discount_type);
        setValue(String(coupon.discount_value));
        setMaxUses(coupon.max_uses ? String(coupon.max_uses) : "");
        setExpiresAt(coupon.expires_at ? coupon.expires_at.slice(0, 16) : ""); // Format for datetime-local
        setMinOrderValue(String(coupon.min_order_value || 0));
        setIsVisible(coupon.is_visible || false);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        try {
            const { error } = await supabase
                .from("coupons")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setCoupons(coupons.filter(c => c.id !== id));
            toast.success("Coupon deleted successfully");
        } catch (error) {
            console.error("Error deleting coupon:", error);
            toast.error("Failed to delete coupon");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const couponData = {
                code: code.toUpperCase(),
                discount_type: type,
                discount_value: Number(value),
                max_uses: maxUses ? Number(maxUses) : null,
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                min_order_value: Number(minOrderValue),
                is_visible: isVisible,
            };

            if (editingCoupon) {
                const { error } = await supabase
                    .from("coupons")
                    .update(couponData)
                    .eq("id", editingCoupon.id);
                if (error) throw error;
                toast.success("Coupon updated successfully");
            } else {
                const { error } = await supabase
                    .from("coupons")
                    .insert({
                        ...couponData,
                        created_by: user?.id,
                    });
                if (error) throw error;
                toast.success("Coupon created successfully");
            }

            setIsDialogOpen(false);
            resetForm();
            fetchCoupons();
        } catch (error) {
            console.error("Error saving coupon:", error);
            toast.error("Failed to save coupon");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("coupons")
                .update({ is_active: !currentStatus } as TablesUpdate<"coupons">)
                .eq("id", id);

            if (error) throw error;

            setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
            toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (loading) return <div className="text-center py-8">Loading coupons...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Coupons Management</h2>
                <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Coupon Code</Label>
                                <Input
                                    id="code"
                                    placeholder="SUMMER2026"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Discount Type</Label>
                                    <Select value={type} onValueChange={(v: "percent" | "flat") => setType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percent">Percentage (%)</SelectItem>
                                            <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="value">Value</Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        min="1"
                                        placeholder="20"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>



                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                                    <Input
                                        id="maxUses"
                                        type="number"
                                        min="1"
                                        placeholder="Unlimited"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                                    <Input
                                        id="expiry"
                                        type="datetime-local"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minOrderValue">Min Order Value (₹)</Label>
                                    <Input
                                        id="minOrderValue"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={minOrderValue}
                                        onChange={(e) => setMinOrderValue(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <input
                                        type="checkbox"
                                        id="isVisible"
                                        checked={isVisible}
                                        onChange={(e) => setIsVisible(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="isVisible" className="cursor-pointer">Show in Visible List</Label>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingCoupon ? "Update Coupon" : "Create Coupon"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-lg">{coupon.code}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {coupon.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                {' • '}
                                Used: {coupon.used_count} {coupon.max_uses ? `/ ${coupon.max_uses}` : ''}
                            </p>
                            {coupon.expires_at && (
                                <p className="text-xs text-muted-foreground">
                                    Expires: {format(new Date(coupon.expires_at), 'PPp')}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleActive(coupon.id, coupon.is_active)}
                                className={coupon.is_active ? "text-green-600 hover:text-green-700" : "text-muted-foreground"}
                                title={coupon.is_active ? "Deactivate" : "Activate"}
                            >
                                {coupon.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(coupon)}
                                title="Edit Coupon"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(coupon.id)}
                                className="text-destructive hover:text-destructive"
                                title="Delete Coupon"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                {coupons.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No coupons found. Create your first one!
                    </div>
                )}
            </div>
        </div>
    );
}
