-- Must change password flag for retailer onboarding
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- Allow super_admin without franchise_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS retailer_requires_franchise;
ALTER TABLE public.profiles ADD CONSTRAINT retailer_requires_franchise CHECK (
  role IN ('admin', 'super_admin') OR franchise_id IS NOT NULL OR active = false
);

-- Provision retailer profile (bypasses escalation trigger)
CREATE OR REPLACE FUNCTION public.provision_retailer_profile(
  p_user_id uuid,
  p_franchise_id uuid,
  p_display_name text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_escalation;
  UPDATE public.profiles
  SET
    role = 'retailer'::public.user_role,
    franchise_id = p_franchise_id,
    active = true,
    must_change_password = true,
    display_name = COALESCE(p_display_name, display_name)
  WHERE id = p_user_id;
  ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_escalation;
END;
$$;

-- Promote to super_admin (developer allowlist)
CREATE OR REPLACE FUNCTION public.promote_super_admin(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_escalation;
  UPDATE public.profiles
  SET role = 'super_admin'::public.user_role, franchise_id = NULL, active = true, must_change_password = false
  WHERE id = p_user_id;
  ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_escalation;
END;
$$;

-- Promote to admin
CREATE OR REPLACE FUNCTION public.promote_admin(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_escalation;
  UPDATE public.profiles
  SET role = 'admin'::public.user_role, franchise_id = NULL, active = true, must_change_password = false
  WHERE id = p_user_id;
  ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_escalation;
END;
$$;

-- Update profile role/franchise/active (super_admin dev tools)
CREATE OR REPLACE FUNCTION public.update_profile_access(
  p_user_id uuid,
  p_role public.user_role,
  p_franchise_id uuid,
  p_active boolean
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_escalation;
  UPDATE public.profiles
  SET role = p_role, franchise_id = p_franchise_id, active = p_active
  WHERE id = p_user_id;
  ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_escalation;
END;
$$;
