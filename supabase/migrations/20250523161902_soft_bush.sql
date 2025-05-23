/*
  # Fix Row Level Security for plan_modules table
  
  1. Changes
     - Drop existing RLS policies on plan_modules table
     - Create new policies with explicit permissions for authenticated users
     - Ensure all operations (SELECT, INSERT, UPDATE, DELETE) are properly covered
  
  2. Security
     - Re-enable RLS on plan_modules table
     - Create explicit policies for all operations
*/

-- Drop existing policies that might not be working correctly
DROP POLICY IF EXISTS "anyone_can_read_plan_modules" ON public.plan_modules;
DROP POLICY IF EXISTS "anyone_can_modify_plan_modules" ON public.plan_modules;

-- Make sure RLS is enabled
ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;

-- Create explicit policies for each operation
CREATE POLICY "allow_select_plan_modules"
  ON public.plan_modules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_plan_modules"
  ON public.plan_modules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_plan_modules"
  ON public.plan_modules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_delete_plan_modules"
  ON public.plan_modules
  FOR DELETE
  TO authenticated
  USING (true);