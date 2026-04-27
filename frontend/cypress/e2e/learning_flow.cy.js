/**
 * E2E: Luồng đăng nhập → học bài → ôn tập
 *
 * Dùng cy.intercept() để mock API — không cần backend đang chạy.
 * Để chạy với backend thật: xóa các cy.intercept() và dùng cy.loginViaApi().
 */

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 1, email: "student@test.com", username: "student",
  full_name: "Nguyễn Văn A", role: "user",
  xp: 250, level: 3, avatar_url: "", notification_enabled: true,
  created_at: "2026-01-01T00:00:00Z",
};

const MOCK_TOKENS = {
  access: "mock_access_token",
  refresh: "mock_refresh_token",
  user: MOCK_USER,
};

const MOCK_LESSONS = {
  count: 2, results: [
    { id: 1, title: "Basic Greetings", level: "A1", word_count: 5, is_published: true,
      created_by_name: "Teacher", user_progress: null },
    { id: 2, title: "Numbers 1-10", level: "A1", word_count: 8, is_published: true,
      created_by_name: "Teacher", user_progress: { started_at: "2026-04-25T10:00:00Z", completed_at: null } },
  ],
};

const MOCK_LESSON_DETAIL = {
  id: 1, title: "Basic Greetings", level: "A1", word_count: 3,
  words: [
    { id: 10, order_index: 0, word: { id: 101, text: "hello", phonetic: "həˈloʊ", part_of_speech: "interjection", definition_vi: "Xin chào", definition_en: "A greeting", example_en: "Hello, how are you?", example_vi: "Xin chào, bạn có khỏe không?", level: "A1" } },
    { id: 11, order_index: 1, word: { id: 102, text: "goodbye", phonetic: "ɡʊdˈbaɪ", part_of_speech: "interjection", definition_vi: "Tạm biệt", definition_en: "A farewell", example_en: "Goodbye! See you tomorrow.", example_vi: "Tạm biệt! Hẹn gặp lại ngày mai.", level: "A1" } },
    { id: 12, order_index: 2, word: { id: 103, text: "thank you", phonetic: "θæŋk juː", part_of_speech: "phrase", definition_vi: "Cảm ơn", definition_en: "Expression of gratitude", example_en: "Thank you for your help.", example_vi: "Cảm ơn vì đã giúp đỡ.", level: "A1" } },
  ],
  user_progress: null,
};

const MOCK_REVIEW_LIST = {
  count: 2, words: [
    { id: 1, word: { id: 101, text: "hello", phonetic: "həˈloʊ", part_of_speech: "interjection", definition_vi: "Xin chào", definition_en: "A greeting", example_en: "Hello!", example_vi: "Xin chào!", level: "A1", is_bookmarked: false }, easiness_factor: 2.5, repetitions: 1, interval_days: 1, last_reviewed: "2026-04-26", next_review_date: "2026-04-27", total_reviews: 1, correct_count: 1 },
    { id: 2, word: { id: 102, text: "goodbye", phonetic: "ɡʊdˈbaɪ", part_of_speech: "interjection", definition_vi: "Tạm biệt", definition_en: "A farewell", example_en: "Goodbye!", example_vi: "Tạm biệt!", level: "A1", is_bookmarked: false }, easiness_factor: 2.5, repetitions: 0, interval_days: 1, last_reviewed: null, next_review_date: "2026-04-27", total_reviews: 0, correct_count: 0 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const setupAuthMocks = () => {
  cy.intercept("POST", "/api/v1/auth/login/", { statusCode: 200, body: MOCK_TOKENS }).as("login");
  cy.intercept("GET", "/api/v1/auth/me/", { statusCode: 200, body: MOCK_USER }).as("getMe");
};

const setupLearningMocks = () => {
  cy.intercept("GET", "/api/v1/learning/lessons/*", (req) => {
    if (req.url.includes("/start")) { req.reply({ statusCode: 200, body: { detail: "ok" } }); return; }
    if (req.url.includes("/complete")) {
      req.reply({ statusCode: 200, body: { new_words: 3, xp_earned: 50, total_xp: 300, level: 3, streak: 5 } });
      return;
    }
    req.reply({ statusCode: 200, body: MOCK_LESSON_DETAIL });
  }).as("lessonDetail");

  cy.intercept("POST", "/api/v1/learning/lessons/*/start/", { statusCode: 200, body: { detail: "ok" } }).as("startLesson");
  cy.intercept("POST", "/api/v1/learning/lessons/*/complete/", {
    statusCode: 200,
    body: { new_words: 3, xp_earned: 50, total_xp: 300, level: 3, streak: 5 },
  }).as("completeLesson");

  cy.intercept("GET", "/api/v1/learning/lessons/", { statusCode: 200, body: MOCK_LESSONS }).as("getLessons");
  cy.intercept("GET", "/api/v1/learning/assignments/", { statusCode: 200, body: { count: 0, results: [] } }).as("getAssignments");
  cy.intercept("GET", "/api/v1/learning/review/summary/", {
    statusCode: 200, body: { reviewed_today: 0, correct_today: 0, streak: 0, total_xp: 250, level: 3, due_tomorrow: 2 },
  }).as("reviewSummary");
  cy.intercept("GET", "/api/v1/learning/review/history/*", { statusCode: 200, body: [] }).as("reviewHistory");
  cy.intercept("GET", "/api/v1/learning/notifications/", { statusCode: 200, body: { count: 0, results: [] } }).as("notifications");
};

const setupReviewMocks = () => {
  cy.intercept("GET", "/api/v1/learning/review/", { statusCode: 200, body: MOCK_REVIEW_LIST }).as("reviewList");
  cy.intercept("POST", "/api/v1/learning/review/*/answer/", {
    statusCode: 200,
    body: { word_id: 101, quality: 4, interval_days: 4, next_review_date: "2026-05-01", easiness_factor: 2.5, xp_earned: 5, total_xp: 255, level: 3 },
  }).as("submitAnswer");
};

// ── Test suites ───────────────────────────────────────────────────────────────

describe("Luồng: Đăng nhập → Học bài → Ôn tập", () => {

  // ── 1. Đăng nhập ──────────────────────────────────────────────────────────

  describe("1. Đăng nhập", () => {
    beforeEach(() => {
      setupAuthMocks();
      cy.visit("/login");
    });

    it("hiển thị form đăng nhập", () => {
      cy.get('input[type="email"]').should("exist");
      cy.get('input[type="password"]').should("exist");
      cy.get('button[type="submit"]').should("exist");
    });

    it("đăng nhập thành công và chuyển về trang chủ", () => {
      setupLearningMocks();
      cy.get('input[type="email"]').type("student@test.com");
      cy.get('input[type="password"]').type("Test1234!");
      cy.get('button[type="submit"]').click();
      cy.wait("@login");
      cy.url().should("eq", Cypress.config("baseUrl") + "/");
    });

    it("hiển thị lỗi khi sai mật khẩu", () => {
      cy.intercept("POST", "/api/v1/auth/login/", {
        statusCode: 400,
        body: { non_field_errors: ["Email hoặc mật khẩu không đúng."] },
      }).as("loginFail");
      cy.get('input[type="email"]').type("wrong@test.com");
      cy.get('input[type="password"]').type("wrongpass");
      cy.get('button[type="submit"]').click();
      cy.wait("@loginFail");
      cy.contains("Email hoặc mật khẩu không đúng.").should("be.visible");
    });

    it("validate: không cho submit khi email trống", () => {
      cy.get('button[type="submit"]').click();
      cy.url().should("include", "/login");
    });
  });

  // ── 2. Dashboard ──────────────────────────────────────────────────────────

  describe("2. Dashboard sau đăng nhập", () => {
    beforeEach(() => {
      setupAuthMocks();
      setupLearningMocks();
      cy.visit("/login");
      cy.get('input[type="email"]').type("student@test.com");
      cy.get('input[type="password"]').type("Test1234!");
      cy.get('button[type="submit"]').click();
      cy.wait("@login");
    });

    it("hiển thị tên người dùng trên sidebar", () => {
      cy.contains("Nguyễn Văn A").should("be.visible");
    });

    it("hiển thị nút CTA ôn tập", () => {
      cy.contains("Ôn tập ngay").should("be.visible");
    });

    it("điều hướng sang trang bài học", () => {
      cy.get('[href="/learning"]').first().click();
      cy.url().should("include", "/learning");
    });
  });

  // ── 3. Học bài ────────────────────────────────────────────────────────────

  describe("3. Trang học bài", () => {
    beforeEach(() => {
      setupAuthMocks();
      setupLearningMocks();
      // Đặt token trực tiếp để bypass login UI
      cy.visit("/login");
      cy.get('input[type="email"]').type("student@test.com");
      cy.get('input[type="password"]').type("Test1234!");
      cy.get('button[type="submit"]').click();
      cy.wait("@login");
      cy.url().should("eq", Cypress.config("baseUrl") + "/");
    });

    it("hiển thị danh sách bài học", () => {
      cy.visit("/learning");
      cy.wait("@getLessons");
      cy.contains("Basic Greetings").should("be.visible");
      cy.contains("Numbers 1-10").should("be.visible");
    });

    it("mở bài học và hiển thị thẻ từ", () => {
      cy.intercept("GET", "/api/v1/learning/lessons/1/", { statusCode: 200, body: MOCK_LESSON_DETAIL }).as("lessonDetail1");
      cy.visit("/learning/1/study");
      cy.wait("@lessonDetail1");
      cy.contains("hello").should("be.visible");
    });

    it("lật thẻ và xem nghĩa", () => {
      cy.intercept("GET", "/api/v1/learning/lessons/1/", { statusCode: 200, body: MOCK_LESSON_DETAIL }).as("lessonDetail1");
      cy.intercept("POST", "/api/v1/learning/lessons/1/start/", { statusCode: 200, body: {} }).as("startLesson1");
      cy.visit("/learning/1/study");
      cy.wait("@lessonDetail1");
      cy.contains("Xem nghĩa").click();
      cy.contains("Xin chào").should("be.visible");
    });

    it("đi qua tất cả từ và xem màn hình hoàn thành", () => {
      cy.intercept("GET", "/api/v1/learning/lessons/1/", { statusCode: 200, body: MOCK_LESSON_DETAIL }).as("lessonDetail1");
      cy.intercept("POST", "/api/v1/learning/lessons/1/start/", { statusCode: 200, body: {} });
      cy.intercept("POST", "/api/v1/learning/lessons/1/complete/", {
        statusCode: 200,
        body: { new_words: 3, xp_earned: 50, total_xp: 300, level: 3, streak: 5 },
      }).as("complete1");

      cy.visit("/learning/1/study");
      cy.wait("@lessonDetail1");

      // Từ 1: Xem nghĩa → Tiếp theo
      cy.contains("Xem nghĩa").click();
      cy.contains("Tiếp theo").click();
      // Từ 2: Xem nghĩa → Đã hiểu
      cy.contains("Xem nghĩa").click();
      cy.contains("Đã hiểu").click();
      // Từ 3: Xem nghĩa → Đã hiểu & Hoàn thành
      cy.contains("Xem nghĩa").click();
      cy.contains("Đã hiểu").click();
      cy.wait("@complete1");

      cy.contains("Xuất sắc!").should("be.visible");
      cy.contains("+50").should("be.visible");
    });
  });

  // ── 4. Ôn tập SRS ────────────────────────────────────────────────────────

  describe("4. Trang ôn tập SRS", () => {
    beforeEach(() => {
      setupAuthMocks();
      setupLearningMocks();
      setupReviewMocks();
      cy.visit("/login");
      cy.get('input[type="email"]').type("student@test.com");
      cy.get('input[type="password"]').type("Test1234!");
      cy.get('button[type="submit"]').click();
      cy.wait("@login");
    });

    it("điều hướng đến trang ôn tập từ dashboard", () => {
      cy.contains("Ôn tập ngay").click();
      cy.url().should("include", "/review");
    });

    it("hiển thị thẻ từ cần ôn", () => {
      cy.visit("/review");
      cy.wait("@reviewList");
      cy.contains("Từ 1/2").should("be.visible");
      cy.contains("hello").should("be.visible");
    });

    it("lật thẻ bằng nút", () => {
      cy.visit("/review");
      cy.wait("@reviewList");
      cy.contains("Lật thẻ · Xem nghĩa").click();
      cy.contains("Xin chào").should("be.visible");
    });

    it("hiển thị 6 nút chất lượng sau khi lật thẻ", () => {
      cy.visit("/review");
      cy.wait("@reviewList");
      cy.contains("Lật thẻ · Xem nghĩa").click();
      cy.contains("Quên").should("be.visible");
      cy.contains("Rất khó").should("be.visible");
      cy.contains("Khó").should("be.visible");
      cy.contains("Ổn").should("be.visible");
      cy.contains("Tốt").should("be.visible");
      cy.contains("Dễ").should("be.visible");
    });

    it("gửi đánh giá và chuyển từ tiếp theo", () => {
      cy.visit("/review");
      cy.wait("@reviewList");
      cy.contains("Lật thẻ · Xem nghĩa").click();
      cy.contains("Tốt").click();
      cy.wait("@submitAnswer");
      cy.contains("Từ 2/2").should("be.visible");
      cy.contains("goodbye").should("be.visible");
    });

    it("hoàn thành phiên ôn và xem tổng kết", () => {
      cy.visit("/review");
      cy.wait("@reviewList");

      // Từ 1
      cy.contains("Lật thẻ · Xem nghĩa").click();
      cy.contains("Tốt").click();
      cy.wait("@submitAnswer");

      // Từ 2
      cy.contains("Lật thẻ · Xem nghĩa").click();
      cy.contains("Tốt").click();
      cy.wait("@submitAnswer");

      cy.contains("Phiên ôn hoàn thành!").should("be.visible");
      cy.contains("Độ chính xác").should("be.visible");
      cy.contains("XP kiếm được").should("be.visible");
    });

    it("hiển thị empty state khi không có từ cần ôn", () => {
      cy.intercept("GET", "/api/v1/learning/review/", {
        statusCode: 200, body: { count: 0, words: [] },
      }).as("emptyReview");
      cy.visit("/review");
      cy.wait("@emptyReview");
      cy.contains("Tất cả đã ôn xong!").should("be.visible");
      cy.contains("Học bài mới").should("be.visible");
    });
  });

  // ── 5. Profile ────────────────────────────────────────────────────────────

  describe("5. Trang hồ sơ", () => {
    beforeEach(() => {
      setupAuthMocks();
      setupLearningMocks();
      cy.visit("/login");
      cy.get('input[type="email"]').type("student@test.com");
      cy.get('input[type="password"]').type("Test1234!");
      cy.get('button[type="submit"]').click();
      cy.wait("@login");
    });

    it("hiển thị thông tin người dùng", () => {
      cy.visit("/profile");
      cy.contains("Nguyễn Văn A").should("be.visible");
      cy.contains("student@test.com").should("be.visible");
      cy.contains("Học sinh").should("be.visible");
    });

    it("cập nhật họ tên thành công", () => {
      cy.intercept("PUT", "/api/v1/auth/me/", {
        statusCode: 200,
        body: { ...MOCK_USER, full_name: "Nguyễn Thị B" },
      }).as("updateMe");

      cy.visit("/profile");
      cy.get('input[name="full_name"]').clear().type("Nguyễn Thị B");
      cy.contains("Lưu thay đổi").click();
      cy.wait("@updateMe");
      cy.contains("Đã cập nhật hồ sơ.").should("be.visible");
    });
  });

  // ── 6. Thông báo ─────────────────────────────────────────────────────────

  describe("6. Trang thông báo", () => {
    beforeEach(() => {
      setupAuthMocks();
      setupLearningMocks();
      cy.intercept("GET", "/api/v1/learning/notifications/", {
        statusCode: 200,
        body: [
          { id: 1, type: "level_up", message: "Chúc mừng! Bạn đã đạt Level 3.", is_read: false, related_id: null, created_at: new Date().toISOString() },
          { id: 2, type: "assignment", message: "Bạn được giao bài học mới: Basic Greetings", is_read: true, related_id: 1, created_at: new Date().toISOString() },
        ],
      }).as("notifs");
      cy.visit("/login");
      cy.get('input[type="email"]').type("student@test.com");
      cy.get('input[type="password"]').type("Test1234!");
      cy.get('button[type="submit"]').click();
      cy.wait("@login");
    });

    it("hiển thị danh sách thông báo", () => {
      cy.visit("/notifications");
      cy.wait("@notifs");
      cy.contains("Chúc mừng! Bạn đã đạt Level 3.").should("be.visible");
      cy.contains("Bạn được giao bài học mới").should("be.visible");
    });

    it("đánh dấu đã đọc", () => {
      cy.intercept("PUT", "/api/v1/learning/notifications/1/read/", { statusCode: 200, body: {} }).as("markRead");
      cy.intercept("GET", "/api/v1/learning/notifications/", {
        statusCode: 200,
        body: [
          { id: 1, type: "level_up", message: "Chúc mừng! Bạn đã đạt Level 3.", is_read: true, related_id: null, created_at: new Date().toISOString() },
          { id: 2, type: "assignment", message: "Bạn được giao bài học mới", is_read: true, related_id: 1, created_at: new Date().toISOString() },
        ],
      }).as("notifsAfter");
      cy.visit("/notifications");
      cy.wait("@notifs");
      cy.contains("Đánh dấu tất cả đã đọc").click();
      cy.wait("@notifsAfter");
    });
  });

});
