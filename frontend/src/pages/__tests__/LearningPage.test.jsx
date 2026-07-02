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
    getLearningPathV2: vi.fn(),
    getPlacementStatus: vi.fn(),
    getRecoverableSession: vi.fn(),
    getDailyGoal: vi.fn(),
    startActivity: vi.fn(),
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

const pathV2Response = {
  data: {
    recommended_level: "A2",
    levels: [
      {
        id: 20,
        level: "A2",
        name: "A2 Everyday English",
        description: "Build daily English skills.",
        units: [
          {
            id: 1,
            order_index: 1,
            title: "Basics",
            description: "Core path",
            unlocked: true,
            placement_recommended: true,
            activities: [
              {
                id: 101,
                activity_type: "vocab",
                title: "Vocabulary Basics",
                description: "Core words",
                unlocked: true,
                status: "available",
                estimated_minutes: 8,
                content: { title: "Lesson 1" },
              },
            ],
          },
        ],
      },
    ],
  },
};

describe("LearningPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getPlacementStatus.mockResolvedValue({ data: { should_show_onboarding: false, placement_completed: true } });
    learningApi.getRecoverableSession.mockResolvedValue({ data: { has_recoverable_session: false } });
    learningApi.getDailyGoal.mockResolvedValue({
      data: {
        goal: {
          progress_words: 2,
          target_words: 10,
          reward_xp: 20,
          reward_claimed: false,
        },
        can_claim_reward: false,
      },
    });
    learningApi.getLearningPathV2.mockResolvedValue(pathV2Response);
  });

  it("renders the current learning path level and unit", async () => {
    renderWithProviders(<LearningPage />, { initialEntries: ["/learning"] });

    await waitFor(() => {
      expect(screen.getByText(/Unit 1: Basics/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Everyday English/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Vocabulary Basics/i)).toBeInTheDocument();
    expect(screen.queryByText(/Listening Demo/i)).not.toBeInTheDocument();
  });

  it("shows placement recommendation banner", async () => {
    renderWithProviders(<LearningPage />, { initialEntries: ["/learning"] });

    await waitFor(() => {
      expect(screen.getAllByText("A2").length).toBeGreaterThan(0);
      expect(screen.getByText("Gợi ý")).toBeInTheDocument();
    });
  });
});
