import { expect, test } from "@playwright/test";

const adminUser = {
  id: 1,
  email: "admin@test.com",
  username: "admin",
  full_name: "Quan Tri Vien",
  role: "admin",
  xp: 0,
  level: 1,
};

const json = (body, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

async function mockAdminApi(page) {
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("/auth/token/refresh/") && method === "POST") {
      return route.fulfill(json({ access: "admin_access_token" }));
    }
    if (url.includes("/auth/me/") && method === "GET") {
      return route.fulfill(json(adminUser));
    }
    if (url.includes("/auth/admin/stats/") && method === "GET") {
      return route.fulfill(
        json({
          total_users: 150,
          students: 120,
          admins: 5,
          new_users_this_week: 8,
          active_users: 140,
          inactive_users: 10,
          total_words: 500,
          total_lessons: 50,
          published_lessons: 45,
          total_wordsets: 30,
          reviews_today: 20,
          total_reviews: 450,
          total_quiz_results: 60,
        }),
      );
    }
    if (url.includes("/learning/kpi/baseline/") && method === "GET") {
      return route.fulfill(
        json({
          retention: { d1: 55, d7: 28 },
          first_lesson_start_rate: 80,
          session_completion_rate: 67,
          daily_goal_claim_rate: 42,
          sessions_per_dau: 1.6,
        }),
      );
    }
    if (url.includes("/learning/kpi/onboarding-funnel/") && method === "GET") {
      return route.fulfill(json({ counts: { placement_enter: 100, placement_submit: 70 } }));
    }
    if (url.includes("/auth/admin/users/") && method === "GET") {
      return route.fulfill(
        json({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 2,
              email: "staff@test.com",
              full_name: "Tran Thi B",
              username: "staff",
              role: "user",
              is_active: true,
              xp: 100,
              created_at: "2026-01-02T00:00:00Z",
            },
            {
              id: 3,
              email: "student@test.com",
              full_name: "Nguyen Van A",
              username: "student",
              role: "user",
              is_active: true,
              xp: 200,
              created_at: "2026-01-03T00:00:00Z",
            },
          ],
        }),
      );
    }
    if (url.includes("/vocabulary/words/") && method === "GET") {
      return route.fulfill(
        json({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 1,
              text: "hello",
              phonetic: "/həˈləʊ/",
              part_of_speech: "interjection",
              definition_vi: "xin chao",
              level: "A1",
            },
            {
              id: 2,
              text: "beautiful",
              phonetic: "/ˈbjuːtɪfəl/",
              part_of_speech: "adjective",
              definition_vi: "dep",
              level: "A2",
            },
          ],
        }),
      );
    }
    if (url.includes("/learning/lessons/") && method === "GET") {
      return route.fulfill(
        json({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 1,
              title: "Basic Greetings",
              description: "base",
              level: "A1",
              word_count: 10,
              is_published: true,
            },
            {
              id: 2,
              title: "Advanced Grammar",
              description: "adv",
              level: "C1",
              word_count: 25,
              is_published: true,
            },
          ],
        }),
      );
    }
    if (url.includes("/learning/lessons/1/") && method === "DELETE") {
      return route.fulfill({ status: 204, body: "" });
    }

    return route.fulfill(json({ detail: "mock-not-defined" }, 404));
  });
}

test("admin smoke flow: dashboard/users/words/lessons", async ({ page }) => {
  await mockAdminApi(page);

  await page.goto("/admin");
  await expect(page.getByText("System Dashboard")).toBeVisible();
  await expect(page.getByText("150")).toBeVisible();

  await page.goto("/admin/users");
  await expect(page.getByText("Tran Thi B")).toBeVisible();

  await page.goto("/admin/words");
  await expect(page.getByText("hello")).toBeVisible();

  page.once("dialog", async (dialog) => dialog.accept());
  await page.goto("/admin/lessons");
  await expect(page.getByText("Basic Greetings")).toBeVisible();
  await page.locator("tr", { hasText: "Basic Greetings" }).locator("button").last().click();
});

