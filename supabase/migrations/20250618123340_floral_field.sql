/*
  # WalkTunes Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `level` (integer, default 1)
      - `xp` (integer, default 0)
      - `total_walks` (integer, default 0)
      - `total_distance` (numeric, default 0)
      - `total_duration` (integer, default 0)
      - `total_tracks` (integer, default 0)
      - `streak_days` (integer, default 0)
      - `current_title` (text, nullable)
      - `last_walk_date` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `walking_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, nullable)
      - `duration` (integer) - seconds
      - `distance` (numeric) - meters
      - `avg_speed` (numeric) - km/h
      - `max_speed` (numeric) - km/h
      - `steps` (integer)
      - `calories` (integer)
      - `elevation_gain` (numeric, default 0)
      - `elevation_loss` (numeric, default 0)
      - `gps_data` (jsonb) - array of GPS positions
      - `created_at` (timestamptz)

    - `music_tracks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `walking_session_id` (uuid, foreign key)
      - `title` (text)
      - `prompt` (text)
      - `duration` (integer) - seconds
      - `genre` (text)
      - `mood` (text)
      - `bpm` (integer)
      - `audio_url` (text, nullable)
      - `image_url` (text, nullable)
      - `status` (text, check constraint)
      - `suno_job_id` (text, nullable)
      - `environment_data` (jsonb)
      - `tags` (text array)
      - `is_favorite` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `badges`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `rarity` (text, check constraint)
      - `requirement` (text)
      - `created_at` (timestamptz)

    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `badge_id` (uuid, foreign key)
      - `unlocked_at` (timestamptz)
      - `progress` (integer, default 0)
      - `max_progress` (integer, default 100)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public badge data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT 'ウォーカー',
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  total_walks integer NOT NULL DEFAULT 0,
  total_distance numeric NOT NULL DEFAULT 0,
  total_duration integer NOT NULL DEFAULT 0,
  total_tracks integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  current_title text,
  last_walk_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create walking_sessions table
CREATE TABLE IF NOT EXISTS walking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration integer NOT NULL DEFAULT 0,
  distance numeric NOT NULL DEFAULT 0,
  avg_speed numeric NOT NULL DEFAULT 0,
  max_speed numeric NOT NULL DEFAULT 0,
  steps integer NOT NULL DEFAULT 0,
  calories integer NOT NULL DEFAULT 0,
  elevation_gain numeric NOT NULL DEFAULT 0,
  elevation_loss numeric NOT NULL DEFAULT 0,
  gps_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirement text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create music_tracks table
CREATE TABLE IF NOT EXISTS music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  walking_session_id uuid REFERENCES walking_sessions(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  prompt text NOT NULL,
  duration integer NOT NULL,
  genre text NOT NULL DEFAULT 'acoustic',
  mood text NOT NULL DEFAULT 'uplifting',
  bpm integer NOT NULL DEFAULT 120,
  audio_url text,
  image_url text,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  suno_job_id text,
  environment_data jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  progress integer NOT NULL DEFAULT 0,
  max_progress integer NOT NULL DEFAULT 100,
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE walking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for walking_sessions table
CREATE POLICY "Users can manage own walking sessions"
  ON walking_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for music_tracks table
CREATE POLICY "Users can manage own music tracks"
  ON music_tracks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for user_badges table
CREATE POLICY "Users can manage own badges"
  ON user_badges
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for badges table (public read)
CREATE POLICY "Anyone can read badges"
  ON badges
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_walking_sessions_user_id ON walking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_walking_sessions_created_at ON walking_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_tracks_user_id ON music_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_created_at ON music_tracks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_tracks_status ON music_tracks(status);
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_favorite ON music_tracks(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Insert default badges
INSERT INTO badges (name, description, icon, rarity, requirement) VALUES
  ('初回ウォーク', '最初のウォーキングを完了', '🚶', 'common', '1回のウォーキングを完了する'),
  ('音楽愛好家', '10曲の音楽を生成', '🎵', 'rare', '10曲の音楽を生成する'),
  ('早起き鳥', '朝6時前にウォーキング', '🌅', 'epic', '朝6時前にウォーキングを開始する'),
  ('距離マスター', '累計100km歩行', '🏃', 'epic', '累計100kmのウォーキングを達成する'),
  ('継続の力', '7日連続ウォーキング', '🔥', 'legendary', '7日連続でウォーキングを行う')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_tracks_updated_at
  BEFORE UPDATE ON music_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();