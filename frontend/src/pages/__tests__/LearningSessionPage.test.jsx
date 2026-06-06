import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import LearningSessionPage from "@/pages/user/LearningSessionPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ sessionId: "501" }),
  };
});

vi.mock("@/services/learningApi", () => ({
  default: {
    getLearningSession: vi.fn(),
    submitCheckpoint: vi.fn(),
    finishLearningSession: vi.fn(),
    quitLearningSession: vi.fn(),
    switchSessionEasy: vi.fn(),
    answerLearningSession: vi.fn(),
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

describe("LearningSessionPage listening controls", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getLearningSession.mockResolvedValue({
      data: {
        session: {
          id: 501,
          status: "started",
          session_type: "lesson",
          difficulty: "normal",
          lesson_title: "Listening Demo",
          lesson_skill_tag: "listening",
          lesson_listening_transcript: "Anna takes a bus to school every morning.",
          lesson_listening_translation_vi: "Anna di xe buyt den truong moi buoi sang.",
          lesson_listening_estimated_seconds: 35,
          lesson_listening_tts_lang: "en-US",
          lesson_listening_tts_rate: 0.9,
          unit_title: "Listening Lab",
          total_answered: 0,
          correct_answered: 0,
          xp_earned: 0,
        },
        attempts: [],
        exercises: [
          {
            step_index: 1,
            exercise_type: "listen_choose_word",
            prompt: 'Chon tu ban nghe thay',
            audio_text: 'Anna takes a bus to school every morning.',
            choices: ["bus", "train", "car", "ticket"],
          },
        ],
        next_step: 1,
        hearts: { current: 10, max: 10 },
      },
    });
  });

  it("shows tts controls and toggles transcript", async () => {
    renderWithProviders(<LearningSessionPage />, {
      preloadedState: { auth: { user: { id: 1, xp: 10, level: 1 } } },
      initialEntries: ["/learning/session/501"],
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Nghe/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Xem transcript/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/Anna takes a bus to school every morning\./i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Xem transcript/i }));
    expect(screen.getByText(/Anna takes a bus to school every morning\./i)).toBeInTheDocument();
    expect(screen.getByText(/Anna di xe buyt den truong moi buoi sang\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Nghe$/i }));

    await waitFor(() => {
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    });
  });

  it("still shows summary when finish succeeds but refetch fails", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getLearningSession
      .mockResolvedValueOnce({
        data: {
          session: {
            id: 501,
            status: "started",
            session_type: "lesson",
            difficulty: "normal",
            lesson_title: "Listening Demo",
            lesson_skill_tag: "listening",
            lesson_listening_transcript: "Anna takes a bus to school every morning.",
            lesson_listening_translation_vi: "Anna di xe buyt den truong moi buoi sang.",
            unit_title: "Listening Lab",
            total_answered: 1,
            correct_answered: 1,
            xp_earned: 10,
          },
          attempts: [{ step_index: 1 }],
          exercises: [
            {
              step_index: 1,
              exercise_type: "listen_choose_word",
              prompt: "Chon tu ban nghe thay",
              audio_text: "Anna takes a bus to school every morning.",
              choices: ["bus", "train", "car", "ticket"],
            },
          ],
          hearts: { current: 10, max: 10 },
        },
      })
      .mockRejectedValueOnce({
        response: { data: { detail: "Refetch fail" } },
      });
    learningApi.finishLearningSession.mockResolvedValue({
      data: {
        passed: true,
        summary: { accuracy_pct: 100, accuracy_by_type: {}, review_words: [] },
        user: { xp: 20, level: 1 },
      },
    });

    renderWithProviders(<LearningSessionPage />, {
      preloadedState: { auth: { user: { id: 1, xp: 10, level: 1 } } },
      initialEntries: ["/learning/session/501"],
    });

    await waitFor(() => {
      expect(learningApi.finishLearningSession).toHaveBeenCalledWith("501");
    });
    await waitFor(() => {
      expect(screen.getByText(/hoàn thành phiên học/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/không tải được phiên học/i)).not.toBeInTheDocument();
  });
});
