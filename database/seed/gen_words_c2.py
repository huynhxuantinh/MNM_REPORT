"""
Thêm từ vựng C2 (mastery level) vào database.
Chạy bằng: python manage.py shell -c "exec(open('data/gen_words_c2.py').read())"
"""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

from apps.vocabulary.models import Word

words = [
    # --- Verbs ---
    ("acquiesce", "/ˌækwiˈɛs/", "đồng ý miễn cưỡng", "to acquiesce reluctantly", "C2"),
    ("ameliorate", "/əˈmiːliəreɪt/", "cải thiện, làm tốt hơn", "measures to ameliorate the situation", "C2"),
    ("abrogate", "/ˈæbrəɡeɪt/", "bãi bỏ (luật, hiệp ước)", "to abrogate a treaty", "C2"),
    ("belie", "/bɪˈlaɪ/", "mâu thuẫn với, che giấu sự thật", "her smile belied her anxiety", "C2"),
    ("burnish", "/ˈbɜːrnɪʃ/", "đánh bóng; nâng cao (danh tiếng)", "to burnish one's reputation", "C2"),
    ("capitulate", "/kəˈpɪtʃuleɪt/", "đầu hàng, nhượng bộ", "they finally capitulated to the demands", "C2"),
    ("circumvent", "/ˌsɜːrkəmˈvɛnt/", "lách luật, tránh né", "to circumvent regulations", "C2"),
    ("coalesce", "/ˌkoʊəˈlɛs/", "hợp nhất, kết hợp thành một", "the groups coalesced into a movement", "C2"),
    ("confound", "/kənˈfaʊnd/", "làm bối rối; bác bỏ (kỳ vọng)", "the results confounded expectations", "C2"),
    ("contravene", "/ˌkɒntrəˈviːn/", "vi phạm (luật, quy định)", "the action contravenes international law", "C2"),
    ("corroborate", "/kəˈrɒbəreɪt/", "xác nhận, chứng thực", "evidence to corroborate the claim", "C2"),
    ("denigrate", "/ˈdɛnɪɡreɪt/", "hạ thấp, bôi nhọ", "to denigrate someone's achievements", "C2"),
    ("dissemble", "/dɪˈsɛmbəl/", "che giấu cảm xúc, giả vờ", "he dissembled his true intentions", "C2"),
    ("elucidate", "/ɪˈluːsɪdeɪt/", "làm sáng tỏ, giải thích rõ", "please elucidate your argument", "C2"),
    ("enervate", "/ˈɛnərveɪt/", "làm suy yếu, làm mất sức lực", "the heat enervated the workers", "C2"),
    ("evince", "/ɪˈvɪns/", "biểu lộ rõ ràng", "she evinced no surprise", "C2"),
    ("exacerbate", "/ɪɡˈzæsərbeɪt/", "làm trầm trọng thêm", "the drought exacerbated food shortages", "C2"),
    ("expound", "/ɪkˈspaʊnd/", "trình bày chi tiết, giải thích kỹ", "to expound a theory", "C2"),
    ("extenuate", "/ɪkˈstɛnjueɪt/", "giảm nhẹ (tội lỗi, sai lầm)", "extenuating circumstances", "C2"),
    ("foment", "/foʊˈmɛnt/", "kích động, xúi giục", "to foment unrest", "C2"),
    ("impugn", "/ɪmˈpjuːn/", "bác bỏ, phủ nhận (tính chính trực)", "to impugn someone's motives", "C2"),
    ("inculcate", "/ˈɪnkʌlkeɪt/", "khắc sâu, gieo vào tâm trí", "to inculcate values in children", "C2"),
    ("militate", "/ˈmɪlɪteɪt/", "có tác động mạnh (chống lại)", "these factors militate against success", "C2"),
    ("obviate", "/ˈɒbvieɪt/", "loại trừ, tránh được (vấn đề)", "to obviate the need for surgery", "C2"),
    ("palliate", "/ˈpælieɪt/", "làm dịu (triệu chứng), giảm nhẹ", "medication to palliate the pain", "C2"),
    ("prevaricate", "/prɪˈværɪkeɪt/", "nói loanh quanh, tránh né sự thật", "stop prevaricating and answer", "C2"),
    ("promulgate", "/ˈprɒmʌlɡeɪt/", "công bố chính thức (luật, quy định)", "to promulgate a new law", "C2"),
    ("repudiate", "/rɪˈpjuːdieɪt/", "bác bỏ hoàn toàn, từ chối thừa nhận", "to repudiate the allegations", "C2"),
    ("supplant", "/səˈplænt/", "thay thế (hoàn toàn)", "digital cameras supplanted film cameras", "C2"),
    ("tacitly", "/ˈtæsɪtli/", "ngầm hiểu, không nói ra", "the agreement was tacitly accepted", "C2"),
    # --- Nouns ---
    ("acrimony", "/ˈækrɪməni/", "sự gay gắt, chua cay (trong tranh luận)", "the debate ended with acrimony", "C2"),
    ("anachronism", "/əˈnækrənɪzəm/", "sự lỗi thời, lạc hậu", "the custom is an anachronism", "C2"),
    ("anathema", "/əˈnæθəmə/", "điều bị ghê tởm, kỳ thị", "bureaucracy is anathema to creativity", "C2"),
    ("antipathy", "/ænˈtɪpəθi/", "sự phản cảm, ghét bỏ sâu sắc", "a deep antipathy towards dishonesty", "C2"),
    ("approbation", "/ˌæprəˈbeɪʃən/", "sự chấp thuận chính thức, khen ngợi", "the plan received general approbation", "C2"),
    ("bifurcation", "/ˌbaɪfɜːrˈkeɪʃən/", "sự phân chia thành hai nhánh", "a bifurcation in policy approaches", "C2"),
    ("celerity", "/səˈlɛrɪti/", "sự nhanh nhẹn, tốc độ", "acted with remarkable celerity", "C2"),
    ("chicanery", "/ʃɪˈkeɪnəri/", "mánh khóe, thủ đoạn gian trá", "legal chicanery to avoid taxes", "C2"),
    ("contumacy", "/ˈkɒntjuməsi/", "sự ngoan cố chống lại thẩm quyền", "the defendant showed contumacy", "C2"),
    ("deliquescence", "/ˌdɛlɪˈkwɛsəns/", "sự tan chảy dần, hòa tan", "the deliquescence of old institutions", "C2"),
    ("desideratum", "/dɪˌzɪdəˈreɪtəm/", "điều mong muốn thiết yếu", "clarity is a desideratum in writing", "C2"),
    ("dichotomy", "/daɪˈkɒtəmi/", "sự phân chia thành hai mặt đối lập", "the dichotomy between theory and practice", "C2"),
    ("diffidence", "/ˈdɪfɪdəns/", "sự thiếu tự tin, rụt rè", "spoke with diffidence about her work", "C2"),
    ("dissonance", "/ˈdɪsənəns/", "sự bất hòa, mâu thuẫn", "cognitive dissonance", "C2"),
    ("equanimity", "/ˌiːkwəˈnɪmɪti/", "sự điềm tĩnh, bình thản", "faced adversity with equanimity", "C2"),
    ("exigency", "/ˈɛksɪdʒənsi/", "tình huống khẩn cấp, đòi hỏi bức thiết", "the exigencies of wartime", "C2"),
    ("hegemony", "/hɪˈdʒɛməni/", "quyền bá chủ, sự thống trị", "cultural hegemony", "C2"),
    ("imprimatur", "/ˌɪmprɪˈmɑːtər/", "sự chấp thuận chính thức", "the proposal received the board's imprimatur", "C2"),
    ("inchoate", "/ɪnˈkoʊeɪt/", "còn sơ khai, chưa phát triển hoàn toàn", "an inchoate idea", "C2"),
    ("lassitude", "/ˈlæsɪtjuːd/", "sự mệt mỏi, uể oải", "a feeling of lassitude after illness", "C2"),
    ("malfeasance", "/mælˈfiːzəns/", "hành vi sai trái (của quan chức)", "allegations of malfeasance in office", "C2"),
    ("mendacity", "/mɛnˈdæsɪti/", "sự dối trá, gian lận", "political mendacity", "C2"),
    ("obloquy", "/ˈɒbləkwi/", "sự chỉ trích công khai nặng nề", "subjected to public obloquy", "C2"),
    ("opprobrium", "/əˈproʊbriəm/", "sự lên án, ô nhục", "his actions brought opprobrium", "C2"),
    ("persiflage", "/ˈpɜːrsɪflɑːʒ/", "lời nói đùa cợt, diễu cợt nhẹ nhàng", "idle persiflage", "C2"),
    ("perspicacity", "/ˌpɜːrspɪˈkæsɪti/", "sự tinh tường, nhạy bén", "showed great perspicacity", "C2"),
    ("recidivism", "/rɪˈsɪdɪvɪzəm/", "tái phạm tội", "efforts to reduce recidivism", "C2"),
    ("schadenfreude", "/ˈʃɑːdənfrɔɪdə/", "niềm vui khi thấy người khác thất bại", "a touch of schadenfreude", "C2"),
    ("solecism", "/ˈsɒlɪsɪzəm/", "lỗi ngữ pháp, vi phạm chuẩn mực", "a social solecism", "C2"),
    ("verisimilitude", "/ˌvɛrɪsɪˈmɪlɪtjuːd/", "tính giống thật, sự chân thực", "the novel's historical verisimilitude", "C2"),
    # --- Adjectives ---
    ("abstruse", "/æbˈstruːs/", "khó hiểu, bí hiểm", "abstruse philosophical arguments", "C2"),
    ("acerbic", "/əˈsɜːrbɪk/", "cay độc, sắc bén (lời nói)", "an acerbic wit", "C2"),
    ("assiduous", "/əˈsɪdʒuəs/", "chăm chỉ, cần cù", "an assiduous student", "C2"),
    ("bellicose", "/ˈbɛlɪkoʊs/", "hiếu chiến, hay gây sự", "a bellicose foreign policy", "C2"),
    ("captious", "/ˈkæpʃəs/", "hay chỉ trích vặt vãnh, bắt bẻ", "a captious critic", "C2"),
    ("cogent", "/ˈkoʊdʒənt/", "thuyết phục, chặt chẽ (lập luận)", "a cogent argument", "C2"),
    ("compendious", "/kəmˈpɛndiəs/", "súc tích, đầy đủ mà ngắn gọn", "a compendious summary", "C2"),
    ("dilatory", "/ˈdɪlətɔːri/", "chậm chạp, trì hoãn", "dilatory tactics in negotiations", "C2"),
    ("egregious", "/ɪˈɡriːdʒəs/", "nghiêm trọng một cách lộ liễu", "an egregious error", "C2"),
    ("emollient", "/ɪˈmɒliənt/", "làm dịu, xoa dịu", "an emollient response", "C2"),
    ("fastidious", "/fæˈstɪdiəs/", "khó tính, cầu kỳ về tiêu chuẩn", "a fastidious editor", "C2"),
    ("fatuous", "/ˈfætʃuəs/", "ngớ ngẩn, thiếu suy nghĩ", "a fatuous remark", "C2"),
    ("inimical", "/ɪˈnɪmɪkəl/", "thù địch, bất lợi", "conditions inimical to growth", "C2"),
    ("inveterate", "/ɪnˈvɛtərɪt/", "đã ăn sâu, khó thay đổi", "an inveterate liar", "C2"),
    ("loquacious", "/loʊˈkweɪʃəs/", "nói nhiều, ba hoa", "a loquacious host", "C2"),
    ("meretricious", "/ˌmɛrɪˈtrɪʃəs/", "hào nhoáng giả tạo, không thực chất", "meretricious rhetoric", "C2"),
    ("obdurate", "/ˈɒbdjʊrɪt/", "cứng đầu, không chịu thay đổi", "remained obdurate in his refusal", "C2"),
    ("obsequious", "/əbˈsiːkwiəs/", "nịnh hót, quá phục tùng", "an obsequious manner", "C2"),
    ("parsimonious", "/ˌpɑːrsɪˈmoʊniəs/", "keo kiệt, bủn xỉn", "a parsimonious budget", "C2"),
    ("pellucid", "/pɪˈluːsɪd/", "trong suốt; rõ ràng, dễ hiểu", "pellucid prose", "C2"),
    ("perspicuous", "/pəˈspɪkjuəs/", "rõ ràng, dễ hiểu (văn phong)", "a perspicuous explanation", "C2"),
    ("puerile", "/ˈpjʊəraɪl/", "ấu trĩ, ngây thơ một cách đáng chê", "puerile humour", "C2"),
    ("recondite", "/ˈrɛkəndaɪt/", "bí truyền, ít người biết", "recondite knowledge", "C2"),
    ("sanguine", "/ˈsæŋɡwɪn/", "lạc quan, tràn đầy hy vọng", "remained sanguine about the outcome", "C2"),
    ("tendentious", "/tɛnˈdɛnʃəs/", "thiên lệch, có dụng ý", "a tendentious account of events", "C2"),
    ("truculent", "/ˈtrʌkjʊlənt/", "hung hăng, thích gây sự", "a truculent tone", "C2"),
    ("unctuous", "/ˈʌŋktʃuəs/", "giả vờ thân thiện, nịnh nọt thái quá", "an unctuous smile", "C2"),
    ("vapid", "/ˈvæpɪd/", "nhạt nhẽo, thiếu sinh khí", "vapid conversation", "C2"),
    ("vociferous", "/voʊˈsɪfərəs/", "ồn ào, la hét phản đối mạnh mẽ", "vociferous opposition", "C2"),
    ("wanton", "/ˈwɒntən/", "vô cớ, bừa bãi (hành động có hại)", "wanton destruction", "C2"),
]

created, skipped = 0, 0
for text, phonetic, definition_vi, example, level in words:
    obj, c = Word.objects.get_or_create(
        text=text,
        defaults={
            "phonetic": phonetic,
            "definition_vi": definition_vi,
            "definition_en": "",
            "example_en": example,
            "example_vi": "",
            "level": level,
            "part_of_speech": "v" if any(text.endswith(s) for s in ["ate","ize","ise","fy","en"]) else "n",
        }
    )
    if c:
        created += 1
    else:
        skipped += 1

total = Word.objects.count()
c2_total = Word.objects.filter(level="C2").count()
print(f"Created: {created} | Skipped: {skipped}")
print(f"C2 total: {c2_total} | All words: {total}")
