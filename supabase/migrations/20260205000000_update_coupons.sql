-- Add new columns to coupons table
ALTER TABLE public.coupons 
ADD COLUMN min_order_value NUMERIC DEFAULT 0,
ADD COLUMN is_visible BOOLEAN DEFAULT false;

-- Update apply_coupon function to check for min_order_value
CREATE OR REPLACE FUNCTION public.apply_coupon(
    p_code TEXT,
    p_user UUID,
    p_total NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    c RECORD;
    discount NUMERIC;
BEGIN
    SELECT * INTO c
    FROM public.coupons
    WHERE code = p_code
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR used_count < max_uses);

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Invalid or expired coupon');
    END IF;

    -- Check minimum order value
    IF p_total < COALESCE(c.min_order_value, 0) THEN
        RETURN json_build_object('error', format('Minimum order value of %s required', c.min_order_value));
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.coupon_usages
        WHERE coupon_id = c.id AND user_id = p_user
    ) THEN
        RETURN json_build_object('error', 'Coupon already used');
    END IF;

    discount := CASE
        WHEN c.discount_type = 'percent'
        THEN (p_total * c.discount_value / 100)
        ELSE c.discount_value
    END;

    -- Ensure discount doesn't exceed total
    IF discount > p_total THEN
      discount := p_total;
    END IF;

    RETURN json_build_object(
        'coupon_id', c.id,
        'discount', discount,
        'final_total', GREATEST(p_total - discount, 0)
    );
END;
$$;
