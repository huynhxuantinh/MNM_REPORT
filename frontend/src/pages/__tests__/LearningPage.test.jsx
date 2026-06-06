import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import LearningPage from "@/pages/user/LearningPage";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock("@/services/learningApi", () => ({
  default: {
    getLearningPath: vi.fn(),
    getPlacementStatus: vi.fn(),
    getRecoverableSession: vi.fn(),
    getDailyGoal: vi.fn(),
    startLearningSession: vi.fn(),
    startCheckpoint: vi.fn(),
    resumeLearningSession: vi.fn(),
    getReviewList: vi.fn(),
    claimDailyGoal: vi.fn(),
    claimStreakFreeze: vi.fn(),
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

describe("LearningPage excludes listening lessons", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getPlacementStatus.mockResolvedValue({ data: { should_show_onboarding: false, has_completed_placement: true } });
    learningApi.getRecoverableSession.mockResolvedValue({ data: { has_recoverable_session: false } });
    learningApi.getDailyGoal.mockResolvedValue({ data: { target_minutes: 10, today: { goal_minutes: 10, studied_minutes: 2 } } });
    learningApi.getLearningPath.mockResolvedValue({
      data: {
        name: "English Foundation A1-A2",
        placement: { recommended_level: "A2", recommended_start_unit_id: 1 },
        units: [
          {
            id: 1,
            order_index: 1,
            title: "Basics",
            description: "Core path",
            unlocked: true,
            lesson_count: 1,
            lessons: [{ order_index: 1, lesson: { id: 11, title: "Lesson 1", level: "A1", is_published: true, skill_tag: "vocab", words_total: 4, words_learned: 0 } }],
          },
          {
            id: 2,
            order_index: 3,
            title: "Listening Lab",
            description: "Listening",
            unlocked: true,
            lesson_count: 1,
            lessons: [{ order_index: 1, lesson: { id: 101, title: "Listening Demo", level: "A1", is_published: true, skill_tag: "listening", words_total: 4, words_learned: 0, listening_estimated_seconds: 35 } }],
          },
        ],
      },
    });
  });

  it("renders normal learning path without listening section", async () => {
    renderWithProviders(<LearningPage />, { initialEntries: ["/learning"] });

    await waitFor(() => {
      expect(screen.getByText(/Unit 1: Basics/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Luyện nghe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Listening Demo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nghe và làm bài/i })).not.toBeInTheDocument();
  });

  it("shows placement recommendation banner when user has no progress", async () => {
    renderWithProviders(<LearningPage />, { initialEntries: ["/learning"] });
    await waitFor(() => {
      expect(screen.getByText(/Placement đề xuất bạn bắt đầu từ Basics \(A2\)\./i)).toBeInTheDocument();
    });
  });
});
