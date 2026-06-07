const API_BASE = "http://127.0.0.1:8000/api/v1";

/**
 * Login qua API:
 * - Lấy access + refresh token từ response body
 * - Intercept /auth/token/refresh/ để trả token ngay, không cần HTTP-only cookie
 *   (cookie cross-origin bị chặn vì frontend :5173 ≠ backend :8000)
 */
const loginViaApi = (email, password) =>
  cy
    .request({
      method: "POST",
      url: `${API_BASE}/auth/login/`,
      body: { email, password },
      withCredentials: true,
    })
    .then(({ body }) => {
      Cypress.env("accessToken", body.access);
      Cypress.env("refreshToken", body.refresh);
    });

/** cy.request() tự động đính Authorization header */
const authRequest = (method, url, body) => {
  const token = Cypress.env("accessToken");
  const opts = {
    method,
    url,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
    withCredentials: true,
  };
  if (body !== undefined) opts.body = body;
  return cy.request(opts);
};

const ensurePlacementReady = () => {
  authRequest("GET", `${API_BASE}/learning/placement/status/`).then(({ body }) => {
    if (body?.should_show_onboarding) {
      authRequest("POST", `${API_BASE}/learning/placement/skip/`, {});
    }
  });
};

/**
 * Intercept token/refresh để bypass HTTP-only cookie (cross-origin issue).
 * tokenStore.js giữ token in-memory → reset khi cy.visit() reload page.
 * Giải pháp: mock /auth/token/refresh/ trả về access token ngay,
 * để initAuth() hoàn thành thành công mà không cần cookie.
 */
const interceptTokenRefresh = () => {
  const token = Cypress.env("accessToken");
  cy.intercept("POST", "**/auth/token/refresh/**", {
    statusCode: 200,
    body: { access: token },
  }).as("tokenRefresh");
};

/**
 * Intercept placement/status để PlacementGateRoute không redirect sang /onboarding
 * do React Query cache cũ từ lần visit trước.
 */
const interceptPlacementReady = () => {
  cy.intercept("GET", "**/learning/placement/status/**", {
    statusCode: 200,
    body: { should_show_onboarding: false },
  }).as("placementStatus");
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
  return { step_index: exercise.step_index, submitted_answer: submittedAnswer, response_ms: 900 };
};

const buildListeningAnswerPayload = (question) => {
  if (!question) throw new Error("Listening passage has no question to answer.");
  if (question.question_type === "fill_blank") {
    return { question_id: question.id, submitted_answer: { text: "test" } };
  }
  return { question_id: question.id, submitted_answer: { option: question.choices_json?.[0] || "True" } };
};

describe("Integration Smoke", () => {
  it("logs in as student and exercises learning + listening with real backend", () => {
    // 1. Login qua API để lấy access + refresh token
    loginViaApi("student@norostu.com", "Student@2024!");
    ensurePlacementReady();

    // 2. Intercept trước khi visit để initAuth() và PlacementGateRoute không bị block
    interceptTokenRefresh();
    interceptPlacementReady();

    // 3. Visit /learning — initAuth sẽ gọi /auth/token/refresh/, được intercept trả token ngay
    cy.visit("/learning");
    cy.location("pathname", { timeout: 20000 }).should("not.eq", "/login");
    cy.location("pathname", { timeout: 20000 }).should("not.include", "/onboarding");

    // 4. Tìm nút "Làm bài" của lesson đã unlock (không bị disabled)
    cy.get('[data-cy^="learning-start-"]', { timeout: 20000 })
      .filter(":not([disabled])")
      .should("have.length.at.least", 1)
      .first()
      .click({ force: true });
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

    // 5. Intercept lại trước khi visit /listening (page load mới → cần intercept lại)
    interceptTokenRefresh();
    interceptPlacementReady();

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

    cy.location("pathname", { timeout: 20000 }).should("not.eq", "/login");
    cy.location("pathname", { timeout: 20000 }).should("not.include", "/onboarding");
    cy.get('[data-cy^="listening-start-"]', { timeout: 20000 })
      .should("have.length.at.least", 1)
      .first()
      .click({ force: true });
    cy.location("pathname", { timeout: 20000 }).should("match", /\/listening\/session\/\d+$/);
    cy.get('[data-cy="listening-transcript-toggle"]').should("be.visible").click({ force: true });

    cy.location("pathname").then((pathname) => {
      const sessionId = pathname.split("/").pop();
      authRequest("GET", `${API_BASE}/listening/session/${sessionId}/`).then(({ body }) => {
        const questions = body?.passage?.questions || [];
        expect(questions.length).to.be.greaterThan(0);

        questions
          .reduce(
            (chain, question) =>
              chain.then(() =>
                authRequest(
                  "POST",
                  `${API_BASE}/listening/session/${sessionId}/answer/`,
                  buildListeningAnswerPayload(question)
                )
              ),
            cy.wrap(null)
          )
          .then(() => {
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
    loginViaApi("admin@norostu.com", "Admin@2024!");
    interceptTokenRefresh();
    cy.visit("/admin");
    cy.location("pathname", { timeout: 20000 }).should("include", "/admin");
    cy.contains(/system dashboard|c.ng qu.n tr.|cong quan tri/i, { timeout: 20000 }).should("be.visible");
  });
});
