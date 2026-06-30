# Gigit — Flutter Mobile App

A modern, animated mobile app for tracking job applications, interviews, and follow-ups — built with Flutter, Bento UI design, and smooth animations.

## Features

- **Dashboard** — Bento-style stats grid showing total applications, interviews, offers, accepted, rejected, and upcoming interviews
- **Applications** — Full CRUD for job applications with company, position, status, skills, applied sources, notes, and more
- **Interviews** — Track interview rounds per application with scheduled dates, times, status, join links, and notes
- **Follow-ups** — Log follow-up communications (email, call, message) per application
- **Calendar** — Visual calendar showing all scheduled interviews with day selection
- **All Interviews** — Flat list of all interviews across applications
- **Auth** — JWT-based login and registration

## API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/applications` | List applications |
| POST | `/api/applications` | Create application |
| GET | `/api/applications/:id` | Get application detail (with interviews & follow-ups) |
| PUT | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application |
| GET | `/api/applications/stats` | Get dashboard stats |
| GET | `/api/applications/follow-up-needed` | Get applications needing follow-up |
| GET | `/api/interviews` | List all interviews |
| POST | `/api/applications/:id/interviews` | Create interview |
| PUT | `/api/applications/:id/interviews/:interviewId` | Update interview |
| DELETE | `/api/applications/:id/interviews/:interviewId` | Delete interview |
| POST | `/api/applications/:id/follow-ups` | Create follow-up |
| PUT | `/api/applications/:id/follow-ups/:followUpId` | Update follow-up |
| DELETE | `/api/applications/:id/follow-ups/:followUpId` | Delete follow-up |

## Getting Started

### Prerequisites

- Flutter SDK >= 3.0.0
- Dart >= 3.0.0
- Backend server running (default: `http://10.0.2.2:4000` for Android emulator, or `http://localhost:4000` for iOS simulator)

### Install & Run

```bash
cd mobile_app
flutter pub get
flutter run
```

### API Configuration

The API base URL is configured in `lib/services/api_service.dart`:

```dart
static const String baseUrl = 'http://10.0.2.2:4000/api';
```

- **Android emulator**: Use `http://10.0.2.2:4000/api`
- **iOS simulator**: Use `http://localhost:4000/api`
- **Physical device**: Use your machine's IP, e.g. `http://192.168.x.x:4000/api`

## Project Structure

```
mobile_app/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── models/
│   │   └── models.dart              # All data models
│   ├── services/
│   │   └── api_service.dart         # HTTP API client
│   ├── providers/
│   │   └── auth_provider.dart       # Auth state management
│   ├── theme/
│   │   └── app_theme.dart           # Dark theme, colors, styling
│   ├── widgets/
│   │   ├── bento_card.dart          # Bento grid card widgets
│   │   ├── status_badge.dart        # Status badge component
│   │   ├── application_tile.dart    # Application list item
│   │   ├── interview_tile.dart      # Interview list item
│   │   └── common.dart              # Loading, empty, error states
│   └── screens/
│       ├── auth_screen.dart         # Login / Register
│       ├── home_screen.dart         # Bottom nav + profile
│       ├── dashboard_screen.dart    # Bento UI dashboard
│       ├── application_list_screen.dart  # Filtered app lists
│       ├── application_detail_screen.dart # Detail with tabs
│       ├── application_form_screen.dart   # Create/edit application
│       ├── interviews_screen.dart   # All interviews list
│       ├── interview_form_screen.dart # Create/edit interview
│       ├── follow_up_form_screen.dart # Create/edit follow-up
│       └── calendar_screen.dart     # Calendar view
├── pubspec.yaml
└── README.md
```

## Design

- **Bento UI** — Staggered grid layout for dashboard stats with colored accent cards
- **Dark theme** — Deep navy background with indigo/purple accents
- **Animations** — Fade-in, slide, and scale transitions using `flutter_animate`
- **Material 3** — Modern Material Design components
- **Google Fonts** — Inter font family throughout
