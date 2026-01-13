-- Create coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percent', 'flat')) NOT NULL,
    discount_value NUMERIC NOT NULL,
    max_uses INTEGER, -- NULL = unlimited
    used_count INTEGER DEFAULT 0,
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create coupon_usages table
CREATE TABLE public.coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (coupon_id, user_id)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Coupons policies
CREATE POLICY "Coupons readable by authenticated users"
ON public.coupons FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Coupon usage policies
CREATE POLICY "Users can view own coupon usage"
ON public.coupon_usages FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own coupon usage"
ON public.coupon_usages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RPC for validating and applying coupons
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

-- Trigger to increment used_count on successful usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_coupon_usage_created
AFTER INSERT ON public.coupon_usages
FOR EACH ROW
EXECUTE FUNCTION public.increment_coupon_usage();
