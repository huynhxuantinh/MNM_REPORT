import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import StudyPage from "@/pages/user/StudyPage";

const mockNavigate = vi.fn();

vi.mock("@/services/learningApi", () => ({
  default: {
    getLesson: vi.fn(),
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

describe("StudyPage (flashcard mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads lesson and renders first flashcard word", async () => {
    const learningApi = await import("@/services/learningApi");
    learningApi.default.getLesson.mockResolvedValue({
      data: {
        id: 7,
        title: "Bài test",
        words: [
          {
            id: 1,
            word: { id: 101, text: "good", definition_vi: "tốt", definition_en: "good" },
          },
        ],
      },
    });

    renderWithProviders(<StudyPage />);

    expect(await screen.findByText("Flashcard: Bài test")).toBeInTheDocument();
    expect(screen.getByText("good")).toBeInTheDocument();
  });
});
