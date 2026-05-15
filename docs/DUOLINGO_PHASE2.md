# DUOLINGO PHASE 2 - DONE

## Muc tieu phase 2

- Exercise engine + checkpoint
- Session feedback nhanh
- Tong ket cuoi phien
- Noi voi SRS de day tu sai vao review som

## Da hoan thanh

- Backend exercise engine:
  - Generator template: `mc_meaning`, `fill_blank`, `word_order`
  - Distractor pool co tron `lesson_words` + `global_words` cung level/loai tu
  - Evaluate dap an theo tung exercise type
- Learning session/checkpoint flow:
  - `POST /learning/session/start/`
  - `POST /learning/session/{id}/answer/`
  - `POST /learning/session/{id}/finish/`
  - `POST /learning/checkpoint/start/`
  - `POST /learning/checkpoint/{id}/submit/`
- Checkpoint scoring + unlock:
  - Tinh diem `%`, pass khi `>= 70`
  - Set `checkpoint_passed`, `checkpoint_passed_at`
  - Unlock unit tiep theo theo rule unit unlock
- Summary cuoi phien:
  - `accuracy_pct`
  - `accuracy_by_type`
  - `review_word_ids`, `review_words`
  - `total_xp_from_attempts`
- Noi voi SRS:
  - Sai cung 1 tu >= 2 lan trong session => bump vao review som (`next_review_date = today`)
- Frontend:
  - Learning Path page + Unit card + start checkpoint
  - Learning Session page cho 3 loai bai
  - Instant feedback + summary page
  - Delay feedback set `180ms` (dat muc tieu < 200ms)

## Xac nhan

- `manage.py check`: pass
- `pytest apps/learning/tests/test_learning_path_session.py -q`: 7 passed
- `makemigrations --check --dry-run`: no changes

## Luu y moi truong

- Build frontend trong may hien tai dang fail do PowerShell policy/sandbox (`npm.ps1` + esbuild permission), khong phai loi logic phase 2.
