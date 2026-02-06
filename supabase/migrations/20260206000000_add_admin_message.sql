ALTER TABLE public.orders
ADD COLUMN admin_message TEXT;

-- Add FK to profiles to enable joining
ALTER TABLE public.orders
ADD CONSTRAINT orders_user_id_profiles_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id);
