-- SQL backup generated from Django migrations (model-based)
-- Project: NoroStu / MNM_REPORT
-- Settings: config.settings.test (SQLite SQL dialect)
-- Generated at: 2026-05-21 22:59:10


-- ==========================================
-- APP: accounts
-- ==========================================


-- Migration: accounts.0001_initial

BEGIN;
--
-- Create model User
--
CREATE TABLE "users" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "password" varchar(128) NOT NULL, "last_login" datetime NULL, "is_superuser" bool NOT NULL, "username" varchar(150) NOT NULL UNIQUE, "first_name" varchar(150) NOT NULL, "last_name" varchar(150) NOT NULL, "date_joined" datetime NOT NULL, "is_staff" bool NOT NULL, "email" varchar(254) NOT NULL UNIQUE, "full_name" varchar(200) NOT NULL, "role" varchar(10) NOT NULL, "xp" integer NOT NULL, "level" integer NOT NULL, "avatar_url" varchar(500) NOT NULL, "is_active" bool NOT NULL, "email_verified" bool NOT NULL, "notification_enabled" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL);
CREATE TABLE "users_groups" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE "users_user_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model EmailVerificationToken
--
CREATE TABLE "email_verification_tokens" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "token" varchar(64) NOT NULL UNIQUE, "expires_at" datetime NOT NULL, "created_at" datetime NOT NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model PasswordResetToken
--
CREATE TABLE "password_reset_tokens" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "token" varchar(64) NOT NULL UNIQUE, "expires_at" datetime NOT NULL, "is_used" bool NOT NULL, "created_at" datetime NOT NULL, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE UNIQUE INDEX "users_groups_user_id_group_id_fc7788e8_uniq" ON "users_groups" ("user_id", "group_id");
CREATE INDEX "users_groups_user_id_f500bee5" ON "users_groups" ("user_id");
CREATE INDEX "users_groups_group_id_2f3517aa" ON "users_groups" ("group_id");
CREATE UNIQUE INDEX "users_user_permissions_user_id_permission_id_3b86cbdf_uniq" ON "users_user_permissions" ("user_id", "permission_id");
CREATE INDEX "users_user_permissions_user_id_92473840" ON "users_user_permissions" ("user_id");
CREATE INDEX "users_user_permissions_permission_id_6d08dcd2" ON "users_user_permissions" ("permission_id");
CREATE INDEX "password_reset_tokens_user_id_0aeaaad3" ON "password_reset_tokens" ("user_id");
COMMIT;



-- Migration: accounts.0002_alter_emailverificationtoken_id_and_more

BEGIN;
--
-- Alter field id on emailverificationtoken
--
-- (no-op)
--
-- Alter field id on passwordresettoken
--
-- (no-op)
--
-- Alter field date_joined on user
--
-- (no-op)
--
-- Alter field first_name on user
--
-- (no-op)
--
-- Alter field groups on user
--
-- (no-op)
--
-- Alter field id on user
--
-- (no-op)
--
-- Alter field is_staff on user
--
-- (no-op)
--
-- Alter field is_superuser on user
--
-- (no-op)
--
-- Alter field last_name on user
--
-- (no-op)
--
-- Alter field user_permissions on user
--
-- (no-op)
--
-- Alter field username on user
--
-- (no-op)
COMMIT;



-- Migration: accounts.0003_alter_emailverificationtoken_token_and_more

BEGIN;
--
-- Alter field token on emailverificationtoken
--
CREATE TABLE "new__email_verification_tokens" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "token" varchar(64) NOT NULL UNIQUE, "expires_at" datetime NOT NULL, "created_at" datetime NOT NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
INSERT INTO "new__email_verification_tokens" ("id", "expires_at", "created_at", "user_id", "token") SELECT "id", "expires_at", "created_at", "user_id", "token" FROM "email_verification_tokens";
DROP TABLE "email_verification_tokens";
ALTER TABLE "new__email_verification_tokens" RENAME TO "email_verification_tokens";
--
-- Alter field token on passwordresettoken
--
CREATE TABLE "new__password_reset_tokens" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "expires_at" datetime NOT NULL, "is_used" bool NOT NULL, "created_at" datetime NOT NULL, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "token" varchar(64) NOT NULL UNIQUE);
INSERT INTO "new__password_reset_tokens" ("id", "expires_at", "is_used", "created_at", "user_id", "token") SELECT "id", "expires_at", "is_used", "created_at", "user_id", "token" FROM "password_reset_tokens";
DROP TABLE "password_reset_tokens";
ALTER TABLE "new__password_reset_tokens" RENAME TO "password_reset_tokens";
CREATE INDEX "password_reset_tokens_user_id_0aeaaad3" ON "password_reset_tokens" ("user_id");
COMMIT;



-- ==========================================
-- APP: vocabulary
-- ==========================================


-- Migration: vocabulary.0001_initial

BEGIN;
--
-- Create model Word
--
CREATE TABLE "words" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "text" varchar(200) NOT NULL, "phonetic" varchar(100) NOT NULL, "part_of_speech" varchar(50) NOT NULL, "definition_en" text NOT NULL, "definition_vi" text NOT NULL, "example_en" text NOT NULL, "example_vi" text NOT NULL, "level" varchar(10) NOT NULL, "image_url" varchar(500) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create index words_text_idx on field(s) text of model word
--
CREATE INDEX "words_text_idx" ON "words" ("text");
--
-- Create model WordSet
--
CREATE TABLE "wordsets" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(200) NOT NULL, "description" text NOT NULL, "level" varchar(10) NOT NULL, "is_public" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model WordSetWord
--
CREATE TABLE "wordset_words" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "word_id" bigint NOT NULL REFERENCES "words" ("id") DEFERRABLE INITIALLY DEFERRED, "wordset_id" bigint NOT NULL REFERENCES "wordsets" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Alter unique_together for wordsetword (1 constraint(s))
--
CREATE UNIQUE INDEX "wordset_words_wordset_id_word_id_d558b959_uniq" ON "wordset_words" ("wordset_id", "word_id");
--
-- Add field words to wordset
--
CREATE TABLE "new__wordsets" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(200) NOT NULL, "description" text NOT NULL, "level" varchar(10) NOT NULL, "is_public" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
INSERT INTO "new__wordsets" ("id", "name", "description", "level", "is_public", "created_at", "updated_at", "created_by_id") SELECT "id", "name", "description", "level", "is_public", "created_at", "updated_at", "created_by_id" FROM "wordsets";
DROP TABLE "wordsets";
ALTER TABLE "new__wordsets" RENAME TO "wordsets";
CREATE INDEX "words_level_9779e37c" ON "words" ("level");
CREATE INDEX "words_created_by_id_e7ce8a17" ON "words" ("created_by_id");
CREATE INDEX "wordset_words_word_id_39d7a66d" ON "wordset_words" ("word_id");
CREATE INDEX "wordset_words_wordset_id_b45d6ce4" ON "wordset_words" ("wordset_id");
CREATE INDEX "wordsets_created_by_id_0b115507" ON "wordsets" ("created_by_id");
--
-- Create model Bookmark
--
CREATE TABLE "bookmarks" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "created_at" datetime NOT NULL, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "word_id" bigint NOT NULL REFERENCES "words" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Alter unique_together for bookmark (1 constraint(s))
--
CREATE UNIQUE INDEX "bookmarks_user_id_word_id_1f1d1db3_uniq" ON "bookmarks" ("user_id", "word_id");
CREATE INDEX "bookmarks_user_id_12990ce0" ON "bookmarks" ("user_id");
CREATE INDEX "bookmarks_word_id_7bd9d96a" ON "bookmarks" ("word_id");
COMMIT;



-- Migration: vocabulary.0002_rename_words_text_idx_words_text_295e13_idx_and_more

BEGIN;
--
-- Rename index words_text_idx on word to words_text_295e13_idx
--
DROP INDEX "words_text_idx";
CREATE INDEX "words_text_295e13_idx" ON "words" ("text");
--
-- Alter field id on bookmark
--
-- (no-op)
--
-- Alter field id on word
--
-- (no-op)
--
-- Alter field id on wordset
--
-- (no-op)
--
-- Alter field id on wordsetword
--
-- (no-op)
COMMIT;



-- Migration: vocabulary.0003_word_text_unique

BEGIN;
--
-- Alter field text on word
--
CREATE TABLE "new__words" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "text" varchar(200) NOT NULL UNIQUE, "phonetic" varchar(100) NOT NULL, "part_of_speech" varchar(50) NOT NULL, "definition_en" text NOT NULL, "definition_vi" text NOT NULL, "example_en" text NOT NULL, "example_vi" text NOT NULL, "level" varchar(10) NOT NULL, "image_url" varchar(500) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
INSERT INTO "new__words" ("id", "phonetic", "part_of_speech", "definition_en", "definition_vi", "example_en", "example_vi", "level", "image_url", "created_at", "updated_at", "created_by_id", "text") SELECT "id", "phonetic", "part_of_speech", "definition_en", "definition_vi", "example_en", "example_vi", "level", "image_url", "created_at", "updated_at", "created_by_id", "text" FROM "words";
DROP TABLE "words";
ALTER TABLE "new__words" RENAME TO "words";
CREATE INDEX "words_level_9779e37c" ON "words" ("level");
CREATE INDEX "words_created_by_id_e7ce8a17" ON "words" ("created_by_id");
CREATE INDEX "words_text_295e13_idx" ON "words" ("text");
COMMIT;



-- ==========================================
-- APP: learning
-- ==========================================


-- Migration: learning.0001_initial

BEGIN;
--
-- Create model Lesson
--
CREATE TABLE "lessons" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "title" varchar(200) NOT NULL, "description" text NOT NULL, "level" varchar(10) NOT NULL, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "is_published" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model LessonWord
--
CREATE TABLE "lesson_words" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "word_id" bigint NOT NULL REFERENCES "words" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Alter unique_together for lessonword (1 constraint(s))
--
CREATE UNIQUE INDEX "lesson_words_lesson_id_word_id_deb8162f_uniq" ON "lesson_words" ("lesson_id", "word_id");
--
-- Add field words to lesson
--
CREATE TABLE "new__lessons" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "title" varchar(200) NOT NULL, "description" text NOT NULL, "level" varchar(10) NOT NULL, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "is_published" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
INSERT INTO "new__lessons" ("id", "title", "description", "level", "order_index", "is_published", "created_at", "updated_at", "created_by_id") SELECT "id", "title", "description", "level", "order_index", "is_published", "created_at", "updated_at", "created_by_id" FROM "lessons";
DROP TABLE "lessons";
ALTER TABLE "new__lessons" RENAME TO "lessons";
CREATE INDEX "lesson_words_lesson_id_9295130c" ON "lesson_words" ("lesson_id");
CREATE INDEX "lesson_words_word_id_7e1a2626" ON "lesson_words" ("word_id");
CREATE INDEX "lessons_created_by_id_59bf509f" ON "lessons" ("created_by_id");
--
-- Create model Assignment
--
CREATE TABLE "assignments" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "due_date" date NULL, "completed_at" datetime NULL, "created_at" datetime NOT NULL, "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "student_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "teacher_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Alter unique_together for assignment (1 constraint(s))
--
CREATE UNIQUE INDEX "assignments_lesson_id_student_id_0c58491b_uniq" ON "assignments" ("lesson_id", "student_id");
--
-- Create model LessonProgress
--
CREATE TABLE "lesson_progress" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "started_at" datetime NULL, "completed_at" datetime NULL, "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Alter unique_together for lessonprogress (1 constraint(s))
--
CREATE UNIQUE INDEX "lesson_progress_user_id_lesson_id_0e9154c2_uniq" ON "lesson_progress" ("user_id", "lesson_id");
--
-- Create model ReviewLog
--
CREATE TABLE "review_logs" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "easiness_factor" real NOT NULL, "repetitions" integer NOT NULL, "interval_days" integer NOT NULL, "last_reviewed" date NULL, "next_review_date" date NULL, "total_reviews" integer NOT NULL, "correct_count" integer NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "word_id" bigint NOT NULL REFERENCES "words" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Alter unique_together for reviewlog (1 constraint(s))
--
CREATE UNIQUE INDEX "review_logs_user_id_word_id_7cd078a2_uniq" ON "review_logs" ("user_id", "word_id");
--
-- Create index review_next_date_idx on field(s) next_review_date of model reviewlog
--
CREATE INDEX "review_next_date_idx" ON "review_logs" ("next_review_date");
--
-- Create index review_user_date_idx on field(s) user, next_review_date of model reviewlog
--
CREATE INDEX "review_user_date_idx" ON "review_logs" ("user_id", "next_review_date");
--
-- Create model UserStreak
--
CREATE TABLE "user_streaks" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "current_streak" integer NOT NULL, "longest_streak" integer NOT NULL, "last_active_date" date NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model Notification
--
CREATE TABLE "notifications" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "type" varchar(50) NOT NULL, "message" text NOT NULL, "is_read" bool NOT NULL, "related_id" integer NULL, "created_at" datetime NOT NULL, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create index notif_user_read_idx on field(s) user, is_read of model notification
--
CREATE INDEX "notif_user_read_idx" ON "notifications" ("user_id", "is_read");
CREATE INDEX "assignments_lesson_id_31ba906c" ON "assignments" ("lesson_id");
CREATE INDEX "assignments_student_id_82c5a6fc" ON "assignments" ("student_id");
CREATE INDEX "assignments_teacher_id_2d69c6f6" ON "assignments" ("teacher_id");
CREATE INDEX "lesson_progress_lesson_id_29220d73" ON "lesson_progress" ("lesson_id");
CREATE INDEX "lesson_progress_user_id_4d13c87b" ON "lesson_progress" ("user_id");
CREATE INDEX "review_logs_user_id_2610bf33" ON "review_logs" ("user_id");
CREATE INDEX "review_logs_word_id_35b2c044" ON "review_logs" ("word_id");
CREATE INDEX "notifications_user_id_468e288d" ON "notifications" ("user_id");
COMMIT;



-- Migration: learning.0002_lesson_level_add_toeic

BEGIN;
--
-- Alter field level on lesson
--
-- (no-op)
COMMIT;



-- Migration: learning.0003_add_student_class

BEGIN;
--
-- Create model StudentClass
--
CREATE TABLE "student_classes" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(200) NOT NULL, "created_at" datetime NOT NULL, "teacher_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE "student_classes_students" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "studentclass_id" bigint NOT NULL REFERENCES "student_classes" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX "student_classes_teacher_id_4ac95e3c" ON "student_classes" ("teacher_id");
CREATE UNIQUE INDEX "student_classes_students_studentclass_id_user_id_d2fdc8a1_uniq" ON "student_classes_students" ("studentclass_id", "user_id");
CREATE INDEX "student_classes_students_studentclass_id_5e23edff" ON "student_classes_students" ("studentclass_id");
CREATE INDEX "student_classes_students_user_id_5f1c0dc2" ON "student_classes_students" ("user_id");
COMMIT;



-- Migration: learning.0004_rename_notif_user_read_idx_notificatio_user_id_a4dd5c_idx_and_more

BEGIN;
--
-- Rename index notif_user_read_idx on notification to notificatio_user_id_a4dd5c_idx
--
DROP INDEX "notif_user_read_idx";
CREATE INDEX "notificatio_user_id_a4dd5c_idx" ON "notifications" ("user_id", "is_read");
--
-- Rename index review_next_date_idx on reviewlog to review_logs_next_re_e98d82_idx
--
DROP INDEX "review_next_date_idx";
CREATE INDEX "review_logs_next_re_e98d82_idx" ON "review_logs" ("next_review_date");
--
-- Rename index review_user_date_idx on reviewlog to review_logs_user_id_a9883e_idx
--
DROP INDEX "review_user_date_idx";
CREATE INDEX "review_logs_user_id_a9883e_idx" ON "review_logs" ("user_id", "next_review_date");
--
-- Alter field id on assignment
--
-- (no-op)
--
-- Alter field id on lesson
--
-- (no-op)
--
-- Alter field id on lessonprogress
--
-- (no-op)
--
-- Alter field id on lessonword
--
-- (no-op)
--
-- Alter field id on notification
--
-- (no-op)
--
-- Alter field id on reviewlog
--
-- (no-op)
--
-- Alter field id on userstreak
--
-- (no-op)
COMMIT;



-- Migration: learning.0005_course_unit_learningsession_exerciseattempt_and_more

BEGIN;
--
-- Create model Course
--
CREATE TABLE "courses" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(200) NOT NULL, "slug" varchar(80) NOT NULL UNIQUE, "description" text NOT NULL, "is_active" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL);
--
-- Create model Unit
--
CREATE TABLE "units" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "title" varchar(200) NOT NULL, "description" text NOT NULL, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "required_lessons_to_unlock" integer unsigned NOT NULL CHECK ("required_lessons_to_unlock" >= 0), "is_published" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "course_id" bigint NOT NULL REFERENCES "courses" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model LearningSession
--
CREATE TABLE "learning_sessions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "status" varchar(16) NOT NULL, "total_answered" integer unsigned NOT NULL CHECK ("total_answered" >= 0), "correct_answered" integer unsigned NOT NULL CHECK ("correct_answered" >= 0), "xp_earned" integer unsigned NOT NULL CHECK ("xp_earned" >= 0), "started_at" datetime NOT NULL, "completed_at" datetime NULL, "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "unit_id" bigint NOT NULL REFERENCES "units" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model ExerciseAttempt
--
CREATE TABLE "exercise_attempts" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "step_index" integer unsigned NOT NULL CHECK ("step_index" >= 0), "exercise_type" varchar(50) NOT NULL, "prompt" text NOT NULL, "submitted_answer" text NOT NULL CHECK ((JSON_VALID("submitted_answer") OR "submitted_answer" IS NULL)), "is_correct" bool NOT NULL, "response_ms" integer unsigned NOT NULL CHECK ("response_ms" >= 0), "awarded_xp" integer unsigned NOT NULL CHECK ("awarded_xp" >= 0), "created_at" datetime NOT NULL, "session_id" bigint NOT NULL REFERENCES "learning_sessions" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model UserUnitProgress
--
CREATE TABLE "user_unit_progress" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "completed_lessons" integer unsigned NOT NULL CHECK ("completed_lessons" >= 0), "total_xp_earned" integer unsigned NOT NULL CHECK ("total_xp_earned" >= 0), "started_at" datetime NULL, "completed_at" datetime NULL, "updated_at" datetime NOT NULL, "unit_id" bigint NOT NULL REFERENCES "units" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model UnitLesson
--
CREATE TABLE "unit_lessons" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "unit_id" bigint NOT NULL REFERENCES "units" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create index learning_se_user_id_d61245_idx on field(s) user, status of model learningsession
--
CREATE INDEX "learning_se_user_id_d61245_idx" ON "learning_sessions" ("user_id", "status");
--
-- Create index learning_se_unit_id_13a18f_idx on field(s) unit, lesson of model learningsession
--
CREATE INDEX "learning_se_unit_id_13a18f_idx" ON "learning_sessions" ("unit_id", "lesson_id");
--
-- Create index learning_se_started_f47896_idx on field(s) started_at of model learningsession
--
CREATE INDEX "learning_se_started_f47896_idx" ON "learning_sessions" ("started_at");
--
-- Create index exercise_at_session_bddeb3_idx on field(s) session, step_index of model exerciseattempt
--
CREATE INDEX "exercise_at_session_bddeb3_idx" ON "exercise_attempts" ("session_id", "step_index");
--
-- Create index exercise_at_created_209e2d_idx on field(s) created_at of model exerciseattempt
--
CREATE INDEX "exercise_at_created_209e2d_idx" ON "exercise_attempts" ("created_at");
--
-- Alter unique_together for exerciseattempt (1 constraint(s))
--
CREATE UNIQUE INDEX "exercise_attempts_session_id_step_index_a7c8bbe7_uniq" ON "exercise_attempts" ("session_id", "step_index");
CREATE UNIQUE INDEX "units_course_id_order_index_2a29348d_uniq" ON "units" ("course_id", "order_index");
CREATE INDEX "units_course_id_48ca239a" ON "units" ("course_id");
CREATE INDEX "learning_sessions_lesson_id_385727e1" ON "learning_sessions" ("lesson_id");
CREATE INDEX "learning_sessions_unit_id_f5b59b1e" ON "learning_sessions" ("unit_id");
CREATE INDEX "learning_sessions_user_id_b55d99b0" ON "learning_sessions" ("user_id");
CREATE INDEX "exercise_attempts_session_id_b63dcacd" ON "exercise_attempts" ("session_id");
CREATE UNIQUE INDEX "user_unit_progress_user_id_unit_id_b2c70dd0_uniq" ON "user_unit_progress" ("user_id", "unit_id");
CREATE INDEX "user_unit_progress_unit_id_36f3fc8f" ON "user_unit_progress" ("unit_id");
CREATE INDEX "user_unit_progress_user_id_b1eb59f0" ON "user_unit_progress" ("user_id");
CREATE INDEX "user_unit_p_user_id_ee44cd_idx" ON "user_unit_progress" ("user_id", "unit_id");
CREATE UNIQUE INDEX "unit_lessons_unit_id_lesson_id_ac930fc3_uniq" ON "unit_lessons" ("unit_id", "lesson_id");
CREATE UNIQUE INDEX "unit_lessons_unit_id_order_index_b8ef89c1_uniq" ON "unit_lessons" ("unit_id", "order_index");
CREATE INDEX "unit_lessons_lesson_id_c0d23080" ON "unit_lessons" ("lesson_id");
CREATE INDEX "unit_lessons_unit_id_4a0fcb65" ON "unit_lessons" ("unit_id");
COMMIT;



-- Migration: learning.0006_learningsession_exercises_and_more

BEGIN;
--
-- Add field exercises to learningsession
--
CREATE TABLE "new__learning_sessions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "exercises" text NOT NULL CHECK ((JSON_VALID("exercises") OR "exercises" IS NULL)), "status" varchar(16) NOT NULL, "total_answered" integer unsigned NOT NULL CHECK ("total_answered" >= 0), "correct_answered" integer unsigned NOT NULL CHECK ("correct_answered" >= 0), "xp_earned" integer unsigned NOT NULL CHECK ("xp_earned" >= 0), "started_at" datetime NOT NULL, "completed_at" datetime NULL, "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "unit_id" bigint NOT NULL REFERENCES "units" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
INSERT INTO "new__learning_sessions" ("id", "status", "total_answered", "correct_answered", "xp_earned", "started_at", "completed_at", "lesson_id", "unit_id", "user_id", "exercises") SELECT "id", "status", "total_answered", "correct_answered", "xp_earned", "started_at", "completed_at", "lesson_id", "unit_id", "user_id", '[]' FROM "learning_sessions";
DROP TABLE "learning_sessions";
ALTER TABLE "new__learning_sessions" RENAME TO "learning_sessions";
CREATE INDEX "learning_sessions_lesson_id_385727e1" ON "learning_sessions" ("lesson_id");
CREATE INDEX "learning_sessions_unit_id_f5b59b1e" ON "learning_sessions" ("unit_id");
CREATE INDEX "learning_sessions_user_id_b55d99b0" ON "learning_sessions" ("user_id");
CREATE INDEX "learning_se_user_id_d61245_idx" ON "learning_sessions" ("user_id", "status");
CREATE INDEX "learning_se_unit_id_13a18f_idx" ON "learning_sessions" ("unit_id", "lesson_id");
CREATE INDEX "learning_se_started_f47896_idx" ON "learning_sessions" ("started_at");
--
-- Add field session_type to learningsession
--
CREATE TABLE "new__learning_sessions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "status" varchar(16) NOT NULL, "total_answered" integer unsigned NOT NULL CHECK ("total_answered" >= 0), "correct_answered" integer unsigned NOT NULL CHECK ("correct_answered" >= 0), "xp_earned" integer unsigned NOT NULL CHECK ("xp_earned" >= 0), "started_at" datetime NOT NULL, "completed_at" datetime NULL, "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "unit_id" bigint NOT NULL REFERENCES "units" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "exercises" text NOT NULL CHECK ((JSON_VALID("exercises") OR "exercises" IS NULL)), "session_type" varchar(16) NOT NULL);
INSERT INTO "new__learning_sessions" ("id", "status", "total_answered", "correct_answered", "xp_earned", "started_at", "completed_at", "lesson_id", "unit_id", "user_id", "exercises", "session_type") SELECT "id", "status", "total_answered", "correct_answered", "xp_earned", "started_at", "completed_at", "lesson_id", "unit_id", "user_id", "exercises", 'lesson' FROM "learning_sessions";
DROP TABLE "learning_sessions";
ALTER TABLE "new__learning_sessions" RENAME TO "learning_sessions";
CREATE INDEX "learning_sessions_lesson_id_385727e1" ON "learning_sessions" ("lesson_id");
CREATE INDEX "learning_sessions_unit_id_f5b59b1e" ON "learning_sessions" ("unit_id");
CREATE INDEX "learning_sessions_user_id_b55d99b0" ON "learning_sessions" ("user_id");
CREATE INDEX "learning_se_user_id_d61245_idx" ON "learning_sessions" ("user_id", "status");
CREATE INDEX "learning_se_unit_id_13a18f_idx" ON "learning_sessions" ("unit_id", "lesson_id");
CREATE INDEX "learning_se_started_f47896_idx" ON "learning_sessions" ("started_at");
--
-- Add field checkpoint_passed to userunitprogress
--
CREATE TABLE "new__user_unit_progress" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "completed_lessons" integer unsigned NOT NULL CHECK ("completed_lessons" >= 0), "total_xp_earned" integer unsigned NOT NULL CHECK ("total_xp_earned" >= 0), "started_at" datetime NULL, "completed_at" datetime NULL, "updated_at" datetime NOT NULL, "unit_id" bigint NOT NULL REFERENCES "units" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "checkpoint_passed" bool NOT NULL);
INSERT INTO "new__user_unit_progress" ("id", "completed_lessons", "total_xp_earned", "started_at", "completed_at", "updated_at", "unit_id", "user_id", "checkpoint_passed") SELECT "id", "completed_lessons", "total_xp_earned", "started_at", "completed_at", "updated_at", "unit_id", "user_id", 0 FROM "user_unit_progress";
DROP TABLE "user_unit_progress";
ALTER TABLE "new__user_unit_progress" RENAME TO "user_unit_progress";
CREATE UNIQUE INDEX "user_unit_progress_user_id_unit_id_b2c70dd0_uniq" ON "user_unit_progress" ("user_id", "unit_id");
CREATE INDEX "user_unit_progress_unit_id_36f3fc8f" ON "user_unit_progress" ("unit_id");
CREATE INDEX "user_unit_progress_user_id_b1eb59f0" ON "user_unit_progress" ("user_id");
CREATE INDEX "user_unit_p_user_id_ee44cd_idx" ON "user_unit_progress" ("user_id", "unit_id");
--
-- Add field checkpoint_passed_at to userunitprogress
--
ALTER TABLE "user_unit_progress" ADD COLUMN "checkpoint_passed_at" datetime NULL;
COMMIT;



-- Migration: learning.0007_dailygoal_alter_course_options_and_more

BEGIN;
--
-- Create model DailyGoal
--
CREATE TABLE "daily_goals" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "target_minutes" integer unsigned NOT NULL CHECK ("target_minutes" >= 0), "reward_xp" integer unsigned NOT NULL CHECK ("reward_xp" >= 0), "is_active" bool NOT NULL, "updated_at" datetime NOT NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Change Meta options on course
--
-- (no-op)
--
-- Change Meta options on exerciseattempt
--
-- (no-op)
--
-- Change Meta options on learningsession
--
-- (no-op)
--
-- Change Meta options on unitlesson
--
-- (no-op)
--
-- Change Meta options on userunitprogress
--
-- (no-op)
--
-- Add field last_freeze_used_on to userstreak
--
ALTER TABLE "user_streaks" ADD COLUMN "last_freeze_used_on" date NULL;
--
-- Add field streak_freezes to userstreak
--
CREATE TABLE "new__user_streaks" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "current_streak" integer NOT NULL, "longest_streak" integer NOT NULL, "last_active_date" date NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "last_freeze_used_on" date NULL, "streak_freezes" integer unsigned NOT NULL CHECK ("streak_freezes" >= 0));
INSERT INTO "new__user_streaks" ("id", "current_streak", "longest_streak", "last_active_date", "user_id", "last_freeze_used_on", "streak_freezes") SELECT "id", "current_streak", "longest_streak", "last_active_date", "user_id", "last_freeze_used_on", 0 FROM "user_streaks";
DROP TABLE "user_streaks";
ALTER TABLE "new__user_streaks" RENAME TO "user_streaks";
--
-- Alter field description on course
--
-- (no-op)
--
-- Alter field is_active on course
--
-- (no-op)
--
-- Alter field name on course
--
-- (no-op)
--
-- Alter field awarded_xp on exerciseattempt
--
-- (no-op)
--
-- Alter field exercise_type on exerciseattempt
--
-- (no-op)
--
-- Alter field is_correct on exerciseattempt
--
-- (no-op)
--
-- Alter field prompt on exerciseattempt
--
-- (no-op)
--
-- Alter field response_ms on exerciseattempt
--
-- (no-op)
--
-- Alter field session on exerciseattempt
--
-- (no-op)
--
-- Alter field step_index on exerciseattempt
--
-- (no-op)
--
-- Alter field submitted_answer on exerciseattempt
--
-- (no-op)
--
-- Alter field completed_at on learningsession
--
-- (no-op)
--
-- Alter field correct_answered on learningsession
--
-- (no-op)
--
-- Alter field exercises on learningsession
--
-- (no-op)
--
-- Alter field lesson on learningsession
--
-- (no-op)
--
-- Alter field session_type on learningsession
--
-- (no-op)
--
-- Alter field started_at on learningsession
--
-- (no-op)
--
-- Alter field status on learningsession
--
-- (no-op)
--
-- Alter field total_answered on learningsession
--
-- (no-op)
--
-- Alter field user on learningsession
--
-- (no-op)
--
-- Alter field xp_earned on learningsession
--
-- (no-op)
--
-- Alter field course on unit
--
-- (no-op)
--
-- Alter field description on unit
--
-- (no-op)
--
-- Alter field is_published on unit
--
-- (no-op)
--
-- Alter field order_index on unit
--
-- (no-op)
--
-- Alter field required_lessons_to_unlock on unit
--
-- (no-op)
--
-- Alter field title on unit
--
-- (no-op)
--
-- Alter field lesson on unitlesson
--
-- (no-op)
--
-- Alter field order_index on unitlesson
--
-- (no-op)
--
-- Alter field checkpoint_passed on userunitprogress
--
-- (no-op)
--
-- Alter field checkpoint_passed_at on userunitprogress
--
-- (no-op)
--
-- Alter field completed_at on userunitprogress
--
-- (no-op)
--
-- Alter field completed_lessons on userunitprogress
--
-- (no-op)
--
-- Alter field started_at on userunitprogress
--
-- (no-op)
--
-- Alter field total_xp_earned on userunitprogress
--
-- (no-op)
--
-- Alter field user on userunitprogress
--
-- (no-op)
--
-- Create model UserReminderPreference
--
CREATE TABLE "user_reminder_preferences" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "preferred_hour" smallint unsigned NULL CHECK ("preferred_hour" >= 0), "last_activity_at" datetime NULL, "updated_at" datetime NOT NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model UserHearts
--
CREATE TABLE "user_hearts" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "current_hearts" integer unsigned NOT NULL CHECK ("current_hearts" >= 0), "max_hearts" integer unsigned NOT NULL CHECK ("max_hearts" >= 0), "refill_interval_minutes" integer unsigned NOT NULL CHECK ("refill_interval_minutes" >= 0), "last_refill_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model HeartTransaction
--
CREATE TABLE "heart_transactions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "transaction_type" varchar(16) NOT NULL, "delta" integer NOT NULL, "reason" varchar(120) NOT NULL, "created_at" datetime NOT NULL, "hearts_id" bigint NOT NULL REFERENCES "user_hearts" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model DailyGoalLog
--
CREATE TABLE "daily_goal_logs" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "goal_date" date NOT NULL, "studied_minutes" integer unsigned NOT NULL CHECK ("studied_minutes" >= 0), "goal_minutes" integer unsigned NOT NULL CHECK ("goal_minutes" >= 0), "is_achieved" bool NOT NULL, "achieved_at" datetime NULL, "claimed_at" datetime NULL, "reward_xp_awarded" integer unsigned NOT NULL CHECK ("reward_xp_awarded" >= 0), "updated_at" datetime NOT NULL, "goal_id" bigint NOT NULL REFERENCES "daily_goals" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX "heart_transactions_hearts_id_61cb94d3" ON "heart_transactions" ("hearts_id");
CREATE INDEX "heart_trans_hearts__3bfbe1_idx" ON "heart_transactions" ("hearts_id", "created_at");
CREATE UNIQUE INDEX "daily_goal_logs_user_id_goal_date_93ea8386_uniq" ON "daily_goal_logs" ("user_id", "goal_date");
CREATE INDEX "daily_goal_logs_goal_id_cdb32883" ON "daily_goal_logs" ("goal_id");
CREATE INDEX "daily_goal_logs_user_id_440d1fb9" ON "daily_goal_logs" ("user_id");
CREATE INDEX "daily_goal__user_id_aa3d42_idx" ON "daily_goal_logs" ("user_id", "goal_date");
CREATE INDEX "daily_goal__goal_da_5c2122_idx" ON "daily_goal_logs" ("goal_date", "is_achieved");
COMMIT;



-- Migration: learning.0008_learningsession_difficulty_and_more

BEGIN;
--
-- Add field difficulty to learningsession
--
CREATE TABLE "new__learning_sessions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "difficulty" varchar(10) NOT NULL, "status" varchar(16) NOT NULL, "total_answered" integer unsigned NOT NULL CHECK ("total_answered" >= 0), "correct_answered" integer unsigned NOT NULL CHECK ("correct_answered" >= 0), "xp_earned" integer unsigned NOT NULL CHECK ("xp_earned" >= 0), "started_at" datetime NOT NULL, "completed_at" datetime NULL, "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "unit_id" bigint NOT NULL REFERENCES "units" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "exercises" text NOT NULL CHECK ((JSON_VALID("exercises") OR "exercises" IS NULL)), "session_type" varchar(16) NOT NULL);
INSERT INTO "new__learning_sessions" ("id", "status", "total_answered", "correct_answered", "xp_earned", "started_at", "completed_at", "lesson_id", "unit_id", "user_id", "exercises", "session_type", "difficulty") SELECT "id", "status", "total_answered", "correct_answered", "xp_earned", "started_at", "completed_at", "lesson_id", "unit_id", "user_id", "exercises", "session_type", 'normal' FROM "learning_sessions";
DROP TABLE "learning_sessions";
ALTER TABLE "new__learning_sessions" RENAME TO "learning_sessions";
CREATE INDEX "learning_sessions_lesson_id_385727e1" ON "learning_sessions" ("lesson_id");
CREATE INDEX "learning_sessions_unit_id_f5b59b1e" ON "learning_sessions" ("unit_id");
CREATE INDEX "learning_sessions_user_id_b55d99b0" ON "learning_sessions" ("user_id");
CREATE INDEX "learning_se_user_id_d61245_idx" ON "learning_sessions" ("user_id", "status");
CREATE INDEX "learning_se_unit_id_13a18f_idx" ON "learning_sessions" ("unit_id", "lesson_id");
CREATE INDEX "learning_se_started_f47896_idx" ON "learning_sessions" ("started_at");
--
-- Add field last_freeze_reward_streak to userstreak
--
CREATE TABLE "new__user_streaks" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "current_streak" integer NOT NULL, "longest_streak" integer NOT NULL, "last_active_date" date NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "last_freeze_used_on" date NULL, "streak_freezes" integer unsigned NOT NULL CHECK ("streak_freezes" >= 0), "last_freeze_reward_streak" integer unsigned NOT NULL CHECK ("last_freeze_reward_streak" >= 0));
INSERT INTO "new__user_streaks" ("id", "current_streak", "longest_streak", "last_active_date", "user_id", "last_freeze_used_on", "streak_freezes", "last_freeze_reward_streak") SELECT "id", "current_streak", "longest_streak", "last_active_date", "user_id", "last_freeze_used_on", "streak_freezes", 0 FROM "user_streaks";
DROP TABLE "user_streaks";
ALTER TABLE "new__user_streaks" RENAME TO "user_streaks";
COMMIT;



-- Migration: learning.0009_learningevent

BEGIN;
--
-- Create model LearningEvent
--
CREATE TABLE "learning_events" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "event_type" varchar(32) NOT NULL, "meta" text NOT NULL CHECK ((JSON_VALID("meta") OR "meta" IS NULL)), "created_at" datetime NOT NULL, "session_id" bigint NULL REFERENCES "learning_sessions" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX "learning_events_session_id_58c91dc0" ON "learning_events" ("session_id");
CREATE INDEX "learning_events_user_id_c3a62196" ON "learning_events" ("user_id");
CREATE INDEX "learning_ev_event_t_ac218e_idx" ON "learning_events" ("event_type", "created_at");
CREATE INDEX "learning_ev_user_id_37c831_idx" ON "learning_events" ("user_id", "created_at");
CREATE INDEX "learning_ev_session_c901ea_idx" ON "learning_events" ("session_id", "created_at");
COMMIT;



-- Migration: learning.0010_placementresult

BEGIN;
--
-- Create model PlacementResult
--
CREATE TABLE "placement_results" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "recommended_level" varchar(10) NOT NULL, "score_pct" real NOT NULL, "total_questions" integer unsigned NOT NULL CHECK ("total_questions" >= 0), "correct_answers" integer unsigned NOT NULL CHECK ("correct_answers" >= 0), "answers" text NOT NULL CHECK ((JSON_VALID("answers") OR "answers" IS NULL)), "created_at" datetime NOT NULL, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX "placement_results_user_id_09917ee8" ON "placement_results" ("user_id");
CREATE INDEX "placement_r_user_id_4d1b2c_idx" ON "placement_results" ("user_id", "created_at");
COMMIT;



-- Migration: learning.0011_lesson_content_difficulty_lesson_skill_tag_and_more

BEGIN;
--
-- Add field content_difficulty to lesson
--
CREATE TABLE "new__lessons" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "content_difficulty" varchar(10) NOT NULL, "title" varchar(200) NOT NULL, "description" text NOT NULL, "level" varchar(10) NOT NULL, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "is_published" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
INSERT INTO "new__lessons" ("id", "title", "description", "level", "order_index", "is_published", "created_at", "updated_at", "created_by_id", "content_difficulty") SELECT "id", "title", "description", "level", "order_index", "is_published", "created_at", "updated_at", "created_by_id", 'normal' FROM "lessons";
DROP TABLE "lessons";
ALTER TABLE "new__lessons" RENAME TO "lessons";
CREATE INDEX "lessons_created_by_id_59bf509f" ON "lessons" ("created_by_id");
--
-- Add field skill_tag to lesson
--
CREATE TABLE "new__lessons" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "title" varchar(200) NOT NULL, "description" text NOT NULL, "level" varchar(10) NOT NULL, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "is_published" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "content_difficulty" varchar(10) NOT NULL, "skill_tag" varchar(20) NOT NULL);
INSERT INTO "new__lessons" ("id", "title", "description", "level", "order_index", "is_published", "created_at", "updated_at", "created_by_id", "content_difficulty", "skill_tag") SELECT "id", "title", "description", "level", "order_index", "is_published", "created_at", "updated_at", "created_by_id", "content_difficulty", 'vocab' FROM "lessons";
DROP TABLE "lessons";
ALTER TABLE "new__lessons" RENAME TO "lessons";
CREATE INDEX "lessons_created_by_id_59bf509f" ON "lessons" ("created_by_id");
--
-- Add field topic to lesson
--
CREATE TABLE "new__lessons" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "title" varchar(200) NOT NULL, "description" text NOT NULL, "level" varchar(10) NOT NULL, "order_index" integer unsigned NOT NULL CHECK ("order_index" >= 0), "is_published" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "created_by_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "content_difficulty" varchar(10) NOT NULL, "skill_tag" varchar(20) NOT NULL, "topic" varchar(100) NOT NULL);
INSERT INTO "new__lessons" ("id", "title", "description", "level", "order_index", "is_published", "created_at", "updated_at", "created_by_id", "content_difficulty", "skill_tag", "topic") SELECT "id", "title", "description", "level", "order_index", "is_published", "created_at", "updated_at", "created_by_id", "content_difficulty", "skill_tag", '' FROM "lessons";
DROP TABLE "lessons";
ALTER TABLE "new__lessons" RENAME TO "lessons";
CREATE INDEX "lessons_created_by_id_59bf509f" ON "lessons" ("created_by_id");
COMMIT;



-- Migration: learning.0012_experimentassignment_experimentconfig_leagueseason_and_more

BEGIN;
--
-- Create model ExperimentAssignment
--
CREATE TABLE "learning_experiment_assignments" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "experiment_key" varchar(80) NOT NULL, "variant_name" varchar(80) NOT NULL, "variant_payload" text NOT NULL CHECK ((JSON_VALID("variant_payload") OR "variant_payload" IS NULL)), "assigned_at" datetime NOT NULL);
--
-- Create model ExperimentConfig
--
CREATE TABLE "learning_experiment_configs" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "key" varchar(80) NOT NULL UNIQUE, "description" varchar(255) NOT NULL, "variants" text NOT NULL CHECK ((JSON_VALID("variants") OR "variants" IS NULL)), "is_active" bool NOT NULL, "started_at" datetime NULL, "ended_at" datetime NULL, "updated_at" datetime NOT NULL);
--
-- Create model LeagueSeason
--
CREATE TABLE "learning_league_seasons" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "code" varchar(40) NOT NULL UNIQUE, "title" varchar(120) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "is_active" bool NOT NULL, "created_at" datetime NOT NULL);
--
-- Alter field event_type on learningevent
--
-- (no-op)
--
-- Create model LeagueStanding
--
CREATE TABLE "learning_league_standings" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "rank" integer unsigned NOT NULL CHECK ("rank" >= 0), "xp_earned" integer unsigned NOT NULL CHECK ("xp_earned" >= 0), "sessions_completed" integer unsigned NOT NULL CHECK ("sessions_completed" >= 0), "updated_at" datetime NOT NULL, "season_id" bigint NOT NULL REFERENCES "learning_league_seasons" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create index learning_le_is_acti_22965a_idx on field(s) is_active, start_date of model leagueseason
--
CREATE INDEX "learning_le_is_acti_22965a_idx" ON "learning_league_seasons" ("is_active", "start_date");
--
-- Add field experiment to experimentassignment
--
ALTER TABLE "learning_experiment_assignments" ADD COLUMN "experiment_id" bigint NULL REFERENCES "learning_experiment_configs" ("id") DEFERRABLE INITIALLY DEFERRED;
--
-- Add field user to experimentassignment
--
CREATE TABLE "new__learning_experiment_assignments" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "experiment_key" varchar(80) NOT NULL, "variant_name" varchar(80) NOT NULL, "variant_payload" text NOT NULL CHECK ((JSON_VALID("variant_payload") OR "variant_payload" IS NULL)), "assigned_at" datetime NOT NULL, "experiment_id" bigint NULL REFERENCES "learning_experiment_configs" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
INSERT INTO "new__learning_experiment_assignments" ("id", "experiment_key", "variant_name", "variant_payload", "assigned_at", "experiment_id", "user_id") SELECT "id", "experiment_key", "variant_name", "variant_payload", "assigned_at", "experiment_id", NULL FROM "learning_experiment_assignments";
DROP TABLE "learning_experiment_assignments";
ALTER TABLE "new__learning_experiment_assignments" RENAME TO "learning_experiment_assignments";
CREATE INDEX "learning_league_standings_season_id_27b84048" ON "learning_league_standings" ("season_id");
CREATE INDEX "learning_league_standings_user_id_166350a0" ON "learning_league_standings" ("user_id");
CREATE INDEX "learning_experiment_assignments_experiment_id_3383128f" ON "learning_experiment_assignments" ("experiment_id");
CREATE INDEX "learning_experiment_assignments_user_id_8738e2c2" ON "learning_experiment_assignments" ("user_id");
--
-- Create index learning_le_season__b19c3d_idx on field(s) season, rank of model leaguestanding
--
CREATE INDEX "learning_le_season__b19c3d_idx" ON "learning_league_standings" ("season_id", "rank");
--
-- Create index learning_le_user_id_c72ecd_idx on field(s) user, season of model leaguestanding
--
CREATE INDEX "learning_le_user_id_c72ecd_idx" ON "learning_league_standings" ("user_id", "season_id");
--
-- Alter unique_together for leaguestanding (1 constraint(s))
--
CREATE UNIQUE INDEX "learning_league_standings_season_id_user_id_d0be34fb_uniq" ON "learning_league_standings" ("season_id", "user_id");
--
-- Create index learning_ex_experim_fd6aec_idx on field(s) experiment_key, variant_name of model experimentassignment
--
CREATE INDEX "learning_ex_experim_fd6aec_idx" ON "learning_experiment_assignments" ("experiment_key", "variant_name");
--
-- Create index learning_ex_user_id_7ad985_idx on field(s) user, experiment_key of model experimentassignment
--
CREATE INDEX "learning_ex_user_id_7ad985_idx" ON "learning_experiment_assignments" ("user_id", "experiment_key");
--
-- Alter unique_together for experimentassignment (1 constraint(s))
--
CREATE UNIQUE INDEX "learning_experiment_assignments_user_id_experiment_key_76a24d58_uniq" ON "learning_experiment_assignments" ("user_id", "experiment_key");
COMMIT;



-- Migration: learning.0013_usercourseprogress_exercise

BEGIN;
--
-- Create model UserCourseProgress
--
CREATE TABLE "user_course_progress" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "completed_units" integer unsigned NOT NULL CHECK ("completed_units" >= 0), "total_xp_earned" integer unsigned NOT NULL CHECK ("total_xp_earned" >= 0), "started_at" datetime NULL, "completed_at" datetime NULL, "updated_at" datetime NOT NULL, "course_id" bigint NOT NULL REFERENCES "courses" ("id") DEFERRABLE INITIALLY DEFERRED, "last_unit_id" bigint NULL REFERENCES "units" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model Exercise
--
CREATE TABLE "learning_exercises" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "step_index" integer unsigned NOT NULL CHECK ("step_index" >= 0), "exercise_type" varchar(40) NOT NULL, "prompt" text NOT NULL, "payload" text NOT NULL CHECK ((JSON_VALID("payload") OR "payload" IS NULL)), "is_active" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "lesson_id" bigint NOT NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE UNIQUE INDEX "user_course_progress_user_id_course_id_66fd996b_uniq" ON "user_course_progress" ("user_id", "course_id");
CREATE INDEX "user_course_progress_course_id_1ef9b1b3" ON "user_course_progress" ("course_id");
CREATE INDEX "user_course_progress_last_unit_id_663eb95e" ON "user_course_progress" ("last_unit_id");
CREATE INDEX "user_course_progress_user_id_2fadfe47" ON "user_course_progress" ("user_id");
CREATE INDEX "user_course_user_id_32dde7_idx" ON "user_course_progress" ("user_id", "course_id");
CREATE UNIQUE INDEX "learning_exercises_lesson_id_step_index_exercise_type_7a68fe85_uniq" ON "learning_exercises" ("lesson_id", "step_index", "exercise_type");
CREATE INDEX "learning_exercises_lesson_id_3c5df715" ON "learning_exercises" ("lesson_id");
CREATE INDEX "learning_ex_lesson__7f08e7_idx" ON "learning_exercises" ("lesson_id", "is_active");
CREATE INDEX "learning_ex_lesson__cb75a7_idx" ON "learning_exercises" ("lesson_id", "step_index");
COMMIT;



-- Migration: learning.0014_alter_learningevent_event_type

BEGIN;
--
-- Alter field event_type on learningevent
--
-- (no-op)
COMMIT;



-- Migration: learning.0015_learningplan_paymentevent_learningsubscription_and_more

BEGIN;
--
-- Create model LearningPlan
--
CREATE TABLE "learning_plans" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "code" varchar(60) NOT NULL UNIQUE, "name" varchar(200) NOT NULL, "description" text NOT NULL, "duration_days" integer unsigned NOT NULL CHECK ("duration_days" >= 0), "price_cents" integer unsigned NOT NULL CHECK ("price_cents" >= 0), "currency" varchar(10) NOT NULL, "auto_assign_published_lessons" bool NOT NULL, "is_active" bool NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "target_class_id" bigint NULL REFERENCES "student_classes" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model PaymentEvent
--
CREATE TABLE "learning_payment_events" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "provider" varchar(40) NOT NULL, "transaction_id" varchar(120) NOT NULL, "user_email" varchar(254) NOT NULL, "plan_code" varchar(60) NOT NULL, "amount_cents" integer unsigned NOT NULL CHECK ("amount_cents" >= 0), "currency" varchar(10) NOT NULL, "status" varchar(20) NOT NULL, "payload" text NOT NULL CHECK ((JSON_VALID("payload") OR "payload" IS NULL)), "processed_at" datetime NULL, "created_at" datetime NOT NULL, "user_id" bigint NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model LearningSubscription
--
CREATE TABLE "learning_subscriptions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "start_at" datetime NOT NULL, "end_at" datetime NOT NULL, "status" varchar(20) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "payment_event_id" bigint NOT NULL UNIQUE REFERENCES "learning_payment_events" ("id") DEFERRABLE INITIALLY DEFERRED, "plan_id" bigint NOT NULL REFERENCES "learning_plans" ("id") DEFERRABLE INITIALLY DEFERRED, "student_class_id" bigint NULL REFERENCES "student_classes" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create index learning_pa_provide_8c02bb_idx on field(s) provider, transaction_id of model paymentevent
--
CREATE INDEX "learning_pa_provide_8c02bb_idx" ON "learning_payment_events" ("provider", "transaction_id");
--
-- Create index learning_pa_status_381758_idx on field(s) status, created_at of model paymentevent
--
CREATE INDEX "learning_pa_status_381758_idx" ON "learning_payment_events" ("status", "created_at");
--
-- Alter unique_together for paymentevent (1 constraint(s))
--
CREATE UNIQUE INDEX "learning_payment_events_provider_transaction_id_b8ebf977_uniq" ON "learning_payment_events" ("provider", "transaction_id");
--
-- Create index learning_su_user_id_43a658_idx on field(s) user, status of model learningsubscription
--
CREATE INDEX "learning_su_user_id_43a658_idx" ON "learning_subscriptions" ("user_id", "status");
--
-- Create index learning_su_end_at_3154c1_idx on field(s) end_at, status of model learningsubscription
--
CREATE INDEX "learning_su_end_at_3154c1_idx" ON "learning_subscriptions" ("end_at", "status");
CREATE INDEX "learning_plans_target_class_id_93f38470" ON "learning_plans" ("target_class_id");
CREATE INDEX "learning_payment_events_user_id_95acebd6" ON "learning_payment_events" ("user_id");
CREATE INDEX "learning_subscriptions_plan_id_876197f6" ON "learning_subscriptions" ("plan_id");
CREATE INDEX "learning_subscriptions_student_class_id_6341b41b" ON "learning_subscriptions" ("student_class_id");
CREATE INDEX "learning_subscriptions_user_id_1337fee9" ON "learning_subscriptions" ("user_id");
COMMIT;



-- Migration: learning.0016_remove_legacy_teacher_and_billing_models

BEGIN;
--
-- Delete model LearningSubscription
--
DROP TABLE "learning_subscriptions";
--
-- Delete model LearningPlan
--
DROP TABLE "learning_plans";
--
-- Delete model PaymentEvent
--
DROP TABLE "learning_payment_events";
--
-- Delete model StudentClass
--
DROP TABLE "student_classes_students";
DROP TABLE "student_classes";
--
-- Delete model Assignment
--
DROP TABLE "assignments";
COMMIT;



-- Migration: learning.0017_alter_userhearts_current_hearts_and_more

BEGIN;
--
-- Alter field current_hearts on userhearts
--
CREATE TABLE "new__user_hearts" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "current_hearts" integer unsigned NOT NULL CHECK ("current_hearts" >= 0), "max_hearts" integer unsigned NOT NULL CHECK ("max_hearts" >= 0), "refill_interval_minutes" integer unsigned NOT NULL CHECK ("refill_interval_minutes" >= 0), "last_refill_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
INSERT INTO "new__user_hearts" ("id", "max_hearts", "refill_interval_minutes", "last_refill_at", "updated_at", "user_id", "current_hearts") SELECT "id", "max_hearts", "refill_interval_minutes", "last_refill_at", "updated_at", "user_id", "current_hearts" FROM "user_hearts";
DROP TABLE "user_hearts";
ALTER TABLE "new__user_hearts" RENAME TO "user_hearts";
--
-- Alter field max_hearts on userhearts
--
CREATE TABLE "new__user_hearts" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "current_hearts" integer unsigned NOT NULL CHECK ("current_hearts" >= 0), "refill_interval_minutes" integer unsigned NOT NULL CHECK ("refill_interval_minutes" >= 0), "last_refill_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "max_hearts" integer unsigned NOT NULL CHECK ("max_hearts" >= 0));
INSERT INTO "new__user_hearts" ("id", "current_hearts", "refill_interval_minutes", "last_refill_at", "updated_at", "user_id", "max_hearts") SELECT "id", "current_hearts", "refill_interval_minutes", "last_refill_at", "updated_at", "user_id", "max_hearts" FROM "user_hearts";
DROP TABLE "user_hearts";
ALTER TABLE "new__user_hearts" RENAME TO "user_hearts";
--
-- Alter field refill_interval_minutes on userhearts
--
CREATE TABLE "new__user_hearts" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "current_hearts" integer unsigned NOT NULL CHECK ("current_hearts" >= 0), "max_hearts" integer unsigned NOT NULL CHECK ("max_hearts" >= 0), "last_refill_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "user_id" bigint NOT NULL UNIQUE REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "refill_interval_minutes" integer unsigned NOT NULL CHECK ("refill_interval_minutes" >= 0));
INSERT INTO "new__user_hearts" ("id", "current_hearts", "max_hearts", "last_refill_at", "updated_at", "user_id", "refill_interval_minutes") SELECT "id", "current_hearts", "max_hearts", "last_refill_at", "updated_at", "user_id", "refill_interval_minutes" FROM "user_hearts";
DROP TABLE "user_hearts";
ALTER TABLE "new__user_hearts" RENAME TO "user_hearts";
--
-- Raw Python operation
--
-- THIS OPERATION CANNOT BE WRITTEN AS SQL
COMMIT;



-- ==========================================
-- APP: quiz
-- ==========================================


-- Migration: quiz.0001_initial

BEGIN;
--
-- Create model Quiz
--
CREATE TABLE "quizzes" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "title" varchar(200) NOT NULL, "quiz_type" varchar(10) NOT NULL, "created_at" datetime NOT NULL, "created_by_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED, "lesson_id" bigint NULL REFERENCES "lessons" ("id") DEFERRABLE INITIALLY DEFERRED, "wordset_id" bigint NULL REFERENCES "wordsets" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model QuizResult
--
CREATE TABLE "quiz_results" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "score" real NOT NULL, "total_questions" integer NOT NULL, "correct_answers" integer NOT NULL, "completed_at" datetime NOT NULL, "quiz_id" bigint NOT NULL REFERENCES "quizzes" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX "quizzes_created_by_id_2aed222e" ON "quizzes" ("created_by_id");
CREATE INDEX "quizzes_lesson_id_fece432b" ON "quizzes" ("lesson_id");
CREATE INDEX "quizzes_wordset_id_cfdaa568" ON "quizzes" ("wordset_id");
CREATE INDEX "quiz_results_quiz_id_cbff8230" ON "quiz_results" ("quiz_id");
CREATE INDEX "quiz_results_user_id_48dbc3ae" ON "quiz_results" ("user_id");
COMMIT;



-- Migration: quiz.0002_alter_quiz_id_alter_quizresult_id

BEGIN;
--
-- Alter field id on quiz
--
-- (no-op)
--
-- Alter field id on quizresult
--
-- (no-op)
COMMIT;


