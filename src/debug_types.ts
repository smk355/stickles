
import { Database, Tables } from "./integrations/supabase/types";

// Check if 'coupons' exists in Tables keys
type TableKeys = keyof Database['public']['Tables'];
// This line should error if 'coupons' is missing
const testKey: TableKeys = 'coupons';

type CouponTable = Tables<'coupons'>;
