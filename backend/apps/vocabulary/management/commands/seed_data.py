"""
Lệnh seed dữ liệu mẫu cho môi trường development.
Chạy: python manage.py seed_data
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.vocabulary.models import Word, WordSet, WordSetWord
from apps.learning.models import Lesson, LessonWord

User = get_user_model()

# ── Dữ liệu từ vựng mẫu ──────────────────────────────────────────────────────

WORDS = [
    # A1
    {"text": "hello", "phonetic": "/həˈloʊ/", "part_of_speech": "exclamation", "definition_en": "Used as a greeting", "definition_vi": "Xin chào", "example_en": "Hello, how are you?", "example_vi": "Xin chào, bạn khỏe không?", "level": "A1"},
    {"text": "goodbye", "phonetic": "/ˌɡʊdˈbaɪ/", "part_of_speech": "exclamation", "definition_en": "Used when leaving or parting", "definition_vi": "Tạm biệt", "example_en": "Goodbye, see you tomorrow!", "example_vi": "Tạm biệt, hẹn gặp lại ngày mai!", "level": "A1"},
    {"text": "book", "phonetic": "/bʊk/", "part_of_speech": "noun", "definition_en": "A written or printed work", "definition_vi": "Cuốn sách", "example_en": "I read a book every week.", "example_vi": "Tôi đọc một cuốn sách mỗi tuần.", "level": "A1"},
    {"text": "water", "phonetic": "/ˈwɔːtər/", "part_of_speech": "noun", "definition_en": "A clear liquid essential for life", "definition_vi": "Nước", "example_en": "Please give me a glass of water.", "example_vi": "Vui lòng cho tôi một ly nước.", "level": "A1"},
    {"text": "eat", "phonetic": "/iːt/", "part_of_speech": "verb", "definition_en": "To put food in your mouth and swallow it", "definition_vi": "Ăn", "example_en": "We eat dinner at 7pm.", "example_vi": "Chúng tôi ăn tối lúc 7 giờ tối.", "level": "A1"},
    {"text": "sleep", "phonetic": "/sliːp/", "part_of_speech": "verb", "definition_en": "To rest in a state of sleep", "definition_vi": "Ngủ", "example_en": "I sleep eight hours a night.", "example_vi": "Tôi ngủ tám tiếng mỗi đêm.", "level": "A1"},
    {"text": "house", "phonetic": "/haʊs/", "part_of_speech": "noun", "definition_en": "A building for people to live in", "definition_vi": "Ngôi nhà", "example_en": "They live in a big house.", "example_vi": "Họ sống trong một ngôi nhà lớn.", "level": "A1"},
    {"text": "family", "phonetic": "/ˈfæməli/", "part_of_speech": "noun", "definition_en": "A group of people related to each other", "definition_vi": "Gia đình", "example_en": "My family has four members.", "example_vi": "Gia đình tôi có bốn thành viên.", "level": "A1"},
    {"text": "school", "phonetic": "/skuːl/", "part_of_speech": "noun", "definition_en": "A place where children are educated", "definition_vi": "Trường học", "example_en": "She goes to school by bus.", "example_vi": "Cô ấy đi học bằng xe buýt.", "level": "A1"},
    {"text": "friend", "phonetic": "/frend/", "part_of_speech": "noun", "definition_en": "A person you like and enjoy being with", "definition_vi": "Bạn bè", "example_en": "He is my best friend.", "example_vi": "Anh ấy là người bạn thân nhất của tôi.", "level": "A1"},
    # A2
    {"text": "travel", "phonetic": "/ˈtrævəl/", "part_of_speech": "verb", "definition_en": "To make a journey", "definition_vi": "Du lịch", "example_en": "I love to travel to new places.", "example_vi": "Tôi thích du lịch đến những nơi mới.", "level": "A2"},
    {"text": "weather", "phonetic": "/ˈweðər/", "part_of_speech": "noun", "definition_en": "The state of the atmosphere at a time", "definition_vi": "Thời tiết", "example_en": "The weather today is sunny.", "example_vi": "Thời tiết hôm nay nắng đẹp.", "level": "A2"},
    {"text": "shopping", "phonetic": "/ˈʃɒpɪŋ/", "part_of_speech": "noun", "definition_en": "The activity of buying goods", "definition_vi": "Mua sắm", "example_en": "She enjoys shopping on weekends.", "example_vi": "Cô ấy thích mua sắm vào cuối tuần.", "level": "A2"},
    {"text": "hospital", "phonetic": "/ˈhɒspɪtl/", "part_of_speech": "noun", "definition_en": "A place where sick people receive treatment", "definition_vi": "Bệnh viện", "example_en": "He works at the local hospital.", "example_vi": "Anh ấy làm việc tại bệnh viện địa phương.", "level": "A2"},
    {"text": "doctor", "phonetic": "/ˈdɒktər/", "part_of_speech": "noun", "definition_en": "A person qualified to practice medicine", "definition_vi": "Bác sĩ", "example_en": "The doctor examined the patient.", "example_vi": "Bác sĩ khám bệnh cho bệnh nhân.", "level": "A2"},
    {"text": "market", "phonetic": "/ˈmɑːrkɪt/", "part_of_speech": "noun", "definition_en": "A place where goods are bought and sold", "definition_vi": "Chợ / thị trường", "example_en": "We buy vegetables at the market.", "example_vi": "Chúng tôi mua rau ở chợ.", "level": "A2"},
    {"text": "restaurant", "phonetic": "/ˈrestrɒnt/", "part_of_speech": "noun", "definition_en": "A place where meals are cooked and served", "definition_vi": "Nhà hàng", "example_en": "Let's have dinner at that restaurant.", "example_vi": "Hãy ăn tối ở nhà hàng đó.", "level": "A2"},
    {"text": "holiday", "phonetic": "/ˈhɒlɪdeɪ/", "part_of_speech": "noun", "definition_en": "A period of time spent away from work", "definition_vi": "Kỳ nghỉ", "example_en": "We are going on holiday next week.", "example_vi": "Chúng tôi sẽ đi nghỉ tuần tới.", "level": "A2"},
    {"text": "telephone", "phonetic": "/ˈtelɪfoʊn/", "part_of_speech": "noun", "definition_en": "A device used for voice communication", "definition_vi": "Điện thoại", "example_en": "Can I use your telephone?", "example_vi": "Tôi có thể dùng điện thoại của bạn không?", "level": "A2"},
    {"text": "money", "phonetic": "/ˈmʌni/", "part_of_speech": "noun", "definition_en": "Currency used in transactions", "definition_vi": "Tiền", "example_en": "I don't have enough money.", "example_vi": "Tôi không có đủ tiền.", "level": "A2"},
    # B1
    {"text": "environment", "phonetic": "/ɪnˈvaɪrənmənt/", "part_of_speech": "noun", "definition_en": "The natural world around us", "definition_vi": "Môi trường", "example_en": "We must protect the environment.", "example_vi": "Chúng ta phải bảo vệ môi trường.", "level": "B1"},
    {"text": "opportunity", "phonetic": "/ˌɒpəˈtjuːnɪti/", "part_of_speech": "noun", "definition_en": "A set of circumstances that makes it possible to do something", "definition_vi": "Cơ hội", "example_en": "This is a great opportunity for you.", "example_vi": "Đây là một cơ hội tuyệt vời cho bạn.", "level": "B1"},
    {"text": "society", "phonetic": "/səˈsaɪɪti/", "part_of_speech": "noun", "definition_en": "The community of people living together", "definition_vi": "Xã hội", "example_en": "Technology changes society rapidly.", "example_vi": "Công nghệ thay đổi xã hội nhanh chóng.", "level": "B1"},
    {"text": "culture", "phonetic": "/ˈkʌltʃər/", "part_of_speech": "noun", "definition_en": "The ideas and customs of a group of people", "definition_vi": "Văn hóa", "example_en": "Vietnamese culture is rich and diverse.", "example_vi": "Văn hóa Việt Nam phong phú và đa dạng.", "level": "B1"},
    {"text": "technology", "phonetic": "/tekˈnɒlədʒi/", "part_of_speech": "noun", "definition_en": "The application of scientific knowledge", "definition_vi": "Công nghệ", "example_en": "Technology has transformed our lives.", "example_vi": "Công nghệ đã biến đổi cuộc sống của chúng ta.", "level": "B1"},
    {"text": "education", "phonetic": "/ˌedjʊˈkeɪʃən/", "part_of_speech": "noun", "definition_en": "The process of receiving or giving instruction", "definition_vi": "Giáo dục", "example_en": "Education is the key to success.", "example_vi": "Giáo dục là chìa khóa dẫn đến thành công.", "level": "B1"},
    {"text": "experience", "phonetic": "/ɪkˈspɪəriəns/", "part_of_speech": "noun", "definition_en": "Practical contact with and observation of facts", "definition_vi": "Kinh nghiệm", "example_en": "She has ten years of teaching experience.", "example_vi": "Cô ấy có mười năm kinh nghiệm giảng dạy.", "level": "B1"},
    {"text": "communicate", "phonetic": "/kəˈmjuːnɪkeɪt/", "part_of_speech": "verb", "definition_en": "To share or exchange information", "definition_vi": "Giao tiếp", "example_en": "It's important to communicate clearly.", "example_vi": "Giao tiếp rõ ràng là điều quan trọng.", "level": "B1"},
    {"text": "achievement", "phonetic": "/əˈtʃiːvmənt/", "part_of_speech": "noun", "definition_en": "A thing done successfully with effort", "definition_vi": "Thành tích", "example_en": "Winning the award was a great achievement.", "example_vi": "Giành được giải thưởng là một thành tích lớn.", "level": "B1"},
    {"text": "challenge", "phonetic": "/ˈtʃælɪndʒ/", "part_of_speech": "noun", "definition_en": "A task that is difficult but stimulating", "definition_vi": "Thử thách", "example_en": "Learning a language is a real challenge.", "example_vi": "Học một ngôn ngữ là một thử thách thực sự.", "level": "B1"},
    # B2
    {"text": "innovation", "phonetic": "/ˌɪnəˈveɪʃən/", "part_of_speech": "noun", "definition_en": "The introduction of new ideas or methods", "definition_vi": "Đổi mới / sáng tạo", "example_en": "Innovation drives economic growth.", "example_vi": "Đổi mới thúc đẩy tăng trưởng kinh tế.", "level": "B2"},
    {"text": "sustainable", "phonetic": "/səˈsteɪnəbəl/", "part_of_speech": "adjective", "definition_en": "Able to be maintained without depleting resources", "definition_vi": "Bền vững", "example_en": "We need sustainable development.", "example_vi": "Chúng ta cần phát triển bền vững.", "level": "B2"},
    {"text": "globalization", "phonetic": "/ˌɡloʊbələˈzeɪʃən/", "part_of_speech": "noun", "definition_en": "The process of international integration", "definition_vi": "Toàn cầu hóa", "example_en": "Globalization has connected the world.", "example_vi": "Toàn cầu hóa đã kết nối thế giới.", "level": "B2"},
    {"text": "perspective", "phonetic": "/pərˈspektɪv/", "part_of_speech": "noun", "definition_en": "A particular way of thinking about something", "definition_vi": "Quan điểm / góc nhìn", "example_en": "Consider this from a different perspective.", "example_vi": "Hãy xem xét điều này từ một góc nhìn khác.", "level": "B2"},
    {"text": "consequence", "phonetic": "/ˈkɒnsɪkwəns/", "part_of_speech": "noun", "definition_en": "A result or effect of an action", "definition_vi": "Hậu quả", "example_en": "Every action has consequences.", "example_vi": "Mọi hành động đều có hậu quả.", "level": "B2"},
    {"text": "significant", "phonetic": "/sɪɡˈnɪfɪkənt/", "part_of_speech": "adjective", "definition_en": "Sufficiently great or important", "definition_vi": "Đáng kể / quan trọng", "example_en": "There has been a significant improvement.", "example_vi": "Đã có sự cải thiện đáng kể.", "level": "B2"},
    {"text": "hypothesis", "phonetic": "/haɪˈpɒθɪsɪs/", "part_of_speech": "noun", "definition_en": "A proposed explanation made on limited evidence", "definition_vi": "Giả thuyết", "example_en": "The scientist tested her hypothesis.", "example_vi": "Nhà khoa học đã kiểm tra giả thuyết của mình.", "level": "B2"},
    {"text": "collaboration", "phonetic": "/kəˌlæbəˈreɪʃən/", "part_of_speech": "noun", "definition_en": "The action of working with someone", "definition_vi": "Hợp tác", "example_en": "Success requires teamwork and collaboration.", "example_vi": "Thành công đòi hỏi tinh thần đồng đội và hợp tác.", "level": "B2"},
    {"text": "entrepreneurship", "phonetic": "/ˌɒntrəprəˈnɜːʃɪp/", "part_of_speech": "noun", "definition_en": "The activity of setting up a business", "definition_vi": "Tinh thần khởi nghiệp", "example_en": "Entrepreneurship requires courage and vision.", "example_vi": "Khởi nghiệp đòi hỏi sự can đảm và tầm nhìn.", "level": "B2"},
    {"text": "phenomenon", "phonetic": "/fɪˈnɒmɪnən/", "part_of_speech": "noun", "definition_en": "A fact or event that is observable", "definition_vi": "Hiện tượng", "example_en": "Climate change is a global phenomenon.", "example_vi": "Biến đổi khí hậu là một hiện tượng toàn cầu.", "level": "B2"},
    # TOEIC
    {"text": "negotiate", "phonetic": "/nɪˈɡoʊʃieɪt/", "part_of_speech": "verb", "definition_en": "To try to reach an agreement through discussion", "definition_vi": "Đàm phán", "example_en": "We need to negotiate the contract terms.", "example_vi": "Chúng ta cần đàm phán các điều khoản hợp đồng.", "level": "TOEIC"},
    {"text": "revenue", "phonetic": "/ˈrevənjuː/", "part_of_speech": "noun", "definition_en": "Income generated from business activities", "definition_vi": "Doanh thu", "example_en": "Company revenue grew 20% this year.", "example_vi": "Doanh thu công ty tăng 20% năm nay.", "level": "TOEIC"},
    {"text": "deadline", "phonetic": "/ˈdedlaɪn/", "part_of_speech": "noun", "definition_en": "The latest time by which something must be done", "definition_vi": "Thời hạn chót", "example_en": "Please submit the report before the deadline.", "example_vi": "Vui lòng nộp báo cáo trước thời hạn chót.", "level": "TOEIC"},
    {"text": "headquarters", "phonetic": "/ˈhedˌkwɔːrtərz/", "part_of_speech": "noun", "definition_en": "The main offices of an organization", "definition_vi": "Trụ sở chính", "example_en": "The headquarters is located in Hanoi.", "example_vi": "Trụ sở chính đặt tại Hà Nội.", "level": "TOEIC"},
    {"text": "agenda", "phonetic": "/əˈdʒendə/", "part_of_speech": "noun", "definition_en": "A list of items to be discussed at a meeting", "definition_vi": "Chương trình nghị sự", "example_en": "Please review the meeting agenda.", "example_vi": "Vui lòng xem lại chương trình họp.", "level": "TOEIC"},
]

WORDSETS = [
    {"name": "Từ vựng A1 – Căn bản", "description": "Các từ vựng cơ bản nhất cho người mới bắt đầu học tiếng Anh.", "level": "A1", "word_texts": ["hello", "goodbye", "book", "water", "eat", "sleep", "house", "family", "school", "friend"]},
    {"name": "Từ vựng A2 – Sơ cấp", "description": "Từ vựng giao tiếp hàng ngày cho trình độ sơ cấp.", "level": "A2", "word_texts": ["travel", "weather", "shopping", "hospital", "doctor", "market", "restaurant", "holiday", "telephone", "money"]},
    {"name": "Từ vựng B1 – Trung cấp", "description": "Mở rộng vốn từ cho giao tiếp trung cấp.", "level": "B1", "word_texts": ["environment", "opportunity", "society", "culture", "technology", "education", "experience", "communicate", "achievement", "challenge"]},
    {"name": "Từ vựng B2 – Trung cao cấp", "description": "Từ vựng học thuật và trình bày ý kiến.", "level": "B2", "word_texts": ["innovation", "sustainable", "globalization", "perspective", "consequence", "significant", "hypothesis", "collaboration", "entrepreneurship", "phenomenon"]},
    {"name": "TOEIC – Kinh doanh", "description": "Từ vựng thường gặp trong bài thi TOEIC và môi trường công sở.", "level": "TOEIC", "word_texts": ["negotiate", "revenue", "deadline", "headquarters", "agenda"]},
]

LESSONS = [
    {"title": "Bài 1 – Chào hỏi và giới thiệu", "description": "Học cách chào hỏi và giới thiệu bản thân bằng tiếng Anh.", "level": "A1", "order_index": 1, "word_texts": ["hello", "goodbye", "friend", "family"]},
    {"title": "Bài 2 – Cuộc sống hàng ngày", "description": "Từ vựng về các hoạt động sinh hoạt hàng ngày.", "level": "A1", "order_index": 2, "word_texts": ["eat", "sleep", "house", "school", "book", "water"]},
    {"title": "Bài 3 – Nơi chốn và di chuyển", "description": "Từ vựng về địa điểm và phương tiện di chuyển.", "level": "A2", "order_index": 3, "word_texts": ["hospital", "market", "restaurant", "travel", "holiday"]},
    {"title": "Bài 4 – Xã hội và con người", "description": "Từ vựng mô tả xã hội, giáo dục và nghề nghiệp.", "level": "B1", "order_index": 4, "word_texts": ["society", "education", "culture", "opportunity", "experience"]},
    {"title": "Bài 5 – Khoa học và công nghệ", "description": "Từ vựng học thuật về công nghệ và đổi mới.", "level": "B2", "order_index": 5, "word_texts": ["technology", "innovation", "hypothesis", "phenomenon", "sustainable"]},
]


class Command(BaseCommand):
    help = "Đẩy dữ liệu mẫu vào database (development only)"

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Xóa dữ liệu cũ trước khi seed")

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Đang xóa dữ liệu cũ...")
            WordSetWord.objects.all().delete()
            LessonWord.objects.all().delete()
            WordSet.objects.all().delete()
            Lesson.objects.all().delete()
            Word.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.WARNING("Đã xóa dữ liệu cũ."))

        with transaction.atomic():
            admin = self._seed_users()
            words = self._seed_words(admin)
            self._seed_wordsets(admin, words)
            self._seed_lessons(admin, words)

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Seed hoàn tất!"
            f"\n   Admin:    admin@mnm.com  /  Admin@123456"
            f"\n   Teacher:  teacher@mnm.com  /  Teacher@123456"
            f"\n   Student:  student@mnm.com  /  Student@123456"
            f"\n   Từ vựng:  {len(WORDS)} từ"
            f"\n   Bộ từ:    {len(WORDSETS)} bộ"
            f"\n   Bài học:  {len(LESSONS)} bài"
        ))

    def _seed_users(self):
        self.stdout.write("Đang tạo users...")
        users_data = [
            {"email": "admin@mnm.com",   "username": "admin",   "full_name": "Quản trị viên", "password": "Admin@123456",   "role": "admin",   "is_staff": True, "is_superuser": True},
            {"email": "teacher@mnm.com", "username": "teacher", "full_name": "Giáo viên Lan", "password": "Teacher@123456", "role": "teacher", "is_staff": False, "is_superuser": False},
            {"email": "student@mnm.com", "username": "student", "full_name": "Học sinh Nam",  "password": "Student@123456", "role": "user",    "is_staff": False, "is_superuser": False},
        ]
        admin = None
        for data in users_data:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username":     data["username"],
                    "full_name":    data["full_name"],
                    "role":         data["role"],
                    "is_active":    True,
                    "email_verified": True,
                    "is_staff":     data["is_staff"],
                    "is_superuser": data["is_superuser"],
                },
            )
            if created:
                user.set_password(data["password"])
                user.save()
                self.stdout.write(f"   + Tạo user: {user.email}")
            else:
                self.stdout.write(f"   ~ Đã tồn tại: {user.email}")
            if data["role"] == "admin":
                admin = user
        return admin

    def _seed_words(self, admin):
        self.stdout.write("Đang tạo từ vựng...")
        word_map = {}
        for data in WORDS:
            word, created = Word.objects.get_or_create(
                text=data["text"],
                defaults={**data, "created_by": admin},
            )
            word_map[data["text"]] = word
            if created:
                self.stdout.write(f"   + {word.text} [{word.level}]")
        return word_map

    def _seed_wordsets(self, admin, word_map):
        self.stdout.write("Đang tạo bộ từ...")
        for data in WORDSETS:
            ws, created = WordSet.objects.get_or_create(
                name=data["name"],
                defaults={"description": data["description"], "level": data["level"], "created_by": admin},
            )
            if created:
                for i, text in enumerate(data["word_texts"]):
                    if text in word_map:
                        WordSetWord.objects.get_or_create(wordset=ws, word=word_map[text], defaults={"order_index": i})
                self.stdout.write(f"   + Bộ từ: {ws.name}")

    def _seed_lessons(self, admin, word_map):
        self.stdout.write("Đang tạo bài học...")
        for data in LESSONS:
            lesson, created = Lesson.objects.get_or_create(
                title=data["title"],
                defaults={
                    "description": data["description"],
                    "level":       data["level"],
                    "order_index": data["order_index"],
                    "is_published": True,
                    "created_by":  admin,
                },
            )
            if created:
                for i, text in enumerate(data["word_texts"]):
                    if text in word_map:
                        LessonWord.objects.get_or_create(lesson=lesson, word=word_map[text], defaults={"order_index": i})
                self.stdout.write(f"   + Bài học: {lesson.title}")
