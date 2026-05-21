"""
Cài đặt Django cơ sở — dùng chung cho tất cả môi trường.
"""
from pathlib import Path
from decouple import config, Csv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("SECRET_KEY")
_DEBUG_RAW = str(config("DEBUG", default="False")).strip().lower()
DEBUG = _DEBUG_RAW in {"1", "true", "yes", "on", "debug"}
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost", cast=Csv())

# ── Ứng dụng ──────────────────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "django_celery_beat",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.vocabulary",
    "apps.learning",
    "apps.quiz",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ── Middleware ────────────────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ── Database ──────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME"),
        "USER": config("DB_USER"),
        "PASSWORD": config("DB_PASSWORD"),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        "CONN_MAX_AGE": 60,
    }
}

# ── Cache (Redis) ─────────────────────────────────────────────────
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": config("REDIS_URL", default="redis://redis:6379/0"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ── Auth ──────────────────────────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── DRF ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "config.pagination.StandardPageNumberPagination",
    "PAGE_SIZE": config("DEFAULT_PAGE_SIZE", default=20, cast=int),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # ── Throttling ──────────────────────────────────────────────
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",           # Khách (không đăng nhập)
        "user": "300/minute",          # User đã xác thực
        # Auth endpoints - standard
        "login": "10/minute",          # Brute-force login (normal)
        "register": "5/minute",        # Ngăn tạo tài khoản hàng loạt
        "password_reset": "5/hour",   # Ngăn spam email reset
        # Auth endpoints - strict (after multiple failures)
        "login_strict": "3/minute",          # After 3 failed attempts
        "register_strict": "2/minute",       # After 3 failed attempts
        "password_reset_strict": "2/hour",   # After 2 failed attempts
        # Captcha endpoint
        "captcha": "5/minute",         # Captcha verification limit
        # Burst/Sustained for authenticated users
        "burst": "100/minute",         # Burst traffic
        "sustained": "1000/day",       # Daily sustained traffic
        # Learning flow
        "learning_session_start": "30/minute",
        "learning_session_answer_burst": "180/minute",
        "learning_session_answer_sustained": "3000/day",
        "learning_session_finish": "60/minute",
        "learning_session_quit": "60/minute",
        "learning_checkpoint_start": "20/minute",
        "learning_checkpoint_submit": "20/minute",
        "learning_analytics_read": "120/minute",
    },
}

# ── JWT ───────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=config("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", default=60, cast=int)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ── CORS ──────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="http://localhost:5173", cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# ── Internationalisation ─────────────────────────────────────────
LANGUAGE_CODE = "vi"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True

# ── Static & Media ────────────────────────────────────────────────
STATIC_URL = config("STATIC_URL", default="/static/")
STATIC_ROOT = BASE_DIR / "static"
MEDIA_URL = config("MEDIA_URL", default="/media/")
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Email ─────────────────────────────────────────────────────────
EMAIL_BACKEND      = config("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST         = config("EMAIL_HOST",     default="sandbox.smtp.mailtrap.io")
EMAIL_PORT         = config("EMAIL_PORT",     default=2525, cast=int)
EMAIL_USE_TLS      = config("EMAIL_USE_TLS",  default=True, cast=bool)
EMAIL_HOST_USER    = config("EMAIL_HOST_USER",     default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="NoroStu <noreply@norostu.com>")

# ── Frontend ──────────────────────────────────────────────────────
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")

# ── Celery ────────────────────────────────────────────────────────
CELERY_BROKER_URL        = config("REDIS_URL", default="redis://redis:6379/0")
CELERY_RESULT_BACKEND    = config("REDIS_URL", default="redis://redis:6379/0")
CELERY_TASK_SERIALIZER   = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT    = ["json"]
CELERY_TIMEZONE          = TIME_ZONE
CELERY_ENABLE_UTC        = True

# Lịch chạy task tự động.
# LUᷔU Ý: Không import crontab tại đây để tránh circular import với celery.py.
# Cấu hình cụ thể theo giờ (crontab) được đặt trong config/celery.py.
CELERY_BEAT_SCHEDULE = {
    # 20:00 ICT mỗi ngày — nhắc ôn từ đến hạn (override bằng crontab trong config/celery.py)
    "review-reminders-daily": {
        "task": "learning.send_review_reminders",
        "schedule": timedelta(hours=24),  # Fallback; crontab được set trong celery.py
    },
    "daily-goal-reminders-hourly": {
        "task": "learning.send_daily_goal_reminders",
        "schedule": timedelta(hours=1),
    },
    "onboarding-first-lesson-reminders-hourly": {
        "task": "learning.send_onboarding_first_lesson_reminders",
        "schedule": timedelta(hours=1),
    },
    "refill-hearts-hourly": {
        "task": "learning.refill_hearts",
        "schedule": timedelta(hours=1),
    },
    "rebuild-weekly-league-daily": {
        "task": "learning.rebuild_weekly_league",
        "schedule": timedelta(hours=24),
    },

}

# ── API Docs (drf-spectacular) ────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "NoroStu API",
    "DESCRIPTION": "API cho ứng dụng học từ vựng tiếng Anh NoroStu",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "ENUM_NAME_OVERRIDES": {
        "LessonLevelEnum": "apps.learning.models.Lesson.Level",
        "WordLevelEnum": "apps.vocabulary.models.Word.Level",
    },
}
