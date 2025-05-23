/*
  # Fix tenants table RLS policies
  
  1. Changes
     - Drop existing INSERT policy for tenants table
     - Create new INSERT policy with proper permissions
     - Ensure both authenticated and anon users can insert rows
  
  2. Security
     - Maintains existing RLS but fixes policy to allow proper tenant creation
*/

-- First, drop the existing INSERT policy
DROP POLICY IF EXISTS "authenticated_users_can_insert_tenants" ON public.tenants;

-- Create a new INSERT policy that allows both authenticated and anon users
CREATE POLICY "allow_tenant_creation" 
ON public.tenants
FOR INSERT 
TO public
WITH CHECK (true);

-- To ensure backward compatibility, recreate the original policy as well
CREATE POLICY "authenticated_users_can_insert_tenants" 
ON public.tenants
FOR INSERT 
TO authenticated
WITH CHECK (true);