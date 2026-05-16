describe("Admin Portal Flow", () => {
  const admin = {
    id: 1,
    email: "admin@test.com",
    username: "admin",
    full_name: "Quan Tri Vien",
    role: "admin",
    xp: 0,
    level: 1,
  };

  const mockAdminSession = () => {
    cy.intercept("POST", "**/api/v1/auth/token/refresh/**", {
      statusCode: 200,
      body: { access: "admin_access" },
    }).as("refresh");

    cy.intercept("GET", "**/api/v1/auth/me/**", {
      statusCode: 200,
      body: admin,
    }).as("me");
  };

  beforeEach(() => {
    mockAdminSession();
  });

  it("loads admin dashboard stats", () => {
    cy.intercept("GET", "**/api/v1/auth/admin/stats/**", {
      statusCode: 200,
      body: {
        total_users: 150,
        students: 120,
        teachers: 25,
        admins: 5,
        new_users_this_week: 8,
        active_users: 140,
        total_words: 500,
        total_lessons: 50,        total_wordsets: 30,
        reviews_today: 20,
        total_reviews: 450,
        total_quiz_results: 60,
      },
    }).as("adminStats");

    cy.visit("/admin");
    cy.wait("@refresh");
    cy.wait("@me");
    cy.wait("@adminStats");
    cy.url().should("include", "/admin");
    cy.contains("150").should("be.visible");
  });

  it("loads users management page", () => {
    cy.intercept("GET", "**/api/v1/auth/admin/stats/**", {
      statusCode: 200,
      body: { total_users: 1, students: 1, teachers: 0, admins: 0 },
    });

    cy.intercept("GET", "**/api/v1/auth/admin/users/**", {
      statusCode: 200,
      body: {
        count: 2,
        results: [
          { id: 2, email: "teacher@test.com", full_name: "Tran Thi B", username: "teacher", role: "teacher", is_active: true, xp: 100, created_at: "2026-01-02T00:00:00Z" },
          { id: 10, email: "student@test.com", full_name: "Nguyen Van A", username: "student", role: "user", is_active: true, xp: 200, created_at: "2026-01-03T00:00:00Z" },
        ],
      },
    }).as("getUsers");

    cy.visit("/admin/users");
    cy.wait("@getUsers");
    cy.contains("Tran Thi B").should("be.visible");
    cy.get('input[placeholder*="T"]').should("exist");
  });

  it("loads words management page", () => {
    cy.intercept("GET", "**/api/v1/vocabulary/words/**", {
      statusCode: 200,
      body: {
        count: 2,
        results: [
          { id: 1, text: "hello", phonetic: "/h??lo?/", part_of_speech: "interjection", definition_vi: "xin chao", level: "A1" },
          { id: 2, text: "beautiful", phonetic: "/?bju?t?fl/", part_of_speech: "adjective", definition_vi: "dep", level: "A1" },
        ],
      },
    }).as("getWords");

    cy.visit("/admin/words");
    cy.wait("@getWords");
    cy.contains("hello").should("be.visible");
  });

  it("loads lessons management and deletes one lesson", () => {
    cy.intercept("GET", "**/api/v1/learning/lessons/**", {
      statusCode: 200,
      body: {
        count: 2,
        results: [
          { id: 1, title: "Basic Greetings", description: "base", level: "A1", word_count: 10, is_published: true },
          { id: 2, title: "Advanced Grammar", description: "adv", level: "C1", word_count: 25, is_published: true },
        ],
      },
    }).as("getLessons");

    cy.intercept("DELETE", "**/api/v1/learning/lessons/1/**", {
      statusCode: 204,
      body: {},
    }).as("deleteLesson");

    cy.visit("/admin/lessons");
    cy.wait("@getLessons");
    cy.contains("Basic Greetings").should("be.visible");

    cy.window().then((win) => cy.stub(win, "confirm").returns(true));
    cy.contains("Basic Greetings").parents("tr").find("button").last().click();
    cy.wait("@deleteLesson");
  });
});

