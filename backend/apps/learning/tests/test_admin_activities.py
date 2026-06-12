import pytest

from apps.learning.models import Course, Unit, UnitActivity

pytestmark = pytest.mark.django_db

URL = "/api/v1/learning/admin/activities/"


@pytest.fixture
def course(db):
    return Course.objects.create(name="A1 Demo", slug="a1-demo", is_active=True)


@pytest.fixture
def unit(db, course):
    return Unit.objects.create(course=course, title="Unit 1", order_index=1, is_published=True)


def test_admin_can_crud_unit_activity(ac, unit, lesson):
    payload = {
        "unit": unit.id,
        "activity_type": UnitActivity.ActivityType.VOCAB,
        "title": "Learn words",
        "description": "Practice core words.",
        "order_index": 1,
        "lesson": lesson.id,
        "is_required": True,
        "is_published": True,
        "estimated_minutes": 5,
    }

    created = ac.post(URL, payload, format="json")
    assert created.status_code == 201
    activity_id = created.data["id"]
    assert created.data["lesson_title"] == lesson.title

    listed = ac.get(URL, {"unit_id": unit.id})
    assert listed.status_code == 200
    assert len(listed.data) == 1
    assert listed.data[0]["id"] == activity_id

    updated = ac.patch(f"{URL}{activity_id}/", {"title": "Core words"}, format="json")
    assert updated.status_code == 200
    assert updated.data["title"] == "Core words"

    deleted = ac.delete(f"{URL}{activity_id}/")
    assert deleted.status_code == 204
    assert not UnitActivity.objects.filter(id=activity_id).exists()


def test_regular_user_cannot_access_admin_activities(sc, unit):
    response = sc.get(URL, {"unit_id": unit.id})
    assert response.status_code == 403


def test_vocab_activity_requires_lesson(ac, unit):
    payload = {
        "unit": unit.id,
        "activity_type": UnitActivity.ActivityType.VOCAB,
        "title": "Broken vocab",
        "order_index": 2,
        "is_published": True,
    }
    response = ac.post(URL, payload, format="json")
    assert response.status_code == 400
    assert "lesson" in str(response.data).lower()