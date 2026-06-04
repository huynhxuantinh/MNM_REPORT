"""Batch 10: ~100 từ cuối để vượt 2000."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django; django.setup()
from apps.vocabulary.models import Word

WORDS = [
    ("accelerate", "/əkˈseləreɪt/", "verb", "to go faster", "tăng tốc độ", "The car accelerated on the highway.", "Xe tăng tốc trên cao tốc.", "B2"),
    ("acclaim", "/əˈkleɪm/", "noun", "enthusiastic public praise", "sự tán dương", "She received critical acclaim.", "Cô ấy nhận được sự tán dương.", "C1"),
    ("adhere", "/ədˈhɪər/", "verb", "to stick to rules or beliefs", "tuân thủ", "Adhere to the guidelines.", "Tuân thủ các hướng dẫn.", "C1"),
    ("advent", "/ˈædvent/", "noun", "the arrival of something important", "sự xuất hiện/ra đời", "The advent of the internet changed everything.", "Sự ra đời của internet thay đổi tất cả.", "B2"),
    ("adverse", "/ˈædvɜːrs/", "adjective", "having a harmful effect", "bất lợi/có hại", "Adverse weather delayed the flight.", "Thời tiết xấu làm chậm chuyến bay.", "B2"),
    ("advocate", "/ˈædvəkɪt/", "noun", "a person who supports a cause", "người ủng hộ", "She is an advocate for children.", "Cô ấy là người ủng hộ trẻ em.", "B2"),
    ("aesthetic", "/iːsˈθetɪk/", "adjective", "concerned with beauty", "thẩm mỹ", "The design is very aesthetic.", "Thiết kế rất thẩm mỹ.", "C1"),
    ("affluent", "/ˈæfluənt/", "adjective", "having a great deal of wealth", "giàu có", "An affluent neighbourhood.", "Một khu phố giàu có.", "C1"),
    ("agile", "/ˈædʒaɪl/", "adjective", "able to move quickly and easily", "nhanh nhẹn", "An agile team adapts fast.", "Nhóm nhanh nhẹn thích nghi nhanh.", "B2"),
    ("aggregate", "/ˈæɡrɪɡɪt/", "noun", "a total or combined amount", "tổng cộng", "The aggregate score was high.", "Điểm tổng cộng cao.", "C1"),
    ("allegiance", "/əˈliːdʒəns/", "noun", "loyalty to a person or country", "lòng trung thành", "He swore allegiance to his country.", "Anh ấy thề trung thành với đất nước.", "C1"),
    ("allocate", "/ˈæləkeɪt/", "verb", "to distribute resources officially", "phân bổ", "Allocate funds wisely.", "Phân bổ quỹ một cách khôn ngoan.", "B2"),
    ("ambition", "/æmˈbɪʃən/", "noun", "a strong desire to achieve something", "tham vọng/hoài bão", "She has great ambition.", "Cô ấy có hoài bão lớn.", "B1"),
    ("analogy", "/əˈnælədʒi/", "noun", "a comparison to explain something", "sự so sánh/tương tự", "He used an analogy to explain it.", "Anh ấy dùng sự so sánh để giải thích.", "C1"),
    ("anecdote", "/ˈænɪkdəʊt/", "noun", "a short amusing or interesting story", "câu chuyện ngắn/giai thoại", "She shared an amusing anecdote.", "Cô ấy kể một câu chuyện thú vị.", "B2"),
    ("apparatus", "/ˌæpəˈreɪtəs/", "noun", "equipment for a particular purpose", "thiết bị/máy móc", "The laboratory has modern apparatus.", "Phòng thí nghiệm có thiết bị hiện đại.", "C1"),
    ("arbitrary", "/ˈɑːrbɪtrəri/", "adjective", "based on random choice", "tùy tiện/võ đoán", "The decision seemed arbitrary.", "Quyết định có vẻ tùy tiện.", "C1"),
    ("articulate", "/ɑːˈtɪkjuleɪt/", "verb", "to express ideas clearly", "diễn đạt rõ ràng", "She articulated her views well.", "Cô ấy diễn đạt quan điểm rõ ràng.", "C1"),
    ("aspire", "/əˈspaɪər/", "verb", "to have a strong desire to achieve", "khao khát", "She aspires to be a doctor.", "Cô ấy khao khát trở thành bác sĩ.", "B2"),
    ("attain", "/əˈteɪn/", "verb", "to succeed in achieving something", "đạt được", "Attain your goals through effort.", "Đạt được mục tiêu qua nỗ lực.", "B2"),
    ("augment", "/ɔːɡˈment/", "verb", "to make something larger or stronger", "tăng cường/mở rộng", "Augment your skills with training.", "Tăng cường kỹ năng qua đào tạo.", "C1"),
    ("authorize", "/ˈɔːθəraɪz/", "verb", "to give official permission", "ủy quyền/cho phép", "He authorized the payment.", "Anh ấy cho phép thanh toán.", "B2"),
    ("barrier", "/ˈbæriər/", "noun", "something that prevents progress", "rào cản", "Language is a barrier.", "Ngôn ngữ là rào cản.", "B1"),
    ("bias", "/ˈbaɪəs/", "noun", "an unfair preference or tendency", "sự thiên vị", "Avoid confirmation bias.", "Tránh sự thiên vị xác nhận.", "B2"),
    ("breach", "/briːtʃ/", "noun", "a failure to follow a rule", "vi phạm", "A breach of contract occurred.", "Đã xảy ra vi phạm hợp đồng.", "C1"),
    ("burden", "/ˈbɜːrdən/", "noun", "something heavy or difficult to carry", "gánh nặng", "Share the burden with others.", "Chia sẻ gánh nặng với người khác.", "B1"),
    ("catalyst", "/ˈkætəlɪst/", "noun", "something that causes change", "chất xúc tác/tác nhân", "Education is a catalyst for change.", "Giáo dục là chất xúc tác cho thay đổi.", "C1"),
    ("cognition", "/kɒɡˈnɪʃən/", "noun", "mental processes of knowing and understanding", "nhận thức", "Cognition improves with practice.", "Nhận thức cải thiện qua luyện tập.", "C1"),
    ("coherence", "/kəʊˈhɪərəns/", "noun", "logical and consistent connection", "sự mạch lạc", "The essay lacks coherence.", "Bài luận thiếu mạch lạc.", "C1"),
    ("commodity", "/kəˈmɒdɪti/", "noun", "a raw material or basic product", "hàng hóa/mặt hàng", "Oil is a valuable commodity.", "Dầu là mặt hàng có giá trị.", "B2"),
    ("comply", "/kəmˈplaɪ/", "verb", "to act in accordance with rules", "tuân thủ", "Comply with the regulations.", "Tuân thủ các quy định.", "B2"),
    ("compromise", "/ˈkɒmprəmaɪz/", "noun", "an agreement by mutual concession", "sự thỏa hiệp", "Reach a compromise.", "Đạt được sự thỏa hiệp.", "B2"),
    ("concede", "/kənˈsiːd/", "verb", "to admit something is true", "thừa nhận/nhượng bộ", "He conceded defeat.", "Anh ấy thừa nhận thất bại.", "C1"),
    ("conform", "/kənˈfɔːrm/", "verb", "to behave according to accepted standards", "tuân theo", "Conform to the dress code.", "Tuân theo quy định trang phục.", "B2"),
    ("constrain", "/kənˈstreɪn/", "verb", "to limit or restrict", "hạn chế", "Budget constraints limit options.", "Hạn chế ngân sách thu hẹp lựa chọn.", "C1"),
    ("contend", "/kənˈtend/", "verb", "to compete or to argue", "tranh luận/cạnh tranh", "They contend for first place.", "Họ cạnh tranh vị trí đầu tiên.", "C1"),
    ("contradict", "/ˌkɒntrəˈdɪkt/", "verb", "to say the opposite of what was said", "mâu thuẫn", "The facts contradict the claim.", "Sự thật mâu thuẫn với tuyên bố.", "B2"),
    ("converge", "/kənˈvɜːrdʒ/", "verb", "to come together at a point", "hội tụ", "Ideas converge at the conference.", "Các ý tưởng hội tụ tại hội nghị.", "C1"),
    ("correlate", "/ˈkɒrəleɪt/", "verb", "to have a mutual connection", "tương quan", "Exercise correlates with health.", "Tập thể dục tương quan với sức khỏe.", "B2"),
    ("deter", "/dɪˈtɜːr/", "verb", "to discourage from doing something", "ngăn cản", "Fear deters risk-taking.", "Nỗi sợ ngăn cản việc liều lĩnh.", "C1"),
    ("deviate", "/ˈdiːvieɪt/", "verb", "to depart from an established course", "đi lệch hướng", "Don't deviate from the plan.", "Đừng đi lệch kế hoạch.", "C1"),
    ("diligence", "/ˈdɪlɪdʒəns/", "noun", "steady and careful effort", "sự cần cù", "Success requires diligence.", "Thành công đòi hỏi sự cần cù.", "B2"),
    ("diminish", "/dɪˈmɪnɪʃ/", "verb", "to make or become smaller", "giảm bớt", "His confidence diminished.", "Sự tự tin của anh ấy giảm bớt.", "B2"),
    ("discern", "/dɪˈsɜːrn/", "verb", "to perceive or recognize something", "nhận ra/phân biệt", "Discern the truth from lies.", "Phân biệt sự thật với lời nói dối.", "C1"),
    ("disperse", "/dɪˈspɜːrs/", "verb", "to spread in different directions", "phân tán", "The crowd dispersed slowly.", "Đám đông phân tán chậm rãi.", "C1"),
    ("distort", "/dɪˈstɔːrt/", "verb", "to change the shape or meaning of", "bóp méo/làm sai lệch", "Don't distort the facts.", "Đừng làm sai lệch sự thật.", "C1"),
    ("diverse", "/daɪˈvɜːrs/", "adjective", "showing a great deal of variety", "đa dạng", "Our team is diverse.", "Nhóm của chúng tôi đa dạng.", "B1"),
    ("embed", "/ɪmˈbed/", "verb", "to fix something firmly in a material", "nhúng vào/cài vào", "Embed the video in the page.", "Nhúng video vào trang.", "B2"),
    ("emerge", "/ɪˈmɜːrdʒ/", "verb", "to come out and become visible", "xuất hiện/nổi lên", "New trends are emerging.", "Các xu hướng mới đang nổi lên.", "B2"),
    ("empirical", "/ɪmˈpɪrɪkəl/", "adjective", "based on observation and experiment", "dựa trên thực nghiệm", "We need empirical evidence.", "Chúng ta cần bằng chứng thực nghiệm.", "C1"),
    ("enforce", "/ɪnˈfɔːrs/", "verb", "to ensure rules are obeyed", "thực thi", "Enforce the law strictly.", "Thực thi pháp luật nghiêm ngặt.", "B2"),
    ("equity", "/ˈekwɪti/", "noun", "fairness and justice in treatment", "sự công bằng", "Promote equity in the workplace.", "Thúc đẩy sự công bằng ở nơi làm việc.", "C1"),
    ("erode", "/ɪˈrəʊd/", "verb", "to gradually destroy or weaken", "bào mòn", "Trust erodes without honesty.", "Niềm tin bào mòn khi thiếu trung thực.", "C1"),
    ("exceed", "/ɪkˈsiːd/", "verb", "to go beyond a limit", "vượt quá", "Sales exceeded expectations.", "Doanh số vượt quá kỳ vọng.", "B2"),
    ("extract", "/ɪkˈstrækt/", "verb", "to remove or obtain from a source", "chiết xuất/trích xuất", "Extract the data from the file.", "Trích xuất dữ liệu từ tệp.", "B2"),
    ("fabricate", "/ˈfæbrɪkeɪt/", "verb", "to invent false information", "bịa đặt", "Don't fabricate evidence.", "Đừng bịa đặt bằng chứng.", "C1"),
    ("fluctuation", "/ˌflʌktʃuˈeɪʃən/", "noun", "irregular rise and fall", "sự biến động", "Currency fluctuations affect trade.", "Biến động tiền tệ ảnh hưởng đến thương mại.", "B2"),
    ("forthcoming", "/ˌfɔːrθˈkʌmɪŋ/", "adjective", "happening in the near future", "sắp tới", "The forthcoming election is important.", "Cuộc bầu cử sắp tới rất quan trọng.", "B2"),
    ("fragment", "/ˈfræɡmənt/", "noun", "a small part broken off", "mảnh vỡ/đoạn nhỏ", "A fragment of the original text.", "Một đoạn của văn bản gốc.", "B2"),
    ("gauge", "/ɡeɪdʒ/", "verb", "to estimate or measure something", "đánh giá/đo", "Gauge the level of difficulty.", "Đánh giá mức độ khó khăn.", "C1"),
    ("generate", "/ˈdʒenəreɪt/", "verb", "to produce or create", "tạo ra/sinh ra", "Generate more ideas for the project.", "Tạo ra nhiều ý tưởng hơn cho dự án.", "B1"),
    ("hinder", "/ˈhɪndər/", "verb", "to make something difficult", "cản trở/gây khó khăn", "Bureaucracy hinders innovation.", "Quan liêu cản trở đổi mới.", "B2"),
    ("illuminate", "/ɪˈluːmɪneɪt/", "verb", "to light up or make clear", "chiếu sáng/làm rõ", "The example illuminates the concept.", "Ví dụ làm rõ khái niệm.", "C1"),
    ("implicit", "/ɪmˈplɪsɪt/", "adjective", "suggested but not directly stated", "ngầm hiểu", "There is implicit trust between them.", "Có sự tin tưởng ngầm giữa họ.", "C1"),
    ("incentivize", "/ɪnˈsentɪvaɪz/", "verb", "to motivate with rewards", "khuyến khích bằng phần thưởng", "Incentivize staff with bonuses.", "Khuyến khích nhân viên bằng thưởng.", "C1"),
    ("indispensable", "/ˌɪndɪˈspensəbəl/", "adjective", "absolutely necessary", "không thể thiếu", "Water is indispensable.", "Nước là không thể thiếu.", "C1"),
    ("initiate", "/ɪˈnɪʃieɪt/", "verb", "to cause something to begin", "khởi xướng", "Initiate the conversation.", "Khởi xướng cuộc trò chuyện.", "B2"),
    ("intervene", "/ˌɪntərˈviːn/", "verb", "to become involved to change a situation", "can thiệp", "The teacher intervened in the dispute.", "Giáo viên can thiệp vào tranh chấp.", "C1"),
    ("invoke", "/ɪnˈvəʊk/", "verb", "to call upon something for support", "viện đến", "She invoked the law.", "Cô ấy viện đến luật pháp.", "C1"),
    ("legitimate", "/lɪˈdʒɪtɪmɪt/", "adjective", "conforming to the law or rules", "hợp pháp/chính đáng", "This is a legitimate request.", "Đây là yêu cầu chính đáng.", "B2"),
    ("leverage", "/ˈliːvərɪdʒ/", "noun", "power used to achieve something", "đòn bẩy/sức mạnh", "Use your skills as leverage.", "Dùng kỹ năng làm đòn bẩy.", "C1"),
    ("mediate", "/ˈmiːdieɪt/", "verb", "to help resolve a dispute", "hòa giải", "She mediated the conflict.", "Cô ấy hòa giải xung đột.", "C1"),
    ("monitor", "/ˈmɒnɪtər/", "verb", "to observe and check regularly", "theo dõi", "Monitor your progress.", "Theo dõi tiến độ.", "B1"),
    ("motivate", "/ˈməʊtɪveɪt/", "verb", "to inspire someone to act", "thúc đẩy", "Motivate your team to achieve.", "Thúc đẩy nhóm của bạn đạt mục tiêu.", "B1"),
    ("mutual", "/ˈmjuːtʃuəl/", "adjective", "shared by two or more parties", "tương hỗ/cùng nhau", "A mutual agreement was reached.", "Thỏa thuận chung đã đạt được.", "B2"),
    ("neglect", "/nɪˈɡlekt/", "verb", "to fail to give proper care to", "bỏ bê/xao nhãng", "Don't neglect your health.", "Đừng xao nhãng sức khỏe.", "B2"),
    ("neutralise", "/ˈnjuːtrəlaɪz/", "verb", "to make something ineffective", "vô hiệu hóa", "Neutralise the threat.", "Vô hiệu hóa mối đe dọa.", "C1"),
    ("offset", "/ˈɒfset/", "verb", "to balance or compensate for", "bù đắp/bù lại", "Exercise offsets unhealthy eating.", "Tập thể dục bù đắp cho ăn uống không lành mạnh.", "C1"),
    ("opt", "/ɒpt/", "verb", "to make a choice", "lựa chọn", "She opted for the vegetarian meal.", "Cô ấy chọn bữa ăn chay.", "B1"),
    ("overlook", "/ˌəʊvərˈlʊk/", "verb", "to fail to notice or disregard", "bỏ qua/bỏ sót", "Don't overlook the details.", "Đừng bỏ sót các chi tiết.", "B2"),
    ("perpetual", "/pərˈpetʃuəl/", "adjective", "never ending or changing", "vĩnh cửu/liên tục", "A perpetual motion machine.", "Máy chuyển động liên tục.", "C1"),
    ("plausible", "/ˈplɔːzɪbəl/", "adjective", "seeming reasonable or probable", "có vẻ hợp lý", "That explanation is plausible.", "Giải thích đó có vẻ hợp lý.", "C1"),
    ("preliminary", "/prɪˈlɪmɪnəri/", "adjective", "coming before the main event", "sơ bộ/ban đầu", "Preliminary results are positive.", "Kết quả ban đầu tích cực.", "B2"),
    ("prevalent", "/ˈprevələnt/", "adjective", "widespread in a particular area", "phổ biến rộng rãi", "Obesity is prevalent in many countries.", "Béo phì phổ biến ở nhiều quốc gia.", "C1"),
    ("prompt", "/prɒmpt/", "verb", "to cause or encourage someone to act", "nhắc nhở/thúc đẩy", "Her words prompted him to act.", "Lời nói của cô ấy thúc đẩy anh ấy hành động.", "B2"),
    ("refute", "/rɪˈfjuːt/", "verb", "to prove that something is false", "bác bỏ", "He refuted the argument.", "Anh ấy bác bỏ lập luận.", "C1"),
    ("regulate", "/ˈreɡjuleɪt/", "verb", "to control by rules", "điều tiết/quy định", "Regulate the temperature.", "Điều tiết nhiệt độ.", "B2"),
    ("relevant", "/ˈreləvənt/", "adjective", "closely connected to the subject", "liên quan", "Give relevant examples only.", "Chỉ đưa ra ví dụ liên quan.", "B1"),
    ("resemble", "/rɪˈzembəl/", "verb", "to look like something else", "giống như", "She resembles her mother.", "Cô ấy giống mẹ.", "B1"),
    ("retain", "/rɪˈteɪn/", "verb", "to keep or continue to have", "giữ lại", "Retain key employees.", "Giữ lại nhân viên chủ chốt.", "B2"),
    ("simulate", "/ˈsɪmjuleɪt/", "verb", "to create a model of something real", "mô phỏng", "Simulate real-world conditions.", "Mô phỏng điều kiện thực tế.", "B2"),
    ("speculate", "/ˈspekjuleɪt/", "verb", "to form a theory without evidence", "suy đoán", "Don't speculate without evidence.", "Đừng suy đoán khi thiếu bằng chứng.", "C1"),
    ("stability", "/stəˈbɪlɪti/", "noun", "the quality of being stable", "sự ổn định", "Economic stability is crucial.", "Sự ổn định kinh tế rất quan trọng.", "B2"),
    ("subordinate", "/səˈbɔːrdɪnɪt/", "adjective", "lower in rank or position", "cấp dưới/phụ thuộc", "A subordinate role in the team.", "Vai trò cấp dưới trong nhóm.", "C1"),
    ("subtle", "/ˈsʌtəl/", "adjective", "not obvious; difficult to notice", "tinh tế/khó nhận ra", "A subtle difference in tone.", "Sự khác biệt tinh tế về âm điệu.", "B2"),
    ("suppress", "/səˈpres/", "verb", "to prevent from being expressed", "kìm nén/đàn áp", "Suppress your emotions at work.", "Kìm nén cảm xúc trong công việc.", "C1"),
    ("surpass", "/sərˈpɑːs/", "verb", "to exceed in achievement", "vượt qua", "She surpassed all expectations.", "Cô ấy vượt qua mọi kỳ vọng.", "B2"),
    ("trigger", "/ˈtrɪɡər/", "verb", "to cause something to start", "kích hoạt/gây ra", "Stress can trigger illness.", "Căng thẳng có thể gây ra bệnh.", "B2"),
    ("underpin", "/ˌʌndərˈpɪn/", "verb", "to support or form the basis of", "làm cơ sở cho", "Evidence underpins the theory.", "Bằng chứng làm cơ sở cho lý thuyết.", "C1"),
    ("utilise", "/ˈjuːtɪlaɪz/", "verb", "to make use of something", "tận dụng/sử dụng", "Utilise all available resources.", "Tận dụng tất cả nguồn lực có sẵn.", "B2"),
    ("validate", "/ˈvæl ɪdeɪt/", "verb", "to confirm that something is correct", "xác nhận tính hợp lệ", "Validate your data before publishing.", "Xác nhận dữ liệu trước khi xuất bản.", "B2"),
    ("yield", "/jiːld/", "verb", "to produce or provide results", "mang lại/sản sinh", "Hard work yields results.", "Làm việc chăm chỉ mang lại kết quả.", "B2"),
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
