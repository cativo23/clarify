-- RLS policy for pricing_tables
ALTER TABLE IF EXISTS pricing_tables ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read pricing (adjust if you want admin-only access)
CREATE POLICY "pricing_tables_select_authenticated" ON pricing_tables
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Note: Admin-only access can be enforced at the API layer using service role key and admin email checks.
