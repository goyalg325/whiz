package db

import (
	"database/sql"
	"os"

	_ "github.com/lib/pq"
)

type Database struct {
	db *sql.DB
}

func NewDatabase() (*Database, error) {
	// Use DB_URL from environment if provided, otherwise use default connection string
	connectionString := os.Getenv("DB_URL")
	if connectionString == "" {
		connectionString = "postgresql://postgres:postgres@localhost:6501/whizdb?sslmode=disable"
	}

	db, err := sql.Open("postgres", connectionString)
	if err != nil {
		return nil, err
	}

	// Test the connection
	if err = db.Ping(); err != nil {
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
