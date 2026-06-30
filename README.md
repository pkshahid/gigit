# Gigit

Track job applications, interview rounds, follow-ups, and scheduled interviews with a calendar view.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + TailwindCSS + date-fns + lucide-react
- **Backend**: Go + chi router + SQLite (modernc.org/sqlite - pure Go, no CGO needed)
- **Features**: Dark/light theme, calendar view, full CRUD for applications/interviews/follow-ups

## Project Structure

```
Interview_tracker/
├── backend/          # Go API server
│   ├── main.go       # Entry point, chi router, CORS
│   ├── db.go         # SQLite init and schema
│   ├── models.go     # Data models
│   └── handlers.go   # REST API handlers
├── frontend/         # React + Vite frontend
│   └── src/
│       ├── api/      # API client
│       ├── components/   # Reusable UI components
│       ├── context/      # Theme context (dark/light)
│       ├── pages/        # Dashboard, Detail, Calendar pages
│       └── types.ts      # TypeScript types
```

## Setup

### Backend

```bash
cd backend
go run .
# Server starts on :4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App starts on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`.

## Features

- **Dashboard**: Stats overview (total, interviews, offers, rejections, upcoming), filterable application list
- **Application Detail**: Full JD recording, resume tracking, interview rounds with status (scheduled/attended/passed/failed), follow-ups (email/call/message)
- **Calendar**: Monthly calendar view showing scheduled interviews, click any day to see details, upcoming interviews list
- **Dark/Light Theme**: Toggle in header, persists in localStorage, respects system preference on first load
