"""Django-filter FilterSets cho learning."""
import django_filters
from .models import Lesson


class LessonFilter(django_filters.FilterSet):
    """Filter cho Lesson – hỗ trợ ?level=B1&is_published=true"""

    level = django_filters.ChoiceFilter(
        choices=Lesson.Level.choices, label="Cấp độ"
    )
    skill_tag = django_filters.ChoiceFilter(
        choices=Lesson.SkillTag.choices, label="Skill"
    )
    is_published = django_filters.BooleanFilter(label="Đã public")

    class Meta:
        model = Lesson
        fields = ["level", "skill_tag", "is_published"]

