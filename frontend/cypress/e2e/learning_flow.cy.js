describe("Student Learning Flow", () => {
  const student = {
    id: 10,
    email: "student@test.com",
    username: "student",
    full_name: "Nguyen Van A",
    role: "user",
    xp: 250,
    level: 3,
  };

  const setupSession = () => {
    cy.intercept("POST", "**/api/v1/auth/token/refresh/**", {
      statusCode: 200,
      body: { access: "student_access" },
    }).as("refresh");

    cy.intercept("GET", "**/api/v1/auth/me/**", {
      statusCode: 200,
      body: student,
    }).as("me");

    cy.intercept("GET", "**/api/v1/learning/placement/status/**", {
      statusCode: 200,
      body: {
        has_completed_placement: true,
        should_show_onboarding: false,
      },
    }).as("placementStatus");
  };

  beforeEach(() => {
    setupSession();
  });

  it("loads home dashboard", () => {
    cy.intercept("GET", "**/api/v1/learning/review/summary/**", {
      statusCode: 200,
      body: { due_today: 2, reviewed_today: 1, streak: 4 },
    });
    cy.intercept("GET", "**/api/v1/learning/review/history/**", {
      statusCode: 200,
      body: [{ date: "2026-05-10", count: 2 }],
    });
    cy.intercept("GET", "**/api/v1/learning/lessons/**", {
      statusCode: 200,
      body: {
        count: 1,
        results: [{ id: 1, title: "Basic Greetings", level: "A1", word_count: 5, user_progress: null }],
      },
    });
    cy.intercept("GET", "**/api/v1/learning/session/recover/**", {
      statusCode: 200,
      body: { has_recoverable_session: false },
    });
    cy.intercept("GET", "**/api/v1/learning/daily-goal/**", {
      statusCode: 200,
      body: {
        target_minutes: 10,
        reward_xp: 15,
        today: { studied_minutes: 3, goal_minutes: 10, is_achieved: false, claimed_at: null },
        hearts: { current: 5, max: 10 },
        streak: { freeze_count: 0 },
      },
    });

    cy.visit("/");
    cy.wait("@refresh");
    cy.wait("@me");
    cy.wait("@placementStatus");
    cy.contains(/trang chủ|home|chào/i).should("be.visible");
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
            lessons: [{ order_index: 1, lesson: { id: 1, title: "Greetings", level: "A1", words_learned: 0, words_total: 10 } }],
          },
        ],
      },
    }).as("learningPath");
    cy.intercept("GET", "**/api/v1/learning/session/recover/**", {
      statusCode: 200,
      body: { has_recoverable_session: false },
    });
    cy.intercept("GET", "**/api/v1/learning/daily-goal/**", {
      statusCode: 200,
      body: {
        target_minutes: 10,
        reward_xp: 15,
        today: { studied_minutes: 3, goal_minutes: 10, is_achieved: false, claimed_at: null },
        hearts: { current: 5, max: 10 },
        streak: { freeze_count: 0 },
      },
    });
    cy.intercept("POST", "**/api/v1/learning/session/start/**", {
      statusCode: 201,
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
        exercises: [{ step_index: 1, exercise_type: "mc_meaning", prompt: "hello means?", choices: ["xin chao", "tam biet"] }],
        hearts: { current: 5, max: 10 },
      },
    }).as("session900");

    cy.visit("/learning");
    cy.wait("@refresh");
    cy.wait("@me");
    cy.wait("@placementStatus");
    cy.wait("@learningPath");
    cy.contains(/lộ trình học|learning path/i).should("be.visible");
    cy.get('[data-cy^="learning-start-"]').first().click({ force: true });
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
              phonetic: "hello",
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
    cy.wait("@refresh");
    cy.wait("@me");
    cy.wait("@placementStatus");
    cy.wait("@reviewList");
    cy.contains(/hello/i).should("be.visible");
    cy.contains("button", /lật thẻ|xem nghĩa|flip|xem nghia/i).click({ force: true });
    cy.contains(/tốt|tot/i).click({ force: true });
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
    });
    cy.intercept("GET", "**/api/v1/learning/review/history/**", {
      statusCode: 200,
      body: [{ date: "2026-05-10", count: 2 }],
    });
    cy.intercept("PUT", "**/api/v1/auth/me/**", {
      statusCode: 200,
      body: { ...student, full_name: "Updated Student" },
    }).as("updateProfile");

    cy.visit("/profile");
    cy.wait("@refresh");
    cy.wait("@me");
    cy.wait("@placementStatus");
    cy.get('[data-cy="full-name-input"]').clear().type("Updated Student");
    cy.get('[data-cy="full-name-input"]').closest("form").find('button[type="submit"]').click();
    cy.wait("@updateProfile").its("request.body").should("deep.include", { full_name: "Updated Student" });
  });

  it("marks one notification as read", () => {
    cy.intercept("GET", "**/api/v1/learning/notifications/**", {
      statusCode: 200,
      body: {
        count: 1,
        results: [
          {
            id: 7,
            type: "system",
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
    cy.wait("@refresh");
    cy.wait("@me");
    cy.wait("@placementStatus");
    cy.wait("@notifications");
    cy.contains("New assignment available").click({ force: true });
    cy.wait("@markRead");
  });

  it("shows listening lessons and opens a listening session", () => {
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
            lessons: [{ order_index: 1, lesson: { id: 1, title: "Greetings", level: "A1", words_learned: 0, words_total: 10 } }],
          },
          {
            id: 200,
            title: "Unit 6 - Listening Lab",
            order_index: 6,
            unlocked: true,
            lesson_count: 1,
            progress: null,
            lessons: [{ order_index: 1, lesson: { id: 60, title: "Listening Demo", level: "A1", skill_tag: "listening", listening_estimated_seconds: 30, words_learned: 0, words_total: 5 } }],
          },
        ],
      },
    }).as("learningPath");
    cy.intercept("GET", "**/api/v1/learning/session/recover/**", {
      statusCode: 200,
      body: { has_recoverable_session: false },
    });
    cy.intercept("GET", "**/api/v1/learning/daily-goal/**", {
      statusCode: 200,
      body: {
        target_minutes: 10,
        reward_xp: 15,
        today: { studied_minutes: 3, goal_minutes: 10, is_achieved: false, claimed_at: null },
        hearts: { current: 5, max: 10 },
        streak: { freeze_count: 0 },
      },
    });
    cy.intercept("POST", "**/api/v1/learning/session/start/**", {
      statusCode: 201,
      body: { id: 901 },
    }).as("startListeningSession");
    cy.intercept("GET", "**/api/v1/learning/session/901/**", {
      statusCode: 200,
      body: {
        session: {
          id: 901,
          lesson_title: "Listening Demo",
          lesson_skill_tag: "listening",
          lesson_listening_transcript: "Anna takes a bus to school every morning.",
          lesson_listening_translation_vi: "Anna di xe buyt den truong moi buoi sang.",
          lesson_listening_estimated_seconds: 35,
          lesson_listening_tts_lang: "en-US",
          lesson_listening_tts_rate: 0.9,
          unit_title: "Unit 6 - Listening Lab",
          session_type: "lesson",
          status: "started",
          total_answered: 0,
          correct_answered: 0,
          xp_earned: 0,
        },
        attempts: [],
        exercises: [
          {
            step_index: 1,
            exercise_type: "listen_choose_word",
            prompt: "Chon tu ban nghe thay",
            audio_text: "Anna takes a bus to school every morning.",
            choices: ["bus", "train", "car", "ticket"],
          },
        ],
        hearts: { current: 5, max: 10 },
      },
    }).as("listeningSession");

    cy.visit("/learning", {
      onBeforeLoad(win) {
        win.speechSynthesis = {
          speak: cy.stub().as("speakStub"),
          cancel: cy.stub().as("cancelStub"),
          pause: cy.stub().as("pauseStub"),
          getVoices: cy.stub().returns([{ lang: "en-US", name: "Demo Voice" }]),
        };
        win.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
          this.text = text;
          this.lang = "";
          this.rate = 1;
          this.voice = null;
        };
      },
    });
    cy.wait("@refresh");
    cy.wait("@me");
    cy.wait("@placementStatus");
    cy.wait("@learningPath");

    cy.contains(/Luyện nghe/i).should("be.visible");
    cy.contains(/Listening Demo/i).should("be.visible");
    cy.contains("button", /Nghe và làm bài/i).click({ force: true });
    cy.wait("@startListeningSession");
    cy.wait("@listeningSession");

    cy.contains("button", /^Nghe$/i).should("be.visible").click({ force: true });
    cy.get("@cancelStub").should("have.been.called");
    cy.get("@speakStub").should("have.been.called");

    cy.contains("button", /Xem transcript/i).click({ force: true });
    cy.contains(/Anna takes a bus to school every morning\./i).should("be.visible");
    cy.contains(/Anna di xe buyt den truong moi buoi sang\./i).should("be.visible");
  });
});
