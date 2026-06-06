import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import ProfilePage from "@/pages/user/ProfilePage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/authApi", () => ({
  default: {
    updateMe: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("@/services/learningApi", () => ({
  default: {
    getProfileStats: vi.fn(),
    getReviewHistory: vi.fn(),
  },
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("ProfilePage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getProfileStats.mockResolvedValue({
      data: {
        total_words_studied: 12,
        total_review_attempts: 20,
        total_review_sessions: 20,
        correct_answers: 16,
        accuracy_pct: 80,
        current_streak: 3,
        best_streak: 5,
        bookmarks: 2,
        lessons_completed: 4,
        listening_sessions_completed: 3,
        listening_questions_answered: 12,
        listening_correct_answers: 9,
        listening_accuracy_pct: 75,
      },
    });
    learningApi.getReviewHistory.mockResolvedValue({ data: [] });
  });

  it("renders listening stats in profile", async () => {
    renderWithProviders(<ProfilePage />, {
      initialEntries: ["/profile"],
      preloadedState: {
        auth: {
          user: {
            id: 1,
            role: "user",
            email: "student@test.com",
            username: "student",
            full_name: "Student Demo",
            xp: 120,
            level: 1,
            created_at: "2026-06-01T00:00:00Z",
            notification_enabled: true,
          },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Luyện nghe/i)).toBeInTheDocument();
      expect(screen.getByText(/Bài nghe hoàn thành/i)).toBeInTheDocument();
      expect(screen.getByText(/Độ chính xác listening/i)).toBeInTheDocument();
      expect(screen.getByText(/Câu nghe đúng/i)).toBeInTheDocument();
    });
  });
});
