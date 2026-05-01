import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import QuizPage from "../QuizPage";

// Mock axios client
vi.mock("@/api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock matchMedia cho MUI
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

describe("QuizPage", () => {
  const mockLessons = {
    results: [
      { id: 1, title: "Bài học 1", level: "A1", word_count: 10 },
      { id: 2, title: "Bài học 2", level: "A2", word_count: 8 },
      { id: 3, title: "Bài học 3", level: "B1", word_count: 3 }, // Too few words
    ],
  };

  const mockWordsets = {
    results: [
      { id: 1, name: "Bộ từ cơ bản", level: "A1", word_count: 20 },
      { id: 2, name: "Bộ từ nâng cao", level: "B2", word_count: 15 },
    ],
  };

  const mockQuizQuestions = {
    quiz_id: 1,
    quiz_type: "mc",
    source_title: "Bài học 1",
    questions: [
      {
        word_id: 1,
        word_text: "hello",
        phonetic: "/həˈloʊ/",
        options: ["tạm biệt", "xin chào", "cảm ơn", "xin lỗi"],
        correct_index: 1,
      },
      {
        word_id: 2,
        word_text: "beautiful",
        phonetic: "/ˈbjuːtɪfl/",
        options: ["xấu xí", "đẹp", "cao", "thấp"],
        correct_index: 1,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hiển thị tiêu đề trang kiểm tra", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Kiểm tra từ vựng")).toBeInTheDocument();
    });
  });

  it("hiển thị tab chọn nguồn câu hỏi (Bài học / Bộ từ)", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Bài học")).toBeInTheDocument();
      expect(screen.getByText("Bộ từ (WordSets)")).toBeInTheDocument();
    });
  });

  it("hiển thị danh sách bài học", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockImplementation((url) => {
      if (url.includes("lessons")) return Promise.resolve({ data: mockLessons });
      if (url.includes("wordsets")) return Promise.resolve({ data: mockWordsets });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Bài học 1")).toBeInTheDocument();
      expect(screen.getByText("Bài học 2")).toBeInTheDocument();
    });
  });

  it("hiển thị số lượng từ và cấp độ cho mỗi bài học", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("10 từ")).toBeInTheDocument();
      expect(screen.getByText("A1")).toBeInTheDocument();
    });
  });

  it("vô hiệu hóa bài học có ít hơn 4 từ", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Cần ít nhất 4 từ")).toBeInTheDocument();
    });
  });

  it("chuyển sang tab Bộ từ khi click", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockImplementation((url) => {
      if (url.includes("lessons")) return Promise.resolve({ data: mockLessons });
      if (url.includes("wordsets")) return Promise.resolve({ data: mockWordsets });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    const wordsetsTab = await screen.findByText("Bộ từ (WordSets)");
    await userEvent.click(wordsetsTab);

    await waitFor(() => {
      expect(screen.getByText("Bộ từ cơ bản")).toBeInTheDocument();
    });
  });

  it("mở dialog chọn chế độ khi chọn bài học hợp lệ", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      const lessonCard = screen.getByText("Bài học 1");
      expect(lessonCard).toBeInTheDocument();
    });

    // Click vào bài học đầu tiên
    const firstLesson = screen.getByText("Bài học 1").closest("button") || screen.getByText("Bài học 1").parentElement;
    if (firstLesson) {
      await userEvent.click(firstLesson);
    }

    await waitFor(() => {
      expect(screen.getByText("Chọn chế độ kiểm tra")).toBeInTheDocument();
    });
  });

  it("hiển thị loading khi đang tải dữ liệu", async () => {
    const axiosClient = await import("@/api/axiosClient");
    // Delay response
    axiosClient.default.get.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    // Kiểm tra có skeleton loading
    expect(document.querySelector(".MuiSkeleton-root")).toBeTruthy();
  });

  it("hiển thị thông báo khi không có bài học", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: { results: [] } });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText(/chưa có bài học/i)).toBeInTheDocument();
    });
  });

  it("có thể chọn chế độ Trắc nghiệm", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });
    axiosClient.default.post.mockResolvedValue({ data: mockQuizQuestions });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Bài học 1")).toBeInTheDocument();
    });

    // Click vào bài học
    const lessonElements = screen.getAllByText("Bài học 1");
    const lessonCard = lessonElements[0].closest("button") || lessonElements[0].parentElement;
    if (lessonCard) {
      await userEvent.click(lessonCard);
    }

    await waitFor(() => {
      expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument();
    });
  });

  it("hiển thị đúng format trang", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      // Kiểm tra có subtitle mô tả
      expect(screen.getByText(/Chọn một bài học hoặc bộ từ/i)).toBeInTheDocument();
    });
  });
});
