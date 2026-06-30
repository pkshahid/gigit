package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "modernc.org/sqlite"
)

func initDB(path string) (*sql.DB, error) {
	if path == "" {
		path = "interviews.db"
	}
	dsn := fmt.Sprintf("%s?_pragma=foreign_keys(1)&_pragma=journal_mode(wal)", path)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS applications (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		company TEXT NOT NULL,
		position TEXT NOT NULL,
		job_description TEXT DEFAULT '',
		resume_name TEXT DEFAULT '',
		resume_type TEXT DEFAULT 'name',
		resume_sent INTEGER DEFAULT 0,
		status TEXT DEFAULT 'applied',
		applied_date TEXT NOT NULL,
		notes TEXT DEFAULT '',
		retry_gap_days INTEGER DEFAULT 0,
		job_post_source TEXT DEFAULT '',
		applied_sources TEXT DEFAULT '[]',
		skills TEXT DEFAULT '[]',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS interviews (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		application_id INTEGER NOT NULL,
		round_number INTEGER DEFAULT 1,
		round_name TEXT DEFAULT '',
		scheduled_date TEXT NOT NULL,
		status TEXT DEFAULT 'scheduled',
		notes TEXT DEFAULT '',
		join_link TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS follow_ups (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		application_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		follow_type TEXT DEFAULT 'email',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
	);
	`
	if _, err := db.Exec(schema); err != nil {
		return nil, fmt.Errorf("exec schema: %w", err)
	}

	// Migration: add user_id column to existing applications table if missing
	migration := `
	ALTER TABLE applications ADD COLUMN user_id INTEGER DEFAULT 1;
	`
	// Ignore error if column already exists
	db.Exec(migration)

	// Migration: add retry_gap_days column to existing applications table if missing
	migrationRetryGap := `
	ALTER TABLE applications ADD COLUMN retry_gap_days INTEGER DEFAULT 0;
	`
	db.Exec(migrationRetryGap)

	// Migration: add resume_type column to existing applications table if missing
	migrationResumeType := `
	ALTER TABLE applications ADD COLUMN resume_type TEXT DEFAULT 'name';
	`
	db.Exec(migrationResumeType)

	// Migration: add job_post_source column to existing applications table if missing
	migrationJobPostSource := `
	ALTER TABLE applications ADD COLUMN job_post_source TEXT DEFAULT '';
	`
	db.Exec(migrationJobPostSource)

	// Migration: add applied_sources column to existing applications table if missing
	migrationAppliedSources := `
	ALTER TABLE applications ADD COLUMN applied_sources TEXT DEFAULT '[]';
	`
	db.Exec(migrationAppliedSources)

	// Migration: add skills column to existing applications table if missing
	migrationSkills := `
	ALTER TABLE applications ADD COLUMN skills TEXT DEFAULT '[]';
	`
	db.Exec(migrationSkills)

	// Migration: add scheduled_time column to existing interviews table if missing
	migrationScheduledTime := `
	ALTER TABLE interviews ADD COLUMN scheduled_time TEXT DEFAULT '';
	`
	db.Exec(migrationScheduledTime)

	// Migration: add join_link column to existing interviews table if missing
	migrationJoinLink := `
	ALTER TABLE interviews ADD COLUMN join_link TEXT DEFAULT '';
	`
	db.Exec(migrationJoinLink)

	return db, nil
}

func dbPath() string {
	if p := os.Getenv("DB_PATH"); p != "" {
		return p
	}
	return "interviews.db"
}
