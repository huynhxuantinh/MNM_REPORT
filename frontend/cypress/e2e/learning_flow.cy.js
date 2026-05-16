describe("Student Learning Flow", () => {
  const student = {
    id: 10,
    email: "student@test.com",
    username: "student",
    full_name: "Nguyen Van A",
    role: "user",
    xp: 250,
    level: 3,
    notification_enabled: true,
    created_at: "2026-01-01T00:00:00Z",
    streak: { current_streak: 4 },
  };

  const mockStudentSession = () => {
    cy.intercept("POST", "**/api/v1/auth/token/refresh/**", {
      statusCode: 200,
      body: { access: "student_access" },
    }).as("refresh");

    cy.intercept("GET", "**/api/v1/auth/me/**", {
      statusCode: 200,
      body: student,
    }).as("me");
  };

  beforeEach(() => {
    mockStudentSession();
  });

  it("loads home dashboard", () => {
    cy.intercept("GET", "**/api/v1/learning/review/summary/**", {
      statusCode: 200,
      body: { due_today: 2, reviewed_today: 1, streak: 4 },
    }).as("reviewSummary");

    cy.intercept("GET", "**/api/v1/learning/review/history/**", {
      statusCode: 200,
      body: [{ date: "2026-05-10", count: 2 }],
    }).as("reviewHistory");

    cy.intercept("GET", "**/api/v1/learning/lessons/**", {
      statusCode: 200,
      body: {
        count: 2,
        results: [
          { id: 1, title: "Basic Greetings", level: "A1", word_count: 5, user_progress: null },
          { id: 2, title: "Numbers 1-10", level: "A1", word_count: 8, user_progress: null },
        ],
      },
    }).as("homeLessons");

    cy.visit("/");
    cy.wait("@refresh");
    cy.wait("@me");
    cy.wait("@reviewSummary");
    cy.wait("@homeLessons");
    cy.contains("Basic Greetings").should("be.visible");
  });

  it("opens learning path and starts a lesson session", () => {
    cy.intercept("GET", "**/api/v1/learning/path/**", {
      statusCode: 200,
      body: {
        id: 1,
        name: "Core English",
        units: [
          {
            id: 100,
            title: "Basics",
            order_index: 1,
            unlocked: true,
            lesson_count: 1,
            progress: { completed_lessons: 0 },
            lessons: [{ order_index: 1, lesson: { id: 1, title: "Greetings", level: "A1" } }],
          },
        ],
      },
    }).as("learningPath");

    cy.intercept("GET", "**/api/v1/learning/placement/status/**", {
      statusCode: 200,
      body: { has_completed_placement: true },
    }).as("placementStatus");

    cy.intercept("GET", "**/api/v1/learning/session/recover/**", {
      statusCode: 200,
      body: { has_recoverable_session: false },
    }).as("recoverSession");

    cy.intercept("GET", "**/api/v1/learning/daily-goal/**", {
      statusCode: 200,
      body: {
        target_minutes: 10,
        reward_xp: 20,
        today: { studied_minutes: 3, goal_minutes: 10, is_achieved: false, claimed_at: null },
        hearts: { current: 5, max: 5 },
        streak: { freeze_count: 0 },
      },
    }).as("dailyGoal");

    cy.intercept("POST", "**/api/v1/learning/session/start/**", {
      statusCode: 200,
      body: { id: 900 },
    }).as("startSession");

    cy.intercept("GET", "**/api/v1/learning/session/900/**", {
      statusCode: 200,
      body: {
        session: {
          id: 900,
          lesson_title: "Greetings",
          unit_title: "Basics",
          session_type: "lesson",
          status: "in_progress",
          total_answered: 0,
          correct_answered: 0,
          xp_earned: 0,
        },
        attempts: [],
        exercises: [
          { step_index: 1, exercise_type: "mc_meaning", prompt: "hello means?", choices: ["xin chao", "tam biet"] },
        ],
        hearts: { current: 5, max: 5 },
      },
    }).as("session900");

    cy.visit("/learning");
    cy.wait("@learningPath");
    cy.wait("@dailyGoal");
    cy.contains("Learning Path").should("be.visible");
    cy.contains("button", "Start").first().click();
    cy.wait("@startSession");
    cy.wait("@session900");
    cy.url().should("include", "/learning/session/900");
  });

  it("loads review page and submits one answer", () => {
    cy.intercept("GET", "**/api/v1/learning/review/**", {
      statusCode: 200,
      body: {
        count: 1,
        words: [
          {
            id: 1,
            word: {
              id: 101,
              text: "hello",
              phonetic: "h??lo?",
              part_of_speech: "interjection",
              definition_vi: "xin chao",
              definition_en: "greeting",
              example_en: "Hello!",
              example_vi: "Xin chao!",
            },
            repetitions: 1,
            interval_days: 2,
          },
        ],
      },
    }).as("reviewList");

    cy.intercept("POST", "**/api/v1/learning/review/101/answer/**", {
      statusCode: 200,
      body: { xp_earned: 5, total_xp: 255, level: 3, streak: 4 },
    }).as("reviewAnswer");

    cy.visit("/review");
    cy.wait("@reviewList");
    cy.contains("hello").should("be.visible");
    cy.contains("button", /xem/i).click();
    cy.contains(/^4$/).click({ force: true });
    cy.wait("@reviewAnswer");
  });

  it("updates profile full name", () => {
    cy.intercept("GET", "**/api/v1/learning/profile/stats/**", {
      statusCode: 200,
      body: {
        total_words_studied: 40,
        total_review_sessions: 60,
        correct_answers: 45,
        accuracy_pct: 75,
        best_streak: 8,
        bookmarks: 3,
        lessons_completed: 6,
      },
    }).as("profileStats");

    cy.intercept("GET", "**/api/v1/learning/review/history/**", {
      statusCode: 200,
      body: [{ date: "2026-05-10", count: 2 }],
    }).as("history");

    cy.intercept("PUT", "**/api/v1/auth/me/**", {
      statusCode: 200,
      body: { ...student, full_name: "Updated Student" },
    }).as("updateProfile");

    cy.visit("/profile");
    cy.wait("@profileStats");
    cy.get('[data-cy="full-name-input"]').clear().type("Updated Student");
    cy.get('[data-cy="full-name-input"]').closest("form").find('button[type="submit"]').click();
    cy.wait("@updateProfile").its("request.body").should("deep.include", {
      full_name: "Updated Student",
    });
  });

  it("marks one notification as read", () => {
    cy.intercept("GET", "**/api/v1/learning/notifications/**", {
      statusCode: 200,
      body: {
        count: 1,
        results: [
          {
            id: 7,
            type: "assignment",
            message: "New assignment available",
            is_read: false,
            created_at: "2026-05-15T08:00:00Z",
          },
        ],
      },
    }).as("notifications");

    cy.intercept("PUT", "**/api/v1/learning/notifications/7/read/**", {
      statusCode: 200,
      body: {},
    }).as("markRead");

    cy.visit("/notifications");
    cy.wait("@notifications");
    cy.contains("New assignment available").click();
    cy.wait("@markRead");
  });
});
