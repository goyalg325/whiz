-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default channels
INSERT INTO channels (name, description) VALUES
('general', 'General discussions'),
('random', 'Random topics and conversations'),
('tech', 'Technology discussions')
ON CONFLICT (name) DO NOTHING;
