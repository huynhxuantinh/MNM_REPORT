import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import StudyPage from "../StudyPage";

const mockNavigate = vi.fn();

vi.mock("@/api/learningApi", () => ({
  default: {
    startLearningSession: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useParams: () => ({ id: "7" }),
    useNavigate: () => mockNavigate,
  };
});

describe("StudyPage (legacy redirect)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates session and redirects to session page", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.startLearningSession.mockResolvedValue({
      data: { id: 123 },
    });

    renderWithProviders(<StudyPage />);

    await waitFor(() => {
      expect(learningApi.default.startLearningSession).toHaveBeenCalledWith(7, "legacy_study_route");
      expect(mockNavigate).toHaveBeenCalledWith("/learning/session/123", { replace: true });
    });
  });
});
