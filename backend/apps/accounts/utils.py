"""
Hàm tiện ích cho module accounts: tạo token, gửi email.
"""
import secrets

from django.conf import settings
from django.core.mail import EmailMultiAlternatives


BRAND_NAME = "NoroStu"


def generate_token(nbytes: int = 48) -> str:
    """Tạo chuỗi token URL-safe ngẫu nhiên."""
    return secrets.token_urlsafe(nbytes)


def _build_email_html(title: str, greeting: str, body_lines: list, cta_url: str, cta_label: str, footer: str) -> str:
    body_html = "".join(
        f"<p style='margin:0 0 12px 0;color:#444;font-size:15px;line-height:1.6'>{line}</p>"
        for line in body_lines
    )
    return f"""<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
        <tr><td style="background:#00754a;padding:28px 40px;text-align:center">
          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:.5px">🌿 {BRAND_NAME}</span>
        </td></tr>
        <tr><td style="padding:36px 40px 28px">
          <h2 style="margin:0 0 20px 0;color:#1a1a1a;font-size:20px">{title}</h2>
          <p style="margin:0 0 12px 0;color:#444;font-size:15px">Xin chào <strong>{greeting}</strong>,</p>
          {body_html}
          <table cellpadding="0" cellspacing="0" style="margin:28px 0">
            <tr><td style="border-radius:8px;background:#00754a">
              <a href="{cta_url}" target="_blank"
                 style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:.3px">
                {cta_label}
              </a>
            </td></tr>
          </table>
          <p style="margin:0;color:#888;font-size:13px;line-height:1.6">
            Hoặc copy link này vào trình duyệt:<br>
            <a href="{cta_url}" style="color:#00754a;word-break:break-all">{cta_url}</a>
          </p>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee">
          <p style="margin:0;color:#aaa;font-size:12px;text-align:center">{footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_verification_email(user, token: str) -> None:
    """Gửi email kích hoạt tài khoản (link hết hạn sau 24h)."""
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    verify_url = f"{frontend_url}/verify-email?token={token}"
    name = user.full_name or user.email

    subject = f"[{BRAND_NAME}] Xác thực tài khoản của bạn"
    text_body = (
        f"Xin chào {name},\n\n"
        "Nhấn vào link bên dưới để kích hoạt tài khoản (hết hạn sau 24h):\n"
        f"{verify_url}\n\n"
        "Nếu bạn không đăng ký, hãy bỏ qua email này."
    )
    html_body = _build_email_html(
        title="Xác thực tài khoản của bạn",
        greeting=name,
        body_lines=[
            f"Cảm ơn bạn đã đăng ký tài khoản tại <strong>{BRAND_NAME}</strong>!",
            "Nhấn nút bên dưới để kích hoạt tài khoản. Link sẽ hết hạn sau <strong>24 giờ</strong>.",
        ],
        cta_url=verify_url,
        cta_label="✅ Kích hoạt tài khoản",
        footer=f"Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email. &nbsp;|&nbsp; © 2026 {BRAND_NAME}",
    )

    msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [user.email])
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)


def send_password_reset_email(user, token: str) -> None:
    """Gửi email đặt lại mật khẩu (link hết hạn sau 1h)."""
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    reset_url = f"{frontend_url}/reset-password?token={token}"
    name = user.full_name or user.email

    subject = f"[{BRAND_NAME}] Đặt lại mật khẩu"
    text_body = (
        f"Xin chào {name},\n\n"
        "Nhấn vào link bên dưới để đặt lại mật khẩu (hết hạn sau 1 giờ):\n"
        f"{reset_url}\n\n"
        "Nếu bạn không yêu cầu, hãy bỏ qua email này.\n"
        "Mật khẩu cũ của bạn vẫn còn hoạt động."
    )
    html_body = _build_email_html(
        title="Đặt lại mật khẩu",
        greeting=name,
        body_lines=[
            "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
            "Nhấn nút bên dưới để tạo mật khẩu mới. Link sẽ hết hạn sau <strong>1 giờ</strong>.",
            "<span style='color:#e53935;font-size:13px'>⚠️ Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu cũ vẫn còn hoạt động.</span>",
        ],
        cta_url=reset_url,
        cta_label="🔑 Đặt lại mật khẩu",
        footer=f"Vì lý do bảo mật, link chỉ có hiệu lực trong 1 giờ. &nbsp;|&nbsp; © 2026 {BRAND_NAME}",
    )

    msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [user.email])
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)
