-- Add super_admin to user_role enum (must run in its own migration transaction)
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'super_admin';
