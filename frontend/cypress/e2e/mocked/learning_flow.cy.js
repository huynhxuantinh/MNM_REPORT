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
    cy.intercept("GET", "**/api/v1/learning/path/v2/**", {
      statusCode: 200,
      body: {
        recommended_level: "A1",
        levels: [
          {
            id: 1,
            name: "A1 Foundation",
            slug: "a1-foundation",
            level: "A1",
            description: "Core English",
            progress: null,
            units: [
              {
                id: 100,
                title: "Basics",
                description: "Start here",
                order_index: 1,
                unlocked: true,
                placement_recommended: true,
                activity_count: 1,
                progress: null,
                activities: [
                  {
                    id: 501,
                    activity_type: "vocab",
                    title: "Greetings",
                    description: "Learn greetings",
                    order_index: 1,
                    is_required: true,
                    is_published: true,
                    estimated_minutes: 5,
                    min_score_to_pass: 70,
                    metadata: {},
                    unlocked: true,
                    status: "available",
                    progress: null,
                    content: { kind: "lesson", id: 1, title: "Greetings", skill_tag: "vocab", level: "A1" },
                    target: { start_api: "/api/v1/learning/activities/501/start/", frontend_hint: "vocab" },
                  },
                ],
              },
            ],
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
    cy.intercept("POST", "**/api/v1/learning/activities/501/start/**", {
      statusCode: 201,
      body: {
        kind: "learning_session",
        id: 900,
        activity: { id: 501, type: "vocab" },
      },
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
    cy.get(".MuiDialog-root button").last().click({ force: true });
    cy.contains(/lộ trình học|học tập|learning path/i).should("be.visible");
    cy.get('[data-cy^="learning-activity-start-"]').first().click({ force: true });
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
    cy.contains("button", /lật thẻ|lat the|xem nghĩa|xem nghia/i).click({ force: true });
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

  it("shows listening passages and opens a listening session", () => {
    cy.intercept("GET", "**/api/v1/listening/passages/**", {
      statusCode: 200,
      body: {
        count: 1,
        results: [
          {
            id: 60,
            title: "Listening Demo",
            level: "A1",
            topic: "family",
            estimated_seconds: 30,
            question_count: 3,
            translation_vi: "Nghe mot doan ngan ve loi chao trong gia dinh.",
          },
        ],
      },
    }).as("listeningPassages");
    cy.intercept("POST", "**/api/v1/listening/session/start/**", {
      statusCode: 201,
      body: { id: 901 },
    }).as("startListeningSession");
    cy.intercept("GET", "**/api/v1/listening/session/901/**", {
      statusCode: 200,
      body: {
        id: 901,
        passage: {
          id: 60,
          title: "Listening Demo",
          level: "A1",
          topic: "family",
          transcript: "Anna takes a bus to school every morning.",
          translation_vi: "Anna đi xe buýt đến trường mỗi buổi sáng.",
          estimated_seconds: 35,
          tts_lang: "en-US",
          tts_rate: 0.9,
          questions: [
            {
              id: 5001,
              order_index: 1,
              question_type: "multiple_choice",
              prompt: "Anna goes to school by what?",
              choices_json: ["bus", "train", "car", "bike"],
            },
          ],
        },
        answers: [],
        summary: null,
        status: "started",
        answered_questions: 0,
        correct_answers: 0,
        score_pct: 0,
        session_meta: {
          status: "started",
          xp_earned: 0,
        },
      },
    }).as("listeningSession");

    cy.visit("/listening", {
      onBeforeLoad(win) {
        Object.defineProperty(win, "speechSynthesis", {
          configurable: true,
          writable: true,
          value: {
            speak: cy.stub().as("speakStub"),
            cancel: cy.stub().as("cancelStub"),
            pause: cy.stub().as("pauseStub"),
            getVoices: cy.stub().returns([{ lang: "en-US", name: "Demo Voice" }]),
          },
        });
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
    cy.wait("@listeningPassages");

    cy.contains(/luyện nghe|luy/i).should("be.visible");
    cy.contains(/Listening Demo/i).should("be.visible");
    cy.get("button").contains(/nghe/i).last().click({ force: true });
    cy.wait("@startListeningSession");
    cy.wait("@listeningSession");
    cy.url().should("include", "/listening/session/901");

    // Click play audio (using the Replay or Play icon inside the player)
    cy.get('svg[data-testid="PlayArrowRoundedIcon"]').first().click({ force: true });
    cy.get("@cancelStub").should("have.been.called");
    cy.get("@speakStub").should("have.been.called");

    // Answer the multiple choice question to unlock submit
    cy.contains("bus").click({ force: true });

    // Mock answer and finish endpoints
    cy.intercept("POST", "**/api/v1/listening/session/901/answer/**", {
      statusCode: 200,
      body: { status: "success" },
    }).as("submitAnswer");
    
    cy.intercept("POST", "**/api/v1/listening/session/901/finish/**", {
      statusCode: 200,
      body: {
        summary: { score_pct: 100, level: "A1" }
      },
    }).as("finishSession");

    // Submit
    cy.get('[data-cy="listening-submit-btn"]').click({ force: true });
    cy.wait("@submitAnswer");
    cy.wait("@finishSession");

    // After submitting, the transcript is automatically shown
    cy.contains(/Anna takes a bus to school every morning\./i).should("be.visible");
    cy.contains(/Anna đi xe buýt đến trường mỗi buổi sáng\./i).should("be.visible");
  });
});
