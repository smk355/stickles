-- Add display_order to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Optionally, you can initialize the display_order based on created_at or name so they have an initial sequence
-- WITH ordered AS (
--   SELECT id, row_number() OVER (ORDER BY created_at DESC) as rn
--   FROM products
-- )
-- UPDATE products
-- SET display_order = ordered.rn
-- FROM ordered
-- WHERE products.id = ordered.id;
