import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import LearningPlacementPage from "@/pages/user/LearningPlacementPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/learningApi", () => ({
  default: {
    getPlacementStatus: vi.fn(),
    getPlacementQuestions: vi.fn(),
    submitPlacement: vi.fn(),
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

describe("LearningPlacementPage", () => {
  const mockQuestions = {
    questions: [
      { question_id: 1, prompt: 'Choose "hello"', choices: ["xin chào", "tạm biệt", "cảm ơn", "xin lỗi"] },
      { question_id: 2, prompt: 'Choose "book"', choices: ["bút", "vở", "sách", "bàn"] },
      { question_id: 3, prompt: 'Choose "house"', choices: ["nhà", "xe", "cây", "trường"] },
      { question_id: 4, prompt: 'Choose "run"', choices: ["đi", "chạy", "ngủ", "đọc"] },
      { question_id: 5, prompt: 'Choose "water"', choices: ["nước", "lửa", "đất", "gió"] },
      { question_id: 6, prompt: 'Choose "teacher"', choices: ["giáo viên", "bác sĩ", "kỹ sư", "nông dân"] },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    window.localStorage.clear();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getPlacementStatus.mockResolvedValue({ data: { has_completed_placement: true, recommended_level: "A1" } });
    learningApi.getPlacementQuestions.mockResolvedValue({ data: mockQuestions });
    learningApi.submitPlacement.mockResolvedValue({ data: { result: { recommended_level: "A1", score_pct: 83 } } });
  });

  it("renders placement questions", async () => {
    renderWithProviders(<LearningPlacementPage />, { initialEntries: ["/learning/placement"] });

    await waitFor(() => {
      expect(screen.getByText(/0\/6/)).toBeInTheDocument();
      expect(screen.getByText(/Choose "hello"/i)).toBeInTheDocument();
      expect(screen.getByText(/A1/i)).toBeInTheDocument();
    });
  });

  it("submits placement after 5 answers", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    const user = userEvent.setup();

    renderWithProviders(<LearningPlacementPage />, { initialEntries: ["/learning/placement"] });

    await screen.findByText(/Choose "hello"/i);

    const radios = await screen.findAllByRole("radio");
    await user.click(radios[0]);
    await user.click(radios[6]);
    await user.click(radios[8]);
    await user.click(radios[13]);
    await user.click(radios[16]);

    const submitButton = screen.getByRole("button", { name: /placement/i });
    expect(submitButton).not.toBeDisabled();
    await user.click(submitButton);

    await waitFor(() => {
      expect(learningApi.submitPlacement).toHaveBeenCalledWith(
        [
          { question_id: 1, option: "xin chào" },
          { question_id: 2, option: "sách" },
          { question_id: 3, option: "nhà" },
          { question_id: 4, option: "chạy" },
          { question_id: 5, option: "nước" },
        ],
        "placement_page"
      );
      expect(screen.getByText(/83%/i)).toBeInTheDocument();
    });
  });
});
