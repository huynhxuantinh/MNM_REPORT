/**
 * E2E: Luồng đăng nhập Teacher → quản lý bài học → giao bài → xem học sinh
 */

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_TEACHER = {
  id: 2,
  email: "teacher@test.com",
  username: "teacher",
  full_name: "Trần Thị B",
  role: "teacher",
  xp: 500,
  level: 5,
  avatar_url: "",
  notification_enabled: true,
  created_at: "2026-01-01T00:00:00Z",
};

const MOCK_TOKENS = {
  access: "mock_access_token_teacher",
  refresh: "mock_refresh_token_teacher",
  user: MOCK_TEACHER,
};

const MOCK_TEACHER_STATS = {
  lesson_count: 5,
  assignment_count: 12,
  student_count: 8,
  recent_lessons: [
    { id: 1, title: "Basic Greetings", level: "A1", word_count: 10, is_published: true },
    { id: 2, title: "Numbers 1-20", level: "A1", word_count: 15, is_published: true },
  ],
  recent_assignments: [
    { id: 1, student_email: "student1@test.com", lesson_title: "Basic Greetings", due_date: "2026-05-05", is_completed: false },
    { id: 2, student_email: "student2@test.com", lesson_title: "Numbers 1-20", due_date: "2026-05-03", is_completed: true },
  ],
};

const MOCK_LESSONS = {
  count: 5,
  results: [
    { id: 1, title: "Basic Greetings", level: "A1", word_count: 10, is_published: true, created_by_name: "Trần Thị B" },
    { id: 2, title: "Numbers 1-20", level: "A1", word_count: 15, is_published: true, created_by_name: "Trần Thị B" },
    { id: 3, title: "Family Members", level: "A2", word_count: 12, is_published: false, created_by_name: "Trần Thị B" },
  ],
};

const MOCK_STUDENTS = {
  count: 8,
  results: [
    { id: 10, email: "student1@test.com", full_name: "Nguyễn Văn A", username: "student1", level: 3, xp: 250, assigned_count: 2 },
    { id: 11, email: "student2@test.com", full_name: "Lê Thị C", username: "student2", level: 4, xp: 400, assigned_count: 3 },
  ],
};

const MOCK_CLASSES = {
  count: 2,
  results: [
    { id: 1, name: "Lớp A1 Morning", student_count: 5, students: [
      { id: 10, email: "student1@test.com", full_name: "Nguyễn Văn A", level: 3 },
    ]},
    { id: 2, name: "Lớp A2 Evening", student_count: 3, students: [] },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const setupTeacherAuthMocks = () => {
  cy.intercept("POST", "/api/v1/auth/login/", { statusCode: 200, body: MOCK_TOKENS }).as("login");
  cy.intercept("GET", "/api/v1/auth/me/", { statusCode: 200, body: MOCK_TEACHER }).as("getMe");
  cy.intercept("GET", "/api/v1/auth/teacher/students/*", { statusCode: 200, body: MOCK_STUDENTS }).as("getStudents");
};

const setupTeacherMocks = () => {
  // Teacher stats
  cy.intercept("GET", "/api/v1/learning/teacher/stats/", { statusCode: 200, body: MOCK_TEACHER_STATS }).as("teacherStats");

  // Lessons
  cy.intercept("GET", "/api/v1/learning/lessons/", { statusCode: 200, body: MOCK_LESSONS }).as("getLessons");
  cy.intercept("POST", "/api/v1/learning/lessons/", {
    statusCode: 201,
    body: { id: 6, title: "New Lesson", level: "A1", word_count: 0, is_published: false },
  }).as("createLesson");
  cy.intercept("PATCH", "/api/v1/learning/lessons/*", { statusCode: 200, body: {} }).as("updateLesson");
  cy.intercept("DELETE", "/api/v1/learning/lessons/*", { statusCode: 204 }).as("deleteLesson");

  // Assignments
  cy.intercept("GET", "/api/v1/learning/assignments/", { statusCode: 200, body: { count: 12, results: MOCK_TEACHER_STATS.recent_assignments } }).as("getAssignments");
  cy.intercept("POST", "/api/v1/learning/assignments/", { statusCode: 201, body: { detail: "Assignment created" } }).as("createAssignment");

  // Classes
  cy.intercept("GET", "/api/v1/learning/classes/", { statusCode: 200, body: MOCK_CLASSES }).as("getClasses");
  cy.intercept("POST", "/api/v1/learning/classes/", { statusCode: 201, body: { id: 3, name: "New Class", student_count: 0, students: [] } }).as("createClass");
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Teacher Portal Flow", () => {
  beforeEach(() => {
    setupTeacherAuthMocks();
    setupTeacherMocks();
  });

  it("đăng nhập vào cổng giáo viên", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').type("teacher@test.com");
    cy.get('input[type="password"]').type("Teacher@123456");
    cy.get("button").contains(/đăng nhập/i).click();

    cy.wait("@login");
    cy.url().should("include", "/teacher");

    // Kiểm tra đang ở cổng giáo viên
    cy.contains("Tổng quan").should("be.visible");
    cy.contains("Cổng giáo viên").should("be.visible");
  });

  it("xem dashboard giáo viên với thống kê", () => {
    cy.loginAsTeacher(); // Custom command nếu có

    cy.visit("/teacher");
    cy.wait("@teacherStats");

    // Kiểm tra các thẻ thống kê
    cy.contains("5").should("be.visible"); // lesson_count
    cy.contains("12").should("be.visible"); // assignment_count
    cy.contains("8").should("be.visible"); // student_count

    // Kiểm tra bảng bài học gần đây
    cy.contains("Basic Greetings").should("be.visible");
    cy.contains("Numbers 1-20").should("be.visible");
  });

  it("tạo bài học mới", () => {
    cy.visit("/teacher/lessons");
    cy.wait("@getLessons");

    // Click nút tạo bài học
    cy.get("button").contains(/tạo bài học/i).click();

    // Điền form
    cy.get('input[name="title"]').type("Colors and Shapes");
    cy.get('select[name="level"]').select("A1");
    cy.get('textarea[name="description"]').type("Learn basic colors and shapes");

    // Submit
    cy.get("button").contains(/lưu/i).click();
    cy.wait("@createLesson");

    // Kiểm tra thông báo thành công
    cy.contains(/đã tạo bài học/i).should("be.visible");
  });

  it("giao bài cho học sinh", () => {
    cy.visit("/teacher/assignments");

    // Chờ load students và lessons
    cy.wait(["@getStudents", "@getLessons"]);

    // Chọn bài học
    cy.get('select[name="lesson"]').select("Basic Greetings");

    // Chọn học sinh
    cy.get('input[type="checkbox"]').first().check();

    // Đặt hạn nộp
    cy.get('input[type="date"]').type("2026-05-10");

    // Click giao bài
    cy.get("button").contains(/giao bài/i).click();
    cy.wait("@createAssignment");

    // Kiểm tra thông báo thành công
    cy.contains(/đã giao bài/i).should("be.visible");
  });

  it("xem danh sách học sinh", () => {
    cy.visit("/teacher/students");
    cy.wait("@getStudents");

    // Kiểm tra có học sinh trong danh sách
    cy.contains("Nguyễn Văn A").should("be.visible");
    cy.contains("student1@test.com").should("be.visible");
    cy.contains("Level 3").should("be.visible");
    cy.contains("250 XP").should("be.visible");
  });

  it("quản lý lớp học - tạo lớp mới", () => {
    cy.visit("/teacher/classes");
    cy.wait("@getClasses");

    // Kiểm tra danh sách lớp hiện có
    cy.contains("Lớp A1 Morning").should("be.visible");
    cy.contains("5 học sinh").should("be.visible");

    // Click tạo lớp mới
    cy.get("button").contains(/tạo lớp/i).click();

    // Điền tên lớp
    cy.get('input[name="name"]').type("Lớp B1 Advanced");

    // Submit
    cy.get("button").contains(/tạo/i).click();
    cy.wait("@createClass");

    // Kiểm tra lớp mới xuất hiện
    cy.contains("Lớp B1 Advanced").should("be.visible");
  });

  it("chuyển đổi giữa các tab trong chi tiết lớp học", () => {
    cy.visit("/teacher/classes");
    cy.wait("@getClasses");

    // Click vào lớp để xem chi tiết
    cy.contains("Lớp A1 Morning").click();

    // Tab học sinh
    cy.contains("Học sinh").click();
    cy.contains("Nguyễn Văn A").should("be.visible");

    // Tab thêm học sinh
    cy.contains("Thêm học sinh").click();
    cy.contains(/chọn học sinh/i).should("be.visible");

    // Tab giao bài
    cy.contains("Giao bài").click();
    cy.contains(/chọn bài học/i).should("be.visible");
  });

  it("đăng xuất khỏi cổng giáo viên", () => {
    cy.visit("/teacher");

    // Click menu user
    cy.get('[data-testid="user-menu"]').click();
    cy.contains(/đăng xuất/i).click();

    // Kiểm tra redirect về login
    cy.url().should("include", "/login");
  });
});
