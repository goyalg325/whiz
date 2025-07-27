# Whiz - Real-time Chat Application

A real-time chat application with channels using WebSockets.

## Features

- Real-time messaging using WebSockets
- Channel-based communication
- PostgreSQL database for persistent storage
- Docker setup for easy deployment

## Setup Instructions

### Prerequisites

- Go 1.20+
- Node.js 16+
- Docker and Docker Compose

### Database Setup

1. Start the PostgreSQL database using Docker:

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432.

2. The migrations will be automatically applied when the server starts.

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
go mod download
```

3. Make sure your `.env` file is set up correctly:

```
# Server Configuration
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whiz

# API Keys (optional)
GEMINI_API_KEY=
```

4. Run the server:

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

The frontend will be available at http://localhost:3000.

## Project Structure

- `backend/` - Go backend server
  - `cmd/` - Application entry points
  - `migrations/` - SQL database migrations
  - `internal/` - Internal packages
    - `api/` - API handlers
    - `db/` - Database access
    - `ws/` - WebSocket server
    
- `frontend/` - React frontend
  - `src/` - Source code
    - `api/` - API client
    - `components/` - React components
    - `contexts/` - React contexts
    - `utils/` - Utility functions

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
