"""
Seed đầy đủ learning path + WordSets.
3 courses, ~8 units/course, 3 lessons/unit, 20 từ/lesson, 20 WordSets.
"""
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django; django.setup()

from django.db import transaction
from apps.accounts.models import User
from apps.vocabulary.models import Word, WordSet, WordSetWord
from apps.learning.models import Course, Unit, Lesson, LessonWord, UnitLesson

random.seed(42)
admin = User.objects.filter(is_staff=True).first()

# ─── helper ────────────────────────────────────────────────────────────────────

def get_words(level, keywords=None, exclude_ids=None, count=20):
    qs = Word.objects.filter(level=level)
    if exclude_ids:
        qs = qs.exclude(id__in=exclude_ids)
    if keywords:
        from django.db.models import Q
        q = Q()
        for kw in keywords:
            q |= Q(text__icontains=kw) | Q(definition_vi__icontains=kw) | Q(definition_en__icontains=kw)
        qs_kw = qs.filter(q)
        ids = list(qs_kw.values_list('id', flat=True))
        if len(ids) < count:
            ids += list(qs.exclude(id__in=ids).values_list('id', flat=True))
    else:
        ids = list(qs.values_list('id', flat=True))
    random.shuffle(ids)
    return Word.objects.filter(id__in=ids[:count])


def make_lesson(title, level, topic, order, words_qs, desc="", difficulty="normal"):
    lesson, created = Lesson.objects.get_or_create(
        title=title,
        defaults=dict(
            description=desc or f"Học từ vựng {title}",
            topic=topic,
            skill_tag="vocab",
            content_difficulty=difficulty,
            level=level,
            order_index=order,
            is_published=True,
            created_by=admin,
        )
    )
    if created:
        for i, w in enumerate(words_qs, 1):
            LessonWord.objects.get_or_create(lesson=lesson, word=w, defaults={"order_index": i})
    return lesson


def make_unit(course, order, title, desc, req, lessons):
    unit, _ = Unit.objects.get_or_create(
        course=course, order_index=order,
        defaults=dict(title=title, description=desc,
                      required_lessons_to_unlock=req, is_published=True)
    )
    for i, lesson in enumerate(lessons, 1):
        UnitLesson.objects.get_or_create(unit=unit, lesson=lesson,
                                         defaults={"order_index": i})
    return unit


# ─── clear old learning path ───────────────────────────────────────────────────
print("Xóa dữ liệu learning path cũ...")
UnitLesson.objects.all().delete()
LessonWord.objects.all().delete()
Lesson.objects.all().delete()
Unit.objects.all().delete()
Course.objects.all().delete()
print("  ✓ Đã xóa")

used_ids = set()

with transaction.atomic():

    # ══════════════════════════════════════════════════════════════════════════
    # COURSE 1: Foundation A1–A2
    # ══════════════════════════════════════════════════════════════════════════
    print("\nTạo Course 1: English Foundation A1–A2")
    c1, _ = Course.objects.get_or_create(
        slug="english-foundation",
        defaults=dict(name="English Foundation A1–A2",
                      description="Lộ trình nền tảng tiếng Anh từ A1 đến A2, bao gồm từ vựng cơ bản về cuộc sống hàng ngày.",
                      is_active=True)
    )

    # --- Unit 1: Chào hỏi & Giao tiếp cơ bản ---
    kw1 = ["greet", "hello", "goodbye", "name", "please", "thank", "sorry", "excuse"]
    w = get_words("A1", kw1, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l1 = make_lesson("Chào hỏi & Giao tiếp cơ bản", "A1", "greetings", 1, w,
                     "Học cách chào hỏi, cảm ơn và xin lỗi trong tiếng Anh.")
    kw2 = ["family", "mother", "father", "sister", "brother", "child", "baby", "friend"]
    w = get_words("A1", kw2, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l2 = make_lesson("Gia đình & Mối quan hệ", "A1", "family", 2, w,
                     "Từ vựng về các thành viên trong gia đình.")
    kw3 = ["eat", "drink", "sleep", "walk", "run", "play", "cook", "buy", "sell"]
    w = get_words("A1", kw3, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l3 = make_lesson("Hoạt động hàng ngày", "A1", "daily_activities", 3, w,
                     "Các động từ chỉ hoạt động thường ngày.")
    u1 = make_unit(c1, 1, "Unit 1 - Chào Hỏi & Gia Đình",
                   "Nền tảng giao tiếp: chào hỏi, gia đình và hoạt động cơ bản.", 2, [l1, l2, l3])
    print(f"  ✓ Unit 1 | 3 lessons")

    # --- Unit 2: Đồ vật & Mô tả ---
    kw4 = ["pen", "book", "chair", "table", "door", "window", "bag", "clock"]
    w = get_words("A1", kw4, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l4 = make_lesson("Đồ vật trong lớp & nhà", "A1", "objects", 4, w,
                     "Tên gọi các đồ vật thường thấy ở trường và nhà.")
    kw5 = ["color", "red", "blue", "green", "white", "black", "big", "small", "tall"]
    w = get_words("A1", kw5, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l5 = make_lesson("Màu sắc & Tính từ mô tả", "A1", "colors_adj", 5, w,
                     "Màu sắc và các tính từ mô tả cơ bản.")
    kw6 = ["morning", "afternoon", "evening", "week", "month", "year", "today", "tomorrow"]
    w = get_words("A1", kw6, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l6 = make_lesson("Thời gian & Ngày tháng", "A1", "time", 6, w,
                     "Từ vựng về thời gian, ngày tháng, mùa trong năm.")
    u2 = make_unit(c1, 2, "Unit 2 - Đồ Vật & Thời Gian",
                   "Mô tả đồ vật, màu sắc và biểu đạt thời gian.", 2, [l4, l5, l6])
    print(f"  ✓ Unit 2 | 3 lessons")

    # --- Unit 3: Thực phẩm & Đồ uống ---
    kw7 = ["rice", "noodle", "soup", "bread", "egg", "chicken", "beef", "fish", "pork"]
    w = get_words("A2", kw7, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l7 = make_lesson("Thức ăn & Món ăn", "A2", "food", 7, w, "Tên các món ăn và thực phẩm phổ biến.")
    kw8 = ["apple", "banana", "orange", "tomato", "potato", "vegetable", "fruit", "sugar", "salt"]
    w = get_words("A2", kw8, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l8 = make_lesson("Rau củ quả & Gia vị", "A2", "vegetables", 8, w, "Tên các loại rau củ, quả và gia vị.")
    kw9 = ["coffee", "tea", "milk", "juice", "water", "cake", "cookie", "ice cream", "sandwich"]
    w = get_words("A2", kw9, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l9 = make_lesson("Đồ uống & Bánh kẹo", "A2", "drinks", 9, w, "Các loại đồ uống và bánh kẹo.")
    u3 = make_unit(c1, 3, "Unit 3 - Thực Phẩm & Đồ Uống",
                   "Từ vựng về thức ăn, đồ uống, rau củ và gia vị.", 2, [l7, l8, l9])
    print(f"  ✓ Unit 3 | 3 lessons")

    # --- Unit 4: Nhà cửa & Đồ nội thất ---
    kw10 = ["bedroom", "bathroom", "kitchen", "living room", "table", "chair", "lamp", "curtain"]
    w = get_words("A2", kw10, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l10 = make_lesson("Phòng ốc trong nhà", "A2", "rooms", 10, w, "Tên các phòng và phòng chức năng.")
    kw11 = ["fridge", "oven", "microwave", "television", "washing machine", "kettle", "blender"]
    w = get_words("A2", kw11, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l11 = make_lesson("Đồ gia dụng & Thiết bị", "A2", "appliances", 11, w,
                      "Tên các thiết bị và đồ gia dụng trong nhà.")
    kw12 = ["shirt", "trousers", "dress", "jacket", "hat", "shoes", "socks", "glasses"]
    w = get_words("A2", kw12, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l12 = make_lesson("Quần áo & Phụ kiện", "A2", "clothes", 12, w, "Từ vựng về trang phục và phụ kiện.")
    u4 = make_unit(c1, 4, "Unit 4 - Nhà Cửa & Quần Áo",
                   "Từ vựng về nhà cửa, đồ gia dụng và trang phục.", 2, [l10, l11, l12])
    print(f"  ✓ Unit 4 | 3 lessons")

    # --- Unit 5: Đi lại & Địa điểm ---
    kw13 = ["bicycle", "bus", "train", "car", "taxi", "road", "airport", "station", "traffic"]
    w = get_words("A2", kw13, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l13 = make_lesson("Phương tiện & Giao thông", "A2", "transport", 13, w,
                      "Tên các phương tiện giao thông và từ liên quan.")
    kw14 = ["hospital", "hotel", "museum", "library", "restaurant", "bank", "park", "cinema"]
    w = get_words("A2", kw14, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l14 = make_lesson("Địa điểm trong thành phố", "A2", "places", 14, w,
                      "Tên các địa điểm phổ biến trong thành phố.")
    kw15 = ["rain", "snow", "wind", "cloud", "storm", "temperature", "flood", "mountain", "river"]
    w = get_words("A2", kw15, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l15 = make_lesson("Thời tiết & Thiên nhiên", "A2", "weather", 15, w,
                      "Từ vựng về thời tiết và các hiện tượng tự nhiên.")
    u5 = make_unit(c1, 5, "Unit 5 - Đi Lại & Thiên Nhiên",
                   "Phương tiện giao thông, địa điểm thành phố và thời tiết.", 3, [l13, l14, l15])
    print(f"  ✓ Unit 5 | 3 lessons")

    # ══════════════════════════════════════════════════════════════════════════
    # COURSE 2: Intermediate B1–B2
    # ══════════════════════════════════════════════════════════════════════════
    print("\nTạo Course 2: English Intermediate B1–B2")
    c2, _ = Course.objects.get_or_create(
        slug="english-intermediate",
        defaults=dict(name="English Intermediate B1–B2",
                      description="Lộ trình trung cấp từ B1 đến B2: giao tiếp, công việc, xã hội và công nghệ.",
                      is_active=True)
    )

    # --- Unit 1: Cảm xúc & Tính cách ---
    kw16 = ["anxious", "confident", "curious", "excited", "proud", "lonely", "jealous", "nervous"]
    w = get_words("B1", kw16, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l16 = make_lesson("Cảm xúc & Trạng thái tâm lý", "B1", "emotions", 1, w,
                      "Từ vựng mô tả cảm xúc và trạng thái tâm lý.")
    kw17 = ["patient", "generous", "honest", "brave", "stubborn", "polite", "shy", "ambitious"]
    w = get_words("B1", kw17, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l17 = make_lesson("Tính cách & Phẩm chất", "B1", "personality", 2, w,
                      "Từ vựng mô tả tính cách và phẩm chất con người.")
    kw18 = ["headache", "fever", "cough", "injury", "medicine", "diet", "exercise", "blood"]
    w = get_words("B1", kw18, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l18 = make_lesson("Sức khỏe & Cơ thể", "B1", "health", 3, w,
                      "Từ vựng về sức khỏe, bệnh tật và bộ phận cơ thể.")
    u1b = make_unit(c2, 1, "Unit 1 - Cảm Xúc & Sức Khỏe",
                    "Mô tả cảm xúc, tính cách và từ vựng y tế cơ bản.", 2, [l16, l17, l18])
    print(f"  ✓ Unit 1 | 3 lessons")

    # --- Unit 2: Công việc & Nghề nghiệp ---
    kw19 = ["apply", "interview", "salary", "promotion", "resign", "retire", "colleague", "deadline"]
    w = get_words("B1", kw19, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l19 = make_lesson("Công việc & Nghề nghiệp", "B1", "work", 4, w,
                      "Từ vựng về tìm việc, thăng tiến và môi trường làm việc.")
    kw20 = ["discount", "refund", "afford", "bargain", "currency", "savings", "loan", "investment"]
    w = get_words("B1", kw20, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l20 = make_lesson("Tiền bạc & Mua sắm", "B1", "money", 5, w,
                      "Từ vựng về tài chính cá nhân và mua sắm.")
    kw21 = ["headline", "broadcast", "opinion", "debate", "influence", "publish", "subscribe"]
    w = get_words("B1", kw21, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l21 = make_lesson("Truyền thông & Thông tin", "B1", "media", 6, w,
                      "Từ vựng về báo chí, truyền thông và ý kiến.")
    u2b = make_unit(c2, 2, "Unit 2 - Công Việc & Truyền Thông",
                    "Nghề nghiệp, tài chính cá nhân và phương tiện truyền thông.", 2, [l19, l20, l21])
    print(f"  ✓ Unit 2 | 3 lessons")

    # --- Unit 3: Thiên nhiên & Xã hội ---
    kw22 = ["pollution", "climate", "sustainable", "emission", "ecosystem", "deforestation"]
    w = get_words("B2", kw22, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l22 = make_lesson("Môi trường & Biến đổi khí hậu", "B2", "environment", 7, w,
                      "Từ vựng về môi trường, ô nhiễm và biến đổi khí hậu.")
    kw23 = ["democracy", "government", "election", "policy", "regulation", "justice", "equality"]
    w = get_words("B2", kw23, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l23 = make_lesson("Chính trị & Xã hội", "B2", "politics", 8, w,
                      "Từ vựng về chính phủ, bầu cử và các vấn đề xã hội.")
    kw24 = ["globalisation", "migration", "cultural", "diverse", "tolerance", "discrimination"]
    w = get_words("B2", kw24, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l24 = make_lesson("Toàn cầu hóa & Văn hóa", "B2", "globalisation", 9, w,
                      "Toàn cầu hóa, di cư và đa dạng văn hóa.")
    u3b = make_unit(c2, 3, "Unit 3 - Môi Trường & Xã Hội",
                    "Biến đổi khí hậu, chính trị, toàn cầu hóa và đa dạng văn hóa.", 2, [l22, l23, l24])
    print(f"  ✓ Unit 3 | 3 lessons")

    # --- Unit 4: Công nghệ & Kỹ thuật số ---
    kw25 = ["software", "hardware", "database", "network", "algorithm", "interface", "server", "cloud"]
    w = get_words("B2", kw25, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l25 = make_lesson("Công nghệ & Phần mềm", "B2", "technology", 10, w,
                      "Từ vựng về phần mềm, phần cứng và hệ thống mạng.")
    kw26 = ["viral", "influencer", "platform", "content", "engagement", "stream", "privacy", "cybersecurity"]
    w = get_words("B2", kw26, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l26 = make_lesson("Mạng xã hội & Thế giới số", "B2", "social_media", 11, w,
                      "Mạng xã hội, nội dung số và an ninh thông tin.")
    kw27 = ["artificial intelligence", "machine learning", "automation", "blockchain", "big data"]
    w = get_words("B2", kw27, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l27 = make_lesson("AI & Công nghệ tương lai", "B2", "ai_tech", 12, w,
                      "Trí tuệ nhân tạo, học máy và các công nghệ mới nổi.")
    u4b = make_unit(c2, 4, "Unit 4 - Công Nghệ & Kỹ Thuật Số",
                    "Phần mềm, mạng xã hội, AI và chuyển đổi số.", 3, [l25, l26, l27])
    print(f"  ✓ Unit 4 | 3 lessons")

    # --- Unit 5: Học thuật & Nghiên cứu ---
    kw28 = ["analyze", "evaluate", "hypothesis", "evidence", "argument", "perspective", "theory"]
    w = get_words("B2", kw28, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l28 = make_lesson("Tư duy học thuật & Lập luận", "B2", "academic_thinking", 13, w,
                      "Từ vựng học thuật: phân tích, đánh giá và lập luận.")
    kw29 = ["experiment", "sample", "variable", "accurate", "reliable", "statistic", "formula"]
    w = get_words("B2", kw29, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l29 = make_lesson("Khoa học & Nghiên cứu", "B2", "science", 14, w,
                      "Từ vựng về thí nghiệm, dữ liệu khoa học và nghiên cứu.")
    kw30 = ["inflation", "recession", "revenue", "profit", "asset", "investment", "trade", "market"]
    w = get_words("B2", kw30, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l30 = make_lesson("Kinh tế & Tài chính", "B2", "economics", 15, w,
                      "Kinh tế vĩ mô, thương mại quốc tế và tài chính.")
    u5b = make_unit(c2, 5, "Unit 5 - Học Thuật & Kinh Tế",
                    "Tư duy học thuật, khoa học, nghiên cứu và kinh tế học.", 3, [l28, l29, l30])
    print(f"  ✓ Unit 5 | 3 lessons")

    # ══════════════════════════════════════════════════════════════════════════
    # COURSE 3: Advanced C1 + TOEIC
    # ══════════════════════════════════════════════════════════════════════════
    print("\nTạo Course 3: English Advanced C1 & TOEIC")
    c3, _ = Course.objects.get_or_create(
        slug="english-advanced",
        defaults=dict(name="English Advanced C1 & TOEIC",
                      description="Từ vựng nâng cao C1 và từ vựng TOEIC chuyên biệt cho môi trường chuyên nghiệp.",
                      is_active=True)
    )

    # --- Unit 1: Từ vựng C1 nâng cao ---
    kw31 = ["ambiguous", "contemplate", "elaborate", "facilitate", "inevitable", "paradox", "profound"]
    w = get_words("C1", kw31, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l31 = make_lesson("Tính từ & Trạng từ nâng cao", "C1", "adv_adj", 1, w,
                      "Tính từ và trạng từ nâng cao thường gặp trong văn phong học thuật.")
    kw32 = ["accelerate", "collaborate", "demonstrate", "enhance", "fluctuate", "generate", "implement"]
    w = get_words("C1", kw32, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l32 = make_lesson("Động từ nâng cao & Học thuật", "C1", "adv_verbs", 2, w,
                      "Các động từ nâng cao thường dùng trong văn bản học thuật và chuyên nghiệp.")
    kw33 = ["integrity", "resilience", "empathy", "autonomy", "consensus", "phenomenon", "paradigm"]
    w = get_words("C1", kw33, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l33 = make_lesson("Khái niệm trừu tượng & Triết học", "C1", "abstract", 3, w,
                      "Các danh từ trừu tượng về đạo đức, xã hội và tư duy.")
    u1c = make_unit(c3, 1, "Unit 1 - Từ Vựng Nâng Cao C1",
                    "Tính từ, động từ và danh từ trừu tượng ở trình độ C1.", 2, [l31, l32, l33])
    print(f"  ✓ Unit 1 | 3 lessons")

    # --- Unit 2: TOEIC Business ---
    kw34 = ["invoice", "receipt", "budget", "revenue", "profit", "asset", "merger", "acquisition"]
    w = get_words("TOEIC", kw34, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l34 = make_lesson("Tài chính & Kế toán TOEIC", "TOEIC", "toeic_finance", 4, w,
                      "Từ vựng TOEIC về tài chính, kế toán và báo cáo kinh doanh.")
    kw35 = ["applicant", "recruitment", "resume", "probation", "appraisal", "incentive", "workforce"]
    w = get_words("TOEIC", kw35, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l35 = make_lesson("Nhân sự & Tuyển dụng TOEIC", "TOEIC", "toeic_hr", 5, w,
                      "Từ vựng TOEIC về nhân sự, tuyển dụng và quản lý nhân viên.")
    kw36 = ["branding", "campaign", "demographics", "promotion", "testimonial", "niche", "conversion"]
    w = get_words("TOEIC", kw36, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l36 = make_lesson("Marketing & Bán hàng TOEIC", "TOEIC", "toeic_marketing", 6, w,
                      "Từ vựng TOEIC về marketing, chiến dịch và chiến lược bán hàng.")
    u2c = make_unit(c3, 2, "Unit 2 - TOEIC Business",
                    "Tài chính, nhân sự và marketing theo chuẩn TOEIC.", 2, [l34, l35, l36])
    print(f"  ✓ Unit 2 | 3 lessons")

    # --- Unit 3: TOEIC Operations ---
    kw37 = ["freight", "cargo", "shipment", "dispatch", "clearance", "transit", "logistics", "inventory"]
    w = get_words("TOEIC", kw37, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l37 = make_lesson("Vận chuyển & Hậu cần TOEIC", "TOEIC", "toeic_logistics", 7, w,
                      "Từ vựng TOEIC về vận tải, hải quan và chuỗi cung ứng.")
    kw38 = ["presentation", "seminar", "conference", "agenda", "postpone", "reschedule", "minutes"]
    w = get_words("TOEIC", kw38, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l38 = make_lesson("Họp & Thuyết trình TOEIC", "TOEIC", "toeic_meetings", 8, w,
                      "Từ vựng TOEIC về cuộc họp, thuyết trình và hội nghị.")
    kw39 = ["contract", "negotiation", "compliance", "regulation", "arbitration", "liability", "indemnify"]
    w = get_words("TOEIC", kw39, used_ids, 20); used_ids.update(w.values_list("id",flat=True))
    l39 = make_lesson("Pháp lý & Hợp đồng TOEIC", "TOEIC", "toeic_legal", 9, w,
                      "Từ vựng TOEIC về hợp đồng, pháp lý và tuân thủ.")
    u3c = make_unit(c3, 3, "Unit 3 - TOEIC Operations",
                    "Hậu cần, vận hành, họp hành và pháp lý theo chuẩn TOEIC.", 2, [l37, l38, l39])
    print(f"  ✓ Unit 3 | 3 lessons")

    print("\n=== KẾT QUẢ LEARNING PATH ===")
    print(f"Courses: {Course.objects.count()}")
    print(f"Units: {Unit.objects.count()}")
    print(f"Lessons: {Lesson.objects.count()}")
    print(f"UnitLessons: {UnitLesson.objects.count()}")

    # ══════════════════════════════════════════════════════════════════════════
    # WORDSETS
    # ══════════════════════════════════════════════════════════════════════════
    print("\nTạo WordSets...")
    WordSetWord.objects.all().delete()
    WordSet.objects.all().delete()

    WORDSET_DEFS = [
        ("🐾 Động vật", "A1", ["cat", "dog", "fish", "bird", "animal", "insect", "reptile", "wildlife"], ["A1","A2","B1"]),
        ("🍎 Thực phẩm & Đồ uống", "A2", ["food", "drink", "rice", "bread", "tea", "coffee", "milk", "fruit", "vegetable","eat"], ["A1","A2"]),
        ("👨‍👩‍👧 Gia đình & Mối quan hệ", "A1", ["mother", "father", "brother", "sister", "family", "friend", "child", "couple"], ["A1","A2"]),
        ("🎨 Màu sắc & Mô tả ngoại hình", "A1", ["color", "red", "blue", "tall", "slim", "curly", "bald", "pretty"], ["A1","A2","B1"]),
        ("⏰ Thời gian & Tần suất", "A2", ["morning", "week", "month", "always", "usually", "sometimes", "rarely", "daily"], ["A1","A2"]),
        ("✈️ Du lịch & Địa điểm", "A2", ["airport", "hotel", "passport", "visa", "destination", "accommodation", "souvenir"], ["A2","B2"]),
        ("💻 Công nghệ & Phần mềm", "B2", ["software", "database", "network", "cloud", "algorithm", "server", "interface"], ["B2","C1"]),
        ("📊 Kinh doanh & TOEIC", "TOEIC", ["invoice", "budget", "revenue", "profit", "contract", "negotiation", "strategy"], ["TOEIC","B2"]),
        ("💪 Thể thao & Hoạt động", "A2", ["football", "swimming", "running", "cycling", "yoga", "tournament", "champion"], ["A2","B1"]),
        ("🏥 Sức khỏe & Y tế", "B1", ["fever", "medicine", "exercise", "diet", "symptom", "treatment", "vaccine"], ["B1","B2"]),
        ("😊 Cảm xúc & Tính cách", "B1", ["anxious", "confident", "curious", "proud", "generous", "honest", "brave", "ambitious"], ["B1"]),
        ("🌿 Môi trường & Thiên nhiên", "B2", ["pollution", "climate", "sustainable", "renewable", "ecosystem", "recycle", "forest"], ["A2","B2"]),
        ("🎓 Học thuật & Nghiên cứu", "B2", ["analyze", "hypothesis", "evidence", "theory", "methodology", "research", "statistic"], ["B2","C1"]),
        ("🏢 Nhân sự & Văn phòng", "TOEIC", ["recruitment", "resume", "salary", "deadline", "meeting", "presentation", "agenda"], ["B1","TOEIC"]),
        ("🗣️ Cụm động từ thông dụng", "B1", ["give up", "carry out", "look after", "point out", "put off", "set up", "work out"], ["B1"]),
        ("📝 Viết học thuật", "C1", ["assert", "conclude", "elaborate", "imply", "justify", "modify", "verify", "cite"], ["C1","B2"]),
        ("🔑 Từ vựng C1 nâng cao", "C1", ["ambiguous", "contemplate", "facilitate", "inevitable", "paradox", "resilience", "transparency"], ["C1"]),
        ("🚢 Hậu cần & Vận chuyển TOEIC", "TOEIC", ["freight", "cargo", "shipment", "logistics", "port", "clearance", "transit", "vessel"], ["TOEIC"]),
        ("🤝 Kỹ năng mềm & Lãnh đạo", "B2", ["leadership", "teamwork", "communication", "adaptability", "creativity", "initiative"], ["B2","C1"]),
        ("📱 Mạng xã hội & Truyền thông số", "B2", ["viral", "influencer", "platform", "content", "engagement", "privacy", "cybersecurity"], ["B2"]),
    ]

    ws_created = 0
    for name, level, keywords, levels_to_search in WORDSET_DEFS:
        ws, created = WordSet.objects.get_or_create(
            name=name,
            defaults=dict(description=f"Bộ từ vựng chủ đề: {name.split(' ',1)[-1]}",
                          level=level, is_public=True, created_by=admin)
        )
        if created:
            ws_created += 1
            all_ids = []
            for lv in levels_to_search:
                qs = Word.objects.filter(level=lv)
                from django.db.models import Q
                q = Q()
                for kw in keywords:
                    q |= Q(text__icontains=kw) | Q(definition_vi__icontains=kw) | Q(definition_en__icontains=kw)
                ids = list(qs.filter(q).values_list("id", flat=True))
                if not ids:
                    ids = list(qs.values_list("id", flat=True))
                random.shuffle(ids)
                all_ids.extend(ids[:10])
            random.shuffle(all_ids)
            seen = set()
            final_ids = [x for x in all_ids if not (x in seen or seen.add(x))][:30]
            for i, wid in enumerate(final_ids, 1):
                WordSetWord.objects.get_or_create(wordset=ws, word_id=wid,
                                                   defaults={"order_index": i})

    print(f"  ✓ {ws_created} WordSets mới | {WordSet.objects.count()} tổng cộng")
    for ws in WordSet.objects.all():
        print(f"    [{ws.level}] {ws.name} | {ws.words.count()} từ")

print("\n✅ SEED HOÀN TẤT")
print(f"  Courses: {Course.objects.count()}")
print(f"  Units: {Unit.objects.count()}")
print(f"  Lessons: {Lesson.objects.count()}")
print(f"  WordSets: {WordSet.objects.count()}")
print(f"  Words total: {Word.objects.count()}")
