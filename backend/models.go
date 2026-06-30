package main

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// StringSlice is a []string that serializes as a JSON array for both JSON and SQL.
type StringSlice []string

func (s StringSlice) MarshalJSON() ([]byte, error) {
	if s == nil {
		return []byte("[]"), nil
	}
	return json.Marshal([]string(s))
}

func (s *StringSlice) UnmarshalJSON(data []byte) error {
	if len(data) == 0 || string(data) == "null" {
		*s = []string{}
		return nil
	}
	var arr []string
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}
	*s = arr
	return nil
}

func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = []string{}
		return nil
	}
	switch v := value.(type) {
	case string:
		if v == "" {
			*s = []string{}
			return nil
		}
		return json.Unmarshal([]byte(v), s)
	case []byte:
		if len(v) == 0 {
			*s = []string{}
			return nil
		}
		return json.Unmarshal(v, s)
	}
	return fmt.Errorf("cannot scan %T into StringSlice", value)
}

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	b, err := json.Marshal([]string(s))
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

type User struct {
	ID        int64  `json:"id"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type Application struct {
	ID             int64       `json:"id"`
	UserID         int64       `json:"user_id"`
	Company        string      `json:"company"`
	Position       string      `json:"position"`
	JobDescription string      `json:"job_description"`
	JobPostSource  string      `json:"job_post_source"`
	AppliedSources StringSlice `json:"applied_sources"`
	ResumeName     string      `json:"resume_name"`
	ResumeType     string      `json:"resume_type"`
	ResumeSent     bool        `json:"resume_sent"`
	Status         string      `json:"status"`
	AppliedDate    string      `json:"applied_date"`
	Notes          string      `json:"notes"`
	Skills         StringSlice `json:"skills"`
	RetryGapDays   int         `json:"retry_gap_days"`
	CreatedAt      string      `json:"created_at"`
	UpdatedAt      string      `json:"updated_at"`
}

type Interview struct {
	ID            int64  `json:"id"`
	ApplicationID int64  `json:"application_id"`
	RoundNumber   int    `json:"round_number"`
	RoundName     string `json:"round_name"`
	ScheduledDate string `json:"scheduled_date"`
	ScheduledTime string `json:"scheduled_time"`
	Status        string `json:"status"`
	Notes         string `json:"notes"`
	JoinLink      string `json:"join_link"`
	CreatedAt     string `json:"created_at"`
}

type FollowUp struct {
	ID            int64  `json:"id"`
	ApplicationID int64  `json:"application_id"`
	Date          string `json:"date"`
	FollowType    string `json:"follow_type"`
	Notes         string `json:"notes"`
	CreatedAt     string `json:"created_at"`
}

type ApplicationDetail struct {
	Application
	Interviews []Interview `json:"interviews"`
	FollowUps   []FollowUp  `json:"follow_ups"`
}

type SearchResult struct {
	Type        string `json:"type"`         // "application", "interview", "follow_up"
	ID          int64  `json:"id"`
	ApplicationID int64 `json:"application_id"`
	Company     string `json:"company"`
	Position    string `json:"position"`
	Status      string `json:"status"`
	Title       string `json:"title"`        // display label for the result
	Subtitle    string `json:"subtitle"`     // secondary info
}

type SearchResponse struct {
	Query   string         `json:"query"`
	Results []SearchResult `json:"results"`
}

func nowUTC() string {
	return time.Now().UTC().Format(time.RFC3339)
}
