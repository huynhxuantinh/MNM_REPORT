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

const buildSessionPayload = (overrides = {}) => ({
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
    translation_vi: "Anna di xe buyt den truong moi buoi sang.",
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
    ...(overrides.passage || {}),
  },
  answers: [
    {
      id: 1,
      question_id: 90,
      submitted_answer: { option: "a bus" },
      is_correct: true,
    },
  ],
  ...overrides,
});

const buildFinishPayload = (overrides = {}) => ({
  summary: {
    total_questions: 1,
    answered_questions: 1,
    correct_answers: 1,
    score_pct: 100,
    xp_earned: 10,
    total_xp: 20,
    level: 1,
  },
  ...overrides,
});

describe("ListeningSessionPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getListeningModuleSession.mockResolvedValue({ data: buildSessionPayload() });
    learningApi.answerListeningModuleSession.mockResolvedValue({ data: { is_correct: true } });
    learningApi.finishListeningModuleSession.mockResolvedValue({ data: buildFinishPayload() });
  });

  it("renders dedicated passage + grouped questions layout", async () => {
    const { container } = renderWithProviders(<ListeningSessionPage />, {
      preloadedState: { auth: { user: { id: 1, xp: 10, level: 1 } } },
      initialEntries: ["/listening/session/601"],
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Nghe$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Xem transcript/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/What does Anna take to school\?/i)).toBeInTheDocument();
    expect(container.querySelector('[data-cy="listening-submit-btn"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Xem transcript/i }));
    expect(screen.getByText(/Anna di xe buyt den truong moi buoi sang\./i)).toBeInTheDocument();

    fireEvent.click(container.querySelector('[data-cy="listening-back-btn"]'));
    expect(mockNavigate).toHaveBeenCalledWith("/listening");
  });

  it("returns to learning path when the session comes from a learning activity", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getListeningModuleSession.mockResolvedValueOnce({
      data: buildSessionPayload({ unit_activity: 88 }),
    });

    const { container } = renderWithProviders(<ListeningSessionPage />, {
      preloadedState: { auth: { user: { id: 1, xp: 10, level: 1 } } },
      initialEntries: ["/listening/session/601"],
    });

    await waitFor(() => {
      expect(container.querySelector('[data-cy="listening-back-btn"]')).toBeInTheDocument();
    });

    fireEvent.click(container.querySelector('[data-cy="listening-back-btn"]'));
    expect(mockNavigate).toHaveBeenCalledWith("/learning");
  });

  it("shows a clear back action after submitting a learning activity session", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getListeningModuleSession.mockResolvedValue({
      data: buildSessionPayload({ unit_activity: 88 }),
    });
    learningApi.finishListeningModuleSession.mockResolvedValueOnce({
      data: buildFinishPayload({ activity_progress: { status: "completed" } }),
    });

    const { container } = renderWithProviders(<ListeningSessionPage />, {
      preloadedState: { auth: { user: { id: 1, xp: 10, level: 1 } } },
      initialEntries: ["/listening/session/601"],
    });

    await waitFor(() => {
      expect(container.querySelector('[data-cy="listening-submit-btn"]')).toBeInTheDocument();
    });

    fireEvent.click(container.querySelector('[data-cy="listening-submit-btn"]'));

    await waitFor(() => {
      expect(container.querySelector('[data-cy="listening-result-back-btn"]')).toBeInTheDocument();
    });

    fireEvent.click(container.querySelector('[data-cy="listening-result-back-btn"]'));
    expect(mockNavigate).toHaveBeenCalledWith("/learning");
  });
});
