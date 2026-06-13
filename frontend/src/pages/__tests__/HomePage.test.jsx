import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import HomePage from "@/pages/user/HomePage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/components/dashboard/ReviewActivityChart", () => ({
  default: () => <div>ReviewActivityChart</div>,
}));

vi.mock("@/services/learningApi", () => ({
  default: {
    getPlacementStatus: vi.fn(),
    getReviewSummary: vi.fn(),
    getReviewHistory: vi.fn(),
    getLearningPathV2: vi.fn(),
    getRecoverableSession: vi.fn(),
    resumeLearningSession: vi.fn(),
    getDailyGoal: vi.fn(),
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

describe("HomePage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getPlacementStatus.mockResolvedValue({ data: { should_show_onboarding: false } });
    learningApi.getReviewSummary.mockResolvedValue({ data: { due_today: 3, reviewed_today: 1, streak: 2 } });
    learningApi.getReviewHistory.mockResolvedValue({ data: [{ date: "2026-06-01", count: 1 }] });
    learningApi.getLearningPathV2.mockResolvedValue({
      data: {
        levels: [
          {
            name: "A1 English Foundation",
            level: "A1",
            units: [
              {
                id: 1,
                title: "Unit 1 - Greetings",
                unlocked: true,
                activities: [
                  { id: 10, title: "Vocabulary", status: "completed", unlocked: true },
                  { id: 11, title: "Listening", status: "available", unlocked: true },
                ],
              },
            ],
          },
        ],
      },
    });
    learningApi.getRecoverableSession.mockResolvedValue({ data: { has_recoverable_session: false, session: null } });
    learningApi.getDailyGoal.mockResolvedValue({ data: { target_minutes: 10, today: { goal_minutes: 10, studied_minutes: 4 } } });
  });

  const preloadedState = {
    auth: {
      user: {
        id: 1,
        role: "user",
        username: "tinh1232",
        full_name: "Tinh",
        xp: 100,
        level: 1,
      },
    },
  };

  it("renders home overview", async () => {
    renderWithProviders(<HomePage />, { preloadedState, initialEntries: ["/"] });

    await waitFor(() => {
      expect(screen.getByText(/Unit 1 - Greetings/i)).toBeInTheDocument();
      expect(screen.getByText(/Activity tiếp theo: Listening/i)).toBeInTheDocument();
      expect(screen.getByText(/ReviewActivityChart/i)).toBeInTheDocument();
      expect(screen.getByText(/4\/10/i)).toBeInTheDocument();
      expect(screen.getByText(/25%/i)).toBeInTheDocument();
    });
  });

  it("redirects to onboarding when placement is required", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getPlacementStatus.mockResolvedValueOnce({ data: { should_show_onboarding: true } });

    renderWithProviders(<HomePage />, { preloadedState, initialEntries: ["/"] });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/learning/onboarding", { replace: true });
    });
  });
});

