from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.learning.models import ListeningAnswer, ListeningPassage, ListeningQuestion, ListeningSession


PASSAGES = [
    {
        "title": "Family Greeting",
        "topic": "family",
        "level": "A1",
        "transcript": "Anna comes home after school. She says hello to her mother and father. Then she asks her little brother about his day.",
        "translation_vi": "Anna ve nha sau gio hoc. Co ay chao me va bo. Sau do, co hoi em trai nho ve ngay hom nay cua em.",
        "estimated_seconds": 32,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "Who does Anna say hello to first?",
                "choices_json": ["Her teacher", "Her mother and father", "Her friends", "Her brother only"],
                "correct_answer": {"option": "Her mother and father"},
                "explanation": "The passage says Anna says hello to her mother and father.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "Anna comes home after school.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "True"},
                "explanation": "The first sentence states that Anna comes home after school.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "Anna asks her little ____ about his day.",
                "choices_json": [],
                "correct_answer": {"text": "brother"},
                "explanation": "She asks her little brother about his day.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "Morning Routine",
        "topic": "daily_life",
        "level": "A1",
        "transcript": "Tom wakes up at six o'clock every morning. He brushes his teeth, drinks a glass of milk, and walks to school with his friend Ben.",
        "translation_vi": "Tom thuc day luc sau gio moi sang. Ban ay danh rang, uong mot coc sua va di bo den truong cung ban Ben.",
        "estimated_seconds": 35,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "What does Tom drink in the morning?",
                "choices_json": ["Tea", "Coffee", "Milk", "Juice"],
                "correct_answer": {"option": "Milk"},
                "explanation": "Tom drinks a glass of milk.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "Tom goes to school by bus.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "False"},
                "explanation": "The passage says he walks to school.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "Tom wakes up at ____ o'clock.",
                "choices_json": [],
                "correct_answer": {"text": "six"},
                "explanation": "He wakes up at six o'clock.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "At the Supermarket",
        "topic": "shopping",
        "level": "A1",
        "transcript": "Linh goes to the supermarket with her aunt. They buy apples, bread, and some orange juice. At the end, Linh helps carry the bags to the car.",
        "translation_vi": "Linh di sieu thi cung co cua minh. Ho mua tao, banh mi va mot it nuoc cam. Cuoi cung, Linh giup xach tui ra xe.",
        "estimated_seconds": 38,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "Who goes with Linh to the supermarket?",
                "choices_json": ["Her aunt", "Her teacher", "Her cousin", "Her brother"],
                "correct_answer": {"option": "Her aunt"},
                "explanation": "The passage says Linh goes with her aunt.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "They buy orange juice.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "True"},
                "explanation": "Orange juice is listed in the things they buy.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "Linh helps carry the ____ to the car.",
                "choices_json": [],
                "correct_answer": {"text": "bags"},
                "explanation": "She helps carry the bags to the car.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "School Day",
        "topic": "school",
        "level": "A1",
        "transcript": "Mai has English on Monday morning. Her teacher gives the class a short reading activity. After that, Mai and her classmates work in pairs to practice new words.",
        "translation_vi": "Mai hoc tieng Anh vao sang thu Hai. Co giao cho lop mot bai doc ngan. Sau do, Mai va cac ban hoc theo cap de luyen tu moi.",
        "estimated_seconds": 34,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "When does Mai have English?",
                "choices_json": ["Monday morning", "Tuesday afternoon", "Wednesday morning", "Friday afternoon"],
                "correct_answer": {"option": "Monday morning"},
                "explanation": "The first sentence gives the time.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "Mai works alone after the reading activity.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "False"},
                "explanation": "She works in pairs with classmates.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "Mai practices new ____ with her classmates.",
                "choices_json": [],
                "correct_answer": {"text": "words"},
                "explanation": "The passage says they practice new words.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "Healthy Lunch",
        "topic": "food",
        "level": "A1",
        "transcript": "Nam brings a healthy lunch to school. He has rice, chicken, and green vegetables in a small lunch box. During break time, he drinks water and eats with his best friend.",
        "translation_vi": "Nam mang mot bua trua lanh manh den truong. Ban ay co com, ga va rau xanh trong hop com nho. Trong gio giai lao, Nam uong nuoc va an cung ban than.",
        "estimated_seconds": 37,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "What does Nam drink during break time?",
                "choices_json": ["Milk", "Tea", "Water", "Juice"],
                "correct_answer": {"option": "Water"},
                "explanation": "The passage says Nam drinks water.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "Nam keeps his lunch in a small lunch box.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "True"},
                "explanation": "The second sentence states this clearly.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "Nam eats with his best ____.",
                "choices_json": [],
                "correct_answer": {"text": "friend"},
                "explanation": "He eats with his best friend.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "Bus to the Museum",
        "topic": "travel",
        "level": "A2",
        "transcript": "A class from Green School takes a bus to the city museum on Friday. The trip takes forty minutes because of heavy traffic, but the students stay excited and talk about the art they want to see.",
        "translation_vi": "Mot lop hoc tu truong Green di xe buyt den bao tang thanh pho vao thu Sau. Chuyen di mat bon muoi phut vi giao thong dong, nhung hoc sinh van hao huc va noi ve nhung tac pham nghe thuat ma cac em muon xem.",
        "estimated_seconds": 48,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "Why does the trip take forty minutes?",
                "choices_json": ["Because the museum is far away", "Because of heavy traffic", "Because the bus stops for lunch", "Because the students walk slowly"],
                "correct_answer": {"option": "Because of heavy traffic"},
                "explanation": "The passage states the reason directly.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "The students feel bored during the bus trip.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "False"},
                "explanation": "They stay excited and talk together.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "The class wants to see the ____ at the museum.",
                "choices_json": [],
                "correct_answer": {"text": "art"},
                "explanation": "They talk about the art they want to see.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "A Phone Call at Work",
        "topic": "work",
        "level": "A2",
        "transcript": "Mr. Hoang works in a small office near the train station. One afternoon, he receives a phone call from a customer who needs help with an order. Mr. Hoang checks the computer, gives the customer the right information, and promises to send an email summary.",
        "translation_vi": "Ong Hoang lam viec trong mot van phong nho gan nha ga. Mot buoi chieu, ong nhan duoc cuoc goi tu mot khach hang can ho tro ve don hang. Ong Hoang kiem tra may tinh, cung cap thong tin dung va hua se gui mot email tom tat.",
        "estimated_seconds": 54,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "What does the customer need help with?",
                "choices_json": ["A train ticket", "An office computer", "An order", "A homework task"],
                "correct_answer": {"option": "An order"},
                "explanation": "The customer needs help with an order.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "Mr. Hoang promises to send an email summary.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "True"},
                "explanation": "The final clause says he promises to send one.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "Mr. Hoang checks the ____ before answering.",
                "choices_json": [],
                "correct_answer": {"text": "computer"},
                "explanation": "He checks the computer first.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "Weekend Picnic",
        "topic": "family",
        "level": "A2",
        "transcript": "On Sunday morning, Hoa's family drives to a riverside park for a picnic. Her father sets up a large mat while her mother prepares fruit and sandwiches. After lunch, the children play badminton and take photos near the water.",
        "translation_vi": "Vao sang Chu nhat, gia dinh cua Hoa lai xe den mot cong vien ben song de di da ngoai. Bo cua Hoa trai mot tam tham lon trong khi me chuan bi trai cay va banh sandwich. Sau bua trua, bon tre choi cau long va chup anh gan bo nuoc.",
        "estimated_seconds": 50,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "Where does Hoa's family go on Sunday morning?",
                "choices_json": ["To a mountain village", "To a riverside park", "To a shopping mall", "To a school yard"],
                "correct_answer": {"option": "To a riverside park"},
                "explanation": "The first sentence says they drive to a riverside park.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "Hoa's mother prepares fruit and sandwiches.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "True"},
                "explanation": "The passage states this directly.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "After lunch, the children play ____.",
                "choices_json": [],
                "correct_answer": {"text": "badminton"},
                "explanation": "They play badminton after lunch.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "Doctor's Advice",
        "topic": "health",
        "level": "A2",
        "transcript": "Lan visits the doctor because she often feels tired after school. The doctor asks about her sleep, exercise, and breakfast. At the end of the visit, he advises Lan to sleep earlier, drink more water, and walk for twenty minutes each day.",
        "translation_vi": "Lan den gap bac si vi ban ay thuong cam thay met sau gio hoc. Bac si hoi ve giac ngu, viec tap the duc va bua sang cua Lan. Cuoi buoi kham, bac si khuyen Lan ngu som hon, uong nhieu nuoc hon va di bo hai muoi phut moi ngay.",
        "estimated_seconds": 56,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "Why does Lan visit the doctor?",
                "choices_json": ["She has a broken arm", "She feels tired after school", "She loses her keys", "She needs a new book"],
                "correct_answer": {"option": "She feels tired after school"},
                "explanation": "The first sentence explains the reason.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "The doctor tells Lan to drink less water.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "False"},
                "explanation": "He advises her to drink more water.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "The doctor advises Lan to walk for ____ minutes each day.",
                "choices_json": [],
                "correct_answer": {"text": "twenty"},
                "explanation": "He recommends twenty minutes of walking.",
                "order_index": 3,
            },
        ],
    },
    {
        "title": "Library Visit",
        "topic": "school",
        "level": "A2",
        "transcript": "Two students visit the town library to prepare for a history project. They borrow one book about ancient cities and take notes from a magazine article. Before leaving, they ask the librarian where they can find more information online.",
        "translation_vi": "Hai hoc sinh den thu vien thi tran de chuan bi cho mot du an lich su. Cac ban muon mot quyen sach ve cac thanh pho co dai va ghi chu tu mot bai bao trong tap chi. Truoc khi roi di, cac ban hoi thu thu ve noi co the tim them thong tin tren mang.",
        "estimated_seconds": 52,
        "questions": [
            {
                "question_type": "multiple_choice",
                "prompt": "Why do the students visit the library?",
                "choices_json": ["To play games", "To prepare for a history project", "To meet their teacher", "To buy a magazine"],
                "correct_answer": {"option": "To prepare for a history project"},
                "explanation": "The first sentence gives the purpose.",
                "order_index": 1,
            },
            {
                "question_type": "true_false",
                "prompt": "They borrow a book about ancient cities.",
                "choices_json": ["True", "False"],
                "correct_answer": {"option": "True"},
                "explanation": "The passage says they borrow one book about ancient cities.",
                "order_index": 2,
            },
            {
                "question_type": "fill_blank",
                "prompt": "Before leaving, they ask the ____ for more information.",
                "choices_json": [],
                "correct_answer": {"text": "librarian"},
                "explanation": "They ask the librarian where to find more information online.",
                "order_index": 3,
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed 10 standalone listening passages with demo questions."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Delete existing standalone listening passages first.")

    def handle(self, *args, **options):
        if options["clear"]:
            ListeningAnswer.objects.all().delete()
            ListeningSession.objects.all().delete()
            ListeningQuestion.objects.all().delete()
            ListeningPassage.objects.all().delete()

        admin = self._resolve_admin()
        created = 0
        updated = 0

        for spec in PASSAGES:
            passage, created_flag = ListeningPassage.objects.update_or_create(
                title=spec["title"],
                defaults={
                    "topic": spec["topic"],
                    "level": spec["level"],
                    "transcript": spec["transcript"],
                    "translation_vi": spec["translation_vi"],
                    "estimated_seconds": spec["estimated_seconds"],
                    "tts_lang": "en-US",
                    "tts_rate": 0.9,
                    "is_published": True,
                    "created_by": admin,
                },
            )
            ListeningQuestion.objects.filter(passage=passage).delete()
            for question in spec["questions"]:
                ListeningQuestion.objects.create(passage=passage, **question)

            if created_flag:
                created += 1
            else:
                updated += 1

        total_questions = ListeningQuestion.objects.filter(passage__title__in=[item["title"] for item in PASSAGES]).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Listening demo seeded. passages_created={created}, passages_updated={updated}, total_questions={total_questions}"
            )
        )

    def _resolve_admin(self):
        User = get_user_model()
        admin = User.objects.filter(role=User.Role.ADMIN).order_by("id").first()
        if admin:
            return admin
        return User.objects.create_user(
            username="listening_seed_admin",
            email="listening.seed@example.com",
            password="Pass123!",
            role=User.Role.ADMIN,
            is_active=True,
            email_verified=True,
        )
