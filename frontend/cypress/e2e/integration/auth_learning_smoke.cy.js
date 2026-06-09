const API_BASE = "http://127.0.0.1:8000/api/v1";

// Login qua API - set cookie + lấy access token
const loginViaApi = (email, password) =>
  cy
    .request({
      method: "POST",
      url: `${API_BASE}/auth/login/`,
      body: { email, password },
      withCredentials: true,
      failOnStatusCode: true,
    })
    .then(({ body }) => {
      expect(body).to.have.property("access");
      Cypress.env("accessToken", body.access);
    });

// authRequest luôn lấy token mới nhất từ Cypress.env
const authRequest = (method, url, body) =>
  cy.then(() => {
    const token = Cypress.env("accessToken");
    const opts = { method, url, headers: { Authorization: `Bearer ${token}` }, failOnStatusCode: false, withCredentials: true };
    if (body !== undefined) opts.body = body;
    return cy.request(opts);
  });

// Intercept token/refresh để capture token mới sau mỗi initAuth
const setupTokenInterceptor = () => {
  cy.intercept("POST", "**/auth/token/refresh/", (req) => {
    req.continue((res) => {
      if (res.body?.access) {
        Cypress.env("accessToken", res.body.access);
        cy.log(`Token rotated: ${res.body.access.substring(0, 15)}...`);
      }
    });
  }).as("tokenRefresh");
};

const buildLearningAnswerPayload = (exercise) => {
  if (!exercise) throw new Error("No exercise");
  let ans;
  if (["mc_meaning", "listen_choose_word"].includes(exercise.exercise_type)) ans = { option: exercise.choices?.[0] || "" };
  else if (exercise.exercise_type === "fill_blank") ans = { text: "test" };
  else if (exercise.exercise_type === "word_order") ans = { tokens: exercise.tokens || [] };
  else throw new Error(`Unsupported: ${exercise.exercise_type}`);
  return { step_index: exercise.step_index, submitted_answer: ans, response_ms: 900 };
};

const buildListeningAnswerPayload = (q) => {
  if (!q) throw new Error("No question");
  if (q.question_type === "fill_blank") return { question_id: q.id, submitted_answer: { text: "test" } };
  return { question_id: q.id, submitted_answer: { option: q.choices_json?.[0] || "True" } };
};

describe("Integration Smoke", () => {
  it("logs in as student and exercises learning + listening with real backend", () => {
    // Setup intercept trước khi làm bất cứ gì
    setupTokenInterceptor();

    // Login → cookie set + token saved
    loginViaApi("student@norostu.com", "Student@2024!");

    // Skip placement qua API (trước khi visit bất kỳ page nào)
    authRequest("POST", `${API_BASE}/learning/placement/skip/`, {}).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property("recommended_level");
    });

    // Visit learning page DUY NHẤT 1 lần - đợi token refresh xong
    cy.visit("/learning");
    cy.wait("@tokenRefresh", { timeout: 15000 });
    cy.location("pathname", { timeout: 20000 }).should("not.include", "onboarding");
    cy.location("pathname", { timeout: 20000 }).should("not.eq", "/login");

    // Click nút học bài đầu tiên trên UI
    cy.get('[data-cy^="learning-start-"]:not([data-cy="learning-start-disabled"])', { timeout: 20000 })
      .first()
      .click({ force: true });
    cy.location("pathname", { timeout: 20000 }).should("match", /\/learning\/session\/\d+$/);

    // Trả lời 1 câu qua API (token đã rotate sau visit)
    cy.location("pathname").then((p) => {
      const sid = p.split("/").pop();
      authRequest("GET", `${API_BASE}/learning/session/${sid}/`).then(({ body }) => {
        const payload = buildLearningAnswerPayload(body?.exercises?.[0]);
        authRequest("POST", `${API_BASE}/learning/session/${sid}/answer/`, payload)
          .its("status").should("eq", 200);
      });
    });

    // Navigate sang listening KHÔNG dùng cy.visit - dùng cy.go hoặc sidebar
    // → Dùng direct URL nhưng KHÔNG visit mới, thay vào đó dùng cy.window navigate
    cy.window().then((win) => {
      win.history.pushState({}, "", "/listening");
      win.dispatchEvent(new PopStateEvent("popstate"));
    });
    cy.location("pathname", { timeout: 5000 }).should("eq", "/listening");
    cy.reload(); // 1 reload để React Router sync, token refresh chạy lại
    cy.wait("@tokenRefresh", { timeout: 15000 });
    cy.location("pathname", { timeout: 20000 }).should("not.eq", "/login");

    // Stub speechSynthesis sau reload
    cy.window().then((win) => {
      Object.defineProperty(win, "speechSynthesis", {
        configurable: true, writable: true,
        value: {
          speak: () => {}, cancel: () => {}, pause: () => {},
          getVoices: () => [{ lang: "en-US", name: "Demo" }],
        },
      });
      win.SpeechSynthesisUtterance = function (t) { this.text = t; this.lang = ""; this.rate = 1; this.voice = null; };
    });

    // Click start listening
    cy.get('[data-cy^="listening-start-"]', { timeout: 20000 })
      .first().click({ force: true });
    cy.location("pathname", { timeout: 20000 }).should("match", /\/listening\/session\/\d+$/);

    // Đợi session load
    cy.get('[data-cy="listening-transcript-toggle"]', { timeout: 20000 })
      .should("be.visible").click({ force: true });

    // Trả lời câu hỏi qua API rồi click nộp bài UI
    cy.location("pathname").then((p) => {
      const sid = p.split("/").pop();
      authRequest("GET", `${API_BASE}/listening/session/${sid}/`).then(({ body }) => {
        const questions = body?.passage?.questions || [];
        expect(questions.length).to.be.greaterThan(0);
        questions.reduce(
          (chain, q) => chain.then(() => authRequest("POST", `${API_BASE}/listening/session/${sid}/answer/`, buildListeningAnswerPayload(q))),
          cy.wrap(null)
        ).then(() => {
          cy.get('[data-cy="listening-submit-btn"]', { timeout: 10000 })
            .should("not.be.disabled").click({ force: true });
          cy.contains("Kết quả bài nghe", { timeout: 20000 }).should("be.visible");
        });
      });
    });
  });

  it("logs in as admin and loads the admin dashboard", () => {
    setupTokenInterceptor();
    loginViaApi("admin@norostu.com", "Admin@2024!");
    cy.visit("/admin");
    cy.wait("@tokenRefresh", { timeout: 15000 });
    cy.location("pathname", { timeout: 20000 }).should("include", "/admin");
    cy.contains("System Dashboard", { timeout: 20000 }).should("be.visible");
  });
});
