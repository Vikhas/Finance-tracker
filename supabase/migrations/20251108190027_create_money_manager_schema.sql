/*
  # Money Manager App Schema

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key) - Unique transaction identifier
      - `user_id` (uuid) - Reference to auth.users
      - `amount` (decimal) - Transaction amount
      - `type` (text) - 'credit' or 'debit'
      - `category` (text) - Transaction category (food, transport, shopping, etc.)
      - `merchant` (text) - Merchant/vendor name
      - `description` (text) - Full transaction description
      - `transaction_date` (timestamptz) - When the transaction occurred
      - `created_at` (timestamptz) - When record was created
      - `raw_text` (text) - Original email/text content for reference

    - `categories`
      - `id` (uuid, primary key) - Category identifier
      - `name` (text) - Category name
      - `icon` (text) - Icon identifier for UI
      - `color` (text) - Color code for charts
      - `created_at` (timestamptz) - When created

  2. Security
    - Enable RLS on both tables
    - Users can only access their own transactions
    - Categories are readable by all authenticated users
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text DEFAULT 'circle',
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(12, 2) NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  category text DEFAULT 'other',
  merchant text DEFAULT '',
  description text DEFAULT '',
  transaction_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  raw_text text DEFAULT ''
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by authenticated users"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO categories (name, icon, color) VALUES
  ('Food & Dining', 'utensils', '#ef4444'),
  ('Shopping', 'shopping-bag', '#f59e0b'),
  ('Transport', 'car', '#3b82f6'),
  ('Bills & Utilities', 'receipt', '#8b5cf6'),
  ('Entertainment', 'film', '#ec4899'),
  ('Healthcare', 'heart', '#10b981'),
  ('Salary', 'briefcase', '#22c55e'),
  ('Investment', 'trending-up', '#06b6d4'),
  ('Other', 'more-horizontal', '#6b7280')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
