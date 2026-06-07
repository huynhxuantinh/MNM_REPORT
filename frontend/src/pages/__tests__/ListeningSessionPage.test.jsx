import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import ListeningSessionPage from "@/pages/user/ListeningSessionPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ sessionId: "601" }),
  };
});

vi.mock("@/services/learningApi", () => ({
  default: {
    getListeningModuleSession: vi.fn(),
    answerListeningModuleSession: vi.fn(),
    finishListeningModuleSession: vi.fn(),
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

Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    getVoices: vi.fn(() => [{ lang: "en-US", name: "Demo Voice" }]),
  },
});

global.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
  this.text = text;
  this.lang = "";
  this.rate = 1;
  this.voice = null;
};

describe("ListeningSessionPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getListeningModuleSession.mockResolvedValue({
      data: {
        id: 601,
        status: "started",
        current_question_index: 1,
        score: 0,
        score_pct: 0,
        passage: {
          id: 12,
          title: "Listening Demo",
          topic: "daily_life",
          level: "A1",
          transcript: "Anna takes a bus to school every morning.",
          translation_vi: "Anna đi xe buýt đến trường mỗi buổi sáng.",
          estimated_seconds: 35,
          tts_lang: "en-US",
          tts_rate: 0.9,
          questions: [
            {
              id: 90,
              order_index: 1,
              question_type: "multiple_choice",
              prompt: "What does Anna take to school?",
              choices_json: ["a bus", "a taxi", "a bike", "a train"],
            },
          ],
        },
        answers: [
          {
            id: 1,
            question_id: 90,
            submitted_answer: { option: "a bus" },
            is_correct: true,
          },
        ],
      },
    });
  });

  it("renders dedicated passage + grouped questions layout", async () => {
    renderWithProviders(<ListeningSessionPage />, {
      preloadedState: { auth: { user: { id: 1, xp: 10, level: 1 } } },
      initialEntries: ["/listening/session/601"],
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Nghe$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Xem transcript/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Câu hỏi nghe hiểu/i)).toBeInTheDocument();
    expect(screen.getByText(/What does Anna take to school\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nộp bài/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Xem transcript/i }));
    expect(screen.getByText(/Anna đi xe buýt đến trường mỗi buổi sáng\./i)).toBeInTheDocument();
  });
});
