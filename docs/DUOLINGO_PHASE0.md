# DUOLINGO Phase 0 Baseline

## 1. Target User + Pilot Scope
- Primary: self-learning users level A1-A2.
- Secondary: existing users from current app role `user`.
- Pilot language flow: vocabulary + short sentence practice.
- Session target: 2-5 minutes per lesson run.

## 2. ERD (v1.1)

Core hierarchy:
- `Course` 1-n `Unit`
- `Unit` 1-n `UnitLesson`
- `Lesson` 1-n `UnitLesson`

Progress + runtime:
- `User` 1-n `LearningSession`
- `Unit` 1-n `LearningSession`
- `Lesson` 1-n `LearningSession`
- `LearningSession` 1-n `ExerciseAttempt`
- `User` 1-n `UserUnitProgress`
- `Unit` 1-n `UserUnitProgress`
- `User` 1-n `LessonProgress` (existing)
- `Lesson` 1-n `LessonProgress` (existing)

Unlock rule (current implementation):
- Unit #1 unlocked by default.
- Unit N unlocked when `completed_lessons` of Unit N-1 >= `required_lessons_to_unlock` of Unit N-1.

## 3. API Spec v1.1 (Implemented)

### GET `/api/v1/learning/path/`
Response:
- Active course + list units.
- Per unit: `lesson_count`, `unlocked`, `progress`, `lessons`.

### POST `/api/v1/learning/session/start/`
Request:
```json
{ "lesson_id": 12 }
```
Response:
- New `learning_session` with status `started`.
- Validates lesson belongs to published+active unit and unit is unlocked.

### POST `/api/v1/learning/session/{id}/answer/`
Request:
```json
{
  "step_index": 1,
  "exercise_type": "mc",
  "prompt": "Choose the correct meaning",
  "submitted_answer": {"option": "A"},
  "is_correct": true,
  "response_ms": 950
}
```
Response:
- Saved attempt + updated session counters.
- Idempotent by `(session_id, step_index)`.

### POST `/api/v1/learning/session/{id}/finish/`
Response:
- Session completed.
- Updates `LessonProgress`, `UserUnitProgress`, user XP, streak.

## 4. KPI Tracking List (Phase 0)
- `learning_session_started`
- `learning_session_answered`
- `learning_session_finished`
- `learning_session_abandoned` (next step)
- `unit_unlock`
- `daily_goal_reached` (phase 3)
- `streak_continue`

Suggested product KPIs:
- D1 retention
- D7 retention
- sessions per DAU
- average session duration
- unit completion rate
