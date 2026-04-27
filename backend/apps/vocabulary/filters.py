"""Django-filter FilterSets cho vocabulary."""
import django_filters
from .models import Word, WordSet


class WordFilter(django_filters.FilterSet):
    """Filter cho Word – hỗ trợ ?level=B1&part_of_speech=noun&set_id=5"""

    level = django_filters.ChoiceFilter(
        choices=Word.Level.choices, label="Cấp độ"
    )
    # iexact để filter 'noun' khớp 'Noun'
    part_of_speech = django_filters.CharFilter(
        lookup_expr="iexact", label="Loại từ"
    )
    set_id = django_filters.NumberFilter(
        field_name="wordsets__id", label="ID bộ từ"
    )
    created_by = django_filters.NumberFilter(
        field_name="created_by__id", label="ID người tạo"
    )

    class Meta:
        model = Word
        fields = ["level", "part_of_speech", "set_id", "created_by"]


class WordSetFilter(django_filters.FilterSet):
    level = django_filters.CharFilter(lookup_expr="iexact", label="Cấp độ")
    is_public = django_filters.BooleanFilter(label="Công khai")

    class Meta:
        model = WordSet
        fields = ["level", "is_public"]
