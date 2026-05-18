"""Batch 6: ~420 từ để đạt 2000."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django; django.setup()
from apps.vocabulary.models import Word

WORDS = [
    # A1 - Numbers & quantities
    ("zero", "/ˈzɪərəʊ/", "noun", "the number 0", "số không", "The score is zero to zero.", "Tỷ số là không - không.", "A1"),
    ("hundred", "/ˈhʌndrɪd/", "noun", "the number 100", "một trăm", "There are a hundred students.", "Có một trăm học sinh.", "A1"),
    ("thousand", "/ˈθaʊzənd/", "noun", "the number 1000", "một nghìn", "A thousand people came.", "Một nghìn người đã đến.", "A1"),
    ("million", "/ˈmɪljən/", "noun", "the number 1,000,000", "một triệu", "A million stars are visible.", "Một triệu ngôi sao có thể nhìn thấy.", "A1"),
    ("first", "/fɜːrst/", "adjective", "number one in order", "đầu tiên", "She finished first.", "Cô ấy về đích đầu tiên.", "A1"),
    ("last", "/lɑːst/", "adjective", "coming after all others", "cuối cùng", "He was the last to arrive.", "Anh ấy là người đến cuối cùng.", "A1"),
    ("next", "/nekst/", "adjective", "immediately after", "kế tiếp", "Who is next?", "Ai là người kế tiếp?", "A1"),
    ("few", "/fjuː/", "adjective", "a small number of", "một vài", "She has a few friends.", "Cô ấy có một vài người bạn.", "A1"),
    ("many", "/ˈmeni/", "adjective", "a large number of", "nhiều", "There are many students here.", "Có nhiều học sinh ở đây.", "A1"),
    ("some", "/sʌm/", "adjective", "an unspecified amount of", "một số", "Some people disagree.", "Một số người không đồng ý.", "A1"),
    ("much", "/mʌtʃ/", "adjective", "a large amount of", "nhiều (không đếm được)", "She has much experience.", "Cô ấy có nhiều kinh nghiệm.", "A1"),
    ("enough", "/ɪˈnʌf/", "adjective", "as much as needed", "đủ", "Is there enough food?", "Có đủ thức ăn không?", "A1"),
    ("every", "/ˈevri/", "adjective", "each one of a group", "mỗi", "He comes every day.", "Anh ấy đến mỗi ngày.", "A1"),
    ("both", "/bəʊθ/", "adjective", "the two things or people", "cả hai", "Both sisters are teachers.", "Cả hai chị em đều là giáo viên.", "A1"),
    ("all", "/ɔːl/", "adjective", "the whole amount of", "tất cả", "All students passed.", "Tất cả học sinh đã đậu.", "A1"),
    ("half", "/hɑːf/", "noun", "one of two equal parts", "một nửa", "She ate half the pizza.", "Cô ấy ăn một nửa chiếc pizza.", "A1"),
    ("whole", "/həʊl/", "adjective", "complete; all of something", "toàn bộ", "She ate the whole cake.", "Cô ấy ăn hết cả chiếc bánh.", "A1"),
    ("several", "/ˈsevərəl/", "adjective", "more than two but not very many", "nhiều/vài", "She visited several countries.", "Cô ấy thăm vài quốc gia.", "A1"),
    ("couple", "/ˈkʌpəl/", "noun", "two people or things together", "một cặp/hai người", "A couple of hours later.", "Vài giờ sau.", "A1"),
    ("dozen", "/ˈdʌzən/", "noun", "a group of twelve", "một tá (12 cái)", "Buy a dozen eggs.", "Mua một tá trứng.", "A1"),
    # A2 - Directions & prepositions
    ("above", "/əˈbʌv/", "preposition", "at a higher level than", "phía trên", "The bird flew above the clouds.", "Con chim bay phía trên mây.", "A2"),
    ("below", "/bɪˈləʊ/", "preposition", "at a lower level than", "phía dưới", "The temperature is below zero.", "Nhiệt độ dưới không độ.", "A2"),
    ("beside", "/bɪˈsaɪd/", "preposition", "next to", "bên cạnh", "Sit beside me.", "Ngồi bên cạnh tôi.", "A2"),
    ("between", "/bɪˈtwiːn/", "preposition", "in the middle of two things", "ở giữa (hai thứ)", "The bank is between the café and the park.", "Ngân hàng nằm giữa quán cà phê và công viên.", "A2"),
    ("among", "/əˈmʌŋ/", "preposition", "in the middle of a group", "trong số", "She was popular among friends.", "Cô ấy được bạn bè yêu mến.", "A2"),
    ("toward", "/təˈwɔːrd/", "preposition", "in the direction of", "về phía", "Walk toward the exit.", "Đi về phía lối ra.", "A2"),
    ("through", "/θruː/", "preposition", "from one side to the other", "xuyên qua", "Drive through the tunnel.", "Lái xe xuyên qua đường hầm.", "A2"),
    ("across", "/əˈkrɒs/", "preposition", "from one side to the other", "ngang qua", "Swim across the river.", "Bơi ngang qua sông.", "A2"),
    ("along", "/əˈlɒŋ/", "preposition", "in a line next to something", "dọc theo", "Walk along the street.", "Đi bộ dọc theo con phố.", "A2"),
    ("beyond", "/bɪˈjɒnd/", "preposition", "on the far side of", "bên kia/vượt ra ngoài", "The forest is beyond the village.", "Khu rừng ở phía bên kia ngôi làng.", "A2"),
    # A2 - Time expressions
    ("already", "/ɔːlˈredi/", "adverb", "before a particular time", "đã", "She has already left.", "Cô ấy đã rời đi rồi.", "A2"),
    ("still", "/stɪl/", "adverb", "continuing up to this time", "vẫn còn", "Are you still working?", "Bạn vẫn còn đang làm việc không?", "A2"),
    ("yet", "/jet/", "adverb", "up until now", "chưa", "Have you eaten yet?", "Bạn đã ăn chưa?", "A2"),
    ("soon", "/suːn/", "adverb", "in a short time from now", "sớm", "Dinner will be ready soon.", "Bữa tối sẽ sẵn sàng sớm thôi.", "A2"),
    ("late", "/leɪt/", "adjective", "after the expected time", "muộn", "The train was late.", "Con tàu đến muộn.", "A2"),
    ("early", "/ˈɜːrli/", "adjective", "before the expected time", "sớm", "She arrived early.", "Cô ấy đến sớm.", "A2"),
    ("ago", "/əˈɡəʊ/", "adverb", "before the present time", "trước đây", "He left two days ago.", "Anh ấy đi hai ngày trước.", "A2"),
    ("since", "/sɪns/", "preposition", "from a past time until now", "từ khi", "She has worked here since 2020.", "Cô ấy đã làm việc ở đây từ năm 2020.", "A2"),
    ("during", "/ˈdjʊərɪŋ/", "preposition", "throughout a period of time", "trong suốt", "Be quiet during the film.", "Giữ yên lặng trong suốt bộ phim.", "A2"),
    ("while", "/waɪl/", "conjunction", "at the same time as something else", "trong khi", "She sang while cooking.", "Cô ấy hát trong khi nấu ăn.", "A2"),
    # B1 - Adjectives for opinion
    ("fascinating", "/ˈfæsɪneɪtɪŋ/", "adjective", "extremely interesting", "hấp dẫn", "The documentary was fascinating.", "Bộ phim tài liệu rất hấp dẫn.", "B1"),
    ("boring", "/ˈbɔːrɪŋ/", "adjective", "not interesting", "nhàm chán", "The lecture was boring.", "Bài giảng thật nhàm chán.", "B1"),
    ("surprising", "/sərˈpraɪzɪŋ/", "adjective", "causing surprise", "đáng ngạc nhiên", "The results were surprising.", "Kết quả thật đáng ngạc nhiên.", "B1"),
    ("disappointing", "/ˌdɪsəˈpɔɪntɪŋ/", "adjective", "not as good as expected", "đáng thất vọng", "The film was disappointing.", "Bộ phim thật đáng thất vọng.", "B1"),
    ("shocking", "/ˈʃɒkɪŋ/", "adjective", "causing shock or horror", "gây sốc", "The news was shocking.", "Tin tức thật gây sốc.", "B1"),
    ("impressive", "/ɪmˈpresɪv/", "adjective", "making a strong positive impression", "ấn tượng", "His presentation was impressive.", "Bài thuyết trình của anh ấy ấn tượng.", "B1"),
    ("amusing", "/əˈmjuːzɪŋ/", "adjective", "causing laughter or smiling", "buồn cười/thú vị", "The story was amusing.", "Câu chuyện thật thú vị.", "B1"),
    ("terrifying", "/ˈterɪfaɪɪŋ/", "adjective", "extremely frightening", "kinh khủng", "The rollercoaster was terrifying.", "Tàu lượn siêu tốc thật kinh khủng.", "B1"),
    ("exhausting", "/ɪɡˈzɔːstɪŋ/", "adjective", "making you very tired", "kiệt sức", "The hike was exhausting.", "Chuyến leo núi thật kiệt sức.", "B1"),
    ("relaxing", "/rɪˈlæksɪŋ/", "adjective", "making you feel calm", "thư giãn", "The holiday was relaxing.", "Kỳ nghỉ thật thư giãn.", "B1"),
    # B1 - verbs for academic use
    ("achieve", "/əˈtʃiːv/", "verb", "to succeed in reaching a goal", "đạt được", "She achieved her goals.", "Cô ấy đạt được mục tiêu.", "B1"),
    ("acquire", "/əˈkwaɪər/", "verb", "to get or obtain something", "có được", "He acquired new skills.", "Anh ấy có được kỹ năng mới.", "B1"),
    ("affect", "/əˈfekt/", "verb", "to have an influence on something", "ảnh hưởng đến", "Stress affects your health.", "Căng thẳng ảnh hưởng đến sức khỏe.", "B1"),
    ("create", "/kriˈeɪt/", "verb", "to make something new", "tạo ra", "She created a new design.", "Cô ấy tạo ra thiết kế mới.", "B1"),
    ("consider", "/kənˈsɪdər/", "verb", "to think carefully about something", "cân nhắc", "Consider all the options.", "Cân nhắc tất cả các lựa chọn.", "B1"),
    ("compare", "/kəmˈpeər/", "verb", "to examine similarities and differences", "so sánh", "Compare these two products.", "So sánh hai sản phẩm này.", "B1"),
    ("describe", "/dɪˈskraɪb/", "verb", "to give details about something", "mô tả", "Describe what you saw.", "Mô tả những gì bạn thấy.", "B1"),
    ("develop", "/dɪˈveləp/", "verb", "to grow or make something grow", "phát triển", "Develop your skills daily.", "Phát triển kỹ năng mỗi ngày.", "B1"),
    ("establish", "/ɪˈstæblɪʃ/", "verb", "to set up or create something formal", "thành lập", "She established a charity.", "Cô ấy thành lập một tổ chức từ thiện.", "B1"),
    ("improve", "/ɪmˈpruːv/", "verb", "to make or become better", "cải thiện", "Practice to improve your skills.", "Luyện tập để cải thiện kỹ năng.", "B1"),
    ("include", "/ɪnˈkluːd/", "verb", "to have something as a part", "bao gồm", "The price includes breakfast.", "Giá bao gồm bữa sáng.", "B1"),
    ("influence", "/ˈɪnfluəns/", "verb", "to have an effect on", "tác động đến", "Friends influence your decisions.", "Bạn bè tác động đến quyết định của bạn.", "B1"),
    ("maintain", "/meɪnˈteɪn/", "verb", "to keep something in good condition", "duy trì/bảo trì", "Maintain a healthy lifestyle.", "Duy trì lối sống lành mạnh.", "B1"),
    ("manage", "/ˈmænɪdʒ/", "verb", "to control or be in charge of", "quản lý", "She manages a large team.", "Cô ấy quản lý một nhóm lớn.", "B1"),
    ("obtain", "/əbˈteɪn/", "verb", "to get or acquire something", "thu được", "How did he obtain permission?", "Làm thế nào anh ấy có được sự cho phép?", "B1"),
    ("produce", "/prəˈdjuːs/", "verb", "to make or create something", "sản xuất", "The factory produces cars.", "Nhà máy sản xuất ô tô.", "B1"),
    ("provide", "/prəˈvaɪd/", "verb", "to give something needed", "cung cấp", "The company provides free lunch.", "Công ty cung cấp bữa trưa miễn phí.", "B1"),
    ("reduce", "/rɪˈdjuːs/", "verb", "to make smaller in size or amount", "giảm", "Reduce your carbon footprint.", "Giảm dấu chân carbon của bạn.", "B1"),
    ("reflect", "/rɪˈflekt/", "verb", "to think carefully about something", "suy ngẫm về", "Reflect on your achievements.", "Suy ngẫm về những thành tựu của bạn.", "B1"),
    ("require", "/rɪˈkwaɪər/", "verb", "to need something", "yêu cầu", "The job requires experience.", "Công việc yêu cầu kinh nghiệm.", "B1"),
    ("resolve", "/rɪˈzɒlv/", "verb", "to find a solution to a problem", "giải quyết", "Resolve the conflict peacefully.", "Giải quyết xung đột một cách hòa bình.", "B1"),
    ("support", "/səˈpɔːrt/", "verb", "to help or encourage someone", "ủng hộ/hỗ trợ", "Support your team.", "Ủng hộ nhóm của bạn.", "B1"),
    # B2 - Globalisation & society
    ("globalisation", "/ˌɡləʊbəlaɪˈzeɪʃən/", "noun", "the process of becoming worldwide", "toàn cầu hóa", "Globalisation connects markets.", "Toàn cầu hóa kết nối các thị trường.", "B2"),
    ("multinational", "/ˌmʌltiˈnæʃənəl/", "adjective", "operating in many countries", "đa quốc gia", "She works for a multinational company.", "Cô ấy làm việc cho công ty đa quốc gia.", "B2"),
    ("urbanisation", "/ˌɜːrbənɪˈzeɪʃən/", "noun", "people moving to live in cities", "đô thị hóa", "Urbanisation is growing in Asia.", "Đô thị hóa đang tăng ở châu Á.", "B2"),
    ("migration", "/maɪˈɡreɪʃən/", "noun", "movement of people from place to place", "di cư", "Economic migration is increasing.", "Di cư kinh tế đang tăng.", "B2"),
    ("refugee", "/ˌrefjuˈdʒiː/", "noun", "a person fleeing danger in their country", "người tị nạn", "Thousands of refugees need shelter.", "Hàng nghìn người tị nạn cần nơi ở.", "B2"),
    ("cultural", "/ˈkʌltʃərəl/", "adjective", "relating to the customs of a group", "văn hóa", "Respect cultural differences.", "Tôn trọng sự khác biệt văn hóa.", "B2"),
    ("diverse", "/daɪˈvɜːrs/", "adjective", "showing great variety", "đa dạng", "Our team is culturally diverse.", "Nhóm của chúng tôi đa dạng văn hóa.", "B2"),
    ("tolerance", "/ˈtɒlərəns/", "noun", "acceptance of different views", "sự khoan dung", "Promote tolerance in society.", "Thúc đẩy sự khoan dung trong xã hội.", "B2"),
    ("discrimination", "/dɪˌskrɪmɪˈneɪʃən/", "noun", "treating people unfairly due to differences", "phân biệt đối xử", "Discrimination is illegal.", "Phân biệt đối xử là bất hợp pháp.", "B2"),
    ("stereotype", "/ˈsteriəˌtaɪp/", "noun", "an oversimplified idea about a group", "định kiến", "Challenge stereotypes in society.", "Thách thức các định kiến trong xã hội.", "B2"),
    # C1 - connective phrases
    ("in contrast", "/ɪn ˈkɒntrɑːst/", "phrase", "showing an opposite or different fact", "ngược lại", "In contrast, the other group succeeded.", "Ngược lại, nhóm kia đã thành công.", "C1"),
    ("on the contrary", "/ɒn ðə ˈkɒntrəri/", "phrase", "showing that the opposite is true", "trái lại", "On the contrary, it was easy.", "Trái lại, việc đó rất dễ.", "C1"),
    ("as a result", "/æz ə rɪˈzʌlt/", "phrase", "because of something", "do đó", "As a result, sales improved.", "Do đó, doanh số đã cải thiện.", "C1"),
    ("in addition", "/ɪn əˈdɪʃən/", "phrase", "also; as well", "ngoài ra", "In addition, the price is lower.", "Ngoài ra, giá thấp hơn.", "C1"),
    ("on the other hand", "/ɒn ðə ˈʌðər hænd/", "phrase", "from the opposite viewpoint", "mặt khác", "On the other hand, it may fail.", "Mặt khác, nó có thể thất bại.", "C1"),
    ("to sum up", "/tə sʌm ʌp/", "phrase", "to give a brief summary", "tóm lại", "To sum up, the project was a success.", "Tóm lại, dự án đã thành công.", "C1"),
    ("in conclusion", "/ɪn kənˈkluːʒən/", "phrase", "at the end of a discussion", "kết luận", "In conclusion, we need to act now.", "Kết luận, chúng ta cần hành động ngay.", "C1"),
    ("for instance", "/fər ˈɪnstəns/", "phrase", "as an example", "ví dụ như", "For instance, consider this case.", "Ví dụ như, hãy xem xét trường hợp này.", "C1"),
    ("that is to say", "/ðæt ɪz tə seɪ/", "phrase", "in other words", "có nghĩa là", "That is to say, we need more time.", "Có nghĩa là, chúng ta cần thêm thời gian.", "C1"),
    ("with regard to", "/wɪð rɪˈɡɑːrd tə/", "phrase", "concerning or related to", "liên quan đến", "With regard to your question...", "Liên quan đến câu hỏi của bạn...", "C1"),
    # TOEIC - Banking & finance
    ("transaction", "/trænsˈækʃən/", "noun", "an instance of buying or selling", "giao dịch", "The transaction was completed.", "Giao dịch đã hoàn thành.", "TOEIC"),
    ("statement", "/ˈsteɪtmənt/", "noun", "a formal record of finances", "bảng kê/sao kê", "Check your bank statement.", "Kiểm tra sao kê ngân hàng.", "TOEIC"),
    ("deposit", "/dɪˈpɒzɪt/", "verb", "to put money into a bank account", "gửi tiền", "Deposit money before noon.", "Gửi tiền trước buổi trưa.", "TOEIC"),
    ("withdraw", "/wɪðˈdrɔː/", "verb", "to take money out of an account", "rút tiền", "She withdrew cash from the ATM.", "Cô ấy rút tiền mặt từ máy ATM.", "TOEIC"),
    ("transfer", "/ˈtrænsfer/", "verb", "to move money from one account to another", "chuyển tiền", "Transfer funds electronically.", "Chuyển tiền điện tử.", "TOEIC"),
    ("balance", "/ˈbæləns/", "noun", "the amount of money in an account", "số dư", "Check your account balance.", "Kiểm tra số dư tài khoản.", "TOEIC"),
    ("credit card", "/ˈkredɪt kɑːrd/", "noun", "a card allowing purchase on credit", "thẻ tín dụng", "Pay by credit card.", "Thanh toán bằng thẻ tín dụng.", "TOEIC"),
    ("debit card", "/ˈdebɪt kɑːrd/", "noun", "a card linked to a bank account", "thẻ ghi nợ", "Use your debit card at the shop.", "Dùng thẻ ghi nợ tại cửa hàng.", "TOEIC"),
    ("overdraft", "/ˈəʊvərdrɑːft/", "noun", "spending more than you have in an account", "thấu chi", "Avoid bank overdraft fees.", "Tránh phí thấu chi ngân hàng.", "TOEIC"),
    ("installment", "/ɪnˈstɔːlmənt/", "noun", "one of several payments for a purchase", "trả góp", "Pay in monthly installments.", "Trả góp hàng tháng.", "TOEIC"),
    # TOEIC - Marketing
    ("branding", "/ˈbrændɪŋ/", "noun", "creating a brand identity", "xây dựng thương hiệu", "Strong branding builds loyalty.", "Thương hiệu mạnh xây dựng lòng trung thành.", "TOEIC"),
    ("target market", "/ˈtɑːrɡɪt ˌmɑːrkɪt/", "noun", "the group a product is aimed at", "thị trường mục tiêu", "Identify your target market first.", "Xác định thị trường mục tiêu trước.", "TOEIC"),
    ("demographics", "/ˌdeməˈɡræfɪks/", "noun", "statistical data about a population", "nhân khẩu học", "Study the demographics carefully.", "Nghiên cứu nhân khẩu học cẩn thận.", "TOEIC"),
    ("promotion", "/prəˈməʊʃən/", "noun", "activities to increase product awareness", "khuyến mãi", "Run a special promotion.", "Chạy một chương trình khuyến mãi đặc biệt.", "TOEIC"),
    ("campaign", "/kæmˈpeɪn/", "noun", "a series of marketing activities", "chiến dịch marketing", "The campaign was a success.", "Chiến dịch đã thành công.", "TOEIC"),
    ("testimonial", "/ˌtestɪˈməʊniəl/", "noun", "a customer review supporting a product", "lời chứng thực", "Customer testimonials build trust.", "Lời chứng thực của khách hàng xây dựng niềm tin.", "TOEIC"),
    ("niche", "/niːʃ/", "noun", "a specialised segment of a market", "thị trường ngách", "Find a niche market.", "Tìm một thị trường ngách.", "TOEIC"),
    ("conversion rate", "/kənˈvɜːrʒən reɪt/", "noun", "percentage of visitors who take an action", "tỷ lệ chuyển đổi", "Increase your conversion rate.", "Tăng tỷ lệ chuyển đổi.", "TOEIC"),
    ("retention", "/rɪˈtenʃən/", "noun", "keeping customers coming back", "giữ chân khách hàng", "Customer retention is key.", "Giữ chân khách hàng là chìa khóa.", "TOEIC"),
    ("endorse", "/ɪnˈdɔːrs/", "verb", "to publicly support a product or person", "ủng hộ/xác nhận", "Celebrities endorse the brand.", "Người nổi tiếng xác nhận thương hiệu.", "TOEIC"),
    # B2 - Workplace skills
    ("leadership", "/ˈliːdərʃɪp/", "noun", "the ability to guide others", "khả năng lãnh đạo", "She shows strong leadership.", "Cô ấy thể hiện khả năng lãnh đạo mạnh mẽ.", "B2"),
    ("teamwork", "/ˈtiːmwɜːrk/", "noun", "working together with others", "tinh thần đồng đội", "Good teamwork achieves goals.", "Tinh thần đồng đội tốt đạt được mục tiêu.", "B2"),
    ("communication", "/kəˌmjuːnɪˈkeɪʃən/", "noun", "sharing information with others", "giao tiếp", "Communication skills are vital.", "Kỹ năng giao tiếp rất quan trọng.", "B2"),
    ("critical thinking", "/ˈkrɪtɪkəl ˈθɪŋkɪŋ/", "noun", "analysing ideas carefully", "tư duy phản biện", "Practice critical thinking daily.", "Luyện tập tư duy phản biện mỗi ngày.", "B2"),
    ("problem-solving", "/ˈprɒbləm ˌsɒlvɪŋ/", "noun", "finding solutions to difficulties", "giải quyết vấn đề", "Problem-solving is a key skill.", "Giải quyết vấn đề là kỹ năng quan trọng.", "B2"),
    ("adaptability", "/əˌdæptəˈbɪlɪti/", "noun", "ability to adjust to new situations", "khả năng thích nghi", "Adaptability is essential at work.", "Khả năng thích nghi rất cần thiết ở nơi làm việc.", "B2"),
    ("creativity", "/ˌkriːeɪˈtɪvɪti/", "noun", "the ability to produce new ideas", "sự sáng tạo", "Encourage creativity in the workplace.", "Khuyến khích sự sáng tạo ở nơi làm việc.", "B2"),
    ("time management", "/ˈtaɪm ˌmænɪdʒmənt/", "noun", "using time efficiently", "quản lý thời gian", "Good time management reduces stress.", "Quản lý thời gian tốt giảm căng thẳng.", "B2"),
    ("negotiation skills", "/nɪˌɡəʊʃiˈeɪʃən skɪlz/", "noun", "ability to reach agreements", "kỹ năng đàm phán", "Negotiation skills are crucial.", "Kỹ năng đàm phán rất quan trọng.", "B2"),
    ("emotional intelligence", "/ɪˈməʊʃənəl ɪnˈtelɪdʒəns/", "noun", "ability to understand emotions", "trí tuệ cảm xúc", "Emotional intelligence improves relationships.", "Trí tuệ cảm xúc cải thiện các mối quan hệ.", "B2"),
    # A2 - common adjectives
    ("afraid", "/əˈfreɪd/", "adjective", "feeling fear", "sợ hãi", "She was afraid of the dark.", "Cô ấy sợ bóng tối.", "A2"),
    ("angry", "/ˈæŋɡri/", "adjective", "feeling strong displeasure", "tức giận", "He was angry about the result.", "Anh ấy tức giận về kết quả.", "A2"),
    ("happy", "/ˈhæpi/", "adjective", "feeling pleased and content", "vui vẻ/hạnh phúc", "She was happy to see him.", "Cô ấy vui khi gặp anh ấy.", "A2"),
    ("sad", "/sæd/", "adjective", "feeling unhappy", "buồn", "He was sad when she left.", "Anh ấy buồn khi cô ấy đi.", "A2"),
    ("tired", "/taɪərd/", "adjective", "needing rest or sleep", "mệt mỏi", "She is tired after work.", "Cô ấy mệt sau khi làm việc.", "A2"),
    ("bored", "/bɔːrd/", "adjective", "feeling uninterested", "chán nản", "He felt bored in class.", "Anh ấy cảm thấy chán trong lớp.", "A2"),
    ("surprised", "/sərˈpraɪzd/", "adjective", "feeling sudden wonder", "ngạc nhiên", "She was surprised by the gift.", "Cô ấy ngạc nhiên với món quà.", "A2"),
    ("confused", "/kənˈfjuːzd/", "adjective", "not able to think clearly", "bối rối", "He was confused by the instructions.", "Anh ấy bối rối với các hướng dẫn.", "A2"),
    ("interested", "/ˈɪntrɪstɪd/", "adjective", "wanting to know more about", "quan tâm", "She is interested in art.", "Cô ấy quan tâm đến nghệ thuật.", "A2"),
    ("worried", "/ˈwʌrid/", "adjective", "feeling anxious about something", "lo lắng", "She is worried about her exam.", "Cô ấy lo lắng về kỳ thi.", "A2"),
    # B1 - fixed expressions
    ("on time", "/ɒn taɪm/", "phrase", "not late", "đúng giờ", "Please arrive on time.", "Vui lòng đến đúng giờ.", "B1"),
    ("in time", "/ɪn taɪm/", "phrase", "before a deadline", "kịp giờ", "She arrived in time for the show.", "Cô ấy đến kịp giờ xem buổi biểu diễn.", "B1"),
    ("at least", "/æt liːst/", "phrase", "not less than", "ít nhất", "Drink at least 2 litres of water.", "Uống ít nhất 2 lít nước.", "B1"),
    ("at most", "/æt məʊst/", "phrase", "not more than", "nhiều nhất", "It takes at most an hour.", "Mất nhiều nhất một giờ.", "B1"),
    ("in fact", "/ɪn fækt/", "phrase", "actually; in reality", "thực ra", "In fact, she was right.", "Thực ra, cô ấy đúng.", "B1"),
    ("of course", "/əv kɔːrs/", "phrase", "certainly; naturally", "tất nhiên", "Of course you can!", "Tất nhiên bạn có thể!", "B1"),
    ("for example", "/fər ɪɡˈzɑːmpəl/", "phrase", "as a specific instance", "ví dụ", "For example, dogs are loyal.", "Ví dụ, chó rất trung thành.", "B1"),
    ("such as", "/sʌtʃ æz/", "phrase", "for example", "chẳng hạn như", "Fruits such as mango are sweet.", "Trái cây chẳng hạn như xoài rất ngọt.", "B1"),
    ("as well as", "/æz wel æz/", "phrase", "in addition to", "cũng như", "She speaks French as well as Spanish.", "Cô ấy nói tiếng Pháp cũng như tiếng Tây Ban Nha.", "B1"),
    ("so that", "/səʊ ðæt/", "conjunction", "with the purpose that", "để mà", "He studied hard so that he would pass.", "Anh ấy học chăm chỉ để đậu.", "B1"),
    # B2 - Environment & sustainability
    ("carbon footprint", "/ˈkɑːrbən ˌfʊtprɪnt/", "noun", "the amount of carbon dioxide someone produces", "lượng khí thải carbon", "Reduce your carbon footprint.", "Giảm lượng khí thải carbon của bạn.", "B2"),
    ("renewable energy", "/rɪˈnjuːəbəl ˈenədʒi/", "noun", "energy from natural sources", "năng lượng tái tạo", "Solar is a renewable energy source.", "Năng lượng mặt trời là nguồn tái tạo.", "B2"),
    ("recycle", "/ˌriːˈsaɪkəl/", "verb", "to convert waste into reusable material", "tái chế", "Recycle paper, glass and plastic.", "Tái chế giấy, thủy tinh và nhựa.", "B2"),
    ("compost", "/ˈkɒmpɒst/", "noun", "decayed organic material used as fertiliser", "phân ủ hữu cơ", "Use compost in the garden.", "Dùng phân ủ trong vườn.", "B2"),
    ("landfill", "/ˈlændfɪl/", "noun", "a site for burying waste", "bãi chôn lấp", "Reduce waste going to landfill.", "Giảm rác thải đến bãi chôn lấp.", "B2"),
    ("biodegradable", "/ˌbaɪəʊdɪˈɡreɪdəbəl/", "adjective", "able to be broken down naturally", "có thể phân hủy sinh học", "Use biodegradable packaging.", "Sử dụng bao bì có thể phân hủy sinh học.", "B2"),
    ("fossil fuel", "/ˈfɒsəl fjuːəl/", "noun", "coal, oil or gas as energy sources", "nhiên liệu hóa thạch", "Fossil fuels cause pollution.", "Nhiên liệu hóa thạch gây ô nhiễm.", "B2"),
    ("habitat loss", "/ˈhæbɪtæt lɒs/", "noun", "destruction of natural living areas", "mất môi trường sống", "Habitat loss threatens wildlife.", "Mất môi trường sống đe dọa động vật hoang dã.", "B2"),
    ("endangered", "/ɪnˈdeɪndʒərd/", "adjective", "at risk of becoming extinct", "có nguy cơ tuyệt chủng", "Tigers are an endangered species.", "Hổ là loài có nguy cơ tuyệt chủng.", "B2"),
    ("net zero", "/net ˈzɪərəʊ/", "noun", "achieving balance between emissions and removal", "phát thải ròng bằng không", "The goal is to reach net zero.", "Mục tiêu là đạt phát thải ròng bằng không.", "B2"),
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
