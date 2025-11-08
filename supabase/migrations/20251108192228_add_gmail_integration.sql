/*
  # Add Gmail Integration Schema

  1. New Tables
    - `gmail_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to auth.users
      - `access_token` (text) - Gmail API access token
      - `refresh_token` (text) - Gmail API refresh token
      - `expires_at` (timestamptz) - Token expiration time
      - `created_at` (timestamptz) - When token was created
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on gmail_tokens table
    - Only users can access their own tokens
*/

CREATE TABLE IF NOT EXISTS gmail_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Gmail tokens"
  ON gmail_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Gmail tokens"
  ON gmail_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Gmail tokens"
  ON gmail_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Gmail tokens"
  ON gmail_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON gmail_tokens(user_id);
