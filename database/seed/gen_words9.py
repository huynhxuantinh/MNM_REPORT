"""Batch 9: ~200 từ để đạt 2000+."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django; django.setup()
from apps.vocabulary.models import Word

WORDS = [
    # A2 - describing location
    ("corner", "/ˈkɔːrnər/", "noun", "the point where two lines or walls meet", "góc", "Wait at the corner.", "Chờ ở góc đường.", "A2"),
    ("edge", "/edʒ/", "noun", "the outside limit of something", "mép/cạnh", "Stand at the edge carefully.", "Đứng ở mép cẩn thận.", "A2"),
    ("centre", "/ˈsentər/", "noun", "the middle point of something", "trung tâm", "The café is in the centre.", "Quán cà phê ở trung tâm.", "A2"),
    ("entrance", "/ˈentrəns/", "noun", "the door or gate you enter through", "lối vào", "Meet me at the entrance.", "Gặp tôi ở lối vào.", "A2"),
    ("exit", "/ˈeksɪt/", "noun", "the way out of a place", "lối ra", "Use the emergency exit.", "Dùng lối ra khẩn cấp.", "A2"),
    ("upstairs", "/ˌʌpˈsteərz/", "adverb", "on or to a higher floor", "tầng trên", "She went upstairs.", "Cô ấy đi lên tầng trên.", "A2"),
    ("downstairs", "/ˌdaʊnˈsteərz/", "adverb", "on or to a lower floor", "tầng dưới", "The kitchen is downstairs.", "Nhà bếp ở tầng dưới.", "A2"),
    ("nearby", "/ˌnɪərˈbaɪ/", "adjective", "not far away", "gần đây", "There is a park nearby.", "Có một công viên gần đây.", "A2"),
    ("far", "/fɑːr/", "adverb", "at a great distance", "xa", "The school is far from here.", "Trường học xa đây.", "A2"),
    ("local", "/ˈləʊkəl/", "adjective", "relating to the area you live in", "địa phương", "Support local businesses.", "Ủng hộ doanh nghiệp địa phương.", "A2"),
    # B1 - talking about language
    ("phrase", "/freɪz/", "noun", "a small group of words", "cụm từ", "Learn useful phrases.", "Học các cụm từ hữu ích.", "B1"),
    ("idiom", "/ˈɪdiəm/", "noun", "a phrase with a non-literal meaning", "thành ngữ", "Idioms are tricky to learn.", "Thành ngữ khó học.", "B1"),
    ("slang", "/slæŋ/", "noun", "informal words used in conversation", "tiếng lóng", "Slang changes over time.", "Tiếng lóng thay đổi theo thời gian.", "B1"),
    ("proverb", "/ˈprɒvɜːrb/", "noun", "a short sentence expressing a truth", "tục ngữ", "Every culture has its proverbs.", "Mỗi nền văn hóa có tục ngữ riêng.", "B1"),
    ("synonym", "/ˈsɪnənɪm/", "noun", "a word with the same meaning as another", "từ đồng nghĩa", "Happy is a synonym for joyful.", "Happy là từ đồng nghĩa với joyful.", "B1"),
    ("antonym", "/ˈæntənɪm/", "noun", "a word with the opposite meaning", "từ trái nghĩa", "Hot is the antonym of cold.", "Hot là từ trái nghĩa của cold.", "B1"),
    ("abbreviation", "/əˌbriːviˈeɪʃən/", "noun", "a shortened form of a word", "từ viết tắt", "UNESCO is an abbreviation.", "UNESCO là một từ viết tắt.", "B1"),
    ("context clue", "/ˈkɒntekst kluː/", "noun", "a hint in the text to guess a word's meaning", "gợi ý từ ngữ cảnh", "Use context clues to guess meaning.", "Dùng gợi ý ngữ cảnh để đoán nghĩa.", "B1"),
    ("tense", "/tens/", "noun", "a form of a verb showing time", "thì (ngữ pháp)", "Use the correct tense.", "Dùng đúng thì.", "B1"),
    ("clause", "/klɔːz/", "noun", "a group of words with subject and verb", "mệnh đề", "A sentence has at least one clause.", "Câu có ít nhất một mệnh đề.", "B1"),
    # B2 - work environment
    ("remote work", "/rɪˈməʊt wɜːrk/", "noun", "working from home or another location", "làm việc từ xa", "Remote work increased after Covid.", "Làm việc từ xa tăng sau Covid.", "B2"),
    ("hybrid model", "/ˈhaɪbrɪd ˈmɒdəl/", "noun", "a mix of remote and office work", "mô hình làm việc kết hợp", "They adopted a hybrid model.", "Họ áp dụng mô hình kết hợp.", "B2"),
    ("burnout", "/ˈbɜːrnaʊt/", "noun", "physical and emotional exhaustion from work", "kiệt sức vì công việc", "Burnout affects productivity.", "Kiệt sức ảnh hưởng đến năng suất.", "B2"),
    ("work-life balance", "/wɜːrk laɪf ˈbæləns/", "noun", "balance between professional and personal life", "cân bằng công việc - cuộc sống", "Maintain a healthy work-life balance.", "Duy trì cân bằng công việc - cuộc sống lành mạnh.", "B2"),
    ("micromanage", "/ˈmaɪkrəʊˌmænɪdʒ/", "verb", "to control every small detail of someone's work", "kiểm soát quá mức", "Don't micromanage your team.", "Đừng kiểm soát quá mức nhóm của bạn.", "B2"),
    ("mentor", "/ˈmentɔːr/", "noun", "an experienced person who guides others", "người cố vấn", "She found a great mentor.", "Cô ấy tìm được người cố vấn tuyệt vời.", "B2"),
    ("internship", "/ˈɪntɜːrnʃɪp/", "noun", "temporary work experience for students", "thực tập", "She completed a summer internship.", "Cô ấy hoàn thành kỳ thực tập hè.", "B2"),
    ("freelance", "/ˈfriːlɑːns/", "adjective", "self-employed on short-term contracts", "làm việc tự do", "He works as a freelance designer.", "Anh ấy làm thiết kế tự do.", "B2"),
    ("entrepreneur", "/ˌɒntrəprəˈnɜːr/", "noun", "someone who starts their own business", "doanh nhân", "She is a successful entrepreneur.", "Cô ấy là doanh nhân thành công.", "B2"),
    ("startup", "/ˈstɑːrtʌp/", "noun", "a newly established business", "công ty khởi nghiệp", "He founded a tech startup.", "Anh ấy thành lập một startup công nghệ.", "B2"),
    # A1 - classroom phrases
    ("please", "/pliːz/", "adverb", "used to make a polite request", "xin/vui lòng", "Please sit down.", "Vui lòng ngồi xuống.", "A1"),
    ("thank you", "/θæŋk juː/", "phrase", "used to express gratitude", "cảm ơn", "Thank you for helping.", "Cảm ơn bạn đã giúp đỡ.", "A1"),
    ("sorry", "/ˈsɒri/", "adjective", "feeling regret about something", "xin lỗi", "Sorry, I'm late.", "Xin lỗi, tôi đến muộn.", "A1"),
    ("excuse me", "/ɪkˈskjuːz miː/", "phrase", "used to politely interrupt or attract attention", "xin lỗi (khi ngắt lời)", "Excuse me, can you help?", "Xin lỗi, bạn có thể giúp không?", "A1"),
    ("of course", "/əv kɔːrs/", "phrase", "certainly, without doubt", "tất nhiên rồi", "Of course, I'll help!", "Tất nhiên, tôi sẽ giúp!", "A1"),
    ("how much", "/haʊ mʌtʃ/", "phrase", "asking about price or quantity", "bao nhiêu tiền/bao nhiêu", "How much is it?", "Bao nhiêu tiền?", "A1"),
    ("how many", "/haʊ ˈmeni/", "phrase", "asking about a countable number", "có bao nhiêu", "How many apples do you need?", "Bạn cần bao nhiêu quả táo?", "A1"),
    ("what time", "/wɒt taɪm/", "phrase", "asking about the time", "mấy giờ", "What time is it?", "Mấy giờ rồi?", "A1"),
    ("where is", "/weər ɪz/", "phrase", "asking about location", "ở đâu", "Where is the bathroom?", "Phòng tắm ở đâu?", "A1"),
    ("how far", "/haʊ fɑːr/", "phrase", "asking about distance", "cách bao xa", "How far is the station?", "Ga xe lửa cách đây bao xa?", "A1"),
    # B1 - adjectives for change
    ("drastic", "/ˈdræstɪk/", "adjective", "severe or radical in effect", "quyết liệt/mạnh mẽ", "Drastic measures were needed.", "Cần các biện pháp quyết liệt.", "B1"),
    ("gradual", "/ˈɡrædʒuəl/", "adjective", "happening slowly over time", "dần dần", "There was a gradual improvement.", "Có sự cải thiện dần dần.", "B1"),
    ("rapid", "/ˈræpɪd/", "adjective", "happening very quickly", "nhanh chóng", "The changes were rapid.", "Những thay đổi diễn ra nhanh chóng.", "B1"),
    ("dramatic", "/drəˈmætɪk/", "adjective", "sudden and striking", "kịch tính/ấn tượng", "There was a dramatic change.", "Có sự thay đổi ấn tượng.", "B1"),
    ("steady", "/ˈstedi/", "adjective", "regular and even in rate", "ổn định/đều đặn", "Steady growth is positive.", "Tăng trưởng ổn định là tích cực.", "B1"),
    ("sharp", "/ʃɑːrp/", "adjective", "sudden and abrupt in change", "đột ngột (về sự thay đổi)", "There was a sharp increase.", "Có sự tăng đột ngột.", "B1"),
    ("slight", "/slaɪt/", "adjective", "small in degree", "nhẹ/không đáng kể", "There was a slight improvement.", "Có sự cải thiện nhỏ.", "B1"),
    ("considerable", "/kənˈsɪdərəbəl/", "adjective", "notably large in size", "đáng kể", "There was considerable progress.", "Có tiến bộ đáng kể.", "B1"),
    ("marginal", "/ˈmɑːrdʒɪnəl/", "adjective", "very small in degree", "không đáng kể", "The difference was marginal.", "Sự khác biệt không đáng kể.", "B1"),
    ("excessive", "/ɪkˈsesɪv/", "adjective", "more than is necessary", "quá mức", "Excessive stress harms health.", "Căng thẳng quá mức hại sức khỏe.", "B1"),
    # C1 - formal nouns
    ("assertion", "/əˈsɜːrʃən/", "noun", "a confident statement of a fact", "khẳng định", "Her assertion was challenged.", "Sự khẳng định của cô ấy bị thách thức.", "C1"),
    ("inference", "/ˈɪnfərəns/", "noun", "a conclusion reached from evidence", "sự suy luận", "Draw an inference from the data.", "Rút ra suy luận từ dữ liệu.", "C1"),
    ("juxtaposition", "/ˌdʒʌkstəpəˈzɪʃən/", "noun", "placing two things side by side", "sự đặt cạnh nhau", "Use juxtaposition to show contrast.", "Dùng sự đặt cạnh nhau để thể hiện tương phản.", "C1"),
    ("manifestation", "/ˌmænɪfɪˈsteɪʃən/", "noun", "a sign or indication of something", "biểu hiện", "The rash is a manifestation of illness.", "Phát ban là biểu hiện của bệnh.", "C1"),
    ("obsolescence", "/ˌɒbsəˈlesəns/", "noun", "the process of becoming outdated", "sự lỗi thời", "Planned obsolescence hurts consumers.", "Sự lỗi thời có kế hoạch gây hại cho người tiêu dùng.", "C1"),
    ("paradigm", "/ˈpærədaɪm/", "noun", "a typical example or pattern", "mô hình tư duy", "A paradigm shift changed science.", "Sự chuyển dịch mô hình tư duy đã thay đổi khoa học.", "C1"),
    ("precedent", "/ˈpresɪdənt/", "noun", "an earlier event used as an example", "tiền lệ", "Set a legal precedent.", "Tạo ra tiền lệ pháp lý.", "C1"),
    ("rhetoric", "/ˈretərɪk/", "noun", "persuasive or impressive language", "lời lẽ hoa mỹ", "His speech was full of rhetoric.", "Bài phát biểu của anh ấy đầy lời hoa mỹ.", "C1"),
    ("synthesis", "/ˈsɪnθɪsɪs/", "noun", "a combination of ideas or substances", "tổng hợp", "Create a synthesis of the findings.", "Tạo ra tổng hợp các phát hiện.", "C1"),
    ("abstraction", "/æbˈstrækʃən/", "noun", "the quality of dealing with ideas", "sự trừu tượng", "Philosophy deals in abstraction.", "Triết học đề cập đến sự trừu tượng.", "C1"),
    # TOEIC extra
    ("remittance", "/rɪˈmɪtəns/", "noun", "money sent to someone abroad", "tiền gửi về", "She sends a monthly remittance.", "Cô ấy gửi tiền hàng tháng về nhà.", "TOEIC"),
    ("procurement", "/prəˈkjʊərmənt/", "noun", "the process of obtaining supplies", "mua sắm/thu mua", "Handle the procurement process.", "Xử lý quy trình thu mua.", "TOEIC"),
    ("endorsement", "/ɪnˈdɔːrsmənt/", "noun", "an official approval or support", "sự xác nhận/ủng hộ", "The endorsement boosted sales.", "Sự xác nhận thúc đẩy doanh số.", "TOEIC"),
    ("moratorium", "/ˌmɒrəˈtɔːriəm/", "noun", "a temporary ban on an activity", "lệnh tạm hoãn", "A moratorium on payments was issued.", "Lệnh tạm hoãn thanh toán được ban hành.", "TOEIC"),
    ("arbitration", "/ˌɑːrbɪˈtreɪʃən/", "noun", "a method to resolve disputes", "trọng tài/hòa giải", "Settle the dispute through arbitration.", "Giải quyết tranh chấp qua trọng tài.", "TOEIC"),
    ("liability insurance", "/ˌlaɪəˈbɪlɪti ɪnˈʃʊərəns/", "noun", "insurance covering legal obligations", "bảo hiểm trách nhiệm", "Get liability insurance for the business.", "Mua bảo hiểm trách nhiệm cho doanh nghiệp.", "TOEIC"),
    ("indemnify", "/ɪnˈdemnɪfaɪ/", "verb", "to compensate for damage or loss", "bồi thường thiệt hại", "The company will indemnify victims.", "Công ty sẽ bồi thường cho các nạn nhân.", "TOEIC"),
    ("liquidate", "/ˈlɪkwɪdeɪt/", "verb", "to convert assets into cash", "thanh lý", "They decided to liquidate the assets.", "Họ quyết định thanh lý tài sản.", "TOEIC"),
    ("valuation", "/ˌvæljuˈeɪʃən/", "noun", "an estimate of an asset's worth", "định giá tài sản", "Get a property valuation.", "Lấy định giá bất động sản.", "TOEIC"),
    ("dividends", "/ˈdɪvɪdendz/", "noun", "sums of money paid to shareholders", "cổ tức", "They declared dividends this quarter.", "Họ công bố cổ tức quý này.", "TOEIC"),
    # B2 - technology & innovation
    ("prototype", "/ˈprəʊtətaɪp/", "noun", "an early model of a product", "nguyên mẫu", "Build a prototype first.", "Xây dựng nguyên mẫu trước.", "B2"),
    ("iterate", "/ˈɪtəreɪt/", "verb", "to repeat a process to improve it", "lặp đi lặp lại để cải tiến", "Iterate the design based on feedback.", "Lặp lại thiết kế dựa trên phản hồi.", "B2"),
    ("disruptive", "/dɪsˈrʌptɪv/", "adjective", "causing major changes in a field", "có tính đột phá", "AI is a disruptive technology.", "AI là công nghệ có tính đột phá.", "B2"),
    ("interoperability", "/ˌɪntərˌɒpərəˈbɪlɪti/", "noun", "ability of systems to work together", "khả năng tương tác", "Ensure interoperability between systems.", "Đảm bảo khả năng tương tác giữa các hệ thống.", "B2"),
    ("blockchain", "/ˈblɒktʃeɪn/", "noun", "a digital distributed ledger system", "chuỗi khối (blockchain)", "Blockchain ensures data security.", "Blockchain đảm bảo bảo mật dữ liệu.", "B2"),
    ("virtual reality", "/ˌvɜːrtʃuəl riˈæləti/", "noun", "a simulated digital environment", "thực tế ảo", "Virtual reality is used in training.", "Thực tế ảo được dùng trong đào tạo.", "B2"),
    ("augmented reality", "/ɔːɡˌmentɪd riˈæləti/", "noun", "digital content overlaid on the real world", "thực tế tăng cường", "Augmented reality enhances gaming.", "Thực tế tăng cường nâng cao trải nghiệm game.", "B2"),
    ("big data", "/bɪɡ ˈdeɪtə/", "noun", "extremely large data sets", "dữ liệu lớn", "Big data transforms business decisions.", "Dữ liệu lớn chuyển đổi quyết định kinh doanh.", "B2"),
    ("cyberthreat", "/ˈsaɪbərθret/", "noun", "a possible attack on computer systems", "mối đe dọa mạng", "Cyberthreats are increasing globally.", "Mối đe dọa mạng đang tăng toàn cầu.", "B2"),
    ("digital transformation", "/ˈdɪdʒɪtəl ˌtrænsˌfɔːrˈmeɪʃən/", "noun", "adopting digital technology in business", "chuyển đổi số", "Digital transformation is essential.", "Chuyển đổi số là cần thiết.", "B2"),
    # A2 - sports verbs
    ("kick", "/kɪk/", "verb", "to hit something with your foot", "đá", "Kick the ball into the goal.", "Đá bóng vào lưới.", "A2"),
    ("throw", "/θrəʊ/", "verb", "to send something through the air", "ném", "Throw the ball to me.", "Ném bóng cho tôi.", "A2"),
    ("catch", "/kætʃ/", "verb", "to take hold of something in the air", "bắt", "Catch the ball!", "Bắt bóng!", "A2"),
    ("hit", "/hɪt/", "verb", "to strike something forcefully", "đánh/đập", "Hit the ball with the bat.", "Đánh bóng bằng gậy.", "A2"),
    ("score", "/skɔːr/", "verb", "to earn a point in a game", "ghi điểm", "She scored the winning goal.", "Cô ấy ghi bàn thắng quyết định.", "A2"),
    ("win", "/wɪn/", "verb", "to achieve first place in a contest", "thắng", "Did you win the match?", "Bạn có thắng trận đấu không?", "A2"),
    ("lose", "/luːz/", "verb", "to fail to win a contest", "thua", "They lost the game.", "Họ thua trận.", "A2"),
    ("train", "/treɪn/", "verb", "to practise and improve skills", "luyện tập", "She trains every morning.", "Cô ấy luyện tập mỗi sáng.", "A2"),
    ("compete", "/kəmˈpiːt/", "verb", "to take part in a competition", "thi đấu", "He competes in marathons.", "Anh ấy thi đấu trong các cuộc đua marathon.", "A2"),
    ("cheer", "/tʃɪər/", "verb", "to shout support for a team", "cổ vũ", "The crowd cheered loudly.", "Đám đông cổ vũ ồn ào.", "A2"),
    # B1 - school & uni
    ("curriculum", "/kəˈrɪkjʊləm/", "noun", "the subjects in a course of study", "chương trình học", "The curriculum includes science.", "Chương trình học bao gồm khoa học.", "B1"),
    ("tutor", "/ˈtjuːtər/", "noun", "a teacher who teaches privately", "gia sư", "She has a maths tutor.", "Cô ấy có gia sư toán.", "B1"),
    ("lecture", "/ˈlektʃər/", "noun", "a talk to teach a large group", "bài giảng", "The lecture was two hours long.", "Bài giảng kéo dài hai tiếng.", "B1"),
    ("scholarship", "/ˈskɒlərʃɪp/", "noun", "a grant of money to study", "học bổng", "She won a full scholarship.", "Cô ấy giành học bổng toàn phần.", "B1"),
    ("thesis", "/ˈθiːsɪs/", "noun", "a long essay written for a degree", "luận văn/luận án", "He submitted his thesis.", "Anh ấy nộp luận văn.", "B1"),
    ("assignment", "/əˈsaɪnmənt/", "noun", "a task given to students", "bài tập được giao", "Submit the assignment on time.", "Nộp bài tập đúng hạn.", "B1"),
    ("semester", "/sɪˈmestər/", "noun", "half of an academic year", "học kỳ", "She is in her first semester.", "Cô ấy đang trong học kỳ đầu tiên.", "B1"),
    ("campus", "/ˈkæmpəs/", "noun", "the grounds of a university", "khuôn viên trường", "The campus is beautiful.", "Khuôn viên trường rất đẹp.", "B1"),
    ("degree", "/dɪˈɡriː/", "noun", "a qualification from a university", "bằng cấp", "She has a degree in engineering.", "Cô ấy có bằng kỹ thuật.", "B1"),
    ("graduate", "/ˈɡrædʒuɪt/", "noun", "a person who has completed a degree", "sinh viên tốt nghiệp", "He is a recent graduate.", "Anh ấy là sinh viên mới tốt nghiệp.", "B1"),
    # B2 - healthcare system
    ("physician", "/fɪˈzɪʃən/", "noun", "a medical doctor", "bác sĩ y khoa", "Consult a physician first.", "Tham khảo ý kiến bác sĩ trước.", "B2"),
    ("surgeon", "/ˈsɜːrdʒən/", "noun", "a doctor who performs operations", "bác sĩ phẫu thuật", "The surgeon saved his life.", "Bác sĩ phẫu thuật cứu sống anh ấy.", "B2"),
    ("outpatient", "/ˈaʊtpeɪʃənt/", "noun", "a patient who doesn't stay overnight", "bệnh nhân ngoại trú", "He is treated as an outpatient.", "Anh ấy được điều trị ngoại trú.", "B2"),
    ("chronic disease", "/ˈkrɒnɪk dɪˈziːz/", "noun", "a long-lasting health condition", "bệnh mãn tính", "Manage chronic disease with lifestyle changes.", "Kiểm soát bệnh mãn tính với thay đổi lối sống.", "B2"),
    ("clinical trial", "/ˈklɪnɪkəl ˈtraɪəl/", "noun", "a study testing a new medical treatment", "thử nghiệm lâm sàng", "She joined a clinical trial.", "Cô ấy tham gia thử nghiệm lâm sàng.", "B2"),
    ("pandemic", "/pænˈdemɪk/", "noun", "a worldwide disease outbreak", "đại dịch", "The pandemic affected everyone.", "Đại dịch ảnh hưởng đến mọi người.", "B2"),
    ("epidemic", "/ˌepɪˈdemɪk/", "noun", "a rapid spread of disease in a region", "dịch bệnh", "An epidemic broke out in the city.", "Một dịch bệnh bùng phát ở thành phố.", "B2"),
    ("quarantine", "/ˈkwɒrəntiːn/", "noun", "isolation to prevent spread of disease", "cách ly", "She was placed in quarantine.", "Cô ấy bị cách ly.", "B2"),
    ("sanitation", "/ˌsænɪˈteɪʃən/", "noun", "conditions relating to cleanliness", "vệ sinh môi trường", "Good sanitation prevents disease.", "Vệ sinh tốt ngăn ngừa bệnh tật.", "B2"),
    ("life expectancy", "/laɪf ɪkˈspektənsi/", "noun", "the average age people are expected to live", "tuổi thọ trung bình", "Life expectancy has risen globally.", "Tuổi thọ trung bình tăng toàn cầu.", "B2"),
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
