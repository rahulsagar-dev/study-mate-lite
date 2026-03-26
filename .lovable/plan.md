

# Database Setup Plan

This project needs 10 database tables, 2 storage buckets, and a trigger to function properly. Here's the complete plan.

## Tables to Create

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (display name, avatar, study stats) |
| `flashcard_sets` | Saved flashcard collections |
| `flashcards` | Individual cards within sets |
| `generation_history` | AI generation history for flashcards |
| `summaries` | Saved text summaries |
| `documents` | Uploaded file metadata |
| `ai_error_logs` | Error logging for AI features |
| `pomodoro_settings` | Per-user timer configuration |
| `pomodoro_sessions` | Completed pomodoro session records |
| `todos` | To-do list tasks with priority and ordering |

## Storage Buckets

- **avatars** — Profile pictures (public access)
- **documents** — Uploaded study files (authenticated access)

## Trigger

- **Auto-create profile** — When a new user signs up, automatically insert a row in `profiles` so the profile page works immediately.

## RLS Policies

Every table gets Row-Level Security with policies ensuring users can only read/write their own data. Realtime is enabled on `pomodoro_settings` for live settings sync.

## After Migration

- Update the hook files to remove `as any` casts since the generated types will now include all tables
- The build errors will be resolved once types auto-regenerate

## Technical Details

Single migration with all tables, indexes, triggers, and RLS policies. Key design decisions:
- `profiles.user_id` references `auth.users(id)` with CASCADE delete
- `flashcards.set_id` references `flashcard_sets(id)` with CASCADE delete (deleting a set removes its cards)
- `pomodoro_settings` has a UNIQUE constraint on `user_id` for upsert support
- `todos` uses a `priority_level` enum (high/medium/low)
- Profile trigger uses `SECURITY DEFINER` to bypass RLS during signup

