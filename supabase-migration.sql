-- Migration: Remove email from users table and rename user_email to user_wallet in agents table
-- Date: 2024-12-19

-- Update users table: remove email column
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- Update agents table: rename user_email to user_wallet
ALTER TABLE agents RENAME COLUMN user_email TO user_wallet;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agents' 
ORDER BY ordinal_position;

