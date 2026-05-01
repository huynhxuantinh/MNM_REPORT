/**
 * E2E: Luồng đăng nhập Admin → quản lý users → quản lý từ vựng → quản lý bài học
 */

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ADMIN = {
  id: 1,
  email: "admin@test.com",
  username: "admin",
  full_name: "Quản Trị Viên",
  role: "admin",
  xp: 0,
  level: 1,
  avatar_url: "",
  notification_enabled: true,
  created_at: "2026-01-01T00:00:00Z",
};

const MOCK_TOKENS = {
  access: "mock_access_token_admin",
  refresh: "mock_refresh_token_admin",
  user: MOCK_ADMIN,
};

const MOCK_ADMIN_STATS = {
  total_users: 150,
  students: 120,
  teachers: 25,
  admins: 5,
  active_users: 140,
  recent_users: [
    { id: 10, email: "newuser@test.com", full_name: "Người Dùng Mới", role: "user", is_active: true, created_at: "2026-04-30T10:00:00Z" },
  ],
};

const MOCK_USERS = {
  count: 150,
  results: [
    { id: 1, email: "admin@test.com", full_name: "Quản Trị Viên", username: "admin", role: "admin", is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 2, email: "teacher@test.com", full_name: "Trần Thị B", username: "teacher", role: "teacher", is_active: true, created_at: "2026-01-02T00:00:00Z" },
    { id: 10, email: "student@test.com", full_name: "Nguyễn Văn A", username: "student", role: "user", is_active: true, created_at: "2026-01-03T00:00:00Z" },
  ],
};

const MOCK_WORDS = {
  count: 500,
  results: [
    { id: 1, text: "hello", phonetic: "/həˈloʊ/", part_of_speech: "exclamation", definition_vi: "xin chào", level: "A1", is_bookmarked: false },
    { id: 2, text: "beautiful", phonetic: "/ˈbjuːtɪfl/", part_of_speech: "adjective", definition_vi: "đẹp", level: "A1", is_bookmarked: true },
  ],
};

const MOCK_LESSONS = {
  count: 50,
  results: [
    { id: 1, title: "Basic Greetings", level: "A1", word_count: 10, is_published: true, created_by_name: "Trần Thị B" },
    { id: 2, title: "Advanced Grammar", level: "C1", word_count: 25, is_published: true, created_by_name: "Admin" },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const setupAdminAuthMocks = () => {
  cy.intercept("POST", "/api/v1/auth/login/", { statusCode: 200, body: MOCK_TOKENS }).as("login");
  cy.intercept("GET", "/api/v1/auth/me/", { statusCode: 200, body: MOCK_ADMIN }).as("getMe");
};

const setupAdminMocks = () => {
  // Admin stats
  cy.intercept("GET", "/api/v1/auth/admin/stats/", { statusCode: 200, body: MOCK_ADMIN_STATS }).as("adminStats");

  // Users
  cy.intercept("GET", "/api/v1/auth/users/", { statusCode: 200, body: MOCK_USERS }).as("getUsers");
  cy.intercept("PATCH", "/api/v1/auth/users/*/", { statusCode: 200, body: {} }).as("updateUser");

  // Words
  cy.intercept("GET", "/api/v1/vocabulary/words/", { statusCode: 200, body: MOCK_WORDS }).as("getWords");
  cy.intercept("POST", "/api/v1/vocabulary/words/", { statusCode: 201, body: { id: 501, text: "newword", level: "A1" } }).as("createWord");
  cy.intercept("DELETE", "/api/v1/vocabulary/words/*", { statusCode: 204 }).as("deleteWord");

  // Lessons
  cy.intercept("GET", "/api/v1/learning/lessons/", { statusCode: 200, body: MOCK_LESSONS }).as("getLessons");
  cy.intercept("DELETE", "/api/v1/learning/lessons/*", { statusCode: 204 }).as("deleteLesson");
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Admin Portal Flow", () => {
  beforeEach(() => {
    setupAdminAuthMocks();
    setupAdminMocks();
  });

  it("đăng nhập vào cổng quản trị", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').type("admin@test.com");
    cy.get('input[type="password"]').type("Admin@123456");
    cy.get("button").contains(/đăng nhập/i).click();

    cy.wait("@login");
    cy.url().should("include", "/admin");

    // Kiểm tra đang ở cổng admin
    cy.contains("Quản trị").should("be.visible");
  });

  it("xem dashboard admin với thống kê hệ thống", () => {
    cy.loginAsAdmin(); // Custom command nếu có

    cy.visit("/admin");
    cy.wait("@adminStats");

    // Kiểm tra các thẻ thống kê
    cy.contains("150").should("be.visible"); // total_users
    cy.contains("120").should("be.visible"); // students
    cy.contains("25").should("be.visible"); // teachers
  });

  it("quản lý người dùng - xem danh sách", () => {
    cy.visit("/admin/users");
    cy.wait("@getUsers");

    // Kiểm tra có đủ các loại user
    cy.contains("Quản Trị Viên").should("be.visible");
    cy.contains("Trần Thị B").should("be.visible");
    cy.contains("Nguyễn Văn A").should("be.visible");

    // Kiểm tra role badges
    cy.contains("admin").should("be.visible");
    cy.contains("teacher").should("be.visible");
    cy.contains("user").should("be.visible");
  });

  it("quản lý người dùng - tìm kiếm", () => {
    cy.visit("/admin/users");
    cy.wait("@getUsers");

    // Gõ vào ô tìm kiếm
    cy.get('input[type="search"]').type("teacher");

    // Kiểm tra kết quả lọc
    cy.contains("Trần Thị B").should("be.visible");
  });

  it("quản lý người dùng - thay đổi vai trò", () => {
    cy.visit("/admin/users");
    cy.wait("@getUsers");

    // Click vào user để edit
    cy.contains("Nguyễn Văn A").parent().find('button[title="Edit"]').click();

    // Thay đổi role
    cy.get('select[name="role"]').select("teacher");

    // Lưu thay đổi
    cy.get("button").contains(/lưu/i).click();
    cy.wait("@updateUser");

    // Kiểm tra thông báo thành công
    cy.contains(/đã cập nhật/i).should("be.visible");
  });

  it("quản lý từ vựng - xem danh sách", () => {
    cy.visit("/admin/words");
    cy.wait("@getWords");

    // Kiểm tra có từ vựng
    cy.contains("hello").should("be.visible");
    cy.contains("/həˈloʊ/").should("be.visible");
    cy.contains("xin chào").should("be.visible");
  });

  it("quản lý từ vựng - lọc theo cấp độ", () => {
    cy.visit("/admin/words");
    cy.wait("@getWords");

    // Chọn filter A1
    cy.get('select[name="level"]').select("A1");

    // Kiểm tra danh sách được lọc
    cy.contains("hello").should("be.visible");
  });

  it("quản lý bài học - xem danh sách", () => {
    cy.visit("/admin/lessons");
    cy.wait("@getLessons");

    // Kiểm tra có bài học
    cy.contains("Basic Greetings").should("be.visible");
    cy.contains("Advanced Grammar").should("be.visible");
    cy.contains("A1").should("be.visible");
    cy.contains("C1").should("be.visible");
  });

  it("quản lý bài học - xóa bài học", () => {
    cy.visit("/admin/lessons");
    cy.wait("@getLessons");

    // Click nút xóa
    cy.contains("Basic Greetings").parent().find('button[title="Delete"]').click();

    // Xác nhận xóa
    cy.get("button").contains(/xác nhận/i).click();
    cy.wait("@deleteLesson");

    // Kiểm tra thông báo thành công
    cy.contains(/đã xóa/i).should("be.visible");
  });

  it("chuyển đổi giữa các trang admin", () => {
    cy.visit("/admin");

    // Click vào Users
    cy.contains("Người dùng").click();
    cy.url().should("include", "/admin/users");
    cy.wait("@getUsers");

    // Click vào Words
    cy.contains("Từ vựng").click();
    cy.url().should("include", "/admin/words");
    cy.wait("@getWords");

    // Click vào Lessons
    cy.contains("Bài học").click();
    cy.url().should("include", "/admin/lessons");
    cy.wait("@getLessons");

    // Quay về Dashboard
    cy.contains("Dashboard").click();
    cy.url().should("eq", Cypress.config().baseUrl + "/admin");
  });

  it("không cho phép truy cập admin nếu không phải admin", () => {
    // Mock user không phải admin
    cy.intercept("GET", "/api/v1/auth/me/", {
      statusCode: 200,
      body: { ...MOCK_ADMIN, role: "user" },
    }).as("getMeNonAdmin");

    cy.visit("/admin");
    cy.wait("@getMeNonAdmin");

    // Kiểm tra redirect về trang chủ
    cy.url().should("not.include", "/admin");
  });
});
