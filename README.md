# Whiz - Real-time Messaging Application



## Project Structure

```
whiz/
├── backend/         # Go backend code
│   ├── cmd/         # Application entry points
│   │   └── server/  # Main server application
│   └── internal/    # Internal packages
│       ├── ai/      # AI service integration
│       ├── api/     # API handlers and endpoints
│       ├── db/      # Database integration
│       └── ws/      # WebSocket implementation
└── frontend/        # React frontend code
    └── src/         # Frontend source code
        ├── api/     # API client code
        ├── components/ # React components
        ├── contexts/   # React contexts
        ├── pages/      # Page components
        └── utils/      # Utility functions
```

## Setup Instructions

### Prerequisites

- Go 1.20 or higher
- Node.js and npm
- PostgreSQL database
- Gemini API key 

### Database Setup

1. Install PostgreSQL if you haven't already
2. Create a new database called "whiz":

```sql
CREATE DATABASE whiz;
```

3. You can use the following SQL script to create the required tables:

```sql
-- Create channels table
CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  parent_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO channels (name, description) VALUES
  ('general', 'General chat'),
  ('random', 'Random discussions');

INSERT INTO users (username, email, password_hash) VALUES
  ('user1', 'user1@example.com', 'password_hash_here'),
  ('user2', 'user2@example.com', 'password_hash_here');
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Go dependencies:
```bash
go mod tidy
```

3. Create a `.env` file in the backend directory with the following content:
```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=whiz

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=8080
WS_PORT=8081
```

4. Update `your_password` with your PostgreSQL password and add your Gemini API key if you have one.

5. Run the server:
```bash
go run cmd/server/main.go
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend should now be running at http://localhost:3000.

## Postman Testing Data

You can use the following requests to test the API endpoints:

### Channels

#### Get All Channels
- Method: GET
- URL: http://localhost:8080/api/channels

#### Create Channel
- Method: POST
- URL: http://localhost:8080/api/channels
- Body (JSON):
```json
{
  "name": "tech-talk",
  "description": "Technology discussions"
}
```

#### Get Channel by ID
- Method: GET
- URL: http://localhost:8080/api/channels/1

#### Update Channel
- Method: PUT
- URL: http://localhost:8080/api/channels/1
- Body (JSON):
```json
{
  "name": "tech-discussions",
  "description": "All about technology"
}
```

#### Delete Channel
- Method: DELETE
- URL: http://localhost:8080/api/channels/1

### Messages

#### Get All Messages in Channel
- Method: GET
- URL: http://localhost:8080/api/messages?channel_id=1

#### Create Message
- Method: POST
- URL: http://localhost:8080/api/messages
- Body (JSON):
```json
{
  "channel_id": 1,
  "content": "Hello world!",
  "parent_id": null
}
```

#### Create Reply to Message
- Method: POST
- URL: http://localhost:8080/api/messages
- Body (JSON):
```json
{
  "channel_id": 1,
  "content": "This is a reply",
  "parent_id": 1
}
```

#### Get Message by ID
- Method: GET
- URL: http://localhost:8080/api/messages/1

#### Update Message
- Method: PUT
- URL: http://localhost:8080/api/messages/1
- Body (JSON):
```json
{
  "content": "Updated message content"
}
```

#### Delete Message
- Method: DELETE
- URL: http://localhost:8080/api/messages/1

#### Get Message Context (AI-generated)
- Method: GET
- URL: http://localhost:8080/api/messages/1/context

### Summaries

#### Get Channel Summary
- Method: GET
- URL: http://localhost:8080/api/summaries/channel/1

#### Get Missed Messages Summary
- Method: GET
- URL: http://localhost:8080/api/summaries/missed/1/1

## Development Notes

- The application uses mock AI responses when no Gemini API key is provided
- Database functionality can be disabled for demo/testing purposes
- WebSocket server runs on port 8081 by default for real-time message updates 
