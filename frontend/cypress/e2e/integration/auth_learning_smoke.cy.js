const API_BASE = "http://127.0.0.1:8000/api/v1";

/** Login qua API, lưu access token */
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

/**
 * Đảm bảo placement đã xong TRƯỚC khi visit bất kỳ page nào.
 * Gọi skip → verify response → chỉ sau đó mới cho phép visit.
 */
const skipPlacementAndVerify = () =>
  authRequest("POST", `${API_BASE}/learning/placement/skip/`, {}).then(({ body }) => {
    // skip trả 200 dù đã done trước, nên luôn pass
    expect(body).to.have.property("recommended_level");
  });

const buildLearningAnswerPayload = (exercise) => {
  if (!exercise) throw new Error("No exercise to answer.");
  let submittedAnswer;
  if (["mc_meaning", "listen_choose_word"].includes(exercise.exercise_type)) {
    submittedAnswer = { option: exercise.choices?.[0] || "" };
  } else if (exercise.exercise_type === "fill_blank") {
    submittedAnswer = { text: "test" };
  } else if (exercise.exercise_type === "word_order") {
    submittedAnswer = { tokens: exercise.tokens || [] };
  } else {
    throw new Error(`Unsupported exercise type: ${exercise.exercise_type}`);
  }
  return { step_index: exercise.step_index, submitted_answer: submittedAnswer, response_ms: 900 };
};

const buildListeningAnswerPayload = (question) => {
  if (!question) throw new Error("No question to answer.");
  if (question.question_type === "fill_blank") {
    return { question_id: question.id, submitted_answer: { text: "test" } };
  }
  return { question_id: question.id, submitted_answer: { option: question.choices_json?.[0] || "True" } };
};

describe("Integration Smoke", () => {
  it("logs in as student and exercises learning + listening with real backend", () => {
    // Bước 1: login → lấy token
    loginViaApi("student@norostu.com", "Student@2024!");

    // Bước 2: skip placement và CHỜ confirm xong
    skipPlacementAndVerify();

    // Bước 3: bây giờ mới visit — should_show_onboarding đã là false
    cy.visit("/learning");
    cy.location("pathname", { timeout: 20000 }).should("not.include", "onboarding");
    cy.location("pathname", { timeout: 20000 }).should("not.eq", "/login");

    cy.get('[data-cy^="learning-start-"]:not([data-cy="learning-start-disabled"])', { timeout: 20000 })
      .should("have.length.at.least", 1)
      .first()
      .click({ force: true });

    cy.location("pathname", { timeout: 20000 }).should("match", /\/learning\/session\/\d+$/);

    cy.location("pathname").then((pathname) => {
      const sessionId = pathname.split("/").pop();
      authRequest("GET", `${API_BASE}/learning/session/${sessionId}/`).then(({ body }) => {
        const payload = buildLearningAnswerPayload(body?.exercises?.[0]);
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
            speak: cy.stub().as("speakStub"),
            cancel: cy.stub().as("cancelStub"),
            pause: cy.stub().as("pauseStub"),
            getVoices: cy.stub().returns([{ lang: "en-US", name: "Demo Voice" }]),
          },
        });
        win.SpeechSynthesisUtterance = function (text) {
          this.text = text; this.lang = ""; this.rate = 1; this.voice = null;
        };
      },
    });

    cy.location("pathname", { timeout: 20000 }).should("not.eq", "/login");
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
            (chain, q) =>
              chain.then(() =>
                authRequest("POST", `${API_BASE}/listening/session/${sessionId}/answer/`, buildListeningAnswerPayload(q))
              ),
            cy.wrap(null)
          )
          .then(() => {
            authRequest("POST", `${API_BASE}/listening/session/${sessionId}/finish/`, {}).then(
              ({ status, body: fb }) => {
                expect(status).to.eq(200);
                expect(fb?.summary?.total_questions).to.be.greaterThan(0);
              }
            );
          });
      });
    });

    cy.reload();
    cy.contains(/k.t qu.|ket qua/i, { timeout: 20000 }).should("be.visible");
  });

  it("logs in as admin and loads the admin dashboard", () => {
    loginViaApi("admin@norostu.com", "Admin@2024!");
    cy.visit("/admin");
    cy.location("pathname", { timeout: 20000 }).should("not.eq", "/login");
    cy.location("pathname", { timeout: 20000 }).should("include", "/admin");
    cy.contains("System Dashboard", { timeout: 20000 }).should("be.visible");
  });
});
