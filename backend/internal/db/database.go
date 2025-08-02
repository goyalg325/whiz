package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

type Database struct {
	db *sql.DB
}

func NewDatabase() (*Database, error) {
	// Use DB_URL if provided; otherwise fall back to the old-style literal DSN (now updated for whiz).
	dsn := os.Getenv("DB_URL")
	if dsn == "" {
		dsn = "postgresql://postgres:postgres@localhost:6501/whizdb?sslmode=disable"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	return &Database{db: db}, nil
}

func (d Database) Close() {
	d.db.Close()
}

func (d *Database) GetDB() *sql.DB {
	return d.db
}

// SaveMessage stores a message in the database
func (d *Database) SaveMessage(content, username string, roomId string) error {
	// Debug logging to track what roomId we're receiving
	log.Printf("SaveMessage called with roomId: '%s' (type: %T)", roomId, roomId)

	// Validate that roomId is not just a number (which would indicate a bug)
	if roomId == "1" || roomId == "2" || roomId == "3" || roomId == "4" || roomId == "5" || roomId == "6" || roomId == "7" {
		log.Printf("ERROR: Received numeric roomId '%s' - this is likely a bug. Message: %s", roomId, content)
		return fmt.Errorf("invalid room ID: numeric values not allowed")
	}

	// First, get or create the channel
	var channelId int

	// Try to find existing channel
	err := d.db.QueryRow("SELECT id FROM channels WHERE name = $1", roomId).Scan(&channelId)
	if err == sql.ErrNoRows {
		// Channel doesn't exist, create it
		log.Printf("WARNING: Creating new channel with name '%s' - this might be a bug if it's numeric", roomId)
		err = d.db.QueryRow("INSERT INTO channels (name, description) VALUES ($1, $2) RETURNING id",
			roomId, "User created channel").Scan(&channelId)
		if err != nil {
			log.Printf("Error creating channel %s: %v", roomId, err)
			return err
		}
		log.Printf("Created new channel '%s' with ID %d", roomId, channelId)
	} else if err != nil {
		log.Printf("Error looking up channel %s: %v", roomId, err)
		return err
	}

	// Now insert the message with the correct channel_id
	query := `
		INSERT INTO messages (content, username, channel_id, created_at)
		VALUES ($1, $2, $3, NOW())
	`

	log.Printf("Saving message to database: content=%s, username=%s, roomId=%s, channelId=%d",
		content, username, roomId, channelId)

	_, err = d.db.Exec(query, content, username, channelId)
	if err != nil {
		log.Printf("Error saving message to database: %v", err)
		return err
	}

	log.Printf("Successfully saved message to channel %d", channelId)
	return nil
}

// GetRoomMessages retrieves all messages for a specific room
func (d *Database) GetRoomMessages(roomId string) ([]map[string]interface{}, error) {
	log.Printf("Fetching messages for room: %s", roomId)

	// First, get the channel ID by name
	var channelId int
	err := d.db.QueryRow("SELECT id FROM channels WHERE name = $1", roomId).Scan(&channelId)
	if err == sql.ErrNoRows {
		log.Printf("Channel '%s' not found, returning empty message list", roomId)
		return []map[string]interface{}{}, nil
	} else if err != nil {
		log.Printf("Error looking up channel %s: %v", roomId, err)
		return nil, err
	}

	log.Printf("Found channel '%s' with ID %d", roomId, channelId)

	query := `
		SELECT id, content, username, created_at
		FROM messages 
		WHERE channel_id = $1
		ORDER BY created_at ASC
	`

	rows, err := d.db.Query(query, channelId)
	if err != nil {
		log.Printf("Error querying messages for channel %d: %v", channelId, err)
		return nil, err
	}
	defer rows.Close()

	var messages []map[string]interface{}
	for rows.Next() {
		var id int
		var content, username string
		var createdAt string
		if err := rows.Scan(&id, &content, &username, &createdAt); err != nil {
			log.Printf("Error scanning message row: %v", err)
			return nil, err
		}

		message := map[string]interface{}{
			"id":        id,
			"content":   content,
			"username":  username,
			"roomId":    roomId,
			"timestamp": createdAt,
		}
		messages = append(messages, message)
	}

	log.Printf("Found %d messages for room %s (channel ID %d)", len(messages), roomId, channelId)
	return messages, nil
}

// CreateChannel creates a new channel in the database
func (d *Database) CreateChannel(name, description string) (int, error) {
	var channelId int

	// Try to insert the new channel
	err := d.db.QueryRow("INSERT INTO channels (name, description) VALUES ($1, $2) RETURNING id",
		name, description).Scan(&channelId)
	if err != nil {
		log.Printf("Error creating channel %s: %v", name, err)
		return 0, err
	}

	log.Printf("Created new channel '%s' with ID %d", name, channelId)
	return channelId, nil
}

// GetAllChannels retrieves all channels from the database
func (d *Database) GetAllChannels() ([]map[string]interface{}, error) {
	log.Printf("Fetching all channels from database")

	query := `
		SELECT id, name, description, created_at
		FROM channels 
		ORDER BY created_at ASC
	`

	rows, err := d.db.Query(query)
	if err != nil {
		log.Printf("Error querying channels: %v", err)
		return nil, err
	}
	defer rows.Close()

	var channels []map[string]interface{}
	for rows.Next() {
		var id int
		var name, description, createdAt string
		if err := rows.Scan(&id, &name, &description, &createdAt); err != nil {
			log.Printf("Error scanning channel row: %v", err)
			return nil, err
		}

		channel := map[string]interface{}{
			"id":          id,
			"name":        name,
			"description": description,
			"created_at":  createdAt,
		}
		channels = append(channels, channel)
	}

	log.Printf("Found %d channels in database", len(channels))
	return channels, nil
}

// CleanupNumericChannels removes channels that have purely numeric names (these are usually created by mistake)
func (d *Database) CleanupNumericChannels() error {
	log.Printf("Cleaning up numeric channels...")

	// Delete channels with purely numeric names (1, 2, 3, etc.)
	query := `DELETE FROM channels WHERE name ~ '^[0-9]+$'`

	result, err := d.db.Exec(query)
	if err != nil {
		log.Printf("Error cleaning up numeric channels: %v", err)
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("Cleaned up %d numeric channels", rowsAffected)

	return nil
}

// UpdateUserLastSeen updates the last seen message for a user in a channel
func (d *Database) UpdateUserLastSeen(username string, channelName string, messageId int) error {
	log.Printf("Updating last seen for user %s in channel %s to message %d", username, channelName, messageId)

	// First get the channel ID
	var channelId int
	err := d.db.QueryRow("SELECT id FROM channels WHERE name = $1", channelName).Scan(&channelId)
	if err != nil {
		log.Printf("Error finding channel %s: %v", channelName, err)
		return err
	}

	// Create user_channel_activity table if it doesn't exist
	createTableQuery := `
		CREATE TABLE IF NOT EXISTS user_channel_activity (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) NOT NULL,
			channel_id INTEGER NOT NULL REFERENCES channels(id),
			last_seen_message_id INTEGER,
			last_activity TIMESTAMP DEFAULT NOW(),
			UNIQUE(username, channel_id)
		)
	`

	_, err = d.db.Exec(createTableQuery)
	if err != nil {
		log.Printf("Error creating user_channel_activity table: %v", err)
		return err
	}

	// Upsert the user's last seen message
	query := `
		INSERT INTO user_channel_activity (username, channel_id, last_seen_message_id, last_activity)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (username, channel_id)
		DO UPDATE SET 
			last_seen_message_id = EXCLUDED.last_seen_message_id,
			last_activity = NOW()
	`

	_, err = d.db.Exec(query, username, channelId, messageId)
	if err != nil {
		log.Printf("Error updating user last seen: %v", err)
		return err
	}

	log.Printf("Successfully updated last seen for user %s in channel %s", username, channelName)
	return nil
}

// GetUnreadMessages gets all messages since user's last seen message in a channel
func (d *Database) GetUnreadMessages(username string, channelName string) ([]map[string]interface{}, error) {
	log.Printf("Getting unread messages for user %s in channel %s", username, channelName)

	// First get the channel ID
	var channelId int
	err := d.db.QueryRow("SELECT id FROM channels WHERE name = $1", channelName).Scan(&channelId)
	if err == sql.ErrNoRows {
		log.Printf("Channel '%s' not found", channelName)
		return []map[string]interface{}{}, nil
	} else if err != nil {
		log.Printf("Error looking up channel %s: %v", channelName, err)
		return nil, err
	}

	// Get user's last seen message ID
	var lastSeenMessageId sql.NullInt64
	err = d.db.QueryRow(`
		SELECT last_seen_message_id 
		FROM user_channel_activity 
		WHERE username = $1 AND channel_id = $2
	`, username, channelId).Scan(&lastSeenMessageId)

	var query string
	var args []interface{}

	if err == sql.ErrNoRows || !lastSeenMessageId.Valid {
		// User hasn't seen any messages in this channel, get all messages
		log.Printf("User %s has no activity in channel %s, getting all messages", username, channelName)
		query = `
			SELECT id, content, username, created_at
			FROM messages 
			WHERE channel_id = $1
			ORDER BY created_at ASC
		`
		args = []interface{}{channelId}
	} else {
		// Get messages after the last seen message
		log.Printf("User %s last saw message %d in channel %s", username, lastSeenMessageId.Int64, channelName)
		query = `
			SELECT id, content, username, created_at
			FROM messages 
			WHERE channel_id = $1 AND id > $2
			ORDER BY created_at ASC
		`
		args = []interface{}{channelId, lastSeenMessageId.Int64}
	}

	rows, err := d.db.Query(query, args...)
	if err != nil {
		log.Printf("Error querying unread messages: %v", err)
		return nil, err
	}
	defer rows.Close()

	var messages []map[string]interface{}
	for rows.Next() {
		var id int
		var content, messageUsername string
		var createdAt string
		if err := rows.Scan(&id, &content, &messageUsername, &createdAt); err != nil {
			log.Printf("Error scanning message row: %v", err)
			return nil, err
		}

		message := map[string]interface{}{
			"id":        id,
			"content":   content,
			"username":  messageUsername,
			"roomId":    channelName,
			"timestamp": createdAt,
		}
		messages = append(messages, message)
	}

	log.Printf("Found %d unread messages for user %s in channel %s", len(messages), username, channelName)
	return messages, nil
}
