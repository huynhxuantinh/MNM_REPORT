import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import StudyPage from "../StudyPage";

vi.mock("@/api/learningApi", () => ({
  default: {
    getLesson: vi.fn(),
    startLesson: vi.fn(),
    completeLesson: vi.fn(),
  },
}));

vi.mock("@/api/axiosClient", () => ({
  default: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, useParams: () => ({ id: "1" }) };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: { speak: vi.fn(), cancel: vi.fn() },
});

const MOCK_LESSON = {
  id: 1,
  title: "Từ vựng A1 cơ bản",
  level: "A1",
  is_published: true,
  words: [
    { id: 101, word: { id: 10, text: "apple", phonetic: "ˈæpəl", part_of_speech: "noun", definition_vi: "Táo", definition_en: "A round fruit", example_en: "I eat an apple.", example_vi: "Tôi ăn một quả táo." } },
    { id: 102, word: { id: 11, text: "book", phonetic: "bʊk", part_of_speech: "noun", definition_vi: "Sách", definition_en: "Written work", example_en: "I read a book.", example_vi: "Tôi đọc một cuốn sách." } },
  ],
  user_progress: null,
};

const AUTH_STATE = { auth: { user: { id: 1, xp: 0, level: 1 }, isAuthenticated: true, loading: false, error: null } };

describe("StudyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("hiển thị loading spinner", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getLesson.mockReturnValue(new Promise(() => {}));
    learningApi.default.startLesson.mockResolvedValue({ data: {} });

    renderWithProviders(<StudyPage />, { preloadedState: AUTH_STATE });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("hiển thị từ đầu tiên sau khi tải", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getLesson.mockResolvedValue({ data: MOCK_LESSON });
    learningApi.default.startLesson.mockResolvedValue({ data: { started_at: "2026-01-01" } });

    renderWithProviders(<StudyPage />, { preloadedState: AUTH_STATE });

    await waitFor(() => {
      expect(screen.getByText("apple")).toBeInTheDocument();
    });
  });

  it("hiển thị progress '1 / 2'", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getLesson.mockResolvedValue({ data: MOCK_LESSON });
    learningApi.default.startLesson.mockResolvedValue({ data: {} });

    renderWithProviders(<StudyPage />, { preloadedState: AUTH_STATE });

    await waitFor(() => {
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });
  });

  it("nhấn Xem nghĩa hiện nghĩa từ", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getLesson.mockResolvedValue({ data: MOCK_LESSON });
    learningApi.default.startLesson.mockResolvedValue({ data: {} });

    renderWithProviders(<StudyPage />, { preloadedState: AUTH_STATE });
    await waitFor(() => screen.getByText("apple"));

    fireEvent.click(screen.getByRole("button", { name: /xem nghĩa/i }));
    await waitFor(() => {
      expect(screen.getByText("Táo")).toBeInTheDocument();
    });
  });

  it("gọi completeLesson khi hoàn thành bài cuối", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getLesson.mockResolvedValue({ data: MOCK_LESSON });
    learningApi.default.startLesson.mockResolvedValue({ data: {} });
    learningApi.default.completeLesson.mockResolvedValue({
      data: { xp_earned: 20, streak: 2, total_xp: 120, level: 1 },
    });

    renderWithProviders(<StudyPage />, { preloadedState: AUTH_STATE });
    await waitFor(() => screen.getByText("apple"));

    // Reveal từ 1
    fireEvent.click(screen.getByRole("button", { name: /xem nghĩa/i }));
    await waitFor(() => screen.getByText("Táo"));

    // Tiếp theo → từ 2
    fireEvent.click(screen.getByRole("button", { name: /tiếp theo/i }));
    await waitFor(() => screen.getByText("book"));

    // Reveal từ 2
    fireEvent.click(screen.getByRole("button", { name: /xem nghĩa/i }));
    await waitFor(() => screen.getByText("Sách"));

    // Hoàn thành (nút outlined "Hoàn thành", không phải "Đã hiểu & Hoàn thành")
    const allCompleteButtons = screen.getAllByRole("button", { name: /hoàn thành/i });
    const completeBtn = allCompleteButtons.find((b) => b.textContent.trim() === "Hoàn thành");
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(learningApi.default.completeLesson).toHaveBeenCalledWith("1");
    });
  });
});
