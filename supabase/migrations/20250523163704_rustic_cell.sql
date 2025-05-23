/*
  # Fix Tenants Table RLS Policies

  1. Changes
     - Drop the existing RLS policy for the tenants table
     - Create a new policy that properly grants insert permissions to authenticated users
     - Ensure that authenticated users can properly create and modify tenants

  2. Security
     - Maintains RLS protection while fixing the permission issue
     - Ensures that only authenticated users can modify tenants
*/

-- Drop the existing policy that isn't working correctly
DROP POLICY IF EXISTS "anyone_can_modify_tenants" ON public.tenants;

-- Create a new policy that properly grants permissions to authenticated users
CREATE POLICY "authenticated_users_can_modify_tenants" 
ON public.tenants
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure the read policy exists (this is redundant if it already exists but safe to include)
DROP POLICY IF EXISTS "anyone_can_read_tenants" ON public.tenants;
CREATE POLICY "anyone_can_read_tenants" 
ON public.tenants
FOR SELECT
TO public
USING (true);