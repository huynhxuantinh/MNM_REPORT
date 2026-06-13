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
    "hello": ("interjection", "a greeting", "xin chào", "Hello, my name is Anna.", "Xin chào, tên tôi là Anna."),
    "mother": ("noun", "a female parent", "mẹ", "My mother is kind.", "Mẹ tôi rất tốt bụng."),
    "father": ("noun", "a male parent", "bố", "My father works in an office.", "Bố tôi làm việc ở văn phòng."),
    "brother": ("noun", "a male sibling", "anh/em trai", "My brother is ten years old.", "Em trai tôi mười tuổi."),
    "sister": ("noun", "a female sibling", "chị/em gái", "My sister likes music.", "Chị gái tôi thích âm nhạc."),
    "wake": ("verb", "to stop sleeping", "thức dậy", "I wake up at six.", "Tôi thức dậy lúc sáu giờ."),
    "drink": ("verb", "to take liquid into the mouth", "uống", "I drink water every day.", "Tôi uống nước mỗi ngày."),
    "milk": ("noun", "a white drink from cows", "sữa", "She drinks milk in the morning.", "Cô ấy uống sữa vào buổi sáng."),
    "rice": ("noun", "a common food grain", "cơm/gạo", "We eat rice for dinner.", "Chúng tôi ăn cơm vào bữa tối."),
    "coffee": ("noun", "a hot dark drink", "cà phê", "He drinks coffee at work.", "Anh ấy uống cà phê ở nơi làm việc."),
    "teacher": ("noun", "a person who teaches", "giáo viên", "The teacher writes on the board.", "Giáo viên viết lên bảng."),
    "student": ("noun", "a person who studies", "học sinh", "The student reads a book.", "Học sinh đọc sách."),
    "pen": ("noun", "a tool for writing", "bút", "I write with a pen.", "Tôi viết bằng bút."),
    "lesson": ("noun", "a period of learning", "bài học", "This lesson is easy.", "Bài học này dễ."),
    "park": ("noun", "a public green place", "công viên", "We walk in the park.", "Chúng tôi đi bộ trong công viên."),
    "shop": ("noun", "a place to buy things", "cửa hàng", "The shop opens at nine.", "Cửa hàng mở cửa lúc chín giờ."),
    "market": ("noun", "a place where people buy food", "chợ", "My aunt goes to the market.", "Cô tôi đi chợ."),
    "street": ("noun", "a road in a town", "đường phố", "The street is busy.", "Đường phố đông đúc."),
    "hotel": ("noun", "a place to stay when traveling", "khách sạn", "The hotel is near the station.", "Khách sạn gần nhà ga."),
    "price": ("noun", "the money needed to buy something", "giá", "What is the price?", "Giá là bao nhiêu?"),
    "cheap": ("adjective", "not expensive", "rẻ", "This bag is cheap.", "Cái túi này rẻ."),
    "expensive": ("adjective", "costing a lot of money", "đắt", "That watch is expensive.", "Cái đồng hồ đó đắt."),
    "sell": ("verb", "to give something for money", "bán", "They sell fruit here.", "Họ bán trái cây ở đây."),
    "doctor": ("noun", "a person who treats sick people", "bác sĩ", "The doctor checks my arm.", "Bác sĩ kiểm tra cánh tay tôi."),
    "hospital": ("noun", "a place for sick people", "bệnh viện", "The hospital is large.", "Bệnh viện rất lớn."),
    "medicine": ("noun", "something used to treat illness", "thuốc", "Take this medicine after lunch.", "Hãy uống thuốc này sau bữa trưa."),
    "healthy": ("adjective", "well and not sick", "khỏe mạnh", "Fruit is healthy.", "Trái cây tốt cho sức khỏe."),
    "pain": ("noun", "a bad feeling in the body", "đau", "I have pain in my leg.", "Tôi bị đau chân."),
    "appointment": ("noun", "a planned meeting", "cuộc hẹn", "I have a doctor's appointment.", "Tôi có lịch hẹn với bác sĩ."),
    "meeting": ("noun", "a planned discussion", "cuộc họp", "The meeting starts at ten.", "Cuộc họp bắt đầu lúc mười giờ."),
    "schedule": ("noun", "a plan of times", "lịch trình", "My schedule is full today.", "Lịch của tôi kín hôm nay."),
    "visited": ("verb", "went to see a place or person", "đã thăm", "We visited Da Nang last year.", "Chúng tôi đã thăm Đà Nẵng năm ngoái."),
    "watched": ("verb", "looked at something for a time", "đã xem", "She watched a film yesterday.", "Cô ấy đã xem một bộ phim hôm qua."),
    "played": ("verb", "took part in a game", "đã chơi", "They played football after school.", "Họ đã chơi bóng đá sau giờ học."),
    "learned": ("verb", "got new knowledge", "đã học", "I learned five new words.", "Tôi đã học năm từ mới."),
    "yesterday": ("noun", "the day before today", "hôm qua", "I was busy yesterday.", "Hôm qua tôi bận."),
    "future": ("noun", "the time after now", "tương lai", "I think about my future.", "Tôi nghĩ về tương lai."),
    "tomorrow": ("noun", "the day after today", "ngày mai", "We will meet tomorrow.", "Ngày mai chúng ta sẽ gặp nhau."),
    "weekend": ("noun", "Saturday and Sunday", "cuối tuần", "I visit my family on the weekend.", "Tôi thăm gia đình vào cuối tuần."),
    "goal": ("noun", "something you want to achieve", "mục tiêu", "My goal is to speak English.", "Mục tiêu của tôi là nói tiếng Anh."),
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
                "metadata": {
                    "grammar_exercises": self._grammar_exercises_for_unit(course_level, unit_title),
                },
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

    def _grammar_exercises_for_unit(self, level, unit_title):
        topic = unit_title.lower()
        if level == "A1":
            return [
                {
                    "type": "fill_blank",
                    "prompt": "Choose the correct be verb: I ____ a student.",
                    "answer": "am",
                    "rule": "Use am with I.",
                },
                {
                    "type": "fill_blank",
                    "prompt": "Choose the correct be verb: She ____ my friend.",
                    "answer": "is",
                    "rule": "Use is with he, she, it, or one person.",
                },
                {
                    "type": "sentence_order",
                    "sentence": f"I like {topic}.",
                    "rule": "Use subject + verb + object for simple present sentences.",
                },
                {
                    "type": "sentence_order",
                    "sentence": "They are good friends.",
                    "rule": "Use are with you, we, they, or plural subjects.",
                },
            ]
        return [
            {
                "type": "fill_blank",
                "prompt": "Choose the correct past form: I ____ a ticket yesterday.",
                "answer": "bought",
                "rule": "Use past simple for finished actions in the past.",
            },
            {
                "type": "fill_blank",
                "prompt": "Choose the correct future form: We ____ visit the office tomorrow.",
                "answer": "will",
                "rule": "Use will + base verb for simple future plans.",
            },
            {
                "type": "sentence_order",
                "sentence": f"We are going to talk about {topic}.",
                "rule": "Use be going to + verb for planned future actions.",
            },
            {
                "type": "sentence_order",
                "sentence": "She has an appointment today.",
                "rule": "Use has with he, she, it in the present simple.",
            },
        ]

    def _get_or_create_word(self, text, level, admin):
        existing = Word.objects.filter(text__iexact=text).first()
        if existing:
            return existing

        defaults = WORD_FALLBACKS.get(
            text,
            ("noun", f"a common {level} word", "từ thông dụng", f"I use the word {text}.", f"Tôi luyện tập từ {text}."),
        )
        word = Word.objects.create(
            text=text.lower(),
            phonetic="",
            part_of_speech=defaults[0],
            definition_en=defaults[1],
            definition_vi=defaults[2],
            example_en=defaults[3],
            example_vi=defaults[4],
            level=level,
            created_by=admin,
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
