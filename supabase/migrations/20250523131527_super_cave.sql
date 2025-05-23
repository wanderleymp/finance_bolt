/*
  # Add specific INSERT policy for saas_modules table
  
  1. Changes
     - Adds a specific INSERT policy for the saas_modules table that allows admin users to create new modules
     - This complements the existing "ALL" policy by ensuring INSERT operations work correctly
  
  2. Security
     - Policy only allows users with the 'admin' role to insert new modules
     - Maintains existing security model while fixing the specific INSERT permission issue
*/

-- Create a specific INSERT policy for the saas_modules table
CREATE POLICY "Admins can insert new modules" 
ON public.saas_modules
FOR INSERT 
TO public
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);