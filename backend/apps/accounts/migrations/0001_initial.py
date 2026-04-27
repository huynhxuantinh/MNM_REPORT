"""Migration khởi tạo bảng accounts: User, EmailVerificationToken, PasswordResetToken."""
import django.contrib.auth.models
import django.contrib.auth.validators
import django.utils.timezone
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False)),
                (
                    "username",
                    models.CharField(
                        max_length=150,
                        unique=True,
                        validators=[django.contrib.auth.validators.UnicodeUsernameValidator()],
                        verbose_name="username",
                    ),
                ),
                ("first_name", models.CharField(blank=True, max_length=150)),
                ("last_name", models.CharField(blank=True, max_length=150)),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now)),
                ("is_staff", models.BooleanField(default=False)),
                ("email", models.EmailField(max_length=254, unique=True, verbose_name="email address")),
                ("full_name", models.CharField(blank=True, max_length=200, verbose_name="Họ và tên")),
                (
                    "role",
                    models.CharField(
                        choices=[("user", "Học sinh"), ("teacher", "Giáo viên"), ("admin", "Quản trị viên")],
                        default="user",
                        max_length=10,
                        verbose_name="Vai trò",
                    ),
                ),
                ("xp", models.IntegerField(default=0, verbose_name="Điểm kinh nghiệm")),
                ("level", models.IntegerField(default=1, verbose_name="Cấp độ")),
                ("avatar_url", models.CharField(blank=True, max_length=500, verbose_name="Ảnh đại diện")),
                ("is_active", models.BooleanField(default=False, verbose_name="Hoạt động")),
                ("email_verified", models.BooleanField(default=False, verbose_name="Email đã xác thực")),
                ("notification_enabled", models.BooleanField(default=True, verbose_name="Bật thông báo")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "verbose_name": "Người dùng",
                "verbose_name_plural": "Người dùng",
                "db_table": "users",
            },
            managers=[("objects", django.contrib.auth.models.UserManager())],
        ),
        migrations.CreateModel(
            name="EmailVerificationToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("token", models.CharField(max_length=64, unique=True)),
                ("expires_at", models.DateTimeField(verbose_name="Hết hạn lúc")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="email_verification",
                        to="accounts.user",
                    ),
                ),
            ],
            options={
                "verbose_name": "Token xác thực email",
                "verbose_name_plural": "Token xác thực email",
                "db_table": "email_verification_tokens",
            },
        ),
        migrations.CreateModel(
            name="PasswordResetToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("token", models.CharField(max_length=64, unique=True)),
                ("expires_at", models.DateTimeField(verbose_name="Hết hạn lúc")),
                ("is_used", models.BooleanField(default=False, verbose_name="Đã dùng")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="password_resets",
                        to="accounts.user",
                    ),
                ),
            ],
            options={
                "verbose_name": "Token reset mật khẩu",
                "verbose_name_plural": "Token reset mật khẩu",
                "db_table": "password_reset_tokens",
            },
        ),
    ]
