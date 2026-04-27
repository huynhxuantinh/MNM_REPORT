import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import ReviewPage from "../ReviewPage";

vi.mock("@/api/learningApi", () => ({
  default: {
    getReviewList: vi.fn(),
    submitAnswer: vi.fn(),
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

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// speechSynthesis mock
Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: { speak: vi.fn(), cancel: vi.fn() },
});

const MOCK_WORDS = [
  {
    id: 1,
    word: { id: 10, text: "meticulous", phonetic: "məˈtɪkjʊləs", part_of_speech: "adjective", definition_vi: "Tỉ mỉ", definition_en: "Very careful", example_en: "She is meticulous.", example_vi: "Cô ấy rất tỉ mỉ." },
    repetitions: 1, easiness_factor: 2.5, interval: 1,
  },
  {
    id: 2,
    word: { id: 11, text: "eloquent", phonetic: "ˈɛləkwənt", part_of_speech: "adjective", definition_vi: "Hùng hồn", definition_en: "Fluent and persuasive", example_en: "He gave an eloquent speech.", example_vi: "Anh ấy đưa ra bài phát biểu hùng hồn." },
    repetitions: 0, easiness_factor: 2.5, interval: 1,
  },
];

describe("ReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("hiển thị trạng thái loading", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getReviewList.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<ReviewPage />, {
      preloadedState: { auth: { user: { id: 1 }, isAuthenticated: true, loading: false, error: null } },
      initialEntries: ["/review"],
    });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("hiển thị empty state khi không có từ cần ôn", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getReviewList.mockResolvedValue({ data: { words: [], count: 0 } });

    renderWithProviders(<ReviewPage />, {
      preloadedState: { auth: { user: { id: 1 }, isAuthenticated: true, loading: false, error: null } },
      initialEntries: ["/review"],
    });

    await waitFor(() => {
      expect(screen.getByText(/tất cả đã ôn xong/i)).toBeInTheDocument();
    });
  });

  it("hiển thị từ đầu tiên ở mặt trước", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getReviewList.mockResolvedValue({ data: { words: MOCK_WORDS, count: 2 } });

    renderWithProviders(<ReviewPage />, {
      preloadedState: { auth: { user: { id: 1 }, isAuthenticated: true, loading: false, error: null } },
      initialEntries: ["/review"],
    });

    await waitFor(() => {
      expect(screen.getByText("meticulous")).toBeInTheDocument();
    });
  });

  it("hiển thị progress bar 'Từ 1/2'", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getReviewList.mockResolvedValue({ data: { words: MOCK_WORDS, count: 2 } });

    renderWithProviders(<ReviewPage />, {
      preloadedState: { auth: { user: { id: 1 }, isAuthenticated: true, loading: false, error: null } },
      initialEntries: ["/review"],
    });

    await waitFor(() => {
      expect(screen.getByText(/từ 1\/2/i)).toBeInTheDocument();
    });
  });

  it("nhấn thẻ để lật và xem nghĩa", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getReviewList.mockResolvedValue({ data: { words: MOCK_WORDS, count: 2 } });

    renderWithProviders(<ReviewPage />, {
      preloadedState: { auth: { user: { id: 1 }, isAuthenticated: true, loading: false, error: null } },
      initialEntries: ["/review"],
    });

    await waitFor(() => screen.getByText("meticulous"));

    // Sau khi flip, nút đánh giá chất lượng xuất hiện
    // Click vào nút "Lật thẻ"
    const flipButton = screen.getByRole("button", { name: /lật thẻ/i });
    fireEvent.click(flipButton);

    await waitFor(() => {
      expect(screen.getByText(/quên/i)).toBeInTheDocument();
    });
  });

  it("hiển thị 6 nút đánh giá sau khi lật", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getReviewList.mockResolvedValue({ data: { words: MOCK_WORDS, count: 2 } });

    renderWithProviders(<ReviewPage />, {
      preloadedState: { auth: { user: { id: 1 }, isAuthenticated: true, loading: false, error: null } },
      initialEntries: ["/review"],
    });

    await waitFor(() => screen.getByText("meticulous"));

    const flipButton = screen.getByRole("button", { name: /lật thẻ/i });
    fireEvent.click(flipButton);

    await waitFor(() => {
      const labels = ["Quên", "Rất khó", "Khó", "Ổn", "Tốt", "Dễ"];
      labels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  it("nhấn chất lượng gọi submitAnswer và tiến sang từ tiếp theo", async () => {
    const learningApi = await import("@/api/learningApi");
    learningApi.default.getReviewList.mockResolvedValue({ data: { words: MOCK_WORDS, count: 2 } });
    learningApi.default.submitAnswer.mockResolvedValue({
      data: { xp_earned: 5, streak: 1, total_xp: 100, level: 2 },
    });

    renderWithProviders(<ReviewPage />, {
      preloadedState: { auth: { user: { id: 1, xp: 95, level: 1 }, isAuthenticated: true, loading: false, error: null } },
      initialEntries: ["/review"],
    });

    await waitFor(() => screen.getByText("meticulous"));

    const flipButton = screen.getByRole("button", { name: /lật thẻ/i });
    fireEvent.click(flipButton);

    await waitFor(() => screen.getByText("Tốt"));
    fireEvent.click(screen.getByText("Tốt"));

    await waitFor(() => {
      expect(learningApi.default.submitAnswer).toHaveBeenCalledWith(10, 4);
      expect(screen.getByText("eloquent")).toBeInTheDocument();
    });
  });
});
