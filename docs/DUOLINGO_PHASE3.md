# DUOLINGO PHASE 3 - DONE

## Da lam xong dot 1

- Daily Goal backend:
  - `GET /api/v1/learning/daily-goal/`
  - `POST /api/v1/learning/daily-goal/claim/`
  - Models: `DailyGoal`, `DailyGoalLog`
- Hearts/Lives:
  - Models: `UserHearts`, `HeartTransaction`
  - Refill theo thoi gian + task batch refill
  - Chan start/answer khi het hearts
  - Tra ve hearts trong feedback/session start
- Streak Freeze:
  - Them `streak_freezes`, `last_freeze_used_on`
  - Logic consume freeze khi gap 1 ngay
- Adaptive Difficulty:
  - Rule moi: dung lien tiep -> hard, sai lien tiep -> easy
  - Easy mode giam so cau trong lesson session
- Reminder theo gio hoat dong:
  - Model `UserReminderPreference`
  - Ghi nhan gio hoat dong khi review/session finish
  - Task reminder loc theo `preferred_hour`
- Frontend:
  - Them panel Daily Goal + Hearts + Claim XP o `LearningPage`

## Da lam xong dot 2

- Hearts indicator trong session UI:
  - Hien thi hearts realtime tren `LearningSessionPage`
  - API session detail/answer tra ve `hearts` payload
- Streak freeze UX:
  - API doi XP lay freeze: `POST /api/v1/learning/streak-freeze/claim/`
  - UI nut `Buy Freeze (-50 XP)` trong `LearningPage`
- Tests bo sung:
  - hearts trong session detail
  - claim streak freeze success/fail

## Da lam xong dot 3

- Balance hearts theo do kho:
  - `hard`/`checkpoint` sai: -2 hearts
  - `easy`/`normal` sai: -1 heart
- Balance XP theo do kho:
  - easy dung: +8 XP
  - normal dung: +10 XP
  - hard/checkpoint dung: +12 XP
  - lesson sai: +1 XP, checkpoint sai: +0 XP
- Reward streak freeze theo milestone:
  - moi moc streak 7, 14, 21... thuong +1 freeze (1 lan/moc)
  - theo doi bang `last_freeze_reward_streak`
- Cap streak freeze:
  - mua freeze gioi han toi da 5 freeze/account

## Migration dot 3

- `learning.0008_learningsession_difficulty_and_more`
  - them `LearningSession.difficulty`
  - them `UserStreak.last_freeze_reward_streak`

## Test va migrate

- `manage.py check`: pass
- `pytest` (phase3 + learning path): 19 passed
- `manage.py makemigrations --check --dry-run`: no changes
- `docker compose exec backend python manage.py migrate`: da apply den `learning.0008_learningsession_difficulty_and_more`
- `docker compose exec backend pytest apps/learning/tests/test_phase3_gamification.py -q`: 12 passed
