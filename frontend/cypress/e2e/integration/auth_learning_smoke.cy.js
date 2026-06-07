const API_BASE = "http://127.0.0.1:8000/api/v1";

// Lấy access token qua API login, lưu vào Cypress.env để dùng cho cy.request()
const loginViaApi = (email, password) =>
  cy
    .request("POST", `${API_BASE}/auth/login/`, { email, password })
    .then(({ body }) => {
      Cypress.env("accessToken", body.access);
    });

// Wrapper cho cy.request() tự động đính Authorization header
const authRequest = (method, url, body) => {
  const token = Cypress.env("accessToken");
  const opts = {
    method,
    url,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  };
  if (body !== undefined) opts.body = body;
  return cy.request(opts);
};

const loginThroughUi = (email, password) => {
  cy.visit("/login");
  cy.get('[data-cy="login-form"]').within(() => {
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[autocomplete="current-password"]').clear().type(password);
    cy.get('[data-cy="login-submit"]').click();
  });
  cy.location("pathname", { timeout: 20000 }).should("not.eq", "/login");
};

const ensurePlacementReady = () => {
  authRequest("GET", `${API_BASE}/learning/placement/status/`).then(({ body }) => {
    if (body?.should_show_onboarding) {
      authRequest("POST", `${API_BASE}/learning/placement/skip/`, {});
    }
  });
};

const buildLearningAnswerPayload = (exercise) => {
  if (!exercise) throw new Error("Learning session has no exercise to answer.");

  let submittedAnswer;
  if (["mc_meaning", "listen_choose_word"].includes(exercise.exercise_type)) {
    submittedAnswer = { option: exercise.choices?.[0] || "" };
  } else if (exercise.exercise_type === "fill_blank") {
    submittedAnswer = { text: "test" };
  } else if (exercise.exercise_type === "word_order") {
    submittedAnswer = { tokens: exercise.tokens || [] };
  } else {
    throw new Error(`Unsupported learning exercise type: ${exercise.exercise_type}`);
  }

  return {
    step_index: exercise.step_index,
    submitted_answer: submittedAnswer,
    response_ms: 900,
  };
};

const buildListeningAnswerPayload = (question) => {
  if (!question) throw new Error("Listening passage has no question to answer.");

  if (question.question_type === "fill_blank") {
    return { question_id: question.id, submitted_answer: { text: "test" } };
  }

  return {
    question_id: question.id,
    submitted_answer: { option: question.choices_json?.[0] || "True" },
  };
};

describe("Integration Smoke", () => {
  it("logs in as student and exercises learning + listening with real backend", () => {
    // Login qua API để lấy access token cho cy.request()
    loginViaApi("student@norostu.com", "Student@2024!");
    // Login qua UI để có session trong browser
    loginThroughUi("student@norostu.com", "Student@2024!");
    ensurePlacementReady();

    cy.visit("/learning");
    cy.get('[data-cy^="learning-start-"]', { timeout: 20000 }).should("have.length.at.least", 1).first().click({ force: true });
    cy.location("pathname", { timeout: 20000 }).should("match", /\/learning\/session\/\d+$/);

    cy.location("pathname").then((pathname) => {
      const sessionId = pathname.split("/").pop();
      authRequest("GET", `${API_BASE}/learning/session/${sessionId}/`).then(({ body }) => {
        const firstExercise = body?.exercises?.[0];
        const payload = buildLearningAnswerPayload(firstExercise);
        authRequest("POST", `${API_BASE}/learning/session/${sessionId}/answer/`, payload)
          .its("status")
          .should("eq", 200);
      });
    });

    cy.visit("/listening", {
      onBeforeLoad(win) {
        Object.defineProperty(win, "speechSynthesis", {
          configurable: true,
          writable: true,
          value: {
            speak: cy.stub().as("integrationSpeakStub"),
            cancel: cy.stub().as("integrationCancelStub"),
            pause: cy.stub().as("integrationPauseStub"),
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

    cy.get('[data-cy^="listening-start-"]', { timeout: 20000 }).should("have.length.at.least", 1).first().click({ force: true });
    cy.location("pathname", { timeout: 20000 }).should("match", /\/listening\/session\/\d+$/);
    cy.get('[data-cy="listening-transcript-toggle"]').should("be.visible").click({ force: true });

    cy.location("pathname").then((pathname) => {
      const sessionId = pathname.split("/").pop();
      authRequest("GET", `${API_BASE}/listening/session/${sessionId}/`).then(({ body }) => {
        const questions = body?.passage?.questions || [];
        expect(questions.length).to.be.greaterThan(0);

        questions.reduce(
          (chain, question) =>
            chain.then(() =>
              authRequest("POST", `${API_BASE}/listening/session/${sessionId}/answer/`, buildListeningAnswerPayload(question))
            ),
          cy.wrap(null),
        ).then(() => {
          authRequest("POST", `${API_BASE}/listening/session/${sessionId}/finish/`, {}).then(
            ({ status, body: finishBody }) => {
              expect(status).to.eq(200);
              expect(finishBody?.summary?.total_questions).to.be.greaterThan(0);
            }
          );
        });
      });
    });

    cy.reload();
    cy.contains(/k?t qu?|ket qua/i, { timeout: 20000 }).should("be.visible");
  });

  it("logs in as admin and loads the admin dashboard", () => {
    loginThroughUi("admin@norostu.com", "Admin@2024!");
    cy.visit("/admin");
    cy.location("pathname", { timeout: 20000 }).should("include", "/admin");
    cy.contains(/system dashboard|c?ng qu?n tr?|cong quan tri/i, { timeout: 20000 }).should("be.visible");
  });
});
