-- ============================================================
-- Dapp Dating App - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------
-- PROFILES table
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  age         INTEGER,
  gender      TEXT,
  height      FLOAT,
  weight      FLOAT,
  bio         TEXT,
  relation_type TEXT DEFAULT 'full_time',
  photos      TEXT[] DEFAULT '{}',
  face_score  FLOAT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- MESSAGES table (for chat)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- INDEXES
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_face_score ON public.profiles(face_score);

-- ----------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can write
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Messages: sender/receiver can read; only sender can insert
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ----------------------------------------
-- STORAGE bucket for photos
-- ----------------------------------------
-- Run in Supabase Storage section OR via SQL:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to photos bucket
CREATE POLICY "photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND auth.role() = 'authenticated'
  );

-- Allow public to read photos
CREATE POLICY "photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- Allow users to update/delete their own photos
CREATE POLICY "photos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------
-- Enable Realtime for messages
-- ----------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
