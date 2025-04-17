-- Drop database if exists and create a new one
-- Note: You may need to run this separately if you're already connected to any database
-- DROP DATABASE IF EXISTS whiz;
-- CREATE DATABASE whiz;

-- Connect to the database
-- \c whiz

-- Create tables
CREATE TABLE IF NOT EXISTS channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  parent_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
-- Delete existing data first to avoid conflicts
TRUNCATE channels CASCADE;
TRUNCATE users CASCADE;
ALTER SEQUENCE channels_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;

-- Insert sample data
INSERT INTO channels (name, description) VALUES
  ('general', 'General chat'),
  ('random', 'Random discussions'),
  ('tech-talk', 'Technology discussions');

INSERT INTO users (username, email, password_hash) VALUES
  ('user1', 'user1@example.com', 'password_hash_here'),
  ('user2', 'user2@example.com', 'password_hash_here');

-- Insert sample messages
INSERT INTO messages (channel_id, user_id, content) VALUES
  (1, 1, 'Hello everyone!'),
  (1, 2, 'Welcome to the general channel'),
  (2, 1, 'This is a random message'),
  (3, 2, 'Let''s talk about technology');

-- Add a reply to a message
INSERT INTO messages (channel_id, user_id, parent_id, content) VALUES
  (1, 2, 1, 'Hello! How are you today?');

-- Output confirmation
SELECT 'Database setup complete!' AS result; 