"""Seed the V2 level -> unit -> activity learning path."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.learning.models import (
    Course,
    Lesson,
    LessonWord,
    ListeningPassage,
    ListeningQuestion,
    Unit,
    UnitActivity,
    UnitLesson,
)
from apps.quiz.models import Quiz
from apps.vocabulary.models import Word


User = get_user_model()


COURSE_SPECS = [
    {
        "slug": "a1-english-foundation",
        "name": "A1 English Foundation",
        "description": "Start from everyday words, short listening, simple sentences, and basic writing.",
        "level": "A1",
        "units": [
            ("Greetings & Introductions", "Say hello, introduce yourself, and ask simple personal questions.", ["hello", "name", "friend", "family", "good", "happy"]),
            ("Family & Friends", "Talk about family members, friends, and people around you.", ["mother", "father", "brother", "sister", "friend", "family"]),
            ("Daily Routine", "Describe morning and evening habits with common action words.", ["wake", "eat", "drink", "sleep", "work", "study"]),
            ("Food & Drinks", "Order basic food and talk about meals.", ["water", "milk", "bread", "rice", "apple", "coffee"]),
            ("School & Classroom", "Use classroom language and talk about study items.", ["school", "teacher", "student", "book", "pen", "lesson"]),
            ("Places in Town", "Ask and answer about common places in a town.", ["city", "park", "shop", "market", "street", "house"]),
        ],
    },
    {
        "slug": "a2-everyday-english",
        "name": "A2 Everyday English",
        "description": "Build practical English for travel, shopping, health, work, and plans.",
        "level": "A2",
        "units": [
            ("Travel Plans", "Plan a short trip, buy tickets, and describe transport.", ["travel", "bus", "car", "ticket", "airport", "hotel"]),
            ("Shopping & Prices", "Ask about prices, compare items, and buy things politely.", ["price", "cheap", "expensive", "buy", "sell", "money"]),
            ("Health & Appointments", "Describe simple health problems and make appointments.", ["doctor", "hospital", "medicine", "healthy", "pain", "appointment"]),
            ("Work & Schedule", "Talk about jobs, meetings, deadlines, and daily work.", ["office", "project", "meeting", "deadline", "work", "schedule"]),
            ("Past Experiences", "Talk about simple past events and short experiences.", ["visited", "watched", "played", "learned", "yesterday", "experience"]),
            ("Future Plans", "Describe intentions, plans, and next steps.", ["future", "plan", "tomorrow", "weekend", "goal", "improve"]),
        ],
    },
]


WORD_FALLBACKS = {
    "hello": ("interjection", "a greeting", "xin chao", "Hello, my name is Anna.", "Xin chao, ten toi la Anna."),
    "mother": ("noun", "a female parent", "me", "My mother is kind.", "Me toi rat tot bung."),
    "father": ("noun", "a male parent", "bo", "My father works in an office.", "Bo toi lam viec o van phong."),
    "brother": ("noun", "a male sibling", "anh/em trai", "My brother is ten years old.", "Em trai toi muoi tuoi."),
    "sister": ("noun", "a female sibling", "chi/em gai", "My sister likes music.", "Chi gai toi thich am nhac."),
    "wake": ("verb", "to stop sleeping", "thuc day", "I wake up at six.", "Toi thuc day luc sau gio."),
    "drink": ("verb", "to take liquid into the mouth", "uong", "I drink water every day.", "Toi uong nuoc moi ngay."),
    "milk": ("noun", "a white drink from cows", "sua", "She drinks milk in the morning.", "Co ay uong sua vao buoi sang."),
    "rice": ("noun", "a common food grain", "com/gao", "We eat rice for dinner.", "Chung toi an com vao bua toi."),
    "coffee": ("noun", "a hot dark drink", "ca phe", "He drinks coffee at work.", "Anh ay uong ca phe o noi lam viec."),
    "teacher": ("noun", "a person who teaches", "giao vien", "The teacher writes on the board.", "Giao vien viet len bang."),
    "student": ("noun", "a person who studies", "hoc sinh", "The student reads a book.", "Hoc sinh doc sach."),
    "pen": ("noun", "a tool for writing", "but", "I write with a pen.", "Toi viet bang but."),
    "lesson": ("noun", "a period of learning", "bai hoc", "This lesson is easy.", "Bai hoc nay de."),
    "park": ("noun", "a public green place", "cong vien", "We walk in the park.", "Chung toi di bo trong cong vien."),
    "shop": ("noun", "a place to buy things", "cua hang", "The shop opens at nine.", "Cua hang mo cua luc chin gio."),
    "market": ("noun", "a place where people buy food", "cho", "My aunt goes to the market.", "Co toi di cho."),
    "street": ("noun", "a road in a town", "duong pho", "The street is busy.", "Duong pho dong duc."),
    "hotel": ("noun", "a place to stay when traveling", "khach san", "The hotel is near the station.", "Khach san gan nha ga."),
    "price": ("noun", "the money needed to buy something", "gia", "What is the price?", "Gia la bao nhieu?"),
    "cheap": ("adjective", "not expensive", "re", "This bag is cheap.", "Cai tui nay re."),
    "expensive": ("adjective", "costing a lot of money", "dat", "That watch is expensive.", "Cai dong ho do dat."),
    "sell": ("verb", "to give something for money", "ban", "They sell fruit here.", "Ho ban trai cay o day."),
    "doctor": ("noun", "a person who treats sick people", "bac si", "The doctor checks my arm.", "Bac si kiem tra canh tay toi."),
    "hospital": ("noun", "a place for sick people", "benh vien", "The hospital is large.", "Benh vien rat lon."),
    "medicine": ("noun", "something used to treat illness", "thuoc", "Take this medicine after lunch.", "Hay uong thuoc nay sau bua trua."),
    "healthy": ("adjective", "well and not sick", "khoe manh", "Fruit is healthy.", "Trai cay tot cho suc khoe."),
    "pain": ("noun", "a bad feeling in the body", "dau", "I have pain in my leg.", "Toi bi dau chan."),
    "appointment": ("noun", "a planned meeting", "cuoc hen", "I have a doctor's appointment.", "Toi co lich hen voi bac si."),
    "meeting": ("noun", "a planned discussion", "cuoc hop", "The meeting starts at ten.", "Cuoc hop bat dau luc muoi gio."),
    "schedule": ("noun", "a plan of times", "lich trinh", "My schedule is full today.", "Lich cua toi kin hom nay."),
    "visited": ("verb", "went to see a place or person", "da tham", "We visited Da Nang last year.", "Chung toi da tham Da Nang nam ngoai."),
    "watched": ("verb", "looked at something for a time", "da xem", "She watched a film yesterday.", "Co ay da xem mot bo phim hom qua."),
    "played": ("verb", "took part in a game", "da choi", "They played football after school.", "Ho da choi bong da sau gio hoc."),
    "learned": ("verb", "got new knowledge", "da hoc", "I learned five new words.", "Toi da hoc nam tu moi."),
    "yesterday": ("noun", "the day before today", "hom qua", "I was busy yesterday.", "Hom qua toi ban."),
    "future": ("noun", "the time after now", "tuong lai", "I think about my future.", "Toi nghi ve tuong lai."),
    "tomorrow": ("noun", "the day after today", "ngay mai", "We will meet tomorrow.", "Ngay mai chung ta se gap nhau."),
    "weekend": ("noun", "Saturday and Sunday", "cuoi tuan", "I visit my family on the weekend.", "Toi tham gia dinh vao cuoi tuan."),
    "goal": ("noun", "something you want to achieve", "muc tieu", "My goal is to speak English.", "Muc tieu cua toi la noi tieng Anh."),
}


class Command(BaseCommand):
    help = "Seed the V2 A1/A2 learning path with unit activities."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Delete existing V2 demo path before seeding.")

    def handle(self, *args, **options):
        admin = self._resolve_admin()
        with transaction.atomic():
            if options["clear"]:
                self._clear_existing()

            total_units = 0
            total_activities = 0
            for course_spec in COURSE_SPECS:
                course, _ = Course.objects.update_or_create(
                    slug=course_spec["slug"],
                    defaults={
                        "name": course_spec["name"],
                        "description": course_spec["description"],
                        "is_active": True,
                    },
                )
                for unit_index, unit_spec in enumerate(course_spec["units"], start=1):
                    unit, _ = Unit.objects.update_or_create(
                        course=course,
                        order_index=unit_index,
                        defaults={
                            "title": f"Unit {unit_index} - {unit_spec[0]}",
                            "description": unit_spec[1],
                            "required_lessons_to_unlock": 2,
                            "is_published": True,
                        },
                    )
                    total_units += 1
                    total_activities += self._seed_unit_activities(
                        admin=admin,
                        course_level=course_spec["level"],
                        unit=unit,
                        unit_title=unit_spec[0],
                        unit_description=unit_spec[1],
                        words=unit_spec[2],
                        checkpoint=unit_index % 2 == 0,
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded learning v2. courses={len(COURSE_SPECS)}, units={total_units}, activities={total_activities}"
            )
        )

    def _resolve_admin(self):
        admin = User.objects.filter(role=User.Role.ADMIN, is_active=True).order_by("id").first()
        if admin:
            return admin
        return User.objects.create_user(
            username="seed_admin_v2",
            email="seed.admin.v2@norostu.local",
            password="Admin@2024!",
            full_name="Seed Admin V2",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
            is_active=True,
            email_verified=True,
        )

    def _clear_existing(self):
        slugs = [item["slug"] for item in COURSE_SPECS]
        titles = self._all_seeded_titles()
        Course.objects.filter(slug__in=slugs).delete()
        Lesson.objects.filter(title__in=titles["lessons"]).delete()
        ListeningPassage.objects.filter(title__in=titles["passages"]).delete()
        Quiz.objects.filter(title__in=titles["quizzes"]).delete()

    def _all_seeded_titles(self):
        lesson_titles = []
        passage_titles = []
        quiz_titles = []
        for course in COURSE_SPECS:
            for unit_index, unit_spec in enumerate(course["units"], start=1):
                prefix = f"{course['level']} Unit {unit_index} - {unit_spec[0]}"
                lesson_titles.extend([f"{prefix} Vocabulary", f"{prefix} Grammar"])
                passage_titles.append(f"{prefix} Listening")
                quiz_titles.append(f"{prefix} Quiz")
                if unit_index % 2 == 0:
                    quiz_titles.append(f"{prefix} Checkpoint")
        return {"lessons": lesson_titles, "passages": passage_titles, "quizzes": quiz_titles}

    def _seed_unit_activities(self, admin, course_level, unit, unit_title, unit_description, words, checkpoint):
        word_objs = [self._get_or_create_word(text, course_level, admin) for text in words]
        prefix = f"{course_level} Unit {unit.order_index} - {unit_title}"
        vocab_lesson = self._upsert_lesson(
            admin=admin,
            title=f"{prefix} Vocabulary",
            description=f"Core words for {unit_title.lower()}.",
            level=course_level,
            skill_tag=Lesson.SkillTag.VOCAB,
            order_index=unit.order_index * 10 + 1,
            words=word_objs,
        )
        grammar_lesson = self._upsert_lesson(
            admin=admin,
            title=f"{prefix} Grammar",
            description=f"Short pattern practice for {unit_title.lower()}.",
            level=course_level,
            skill_tag=Lesson.SkillTag.GRAMMAR,
            order_index=unit.order_index * 10 + 2,
            words=word_objs[:4],
        )
        passage = self._upsert_passage(
            admin=admin,
            title=f"{prefix} Listening",
            topic=unit_title.lower().replace(" ", "_"),
            level=course_level,
            words=words,
        )
        quiz = self._upsert_quiz(admin, f"{prefix} Quiz", vocab_lesson)
        checkpoint_quiz = self._upsert_quiz(admin, f"{prefix} Checkpoint", grammar_lesson) if checkpoint else None

        UnitLesson.objects.filter(unit=unit).delete()
        UnitLesson.objects.create(unit=unit, lesson=vocab_lesson, order_index=1)
        UnitLesson.objects.create(unit=unit, lesson=grammar_lesson, order_index=2)

        UnitActivity.objects.filter(unit=unit).delete()
        activity_specs = [
            {
                "activity_type": UnitActivity.ActivityType.VOCAB,
                "title": "Vocabulary",
                "description": f"Learn key words for {unit_title}.",
                "lesson": vocab_lesson,
                "estimated_minutes": 8,
            },
            {
                "activity_type": UnitActivity.ActivityType.LISTENING,
                "title": "Listening",
                "description": f"Listen to a short passage about {unit_title}.",
                "listening_passage": passage,
                "estimated_minutes": 6,
            },
            {
                "activity_type": UnitActivity.ActivityType.GRAMMAR,
                "title": "Grammar Pattern",
                "description": f"Practice a useful sentence pattern for {unit_title}.",
                "lesson": grammar_lesson,
                "estimated_minutes": 7,
            },
            {
                "activity_type": UnitActivity.ActivityType.WRITING,
                "title": "Writing",
                "description": f"Write short sentences about {unit_title}.",
                "estimated_minutes": 8,
                "metadata": {
                    "prompt": f"Write 3 short sentences about {unit_title.lower()}.",
                    "min_words": 8 if course_level == "A1" else 12,
                    "xp": 12 if course_level == "A1" else 15,
                },
            },
            {
                "activity_type": UnitActivity.ActivityType.QUIZ,
                "title": "Unit Quiz",
                "description": f"Check your understanding of {unit_title}.",
                "quiz": quiz,
                "estimated_minutes": 5,
                "min_score_to_pass": 70,
            },
        ]
        if checkpoint_quiz:
            activity_specs.append(
                {
                    "activity_type": UnitActivity.ActivityType.CHECKPOINT,
                    "title": "Checkpoint",
                    "description": f"Unlock check for the next block after {unit_title}.",
                    "quiz": checkpoint_quiz,
                    "estimated_minutes": 6,
                    "min_score_to_pass": 70,
                }
            )

        for order, spec in enumerate(activity_specs, start=1):
            UnitActivity.objects.create(
                unit=unit,
                order_index=order,
                is_required=True,
                is_published=True,
                metadata=spec.pop("metadata", {}),
                **spec,
            )
        return len(activity_specs)

    def _get_or_create_word(self, text, level, admin):
        defaults = WORD_FALLBACKS.get(
            text,
            ("noun", f"a common {level} word", text, f"I use the word {text}.", f"Toi dung tu {text}."),
        )
        word, _ = Word.objects.update_or_create(
            text=text.lower(),
            defaults={
                "phonetic": "",
                "part_of_speech": defaults[0],
                "definition_en": defaults[1],
                "definition_vi": defaults[2],
                "example_en": defaults[3],
                "example_vi": defaults[4],
                "level": level,
                "created_by": admin,
            },
        )
        return word

    def _upsert_lesson(self, admin, title, description, level, skill_tag, order_index, words):
        lesson, _ = Lesson.objects.update_or_create(
            title=title,
            defaults={
                "description": description,
                "topic": title,
                "skill_tag": skill_tag,
                "content_difficulty": Lesson.ContentDifficulty.NORMAL,
                "level": level,
                "order_index": order_index,
                "is_published": True,
                "created_by": admin,
            },
        )
        LessonWord.objects.filter(lesson=lesson).delete()
        for index, word in enumerate(words, start=1):
            LessonWord.objects.create(lesson=lesson, word=word, order_index=index)
        return lesson

    def _upsert_passage(self, admin, title, topic, level, words):
        transcript = self._build_transcript(level, words)
        passage, _ = ListeningPassage.objects.update_or_create(
            title=title,
            defaults={
                "topic": topic,
                "level": level,
                "transcript": transcript,
                "translation_vi": "Bai nghe demo ngan de luyen nghe va tra loi cau hoi.",
                "estimated_seconds": 35 if level == "A1" else 48,
                "tts_lang": "en-US",
                "tts_rate": 0.9,
                "is_published": True,
                "created_by": admin,
            },
        )
        ListeningQuestion.objects.filter(passage=passage).delete()
        first, second = words[0], words[1]
        ListeningQuestion.objects.create(
            passage=passage,
            question_type=ListeningQuestion.QuestionType.MULTIPLE_CHOICE,
            prompt=f"Which word is mentioned in the passage?",
            choices_json=[first, "mountain", "computer", "winter"],
            correct_answer={"option": first},
            explanation=f"The passage mentions {first}.",
            order_index=1,
        )
        ListeningQuestion.objects.create(
            passage=passage,
            question_type=ListeningQuestion.QuestionType.TRUE_FALSE,
            prompt=f"The passage is about {topic.replace('_', ' ')}.",
            choices_json=["True", "False"],
            correct_answer={"option": "True"},
            explanation="The topic matches the passage.",
            order_index=2,
        )
        ListeningQuestion.objects.create(
            passage=passage,
            question_type=ListeningQuestion.QuestionType.FILL_BLANK,
            prompt=f"Complete the key word: {second}",
            choices_json=[],
            correct_answer={"text": second},
            explanation=f"The answer is {second}.",
            order_index=3,
        )
        return passage

    def _build_transcript(self, level, words):
        if level == "A1":
            return (
                f"Listen to these words: {words[0]}, {words[1]}, and {words[2]}. "
                f"I can use {words[0]} in a simple sentence. "
                f"My teacher asks me to practice {words[1]} every day."
            )
        return (
            f"Today we talk about {words[0]} and {words[1]}. "
            f"The speaker gives an example with {words[2]} and explains why {words[3]} is useful. "
            f"Listen again and choose the correct answer."
        )

    def _upsert_quiz(self, admin, title, lesson):
        quiz, _ = Quiz.objects.update_or_create(
            title=title,
            defaults={
                "quiz_type": Quiz.QuizType.MULTIPLE_CHOICE,
                "lesson": lesson,
                "wordset": None,
                "created_by": admin,
            },
        )
        return quiz
