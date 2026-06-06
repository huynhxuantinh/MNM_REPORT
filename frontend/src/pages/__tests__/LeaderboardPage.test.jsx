import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import LeaderboardPage from "@/pages/user/LeaderboardPage";

vi.mock("@/services/learningApi", () => ({
  default: {
    getCurrentLeague: vi.fn(),
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

describe("LeaderboardPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getCurrentLeague.mockResolvedValue({
      data: {
        season: { title: "Tuần 23" },
        leaderboard: [
          { rank: 1, user_id: 1, full_name: "", username: "top_one", avatar_url: "", level: 4, xp_earned: 450, streak: 6, sessions_completed: 5 },
          { rank: 2, user_id: 2, full_name: "Tinh", username: "tinh1232", avatar_url: "", level: 3, xp_earned: 300, streak: 4, sessions_completed: 4 },
          { rank: 3, user_id: 3, full_name: "Lan", username: "lan321", avatar_url: "", level: 2, xp_earned: 220, streak: 2, sessions_completed: 3 },
          { rank: 4, user_id: 4, full_name: "", username: "fallback_user", avatar_url: "", level: 1, xp_earned: 150, streak: 1, sessions_completed: 2 },
        ],
        me: { rank: 4, xp_earned: 150 },
      },
    });
  });

  it("renders weekly leaderboard with fallback username and streak", async () => {
    renderWithProviders(<LeaderboardPage />, { initialEntries: ["/leaderboard"] });

    await waitFor(() => {
      expect(screen.getByText(/Top Tuần/i)).toBeInTheDocument();
      expect(screen.getByText("Tuần 23")).toBeInTheDocument();
      expect(screen.getByText("top_one")).toBeInTheDocument();
      expect(screen.getByText(/Level 1 • Streak 1 • 2 phiên/i)).toBeInTheDocument();
      expect(screen.getByText("🔥 6")).toBeInTheDocument();
      expect(screen.getByText(/Hạng #4/i)).toBeInTheDocument();
    });
  });

  it("renders a single-user podium cleanly", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getCurrentLeague.mockResolvedValueOnce({
      data: {
        season: { title: "Tuần 23" },
        leaderboard: [
          { rank: 1, user_id: 9, full_name: "", username: "solo_ranker", avatar_url: "", level: 5, xp_earned: 999, streak: 8, sessions_completed: 6 },
        ],
        me: { rank: 1, xp_earned: 999 },
      },
    });

    renderWithProviders(<LeaderboardPage />, { initialEntries: ["/leaderboard"] });

    await waitFor(() => {
      expect(screen.getByText("solo_ranker")).toBeInTheDocument();
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.queryByText("#2")).not.toBeInTheDocument();
      expect(screen.queryByText("#3")).not.toBeInTheDocument();
    });
  });
});
