/*
  # Create messages table for Telegram bot integration

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `platform` (text) - The messaging platform (e.g., 'telegram')
      - `user_id` (text) - External user ID from the platform
      - `message` (text) - The message content
      - `direction` (text) - Either 'incoming' or 'outgoing'
      - `timestamp` (timestamptz) - When the message was sent/received
      - `metadata` (jsonb) - Additional platform-specific data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  user_id text NOT NULL,
  message text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  timestamp timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_user_platform ON messages (user_id, platform);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp DESC);

-- Create policy for authenticated users to read messages
CREATE POLICY "Users can read messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for service role to insert messages
CREATE POLICY "Service role can insert messages"
  ON messages
  FOR INSERT
  TO service_role
  WITH CHECK (true);