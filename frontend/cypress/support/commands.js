// ── Custom Cypress commands ───────────────────────────────────────────────────

/**
 * cy.login(email, password)
 * Đăng nhập qua UI và chờ redirect về dashboard.
 */
Cypress.Commands.add("login", (email = "student@test.com", password = "Test1234!") => {
  cy.visit("/login");
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("eq", Cypress.config("baseUrl") + "/");
});

/**
 * cy.loginViaApi(email, password)
 * Đăng nhập trực tiếp qua API (không qua UI) – nhanh hơn cho các test sau login.
 */
Cypress.Commands.add("loginViaApi", (email = "student@test.com", password = "Test1234!") => {
  cy.request("POST", "/api/v1/auth/login/", { email, password }).then(({ body }) => {
    localStorage.setItem("access_token", body.access);
    localStorage.setItem("refresh_token", body.refresh);
    localStorage.setItem("user", JSON.stringify(body.user));
  });
});
