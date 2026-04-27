"""Management command: import từ vựng từ file CSV."""
import csv
import os
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


REQUIRED_COLUMNS = {
    "text", "phonetic", "part_of_speech",
    "definition_en", "definition_vi",
    "example_en", "example_vi", "level",
}


class Command(BaseCommand):
    help = "Import từ vựng từ file CSV vào database."

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="Đường dẫn đến file CSV")
        parser.add_argument(
            "--update",
            action="store_true",
            default=False,
            help="Cập nhật từ đã tồn tại thay vì bỏ qua",
        )

    def handle(self, *args, **options):
        from apps.vocabulary.models import Word

        VALID_LEVELS = {value for value, _ in Word.Level.choices}

        csv_path = options["csv_file"]
        if not os.path.isfile(csv_path):
            raise CommandError(f"File không tồn tại: {csv_path}")

        imported = skipped = updated = errors = 0

        try:
            with open(csv_path, encoding="utf-8") as f:
                reader = csv.DictReader(f)

                missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
                if missing:
                    raise CommandError(f"CSV thiếu các cột: {', '.join(sorted(missing))}")

                with transaction.atomic():
                    for lineno, row in enumerate(reader, start=2):
                        text = row.get("text", "").strip()
                        level = row.get("level", "").strip()

                        if not text:
                            self.stderr.write(f"  Dòng {lineno}: bỏ qua — text trống")
                            errors += 1
                            continue

                        if level not in VALID_LEVELS:
                            self.stderr.write(
                                f"  Dòng {lineno} '{text}': level '{level}' không hợp lệ, bỏ qua"
                            )
                            errors += 1
                            continue

                        defaults = {
                            "phonetic": row.get("phonetic", "").strip(),
                            "part_of_speech": row.get("part_of_speech", "").strip(),
                            "definition_en": row.get("definition_en", "").strip(),
                            "definition_vi": row.get("definition_vi", "").strip(),
                            "example_en": row.get("example_en", "").strip(),
                            "example_vi": row.get("example_vi", "").strip(),
                            "level": level,
                        }

                        existing = Word.objects.filter(text__iexact=text).first()
                        if existing is None:
                            Word.objects.create(text=text, **defaults)
                            imported += 1
                        elif options["update"]:
                            for field, value in defaults.items():
                                setattr(existing, field, value)
                            existing.save()
                            updated += 1
                        else:
                            skipped += 1

        except UnicodeDecodeError:
            raise CommandError("Lỗi encoding. Hãy đảm bảo file CSV được lưu dạng UTF-8.")

        self.stdout.write(self.style.SUCCESS(
            f"Hoàn thành: {imported} nhập mới, {updated} cập nhật, "
            f"{skipped} bỏ qua (đã tồn tại), {errors} lỗi."
        ))
