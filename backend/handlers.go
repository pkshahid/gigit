package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type apiHandler struct {
	db *sql.DB
}

func newAPIHandler(db *sql.DB) *apiHandler {
	return &apiHandler{db: db}
}

func (h *apiHandler) routes() http.Handler {
	r := chi.NewRouter()

	// Public auth routes
	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", h.registerHandler)
		r.Post("/login", h.loginHandler)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)

		r.Get("/auth/me", h.meHandler)

		r.Route("/applications", func(r chi.Router) {
			r.Get("/", h.listApplications)
			r.Post("/", h.createApplication)
			r.Get("/stats", h.getStats)
			r.Get("/follow-up-needed", h.listFollowUpNeeded)

			r.Route("/{id:[0-9]+}", func(r chi.Router) {
				r.Get("/", h.getApplication)
				r.Put("/", h.updateApplication)
				r.Delete("/", h.deleteApplication)

				r.Get("/interviews", h.listInterviews)
				r.Post("/interviews", h.createInterview)

				r.Route("/interviews/{interviewId}", func(r chi.Router) {
					r.Put("/", h.updateInterview)
					r.Delete("/", h.deleteInterview)
				})

				r.Get("/follow-ups", h.listFollowUps)
				r.Post("/follow-ups", h.createFollowUp)

				r.Route("/follow-ups/{followUpId}", func(r chi.Router) {
					r.Put("/", h.updateFollowUp)
					r.Delete("/", h.deleteFollowUp)
				})
			})
		})

		r.Get("/interviews", h.listAllInterviews)
		r.Get("/search", h.searchHandler)
	})

	return r
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func parseID(r *http.Request, key string) (int64, error) {
	v := chi.URLParam(r, key)
	return strconv.ParseInt(v, 10, 64)
}

// verifyAppOwnership checks that the application belongs to the authenticated user.
// Returns false and writes an error response if not owned.
func (h *apiHandler) verifyAppOwnership(w http.ResponseWriter, r *http.Request, appID int64) bool {
	user, _ := userFromContext(r.Context())
	var count int
	h.db.QueryRow(`SELECT COUNT(*) FROM applications WHERE id=? AND user_id=?`, appID, user.ID).Scan(&count)
	if count == 0 {
		writeError(w, http.StatusNotFound, "application not found")
		return false
	}
	return true
}

// verifyInterviewOwnership checks that the interview belongs to an application owned by the user.
func (h *apiHandler) verifyInterviewOwnership(w http.ResponseWriter, r *http.Request, interviewID int64) bool {
	user, _ := userFromContext(r.Context())
	var count int
	h.db.QueryRow(`SELECT COUNT(*) FROM interviews i JOIN applications a ON i.application_id = a.id WHERE i.id=? AND a.user_id=?`, interviewID, user.ID).Scan(&count)
	if count == 0 {
		writeError(w, http.StatusNotFound, "interview not found")
		return false
	}
	return true
}

// verifyFollowUpOwnership checks that the follow-up belongs to an application owned by the user.
func (h *apiHandler) verifyFollowUpOwnership(w http.ResponseWriter, r *http.Request, followUpID int64) bool {
	user, _ := userFromContext(r.Context())
	var count int
	h.db.QueryRow(`SELECT COUNT(*) FROM follow_ups f JOIN applications a ON f.application_id = a.id WHERE f.id=? AND a.user_id=?`, followUpID, user.ID).Scan(&count)
	if count == 0 {
		writeError(w, http.StatusNotFound, "follow-up not found")
		return false
	}
	return true
}

// ---------- Applications ----------

func (h *apiHandler) listApplications(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	rows, err := h.db.Query(`SELECT id, user_id, company, position, job_description, job_post_source, applied_sources, skills, resume_name, resume_type, resume_sent, status, applied_date, notes, retry_gap_days, created_at, updated_at FROM applications WHERE user_id=? ORDER BY datetime(applied_date) DESC, id DESC`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var apps []Application
	for rows.Next() {
		var a Application
		var resumeSent int
		if err := rows.Scan(&a.ID, &a.UserID, &a.Company, &a.Position, &a.JobDescription, &a.JobPostSource, &a.AppliedSources, &a.Skills, &a.ResumeName, &a.ResumeType, &resumeSent, &a.Status, &a.AppliedDate, &a.Notes, &a.RetryGapDays, &a.CreatedAt, &a.UpdatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		a.ResumeSent = resumeSent == 1
		apps = append(apps, a)
	}
	if apps == nil {
		apps = []Application{}
	}
	writeJSON(w, http.StatusOK, apps)
}

func (h *apiHandler) createApplication(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	var a Application
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if a.Company == "" || a.Position == "" {
		writeError(w, http.StatusBadRequest, "company and position are required")
		return
	}
	if a.AppliedDate == "" {
		writeError(w, http.StatusBadRequest, "applied_date is required")
		return
	}
	if a.Status == "" {
		a.Status = "applied"
	}
	if a.ResumeType == "" {
		a.ResumeType = "name"
	}

	resumeSent := 0
	if a.ResumeSent {
		resumeSent = 1
	}

	res, err := h.db.Exec(
		`INSERT INTO applications (user_id, company, position, job_description, job_post_source, applied_sources, skills, resume_name, resume_type, resume_sent, status, applied_date, notes, retry_gap_days, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		user.ID, a.Company, a.Position, a.JobDescription, a.JobPostSource, a.AppliedSources, a.Skills, a.ResumeName, a.ResumeType, resumeSent, a.Status, a.AppliedDate, a.Notes, a.RetryGapDays, nowUTC(), nowUTC(),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	id, _ := res.LastInsertId()
	a.ID = id
	a.UserID = user.ID
	a.CreatedAt = nowUTC()
	a.UpdatedAt = nowUTC()
	writeJSON(w, http.StatusCreated, a)
}

func (h *apiHandler) getApplication(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	id, err := parseID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var a Application
	var resumeSent int
	err = h.db.QueryRow(
		`SELECT id, user_id, company, position, job_description, job_post_source, applied_sources, skills, resume_name, resume_type, resume_sent, status, applied_date, notes, retry_gap_days, created_at, updated_at FROM applications WHERE id=? AND user_id=?`, id, user.ID,
	).Scan(&a.ID, &a.UserID, &a.Company, &a.Position, &a.JobDescription, &a.JobPostSource, &a.AppliedSources, &a.Skills, &a.ResumeName, &a.ResumeType, &resumeSent, &a.Status, &a.AppliedDate, &a.Notes, &a.RetryGapDays, &a.CreatedAt, &a.UpdatedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "application not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.ResumeSent = resumeSent == 1

	interviews, err := h.queryInterviews(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	followUps, err := h.queryFollowUps(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, ApplicationDetail{Application: a, Interviews: interviews, FollowUps: followUps})
}

func (h *apiHandler) updateApplication(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	id, err := parseID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var a Application
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if a.ResumeType == "" {
		a.ResumeType = "name"
	}

	resumeSent := 0
	if a.ResumeSent {
		resumeSent = 1
	}

	_, err = h.db.Exec(
		`UPDATE applications SET company=?, position=?, job_description=?, job_post_source=?, applied_sources=?, skills=?, resume_name=?, resume_type=?, resume_sent=?, status=?, applied_date=?, notes=?, retry_gap_days=?, updated_at=? WHERE id=? AND user_id=?`,
		a.Company, a.Position, a.JobDescription, a.JobPostSource, a.AppliedSources, a.Skills, a.ResumeName, a.ResumeType, resumeSent, a.Status, a.AppliedDate, a.Notes, a.RetryGapDays, nowUTC(), id, user.ID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.ID = id
	a.UserID = user.ID
	a.UpdatedAt = nowUTC()
	writeJSON(w, http.StatusOK, a)
}

func (h *apiHandler) deleteApplication(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	id, err := parseID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	_, err = h.db.Exec(`DELETE FROM applications WHERE id=? AND user_id=?`, id, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- Application status auto-transition ----------

// recalcAppStatus automatically updates the application status based on interview outcomes.
// Rules (only auto-transitions forward; "accepted" is never auto-changed):
//   - any interview "failed" → "rejected"
//   - all interviews "passed" (≥1, no scheduled/attended/failed) → "offer"
//   - interviews exist and app is "applied" → "interview"
//   - app is "offer" but new scheduled/attended rounds exist → "interview"
func (h *apiHandler) touchAppUpdated(appID int64) {
	h.db.Exec(`UPDATE applications SET updated_at=? WHERE id=?`, nowUTC(), appID)
}

func (h *apiHandler) recalcAppStatus(appID int64) {
	var currentStatus string
	h.db.QueryRow(`SELECT status FROM applications WHERE id=?`, appID).Scan(&currentStatus)
	if currentStatus == "accepted" {
		return
	}

	rows, err := h.db.Query(`SELECT status FROM interviews WHERE application_id=?`, appID)
	if err != nil {
		return
	}
	defer rows.Close()

	hasScheduled := false
	hasFailed := false
	allPassed := true
	count := 0
	for rows.Next() {
		var st string
		rows.Scan(&st)
		count++
		if st == "failed" {
			hasFailed = true
			allPassed = false
		}
		if st == "scheduled" || st == "attended" {
			hasScheduled = true
			allPassed = false
		}
	}

	if count == 0 {
		return
	}

	var newStatus string
	switch {
	case hasFailed:
		newStatus = "rejected"
	case allPassed:
		newStatus = "offer"
	case hasScheduled && currentStatus == "applied":
		newStatus = "interview"
	case hasScheduled && currentStatus == "offer":
		newStatus = "interview"
	}

	if newStatus != "" && newStatus != currentStatus {
		h.db.Exec(`UPDATE applications SET status=?, updated_at=? WHERE id=?`, newStatus, nowUTC(), appID)
	}
}

// ---------- Interviews ----------

func (h *apiHandler) queryInterviews(appID int64) ([]Interview, error) {
	rows, err := h.db.Query(
		`SELECT id, application_id, round_number, round_name, scheduled_date, scheduled_time, status, notes, join_link, created_at FROM interviews WHERE application_id=? ORDER BY round_number ASC, datetime(scheduled_date) ASC`,
		appID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Interview
	for rows.Next() {
		var iv Interview
		if err := rows.Scan(&iv.ID, &iv.ApplicationID, &iv.RoundNumber, &iv.RoundName, &iv.ScheduledDate, &iv.ScheduledTime, &iv.Status, &iv.Notes, &iv.JoinLink, &iv.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, iv)
	}
	if list == nil {
		list = []Interview{}
	}
	return list, nil
}

func (h *apiHandler) listInterviews(w http.ResponseWriter, r *http.Request) {
	appID, err := parseID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if !h.verifyAppOwnership(w, r, appID) {
		return
	}
	list, err := h.queryInterviews(appID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *apiHandler) listAllInterviews(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	rows, err := h.db.Query(`
		SELECT i.id, i.application_id, i.round_number, i.round_name, i.scheduled_date, i.scheduled_time, i.status, i.notes, i.join_link, i.created_at,
		       a.company, a.position
		FROM interviews i
		JOIN applications a ON i.application_id = a.id
		WHERE a.user_id=?
		ORDER BY datetime(i.scheduled_date) ASC
	`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type InterviewWithApp struct {
		Interview
		Company  string `json:"company"`
		Position string `json:"position"`
	}
	var list []InterviewWithApp
	for rows.Next() {
		var item InterviewWithApp
		if err := rows.Scan(&item.ID, &item.ApplicationID, &item.RoundNumber, &item.RoundName, &item.ScheduledDate, &item.ScheduledTime, &item.Status, &item.Notes, &item.JoinLink, &item.CreatedAt, &item.Company, &item.Position); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		list = append(list, item)
	}
	if list == nil {
		list = []InterviewWithApp{}
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *apiHandler) createInterview(w http.ResponseWriter, r *http.Request) {
	appID, err := parseID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if !h.verifyAppOwnership(w, r, appID) {
		return
	}
	var iv Interview
	if err := json.NewDecoder(r.Body).Decode(&iv); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if iv.ScheduledDate == "" {
		writeError(w, http.StatusBadRequest, "scheduled_date is required")
		return
	}
	if iv.Status == "" {
		iv.Status = "scheduled"
	}
	if iv.RoundNumber == 0 {
		// auto-increment round number
		var maxRound sql.NullInt64
		h.db.QueryRow(`SELECT MAX(round_number) FROM interviews WHERE application_id=?`, appID).Scan(&maxRound)
		iv.RoundNumber = int(maxRound.Int64) + 1
	}

	res, err := h.db.Exec(
		`INSERT INTO interviews (application_id, round_number, round_name, scheduled_date, scheduled_time, status, notes, join_link, created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
		appID, iv.RoundNumber, iv.RoundName, iv.ScheduledDate, iv.ScheduledTime, iv.Status, iv.Notes, iv.JoinLink, nowUTC(),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	id, _ := res.LastInsertId()
	iv.ID = id
	iv.ApplicationID = appID
	iv.CreatedAt = nowUTC()
	h.recalcAppStatus(appID)
	h.touchAppUpdated(appID)
	writeJSON(w, http.StatusCreated, iv)
}

func (h *apiHandler) updateInterview(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "interviewId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid interview id")
		return
	}
	if !h.verifyInterviewOwnership(w, r, id) {
		return
	}
	var iv Interview
	if err := json.NewDecoder(r.Body).Decode(&iv); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	_, err = h.db.Exec(
		`UPDATE interviews SET round_number=?, round_name=?, scheduled_date=?, scheduled_time=?, status=?, notes=?, join_link=? WHERE id=?`,
		iv.RoundNumber, iv.RoundName, iv.ScheduledDate, iv.ScheduledTime, iv.Status, iv.Notes, iv.JoinLink, id,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	iv.ID = id
	var appID int64
	h.db.QueryRow(`SELECT application_id FROM interviews WHERE id=?`, id).Scan(&appID)
	h.recalcAppStatus(appID)
	h.touchAppUpdated(appID)
	writeJSON(w, http.StatusOK, iv)
}

func (h *apiHandler) deleteInterview(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "interviewId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid interview id")
		return
	}
	if !h.verifyInterviewOwnership(w, r, id) {
		return
	}
	var appID int64
	h.db.QueryRow(`SELECT application_id FROM interviews WHERE id=?`, id).Scan(&appID)
	_, err = h.db.Exec(`DELETE FROM interviews WHERE id=?`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.recalcAppStatus(appID)
	h.touchAppUpdated(appID)
	w.WriteHeader(http.StatusNoContent)
}

// ---------- Follow-ups ----------

func (h *apiHandler) queryFollowUps(appID int64) ([]FollowUp, error) {
	rows, err := h.db.Query(
		`SELECT id, application_id, date, follow_type, notes, created_at FROM follow_ups WHERE application_id=? ORDER BY datetime(date) DESC`,
		appID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []FollowUp
	for rows.Next() {
		var f FollowUp
		if err := rows.Scan(&f.ID, &f.ApplicationID, &f.Date, &f.FollowType, &f.Notes, &f.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, f)
	}
	if list == nil {
		list = []FollowUp{}
	}
	return list, nil
}

func (h *apiHandler) listFollowUps(w http.ResponseWriter, r *http.Request) {
	appID, err := parseID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if !h.verifyAppOwnership(w, r, appID) {
		return
	}
	list, err := h.queryFollowUps(appID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *apiHandler) createFollowUp(w http.ResponseWriter, r *http.Request) {
	appID, err := parseID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if !h.verifyAppOwnership(w, r, appID) {
		return
	}
	var f FollowUp
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if f.Date == "" {
		writeError(w, http.StatusBadRequest, "date is required")
		return
	}
	if f.FollowType == "" {
		f.FollowType = "email"
	}

	res, err := h.db.Exec(
		`INSERT INTO follow_ups (application_id, date, follow_type, notes, created_at) VALUES (?,?,?,?,?)`,
		appID, f.Date, f.FollowType, f.Notes, nowUTC(),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	id, _ := res.LastInsertId()
	f.ID = id
	f.ApplicationID = appID
	f.CreatedAt = nowUTC()
	h.touchAppUpdated(appID)
	writeJSON(w, http.StatusCreated, f)
}

func (h *apiHandler) updateFollowUp(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "followUpId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid follow-up id")
		return
	}
	if !h.verifyFollowUpOwnership(w, r, id) {
		return
	}
	var f FollowUp
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	_, err = h.db.Exec(
		`UPDATE follow_ups SET date=?, follow_type=?, notes=? WHERE id=?`,
		f.Date, f.FollowType, f.Notes, id,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	f.ID = id
	var appID int64
	h.db.QueryRow(`SELECT application_id FROM follow_ups WHERE id=?`, id).Scan(&appID)
	h.touchAppUpdated(appID)
	writeJSON(w, http.StatusOK, f)
}

func (h *apiHandler) deleteFollowUp(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r, "followUpId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid follow-up id")
		return
	}
	if !h.verifyFollowUpOwnership(w, r, id) {
		return
	}
	var appID int64
	h.db.QueryRow(`SELECT application_id FROM follow_ups WHERE id=?`, id).Scan(&appID)
	_, err = h.db.Exec(`DELETE FROM follow_ups WHERE id=?`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.touchAppUpdated(appID)
	w.WriteHeader(http.StatusNoContent)
}

// ---------- Follow-up needed ----------

func (h *apiHandler) listFollowUpNeeded(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	rows, err := h.db.Query(`
		SELECT a.id, a.user_id, a.company, a.position, a.job_description, a.job_post_source, a.applied_sources, a.skills, a.resume_name, a.resume_type, a.resume_sent, a.status, a.applied_date, a.notes, a.retry_gap_days, a.created_at, a.updated_at
		FROM applications a
		WHERE a.user_id=?
		  AND a.status NOT IN ('rejected', 'accepted')
		  AND EXISTS (
		    SELECT 1 FROM interviews i
		    WHERE i.application_id = a.id AND i.status = 'attended'
		  )
		  AND datetime(a.updated_at) <= datetime('now', '-2 days')
		ORDER BY datetime(a.updated_at) ASC
	`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var apps []Application
	for rows.Next() {
		var a Application
		var resumeSent int
		if err := rows.Scan(&a.ID, &a.UserID, &a.Company, &a.Position, &a.JobDescription, &a.JobPostSource, &a.AppliedSources, &a.Skills, &a.ResumeName, &a.ResumeType, &resumeSent, &a.Status, &a.AppliedDate, &a.Notes, &a.RetryGapDays, &a.CreatedAt, &a.UpdatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		a.ResumeSent = resumeSent == 1
		apps = append(apps, a)
	}
	if apps == nil {
		apps = []Application{}
	}
	writeJSON(w, http.StatusOK, apps)
}

// ---------- Stats ----------

func (h *apiHandler) getStats(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	stats := map[string]int{}

	countQuery := func(status string) int {
		var c int
		h.db.QueryRow(`SELECT COUNT(*) FROM applications WHERE status=? AND user_id=?`, status, user.ID).Scan(&c)
		return c
	}

	var total int
	h.db.QueryRow(`SELECT COUNT(*) FROM applications WHERE user_id=?`, user.ID).Scan(&total)
	stats["total"] = total
	stats["applied"] = countQuery("applied")
	stats["interview"] = countQuery("interview")
	stats["offer"] = countQuery("offer")
	stats["rejected"] = countQuery("rejected")
	stats["accepted"] = countQuery("accepted")

	var upcoming int
	h.db.QueryRow(`SELECT COUNT(*) FROM interviews i JOIN applications a ON i.application_id = a.id WHERE a.user_id=? AND i.status='scheduled' AND datetime(i.scheduled_date) >= datetime('now')`, user.ID).Scan(&upcoming)
	stats["upcoming_interviews"] = upcoming

	writeJSON(w, http.StatusOK, stats)
}

// ---------- Search ----------

func (h *apiHandler) searchHandler(w http.ResponseWriter, r *http.Request) {
	user, _ := userFromContext(r.Context())
	q := r.URL.Query().Get("q")
	if q == "" {
		writeJSON(w, http.StatusOK, SearchResponse{Query: "", Results: []SearchResult{}})
		return
	}

	like := "%" + q + "%"
	var results []SearchResult

	// Search applications
	appRows, err := h.db.Query(`
		SELECT id, company, position, status
		FROM applications
		WHERE user_id=? AND (company LIKE ? OR position LIKE ? OR notes LIKE ? OR job_description LIKE ? OR job_post_source LIKE ?)
		ORDER BY datetime(updated_at) DESC
		LIMIT 20
	`, user.ID, like, like, like, like, like)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	for appRows.Next() {
		var sr SearchResult
		sr.Type = "application"
		if err := appRows.Scan(&sr.ID, &sr.Company, &sr.Position, &sr.Status); err != nil {
			appRows.Close()
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		sr.ApplicationID = sr.ID
		sr.Title = sr.Company
		sr.Subtitle = sr.Position
		results = append(results, sr)
	}
	appRows.Close()

	// Search interviews
	ivRows, err := h.db.Query(`
		SELECT i.id, i.application_id, i.round_name, i.status, i.notes, a.company, a.position
		FROM interviews i
		JOIN applications a ON i.application_id = a.id
		WHERE a.user_id=? AND (i.round_name LIKE ? OR i.notes LIKE ? OR i.status LIKE ?)
		ORDER BY datetime(i.scheduled_date) DESC
		LIMIT 20
	`, user.ID, like, like, like)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	for ivRows.Next() {
		var sr SearchResult
		var roundName, notes string
		sr.Type = "interview"
		if err := ivRows.Scan(&sr.ID, &sr.ApplicationID, &roundName, &sr.Status, &notes, &sr.Company, &sr.Position); err != nil {
			ivRows.Close()
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		sr.Title = sr.Company
		sr.Subtitle = "Interview: " + sr.Position
		if roundName != "" {
			sr.Subtitle += " — " + roundName
		}
		results = append(results, sr)
	}
	ivRows.Close()

	// Search follow-ups
	fuRows, err := h.db.Query(`
		SELECT f.id, f.application_id, f.follow_type, f.notes, a.company, a.position
		FROM follow_ups f
		JOIN applications a ON f.application_id = a.id
		WHERE a.user_id=? AND (f.notes LIKE ? OR f.follow_type LIKE ?)
		ORDER BY datetime(f.date) DESC
		LIMIT 20
	`, user.ID, like, like)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	for fuRows.Next() {
		var sr SearchResult
		var followType, notes string
		sr.Type = "follow_up"
		if err := fuRows.Scan(&sr.ID, &sr.ApplicationID, &followType, &notes, &sr.Company, &sr.Position); err != nil {
			fuRows.Close()
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		sr.Status = followType
		sr.Title = sr.Company
		sr.Subtitle = "Follow-up: " + sr.Position
		if notes != "" {
			sr.Subtitle += " — " + notes
		}
		results = append(results, sr)
	}
	fuRows.Close()

	if results == nil {
		results = []SearchResult{}
	}
	writeJSON(w, http.StatusOK, SearchResponse{Query: q, Results: results})
}
