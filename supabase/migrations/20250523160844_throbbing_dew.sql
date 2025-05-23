/*
  # Fix RLS policies for saas_modules table

  1. Changes
    - Modify the RLS policy to properly allow authenticated users with admin roles to modify modules
    - Add specific check for admin users based on user role and is_super status
  
  2. Security
    - Ensures that only authenticated admin users can modify modules
    - Maintains public read access
*/

-- Update the existing policy for module modification to check admin status
DROP POLICY IF EXISTS "anyone_can_modify_modules" ON "public"."saas_modules";

-- Create a new policy that checks if the user is an admin
CREATE POLICY "admin_can_modify_modules" 
ON "public"."saas_modules" 
FOR ALL 
TO authenticated 
USING (
  -- Check if user is a system admin
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'admin' OR 
      users.role = 'superadmin' OR 
      users.is_super = true
    )
  )
)
WITH CHECK (
  -- Same check for inserts/updates
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'admin' OR 
      users.role = 'superadmin' OR 
      users.is_super = true
    )
  )
);

-- Keep the existing read policy
DROP POLICY IF EXISTS "anyone_can_read_modules" ON "public"."saas_modules";
CREATE POLICY "anyone_can_read_modules" 
ON "public"."saas_modules" 
FOR SELECT 
TO public 
USING (true);