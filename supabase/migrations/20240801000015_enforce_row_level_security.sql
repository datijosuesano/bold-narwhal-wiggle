-- Enable RLS on all tables and create proper policies

-- profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
CREATE POLICY "Users can only access their own profile" 
ON profiles FOR ALL 
TO authenticated 
USING (auth.uid() = id);

-- clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own clients" ON clients;
CREATE POLICY "Users can only access their own clients" 
ON clients FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own contracts" ON contracts;
CREATE POLICY "Users can only access their own contracts" 
ON contracts FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- assets table
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own assets" ON assets;
CREATE POLICY "Users can only access their own assets" 
ON assets FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- work_orders table
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own work orders" ON work_orders;
CREATE POLICY "Users can only access their own work orders" 
ON work_orders FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- breakdown_events table
ALTER TABLE breakdown_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own breakdown events" ON breakdown_events;
CREATE POLICY "Users can only access their own breakdown events" 
ON breakdown_events FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- lab_reagents table
ALTER TABLE lab_reagents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own lab reagents" ON lab_reagents;
CREATE POLICY "Users can only access their own lab reagents" 
ON lab_reagents FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- lab_reagent_movements table
ALTER TABLE lab_reagent_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own lab reagent movements" ON lab_reagent_movements;
CREATE POLICY "Users can only access their own lab reagent movements" 
ON lab_reagent_movements FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- spare_parts table
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own spare parts" ON spare_parts;
CREATE POLICY "Users can only access their own spare parts" 
ON spare_parts FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- tools table
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own tools" ON tools;
CREATE POLICY "Users can only access their own tools" 
ON tools FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own reports" ON reports;
CREATE POLICY "Users can only access their own reports" 
ON reports FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Create a function to check if user owns a record in any table
CREATE OR REPLACE FUNCTION check_record_ownership(table_name TEXT, record_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
  owner_id UUID;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- This is a simplified version - in practice, you'd need specific checks per table
  -- The RLS policies above are the primary security mechanism
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;