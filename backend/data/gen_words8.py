"""Batch 8: ~250 từ để vượt 2000."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django; django.setup()
from apps.vocabulary.models import Word

WORDS = [
    # B1 - verbs (unique ones not yet added)
    ("admit", "/ədˈmɪt/", "verb", "to say something is true", "thừa nhận", "He admitted making a mistake.", "Anh ấy thừa nhận đã mắc lỗi.", "B1"),
    ("argue", "/ˈɑːrɡjuː/", "verb", "to disagree in words", "tranh luận", "They argued about the decision.", "Họ tranh luận về quyết định đó.", "B1"),
    ("arrange", "/əˈreɪndʒ/", "verb", "to organise or plan something", "sắp xếp", "She arranged the furniture.", "Cô ấy sắp xếp đồ nội thất.", "B1"),
    ("attend", "/əˈtend/", "verb", "to be present at an event", "tham dự", "She attended the conference.", "Cô ấy tham dự hội nghị.", "B1"),
    ("avoid", "/əˈvɔɪd/", "verb", "to stay away from something", "tránh", "Avoid sugar for better health.", "Tránh đường để khỏe hơn.", "B1"),
    ("blame", "/bleɪm/", "verb", "to say someone is responsible", "đổ lỗi", "Don't blame others for your mistakes.", "Đừng đổ lỗi cho người khác.", "B1"),
    ("borrow", "/ˈbɒrəʊ/", "verb", "to take something with permission", "mượn", "Can I borrow your pen?", "Tôi có thể mượn bút của bạn không?", "B1"),
    ("cancel", "/ˈkænsəl/", "verb", "to decide not to do something planned", "hủy", "She cancelled the meeting.", "Cô ấy hủy cuộc họp.", "B1"),
    ("celebrate", "/ˈselɪbreɪt/", "verb", "to do something special for a good event", "kỷ niệm/ăn mừng", "They celebrated his birthday.", "Họ kỷ niệm sinh nhật của anh ấy.", "B1"),
    ("concentrate", "/ˈkɒnsəntreɪt/", "verb", "to focus your attention on", "tập trung", "Concentrate on your studies.", "Tập trung vào việc học.", "B1"),
    ("confirm", "/kənˈfɜːrm/", "verb", "to state that something is definite", "xác nhận", "Please confirm your booking.", "Vui lòng xác nhận đặt chỗ.", "B1"),
    ("contain", "/kənˈteɪn/", "verb", "to have something inside", "chứa đựng", "The bottle contains 500ml.", "Chai chứa 500ml.", "B1"),
    ("continue", "/kənˈtɪnjuː/", "verb", "to carry on doing something", "tiếp tục", "Continue reading the chapter.", "Tiếp tục đọc chương.", "B1"),
    ("convince", "/kənˈvɪns/", "verb", "to make someone believe something", "thuyết phục", "She convinced him to go.", "Cô ấy thuyết phục anh ấy đi.", "B1"),
    ("criticise", "/ˈkrɪtɪsaɪz/", "verb", "to express disapproval of someone", "phê bình", "Don't criticise without suggestions.", "Đừng phê bình mà không có gợi ý.", "B1"),
    ("decide", "/dɪˈsaɪd/", "verb", "to make a choice", "quyết định", "He decided to stay.", "Anh ấy quyết định ở lại.", "B1"),
    ("discuss", "/dɪˈskʌs/", "verb", "to talk about something with others", "thảo luận", "Let's discuss the problem.", "Hãy thảo luận về vấn đề.", "B1"),
    ("earn", "/ɜːrn/", "verb", "to receive money for work", "kiếm được", "She earns a good salary.", "Cô ấy kiếm được mức lương tốt.", "B1"),
    ("encourage", "/ɪnˈkʌrɪdʒ/", "verb", "to give support and confidence", "khuyến khích", "He encouraged her to keep going.", "Anh ấy khuyến khích cô ấy tiếp tục.", "B1"),
    ("examine", "/ɪɡˈzæmɪn/", "verb", "to look at something carefully", "kiểm tra kỹ", "The doctor examined the patient.", "Bác sĩ kiểm tra bệnh nhân.", "B1"),
    ("expand", "/ɪkˈspænd/", "verb", "to make something larger", "mở rộng", "The company expanded overseas.", "Công ty mở rộng ra nước ngoài.", "B1"),
    ("explain", "/ɪkˈspleɪn/", "verb", "to make something clear", "giải thích", "Please explain your answer.", "Vui lòng giải thích câu trả lời.", "B1"),
    ("express", "/ɪkˈspres/", "verb", "to show feelings in words or actions", "bày tỏ", "Express yourself clearly.", "Hãy bày tỏ bản thân rõ ràng.", "B1"),
    ("fail", "/feɪl/", "verb", "to not succeed", "thất bại", "He failed the test.", "Anh ấy thi trượt.", "B1"),
    ("focus", "/ˈfəʊkəs/", "verb", "to concentrate on one thing", "tập trung vào", "Focus on your goal.", "Tập trung vào mục tiêu.", "B1"),
    ("gain", "/ɡeɪn/", "verb", "to obtain something", "đạt được/kiếm được", "Gain experience before applying.", "Tích lũy kinh nghiệm trước khi nộp đơn.", "B1"),
    ("gather", "/ˈɡæðər/", "verb", "to collect things together", "thu thập", "Gather information carefully.", "Thu thập thông tin cẩn thận.", "B1"),
    ("guess", "/ɡes/", "verb", "to give an answer without knowing", "đoán", "Can you guess the answer?", "Bạn có thể đoán câu trả lời không?", "B1"),
    ("handle", "/ˈhændəl/", "verb", "to deal with a situation", "xử lý", "She handled the crisis well.", "Cô ấy xử lý khủng hoảng tốt.", "B1"),
    ("hesitate", "/ˈhezɪteɪt/", "verb", "to pause before doing something", "do dự", "Don't hesitate to ask.", "Đừng do dự khi hỏi.", "B1"),
    # B2 - nouns for academic writing
    ("aspect", "/ˈæspekt/", "noun", "a particular part of something", "khía cạnh", "Consider every aspect of the problem.", "Xem xét mọi khía cạnh của vấn đề.", "B2"),
    ("consequence", "/ˈkɒnsɪkwəns/", "noun", "a result of an action", "hệ quả", "Think about the consequences.", "Hãy nghĩ về hệ quả.", "B2"),
    ("context", "/ˈkɒntekst/", "noun", "the circumstances around something", "bối cảnh", "Understand the historical context.", "Hiểu bối cảnh lịch sử.", "B2"),
    ("factor", "/ˈfæktər/", "noun", "something that contributes to a result", "nhân tố", "Several factors affect the outcome.", "Nhiều nhân tố ảnh hưởng đến kết quả.", "B2"),
    ("feature", "/ˈfiːtʃər/", "noun", "an important part or aspect", "đặc điểm/tính năng", "This is a key feature.", "Đây là một đặc điểm quan trọng.", "B2"),
    ("impact", "/ˈɪmpækt/", "noun", "a strong effect or influence", "tác động", "The impact was significant.", "Tác động rất đáng kể.", "B2"),
    ("issue", "/ˈɪʃuː/", "noun", "an important topic or problem", "vấn đề/chủ đề", "Climate change is a global issue.", "Biến đổi khí hậu là vấn đề toàn cầu.", "B2"),
    ("pattern", "/ˈpætərn/", "noun", "a regular arrangement or sequence", "mô hình/kiểu", "Identify the pattern in the data.", "Xác định mô hình trong dữ liệu.", "B2"),
    ("process", "/ˈprəʊses/", "noun", "a series of steps to achieve something", "quy trình", "Follow the process step by step.", "Làm theo quy trình từng bước.", "B2"),
    ("research", "/rɪˈsɜːrtʃ/", "noun", "careful study to discover facts", "nghiên cứu", "She conducted extensive research.", "Cô ấy tiến hành nghiên cứu sâu rộng.", "B2"),
    ("resource", "/rɪˈzɔːrs/", "noun", "something useful for a purpose", "nguồn lực", "Manage your resources wisely.", "Quản lý nguồn lực khôn ngoan.", "B2"),
    ("role", "/rəʊl/", "noun", "the part someone plays in a situation", "vai trò", "What is your role in the team?", "Vai trò của bạn trong nhóm là gì?", "B2"),
    ("scale", "/skeɪl/", "noun", "the size or extent of something", "quy mô", "The project is large in scale.", "Dự án có quy mô lớn.", "B2"),
    ("structure", "/ˈstrʌktʃər/", "noun", "the way something is built or organized", "cấu trúc", "The structure of the essay is clear.", "Cấu trúc của bài luận rõ ràng.", "B2"),
    ("trend", "/trend/", "noun", "a general direction of change", "xu hướng", "Follow the latest trends.", "Theo dõi xu hướng mới nhất.", "B2"),
    # TOEIC - management & strategy
    ("objective", "/əbˈdʒektɪv/", "noun", "a goal to be achieved", "mục tiêu", "Set clear objectives.", "Đặt ra các mục tiêu rõ ràng.", "TOEIC"),
    ("milestone", "/ˈmaɪlstəʊn/", "noun", "an important event in a process", "cột mốc quan trọng", "Reach the first milestone.", "Đạt cột mốc đầu tiên.", "TOEIC"),
    ("stakeholder", "/ˈsteɪkˌhəʊldər/", "noun", "a person with an interest in a project", "bên liên quan", "Consult all stakeholders.", "Tham khảo ý kiến tất cả các bên liên quan.", "TOEIC"),
    ("timeline", "/ˈtaɪmlaɪn/", "noun", "a schedule showing dates of events", "dòng thời gian/lịch trình", "Set a clear timeline.", "Đặt lịch trình rõ ràng.", "TOEIC"),
    ("implementation", "/ˌɪmplɪmenˈteɪʃən/", "noun", "the process of putting a plan into action", "triển khai", "The implementation went smoothly.", "Việc triển khai diễn ra suôn sẻ.", "TOEIC"),
    ("feasibility", "/ˌfiːzɪˈbɪlɪti/", "noun", "whether something can be done", "tính khả thi", "A feasibility study was conducted.", "Một nghiên cứu khả thi đã được thực hiện.", "TOEIC"),
    ("contingency", "/kənˈtɪndʒənsi/", "noun", "a plan for unexpected events", "kế hoạch dự phòng", "Have a contingency plan ready.", "Hãy có kế hoạch dự phòng sẵn sàng.", "TOEIC"),
    ("benchmark", "/ˈbentʃmɑːrk/", "noun", "a point of reference to compare", "điểm chuẩn so sánh", "Set a performance benchmark.", "Đặt điểm chuẩn hiệu suất.", "TOEIC"),
    ("scalable", "/ˈskeɪləbəl/", "adjective", "able to grow as needed", "có thể mở rộng quy mô", "We need a scalable solution.", "Chúng ta cần giải pháp có thể mở rộng.", "TOEIC"),
    ("viable", "/ˈvaɪəbəl/", "adjective", "workable and achievable", "khả thi/có thể thực hiện", "Is this a viable option?", "Đây có phải là lựa chọn khả thi không?", "TOEIC"),
    # A2 - frequency adverbs
    ("always", "/ˈɔːlweɪz/", "adverb", "at all times", "luôn luôn", "She always arrives early.", "Cô ấy luôn đến sớm.", "A2"),
    ("usually", "/ˈjuːʒuəli/", "adverb", "in most cases", "thường thường", "He usually eats at home.", "Anh ấy thường ăn ở nhà.", "A2"),
    ("often", "/ˈɒfən/", "adverb", "many times", "thường xuyên", "She often goes to the gym.", "Cô ấy thường xuyên đến phòng tập.", "A2"),
    ("sometimes", "/ˈsʌmtaɪmz/", "adverb", "on some occasions", "đôi khi", "He sometimes forgets.", "Anh ấy đôi khi quên.", "A2"),
    ("seldom", "/ˈseldəm/", "adverb", "not very often", "hiếm khi", "She seldom watches TV.", "Cô ấy hiếm khi xem TV.", "A2"),
    ("never", "/ˈnevər/", "adverb", "not at any time", "không bao giờ", "He never gives up.", "Anh ấy không bao giờ bỏ cuộc.", "A2"),
    ("once", "/wʌns/", "adverb", "one time", "một lần", "She visited once a year.", "Cô ấy ghé thăm một lần mỗi năm.", "A2"),
    ("twice", "/twaɪs/", "adverb", "two times", "hai lần", "He jogs twice a day.", "Anh ấy chạy bộ hai lần mỗi ngày.", "A2"),
    ("daily", "/ˈdeɪli/", "adverb", "every day", "hàng ngày", "Exercise daily for good health.", "Tập thể dục hàng ngày để có sức khoẻ tốt.", "A2"),
    ("weekly", "/ˈwiːkli/", "adverb", "once every week", "hàng tuần", "They meet weekly.", "Họ gặp nhau hàng tuần.", "A2"),
    ("monthly", "/ˈmʌnθli/", "adverb", "once every month", "hàng tháng", "She pays rent monthly.", "Cô ấy trả tiền thuê hàng tháng.", "A2"),
    ("yearly", "/ˈjɪərli/", "adverb", "once every year", "hàng năm", "They take a yearly holiday.", "Họ đi nghỉ hàng năm.", "A2"),
    # C1 - final batch
    ("acquiesce", "/ˌækwiˈes/", "verb", "to accept something without protest", "chấp thuận (miễn cưỡng)", "She acquiesced to the demands.", "Cô ấy chấp thuận những yêu cầu.", "C1"),
    ("allude", "/əˈluːd/", "verb", "to refer to something indirectly", "ám chỉ", "He alluded to past mistakes.", "Anh ấy ám chỉ đến những lỗi lầm cũ.", "C1"),
    ("bolster", "/ˈbəʊlstər/", "verb", "to support or strengthen", "tăng cường/củng cố", "Exercise bolsters your immune system.", "Tập thể dục tăng cường hệ miễn dịch.", "C1"),
    ("circumvent", "/ˌsɜːrkəmˈvent/", "verb", "to find a way around a rule", "lách qua/né tránh", "He circumvented the rules.", "Anh ấy lách qua các quy tắc.", "C1"),
    ("coerce", "/kəʊˈɜːrs/", "verb", "to force someone to do something", "ép buộc", "You cannot coerce people.", "Bạn không thể ép buộc người khác.", "C1"),
    ("culminate", "/ˈkʌlmɪneɪt/", "verb", "to reach the highest point", "lên đến đỉnh điểm", "The project culminated in success.", "Dự án lên đến đỉnh điểm thành công.", "C1"),
    ("depict", "/dɪˈpɪkt/", "verb", "to show or represent in a picture", "miêu tả/khắc họa", "The painting depicts a village.", "Bức tranh khắc họa một ngôi làng.", "C1"),
    ("dismiss", "/dɪsˈmɪs/", "verb", "to treat something as unimportant", "bác bỏ/bỏ qua", "Don't dismiss her suggestion.", "Đừng bác bỏ đề xuất của cô ấy.", "C1"),
    ("divert", "/daɪˈvɜːrt/", "verb", "to change the direction of something", "chuyển hướng", "Divert traffic to avoid congestion.", "Chuyển hướng giao thông để tránh ùn tắc.", "C1"),
    ("encompass", "/ɪnˈkʌmpəs/", "verb", "to include a wide range of things", "bao gồm", "The project encompasses many tasks.", "Dự án bao gồm nhiều nhiệm vụ.", "C1"),
    ("engender", "/ɪnˈdʒendər/", "verb", "to cause or give rise to", "sinh ra/gây ra", "Trust engenders loyalty.", "Sự tin tưởng tạo ra lòng trung thành.", "C1"),
    ("exacerbate", "/ɪɡˈzæsərbeɪt/", "verb", "to make a problem worse", "làm trầm trọng hơn", "Stress exacerbates the problem.", "Căng thẳng làm vấn đề trầm trọng hơn.", "C1"),
    ("impede", "/ɪmˈpiːd/", "verb", "to delay or prevent progress", "cản trở", "Bureaucracy impedes progress.", "Quan liêu cản trở tiến bộ.", "C1"),
    ("infer", "/ɪnˈfɜːr/", "verb", "to reach a conclusion from evidence", "suy luận", "What can you infer from the data?", "Bạn có thể suy luận gì từ dữ liệu?", "C1"),
    ("invoke", "/ɪnˈvəʊk/", "verb", "to call upon a law or authority", "viện dẫn/kêu gọi", "She invoked her right to silence.", "Cô ấy viện dẫn quyền im lặng của mình.", "C1"),
    ("negate", "/nɪˈɡeɪt/", "verb", "to cancel out the effect of something", "phủ nhận/vô hiệu hóa", "Exercise negates some health risks.", "Tập thể dục vô hiệu hóa một số rủi ro sức khỏe.", "C1"),
    ("perpetuate", "/pərˈpetʃueɪt/", "verb", "to cause something to continue", "duy trì/tiếp tục", "Don't perpetuate harmful myths.", "Đừng duy trì những quan niệm sai lầm.", "C1"),
    ("reinforce", "/ˌriːɪnˈfɔːrs/", "verb", "to make something stronger", "củng cố", "Reinforce positive habits.", "Củng cố những thói quen tích cực.", "C1"),
    ("supersede", "/ˌsuːpərˈsiːd/", "verb", "to replace something older", "thay thế", "Digital tools supersede old ones.", "Công cụ kỹ thuật số thay thế công cụ cũ.", "C1"),
    ("transcend", "/trænˈsend/", "verb", "to go beyond the limits of something", "vượt qua", "Her talent transcends boundaries.", "Tài năng của cô ấy vượt qua ranh giới.", "C1"),
    # IELTS - social issues
    ("disparity", "/dɪˈspærɪti/", "noun", "a great difference in something", "sự chênh lệch", "Income disparity is growing.", "Sự chênh lệch thu nhập đang tăng.", "C1"),
    ("marginalise", "/ˈmɑːrdʒɪnəlaɪz/", "verb", "to treat a group as unimportant", "gạt ra ngoài lề", "Don't marginalise minority groups.", "Đừng gạt các nhóm thiểu số ra ngoài lề.", "C1"),
    ("alleviate", "/əˈliːvieɪt/", "verb", "to make suffering less severe", "giảm bớt", "Aid alleviates suffering.", "Viện trợ giảm bớt đau khổ.", "C1"),
    ("condemn", "/kənˈdem/", "verb", "to express strong disapproval", "lên án", "They condemned the violence.", "Họ lên án bạo lực.", "C1"),
    ("rehabilitate", "/ˌriːhəˈbɪlɪteɪt/", "verb", "to restore someone to health or society", "phục hồi", "Rehabilitate offenders through education.", "Phục hồi người phạm pháp thông qua giáo dục.", "C1"),
    ("empower", "/ɪmˈpaʊər/", "verb", "to give someone authority or confidence", "trao quyền", "Education empowers women.", "Giáo dục trao quyền cho phụ nữ.", "C1"),
    ("eradicate", "/ɪˈrædɪkeɪt/", "verb", "to destroy completely", "xóa sổ/loại bỏ hoàn toàn", "Eradicate poverty through cooperation.", "Xóa sổ nghèo đói thông qua hợp tác.", "C1"),
    ("proliferate", "/prəˈlɪfəreɪt/", "verb", "to grow rapidly in numbers", "phát triển nhanh chóng", "Fake news proliferates online.", "Tin giả lan tràn trực tuyến.", "C1"),
    ("segregate", "/ˈseɡrɪɡeɪt/", "verb", "to separate groups from each other", "phân tách", "Society must not segregate people.", "Xã hội không được phân tách con người.", "C1"),
    ("assimilate", "/əˈsɪmɪleɪt/", "verb", "to absorb and integrate fully", "đồng hóa/hội nhập", "Immigrants assimilate over time.", "Người nhập cư hội nhập theo thời gian.", "C1"),
]


def run():
    created = 0
    skipped = 0
    for item in WORDS:
        text, phonetic, pos, def_en, def_vi, ex_en, ex_vi, level = item
        _, is_new = Word.objects.get_or_create(
            text=text,
            defaults={
                "phonetic": phonetic,
                "part_of_speech": pos,
                "definition_en": def_en,
                "definition_vi": def_vi,
                "example_en": ex_en,
                "example_vi": ex_vi,
                "level": level,
            },
        )
        if is_new:
            created += 1
        else:
            skipped += 1
    total = Word.objects.count()
    print(f"Hoàn thành: {created} từ mới, {skipped} bỏ qua.")
    print(f"Tổng từ vựng hiện tại: {total}")


run()
