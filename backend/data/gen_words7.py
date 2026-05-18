"""Batch 7: ~310 từ để vượt 2000."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django; django.setup()
from apps.vocabulary.models import Word

WORDS = [
    # A1 - basic adjectives
    ("new", "/njuː/", "adjective", "recently made or not used before", "mới", "She has a new phone.", "Cô ấy có điện thoại mới.", "A1"),
    ("old", "/əʊld/", "adjective", "having existed for a long time", "cũ/già", "This is an old building.", "Đây là tòa nhà cũ.", "A1"),
    ("young", "/jʌŋ/", "adjective", "not having lived very long", "trẻ", "She is young and energetic.", "Cô ấy trẻ và năng động.", "A1"),
    ("big", "/bɪɡ/", "adjective", "large in size", "to/lớn", "He lives in a big house.", "Anh ấy sống trong ngôi nhà lớn.", "A1"),
    ("small", "/smɔːl/", "adjective", "not large", "nhỏ", "The cat is very small.", "Con mèo rất nhỏ.", "A1"),
    ("good", "/ɡʊd/", "adjective", "of high quality", "tốt", "She did a good job.", "Cô ấy làm việc tốt.", "A1"),
    ("bad", "/bæd/", "adjective", "of low quality", "xấu/tồi", "The weather is bad today.", "Thời tiết tệ hôm nay.", "A1"),
    ("right", "/raɪt/", "adjective", "correct", "đúng", "That's the right answer.", "Đó là câu trả lời đúng.", "A1"),
    ("wrong", "/rɒŋ/", "adjective", "not correct", "sai", "The answer is wrong.", "Câu trả lời sai.", "A1"),
    ("pretty", "/ˈprɪti/", "adjective", "attractive and pleasing", "xinh đẹp", "The flower is pretty.", "Bông hoa xinh đẹp.", "A1"),
    ("lovely", "/ˈlʌvli/", "adjective", "beautiful or very enjoyable", "đáng yêu/tuyệt vời", "What a lovely day!", "Thật là một ngày tuyệt vời!", "A1"),
    ("wonderful", "/ˈwʌndərfəl/", "adjective", "extremely good", "tuyệt vời", "The food was wonderful.", "Đồ ăn thật tuyệt vời.", "A1"),
    ("terrible", "/ˈterɪbəl/", "adjective", "very bad", "tệ/khủng khiếp", "The traffic was terrible.", "Giao thông thật tệ.", "A1"),
    ("perfect", "/ˈpɜːrfɪkt/", "adjective", "completely without fault", "hoàn hảo", "It was a perfect day.", "Đó là một ngày hoàn hảo.", "A1"),
    ("popular", "/ˈpɒpjʊlər/", "adjective", "liked by many people", "phổ biến", "Pizza is very popular.", "Pizza rất phổ biến.", "A1"),
    ("favourite", "/ˈfeɪvərɪt/", "adjective", "preferred above all others", "yêu thích nhất", "What is your favourite colour?", "Màu yêu thích nhất của bạn là gì?", "A1"),
    ("free", "/friː/", "adjective", "costing nothing", "miễn phí", "The app is free.", "Ứng dụng này miễn phí.", "A1"),
    ("busy", "/ˈbɪzi/", "adjective", "having a lot of things to do", "bận rộn", "She is very busy today.", "Cô ấy rất bận hôm nay.", "A1"),
    ("ready", "/ˈredi/", "adjective", "prepared and able to act", "sẵn sàng", "Are you ready to go?", "Bạn đã sẵn sàng chưa?", "A1"),
    ("lucky", "/ˈlʌki/", "adjective", "having good luck", "may mắn", "She is very lucky.", "Cô ấy rất may mắn.", "A1"),
    # A2 - common nouns (everyday)
    ("bag", "/bæɡ/", "noun", "a container for carrying things", "túi xách", "She packed her bag.", "Cô ấy đóng gói túi xách.", "A2"),
    ("box", "/bɒks/", "noun", "a square container", "hộp", "Put it in the box.", "Đặt vào trong hộp.", "A2"),
    ("bottle", "/ˈbɒtəl/", "noun", "a glass or plastic container for liquids", "chai", "She drank from a water bottle.", "Cô ấy uống từ chai nước.", "A2"),
    ("cup", "/kʌp/", "noun", "a small container for drinks", "cái tách/ly", "Would you like a cup of tea?", "Bạn có muốn một tách trà không?", "A2"),
    ("glass", "/ɡlɑːs/", "noun", "a container made from glass", "cái ly", "Fill the glass with water.", "Đổ đầy nước vào ly.", "A2"),
    ("plate", "/pleɪt/", "noun", "a flat dish for food", "đĩa", "Pass me the plate.", "Đưa đĩa cho tôi.", "A2"),
    ("bowl", "/bəʊl/", "noun", "a round deep dish", "tô/bát", "A bowl of soup.", "Một tô súp.", "A2"),
    ("spoon", "/spuːn/", "noun", "a utensil for eating liquids", "thìa/muỗng", "Use a spoon for the soup.", "Dùng muỗng cho súp.", "A2"),
    ("fork", "/fɔːrk/", "noun", "a utensil with prongs for eating", "nĩa", "Use a fork to eat pasta.", "Dùng nĩa để ăn mì ống.", "A2"),
    ("knife", "/naɪf/", "noun", "a sharp blade for cutting", "con dao", "Use a knife to cut the bread.", "Dùng dao để cắt bánh mì.", "A2"),
    ("key", "/kiː/", "noun", "a small metal tool for opening locks", "chìa khóa", "I forgot my key.", "Tôi quên chìa khóa.", "A2"),
    ("wallet", "/ˈwɒlɪt/", "noun", "a small flat case for cards and cash", "ví tiền", "He left his wallet at home.", "Anh ấy bỏ quên ví tiền ở nhà.", "A2"),
    ("umbrella", "/ʌmˈbrelə/", "noun", "a device to protect from rain", "ô/dù", "Take an umbrella, it may rain.", "Mang ô theo, trời có thể mưa.", "A2"),
    ("ticket", "/ˈtɪkɪt/", "noun", "a small piece of paper for admission", "vé", "Buy a ticket for the concert.", "Mua vé cho buổi hòa nhạc.", "A2"),
    ("map", "/mæp/", "noun", "a drawing showing an area", "bản đồ", "Use a map to find the way.", "Dùng bản đồ để tìm đường.", "A2"),
    ("sign", "/saɪn/", "noun", "a board with information on it", "biển hiệu", "Read the sign carefully.", "Đọc biển hiệu cẩn thận.", "A2"),
    ("address", "/əˈdres/", "noun", "the place where someone lives", "địa chỉ", "Write your address here.", "Viết địa chỉ của bạn ở đây.", "A2"),
    ("message", "/ˈmesɪdʒ/", "noun", "information sent to someone", "tin nhắn", "Leave a message after the tone.", "Để lại tin nhắn sau tiếng bíp.", "A2"),
    ("password", "/ˈpɑːswɜːrd/", "noun", "a secret word to access something", "mật khẩu", "Remember your password.", "Nhớ mật khẩu của bạn.", "A2"),
    ("website", "/ˈwebsaɪt/", "noun", "a set of pages on the internet", "trang web", "Visit our website for details.", "Truy cập trang web của chúng tôi để biết chi tiết.", "A2"),
    # B1 - abstract nouns
    ("ability", "/əˈbɪlɪti/", "noun", "the skill to do something", "khả năng", "She has the ability to learn fast.", "Cô ấy có khả năng học nhanh.", "B1"),
    ("advantage", "/ədˈvɑːntɪdʒ/", "noun", "a condition that helps you succeed", "lợi thế", "Speaking English is a big advantage.", "Biết nói tiếng Anh là lợi thế lớn.", "B1"),
    ("challenge", "/ˈtʃælɪndʒ/", "noun", "something that is difficult to do", "thử thách", "Learning English is a challenge.", "Học tiếng Anh là một thử thách.", "B1"),
    ("choice", "/tʃɔɪs/", "noun", "the act of selecting", "sự lựa chọn", "Make the right choice.", "Hãy lựa chọn đúng đắn.", "B1"),
    ("effort", "/ˈefərt/", "noun", "physical or mental energy used", "nỗ lực", "Success requires great effort.", "Thành công đòi hỏi nhiều nỗ lực.", "B1"),
    ("experience", "/ɪkˈspɪəriəns/", "noun", "knowledge gained through practice", "kinh nghiệm", "She has years of experience.", "Cô ấy có nhiều năm kinh nghiệm.", "B1"),
    ("habit", "/ˈhæbɪt/", "noun", "something you do regularly", "thói quen", "Reading is a good habit.", "Đọc sách là thói quen tốt.", "B1"),
    ("knowledge", "/ˈnɒlɪdʒ/", "noun", "facts learned through study", "kiến thức", "Knowledge is power.", "Kiến thức là sức mạnh.", "B1"),
    ("opportunity", "/ˌɒpərˈtjuːnɪti/", "noun", "a chance to do something", "cơ hội", "Don't miss this opportunity.", "Đừng bỏ lỡ cơ hội này.", "B1"),
    ("responsibility", "/rɪˌspɒnsɪˈbɪlɪti/", "noun", "a duty you are obliged to perform", "trách nhiệm", "It's your responsibility.", "Đó là trách nhiệm của bạn.", "B1"),
    ("skill", "/skɪl/", "noun", "an ability developed through practice", "kỹ năng", "Coding is a useful skill.", "Lập trình là kỹ năng hữu ích.", "B1"),
    ("success", "/səkˈses/", "noun", "achieving your goals", "thành công", "Success comes from hard work.", "Thành công đến từ sự chăm chỉ.", "B1"),
    ("solution", "/səˈluːʃən/", "noun", "an answer to a problem", "giải pháp", "We need a creative solution.", "Chúng ta cần một giải pháp sáng tạo.", "B1"),
    ("purpose", "/ˈpɜːrpəs/", "noun", "the reason for which something is done", "mục đích", "What is the purpose of this meeting?", "Mục đích của cuộc họp này là gì?", "B1"),
    ("value", "/ˈvæljuː/", "noun", "the importance or worth of something", "giá trị", "She values hard work.", "Cô ấy coi trọng sự chăm chỉ.", "B1"),
    ("progress", "/ˈprəʊɡres/", "noun", "forward movement toward a goal", "tiến bộ", "She made great progress.", "Cô ấy đạt được nhiều tiến bộ.", "B1"),
    ("quality", "/ˈkwɒlɪti/", "noun", "the standard of something", "chất lượng", "Quality over quantity.", "Chất lượng hơn số lượng.", "B1"),
    ("relationship", "/rɪˈleɪʃənʃɪp/", "noun", "a connection between people", "mối quan hệ", "Good relationships need trust.", "Mối quan hệ tốt cần có sự tin tưởng.", "B1"),
    ("difference", "/ˈdɪfərəns/", "noun", "the way in which things are not the same", "sự khác biệt", "Spot the difference.", "Tìm điểm khác biệt.", "B1"),
    ("situation", "/ˌsɪtʃuˈeɪʃən/", "noun", "a set of circumstances at a time", "tình huống", "Handle the situation calmly.", "Xử lý tình huống một cách bình tĩnh.", "B1"),
    # B2 - health lifestyle
    ("meditation", "/ˌmedɪˈteɪʃən/", "noun", "the practice of calming the mind", "thiền định", "Daily meditation reduces stress.", "Thiền định hàng ngày giảm căng thẳng.", "B2"),
    ("nutrition", "/njuːˈtrɪʃən/", "noun", "the process of taking in and using food", "dinh dưỡng", "Good nutrition is essential.", "Dinh dưỡng tốt là cần thiết.", "B2"),
    ("hydration", "/haɪˈdreɪʃən/", "noun", "maintaining adequate water intake", "cung cấp đủ nước", "Stay hydrated during exercise.", "Giữ cơ thể đủ nước khi tập thể dục.", "B2"),
    ("insomnia", "/ɪnˈsɒmniə/", "noun", "inability to sleep", "chứng mất ngủ", "She suffers from insomnia.", "Cô ấy bị mất ngủ.", "B2"),
    ("obesity", "/əʊˈbiːsɪti/", "noun", "the state of being severely overweight", "béo phì", "Obesity causes health problems.", "Béo phì gây ra vấn đề sức khỏe.", "B2"),
    ("cardiovascular", "/ˌkɑːdiəʊˈvæskjʊlər/", "adjective", "relating to the heart and blood vessels", "tim mạch", "Cardio exercise improves cardiovascular health.", "Tập cardio cải thiện sức khỏe tim mạch.", "B2"),
    ("immune system", "/ɪˈmjuːn ˌsɪstəm/", "noun", "the body's defence against disease", "hệ miễn dịch", "A strong immune system fights illness.", "Hệ miễn dịch mạnh chống lại bệnh tật.", "B2"),
    ("wellbeing", "/ˈwelbɪɪŋ/", "noun", "the state of being healthy and happy", "sức khoẻ và hạnh phúc", "Mental wellbeing is important.", "Sức khoẻ tinh thần quan trọng.", "B2"),
    ("depression", "/dɪˈpreʃən/", "noun", "a mental illness causing persistent sadness", "trầm cảm", "She was treated for depression.", "Cô ấy được điều trị trầm cảm.", "B2"),
    ("anxiety", "/æŋˈzaɪəti/", "noun", "a feeling of worry and fear", "lo âu", "He has social anxiety.", "Anh ấy bị lo âu xã hội.", "B2"),
    # TOEIC - Email language
    ("regarding", "/rɪˈɡɑːrdɪŋ/", "preposition", "about or concerning", "về/liên quan đến", "Regarding your request...", "Liên quan đến yêu cầu của bạn...", "TOEIC"),
    ("enclosed", "/ɪnˈkləʊzd/", "adjective", "included or attached in an envelope", "đính kèm", "Please find enclosed the invoice.", "Vui lòng xem hóa đơn đính kèm.", "TOEIC"),
    ("attached", "/əˈtætʃt/", "adjective", "joined or fastened to something", "đính kèm", "See the attached document.", "Xem tài liệu đính kèm.", "TOEIC"),
    ("acknowledge", "/əkˈnɒlɪdʒ/", "verb", "to confirm receiving something", "xác nhận đã nhận", "Please acknowledge receipt.", "Vui lòng xác nhận đã nhận.", "TOEIC"),
    ("sincerely", "/sɪnˈsɪərli/", "adverb", "in a genuine and honest way", "thành thật", "Yours sincerely, John.", "Trân trọng, John.", "TOEIC"),
    ("urgent", "/ˈɜːrdʒənt/", "adjective", "requiring immediate action", "khẩn cấp", "This is an urgent matter.", "Đây là vấn đề khẩn cấp.", "TOEIC"),
    ("clarification", "/ˌklærɪfɪˈkeɪʃən/", "noun", "an explanation to remove confusion", "làm rõ/giải thích", "I need clarification on this.", "Tôi cần làm rõ điều này.", "TOEIC"),
    ("inquiry", "/ɪnˈkwaɪəri/", "noun", "a request for information", "yêu cầu thông tin", "Thank you for your inquiry.", "Cảm ơn bạn đã gửi yêu cầu.", "TOEIC"),
    ("hereby", "/ˌhɪərˈbaɪ/", "adverb", "as a result of this document", "do văn bản này", "I hereby confirm the agreement.", "Tôi đây xác nhận thỏa thuận.", "TOEIC"),
    ("pursuant to", "/pɜːˈsjuːənt tə/", "phrase", "in accordance with", "theo quy định của", "Pursuant to our agreement...", "Theo thỏa thuận của chúng ta...", "TOEIC"),
    # C1 - more advanced words
    ("accentuate", "/ækˈsentʃueɪt/", "verb", "to emphasise or make prominent", "nhấn mạnh", "The colour accentuates the design.", "Màu sắc nhấn mạnh thiết kế.", "C1"),
    ("apprehensive", "/ˌæprɪˈhensɪv/", "adjective", "worried or nervous about the future", "lo ngại", "She was apprehensive about the surgery.", "Cô ấy lo ngại về ca phẫu thuật.", "C1"),
    ("articulate", "/ɑːˈtɪkjʊlɪt/", "adjective", "able to express ideas clearly", "diễn đạt rõ ràng", "He is a very articulate speaker.", "Anh ấy là diễn giả rất rõ ràng.", "C1"),
    ("candid", "/ˈkændɪd/", "adjective", "honest and truthful", "thẳng thắn", "She gave a candid opinion.", "Cô ấy đưa ra ý kiến thẳng thắn.", "C1"),
    ("compelling", "/kəmˈpelɪŋ/", "adjective", "very interesting and convincing", "thuyết phục", "She made a compelling argument.", "Cô ấy đưa ra lập luận thuyết phục.", "C1"),
    ("concise", "/kənˈsaɪs/", "adjective", "brief but clear and complete", "ngắn gọn", "Keep your answer concise.", "Giữ câu trả lời ngắn gọn.", "C1"),
    ("decisive", "/dɪˈsaɪsɪv/", "adjective", "making decisions quickly and confidently", "quyết đoán", "A leader must be decisive.", "Người lãnh đạo phải quyết đoán.", "C1"),
    ("diligent", "/ˈdɪlɪdʒənt/", "adjective", "hardworking and careful", "cần cù", "She is a diligent student.", "Cô ấy là học sinh cần cù.", "C1"),
    ("dynamic", "/daɪˈnæmɪk/", "adjective", "full of energy and change", "năng động", "She is a dynamic leader.", "Cô ấy là người lãnh đạo năng động.", "C1"),
    ("eloquent", "/ˈeləkwənt/", "adjective", "fluent and persuasive in speaking", "hùng hồn/hoa mỹ", "The politician gave an eloquent speech.", "Chính trị gia có bài phát biểu hùng hồn.", "C1"),
    ("meticulous", "/mɪˈtɪkjʊləs/", "adjective", "very careful and precise", "tỉ mỉ/cẩn thận", "She is meticulous about details.", "Cô ấy tỉ mỉ về chi tiết.", "C1"),
    ("objective", "/əbˈdʒektɪv/", "adjective", "not influenced by personal feelings", "khách quan", "Stay objective when analysing data.", "Hãy khách quan khi phân tích dữ liệu.", "C1"),
    ("persistent", "/pəˈsɪstənt/", "adjective", "continuing despite difficulty", "kiên trì", "She is persistent and hardworking.", "Cô ấy kiên trì và chăm chỉ.", "C1"),
    ("proactive", "/prəʊˈæktɪv/", "adjective", "acting in advance to prevent problems", "chủ động", "Be proactive about your health.", "Hãy chủ động về sức khỏe của bạn.", "C1"),
    ("rational", "/ˈræʃənəl/", "adjective", "based on reason and logic", "hợp lý", "Make a rational decision.", "Hãy đưa ra quyết định hợp lý.", "C1"),
    ("spontaneous", "/spɒnˈteɪniəs/", "adjective", "done naturally without planning", "tự nhiên/bộc phát", "She made a spontaneous decision.", "Cô ấy đưa ra quyết định bộc phát.", "C1"),
    ("versatile", "/ˈvɜːrsətaɪl/", "adjective", "able to adapt to many uses", "linh hoạt/đa năng", "She is a versatile employee.", "Cô ấy là nhân viên đa năng.", "C1"),
    ("vivid", "/ˈvɪvɪd/", "adjective", "producing strong clear images", "sống động", "She has vivid memories of childhood.", "Cô ấy có ký ức sống động về tuổi thơ.", "C1"),
    ("volatile", "/ˈvɒlətaɪl/", "adjective", "changing rapidly and unpredictably", "dễ biến động", "The market is very volatile.", "Thị trường rất dễ biến động.", "C1"),
    ("wary", "/ˈweəri/", "adjective", "feeling caution about something", "thận trọng", "Be wary of strangers online.", "Hãy thận trọng với người lạ trực tuyến.", "C1"),
    # B1 - collocations
    ("make a decision", "/meɪk ə dɪˈsɪʒən/", "phrase", "to decide something", "đưa ra quyết định", "It's time to make a decision.", "Đã đến lúc đưa ra quyết định.", "B1"),
    ("take part", "/teɪk pɑːrt/", "phrase", "to participate in something", "tham gia", "Take part in the competition.", "Tham gia cuộc thi.", "B1"),
    ("make progress", "/meɪk ˈprəʊɡres/", "phrase", "to advance toward a goal", "tiến bộ", "She is making great progress.", "Cô ấy đang tiến bộ nhiều.", "B1"),
    ("take advantage", "/teɪk ədˈvɑːntɪdʒ/", "phrase", "to use a situation for benefit", "tận dụng", "Take advantage of the opportunity.", "Hãy tận dụng cơ hội.", "B1"),
    ("pay attention", "/peɪ əˈtenʃən/", "phrase", "to listen or watch carefully", "chú ý", "Pay attention in class.", "Chú ý trong lớp.", "B1"),
    ("make sense", "/meɪk sens/", "phrase", "to be logical or understandable", "có ý nghĩa/hợp lý", "Does this make sense?", "Điều này có hợp lý không?", "B1"),
    ("take care", "/teɪk keər/", "phrase", "to be careful or to look after", "chăm sóc/cẩn thận", "Take care of yourself.", "Hãy chăm sóc bản thân.", "B1"),
    ("do your best", "/duː jɔːr best/", "phrase", "to try as hard as you can", "cố gắng hết sức", "Always do your best.", "Luôn cố gắng hết sức.", "B1"),
    ("have a look", "/hæv ə lʊk/", "phrase", "to look at something briefly", "nhìn qua/xem một chút", "Have a look at this.", "Nhìn qua cái này.", "B1"),
    ("get used to", "/ɡet juːst tə/", "phrase", "to become familiar with", "quen với", "Get used to the new routine.", "Quen với thói quen mới.", "B1"),
    # A2 - money & numbers
    ("price", "/praɪs/", "noun", "the amount of money for something", "giá cả", "What is the price?", "Giá là bao nhiêu?", "A2"),
    ("cost", "/kɒst/", "noun", "the amount paid for something", "chi phí", "The cost is too high.", "Chi phí quá cao.", "A2"),
    ("fee", "/fiː/", "noun", "money charged for a service", "lệ phí/phí", "Pay the registration fee.", "Nộp lệ phí đăng ký.", "A2"),
    ("tax", "/tæks/", "noun", "money paid to the government", "thuế", "Pay your taxes on time.", "Nộp thuế đúng hạn.", "A2"),
    ("tip", "/tɪp/", "noun", "extra money given for good service", "tiền boa", "Leave a tip for the waiter.", "Để lại tiền boa cho bồi bàn.", "A2"),
    ("change", "/tʃeɪndʒ/", "noun", "money returned when you overpay", "tiền thừa", "Keep the change.", "Giữ tiền thừa.", "A2"),
    ("cash", "/kæʃ/", "noun", "physical money", "tiền mặt", "Do you accept cash?", "Bạn có nhận tiền mặt không?", "A2"),
    ("coin", "/kɔɪn/", "noun", "a metal piece of money", "đồng xu", "I found a coin on the ground.", "Tôi tìm thấy một đồng xu trên đất.", "A2"),
    ("note", "/nəʊt/", "noun", "a piece of paper money", "tờ tiền", "She paid with a 50-dollar note.", "Cô ấy trả bằng tờ 50 đô la.", "A2"),
    ("rate", "/reɪt/", "noun", "a measure of how often something happens", "tỷ lệ", "The exchange rate is good.", "Tỷ giá hối đoái tốt.", "A2"),
    # B2 - advanced language
    ("imply", "/ɪmˈplaɪ/", "verb", "to suggest without saying directly", "ngụ ý", "Are you implying I'm wrong?", "Bạn đang ngụ ý tôi sai à?", "B2"),
    ("convey", "/kənˈveɪ/", "verb", "to express or communicate a message", "truyền đạt", "He conveyed his feelings clearly.", "Anh ấy truyền đạt cảm xúc rõ ràng.", "B2"),
    ("elaborate", "/ɪˈlæbəreɪt/", "verb", "to give more detail about something", "trình bày chi tiết hơn", "Please elaborate on your point.", "Vui lòng trình bày chi tiết hơn.", "B2"),
    ("emphasise", "/ˈemfəsaɪz/", "verb", "to give extra importance to something", "nhấn mạnh", "She emphasised the importance of safety.", "Cô ấy nhấn mạnh tầm quan trọng của an toàn.", "B2"),
    ("highlight", "/ˈhaɪlaɪt/", "verb", "to draw attention to something", "nêu bật", "Highlight the key points.", "Nêu bật những điểm chính.", "B2"),
    ("outline", "/ˈaʊtlaɪn/", "verb", "to give the main points of something", "phác thảo/tóm tắt", "Outline your main ideas first.", "Phác thảo những ý tưởng chính trước.", "B2"),
    ("paraphrase", "/ˈpærəfreɪz/", "verb", "to say something in different words", "diễn giải lại", "Paraphrase the sentence.", "Diễn giải lại câu đó.", "B2"),
    ("summarise", "/ˈsʌməraɪz/", "verb", "to state the main points briefly", "tóm tắt", "Summarise the article in three sentences.", "Tóm tắt bài báo trong ba câu.", "B2"),
    ("quote", "/kwəʊt/", "verb", "to repeat someone else's words", "trích dẫn", "She quoted a famous author.", "Cô ấy trích dẫn một tác giả nổi tiếng.", "B2"),
    ("cite", "/saɪt/", "verb", "to refer to a source as evidence", "trích dẫn tài liệu", "Cite your sources in the essay.", "Trích dẫn nguồn trong bài luận.", "B2"),
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
