import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import QuizPage from "@/pages/user/QuizPage";

vi.mock("@/services/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
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

describe("QuizPage", () => {
  const mockLessons = {
    results: [
      { id: 1, title: "Lesson 1", level: "A1", word_count: 10 },
      { id: 2, title: "Lesson 2", level: "A2", word_count: 8 },
      { id: 3, title: "Lesson 3", level: "B1", word_count: 3 },
    ],
  };

  const mockWordsets = {
    results: [
      { id: 1, name: "Set Basic", level: "A1", word_count: 20 },
      { id: 2, name: "Set Advanced", level: "B2", word_count: 15 },
    ],
  };

  const mockQuizQuestions = {
    quiz_id: 1,
    quiz_type: "mc",
    source_title: "Lesson 1",
    questions: [
      {
        word_id: 1,
        word_text: "hello",
        phonetic: "/hello/",
        options: ["bye", "hello", "thanks", "sorry"],
        correct_index: 1,
      },
      {
        word_id: 2,
        word_text: "beautiful",
        phonetic: "/beautiful/",
        options: ["ugly", "beautiful", "tall", "short"],
        correct_index: 1,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hien thi tieu de trang kiem tra", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Kiểm tra từ vựng")).toBeInTheDocument();
    });
  });

  it("hien thi tab chon nguon cau hoi", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Bài học")).toBeInTheDocument();
      expect(screen.getByText("Bộ từ")).toBeInTheDocument();
    });
  });

  it("hien thi danh sach bai hoc", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockImplementation((url) => {
      if (url.includes("lessons")) return Promise.resolve({ data: mockLessons });
      if (url.includes("sets")) return Promise.resolve({ data: mockWordsets });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Lesson 1")).toBeInTheDocument();
      expect(screen.getByText("Lesson 2")).toBeInTheDocument();
    });
  });

  it("hien thi so luong tu va cap do", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText(/10 từ/)).toBeInTheDocument();
      expect(screen.getByText("A1")).toBeInTheDocument();
    });
  });

  it("vo hieu hoa bai hoc it hon 4 tu", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText(/Cần ít nhất 4 từ để tạo quiz/i)).toBeInTheDocument();
    });
  });

  it("chuyen sang tab bo tu khi click", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockImplementation((url) => {
      if (url.includes("lessons")) return Promise.resolve({ data: mockLessons });
      if (url.includes("sets")) return Promise.resolve({ data: mockWordsets });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    const wordsetsTab = await screen.findByText("Bộ từ");
    await userEvent.click(wordsetsTab);

    await waitFor(() => {
      expect(screen.getByText("Set Basic")).toBeInTheDocument();
    });
  });

  it("mo dialog chon che do khi chon bai hop le", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Lesson 1")).toBeInTheDocument();
    });

    const firstLesson = screen.getByText("Lesson 1").closest("button") || screen.getByText("Lesson 1").parentElement;
    if (firstLesson) {
      await userEvent.click(firstLesson);
    }

    await waitFor(() => {
      expect(screen.getByText("Chọn chế độ kiểm tra")).toBeInTheDocument();
    });
  });

  it("hien thi loading khi dang tai du lieu", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    expect(document.querySelector(".MuiSkeleton-root")).toBeTruthy();
  });

  it("hien thi thong bao khi khong co bai hoc", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: { results: [] } });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText(/Chưa có bài học nào đủ điều kiện/i)).toBeInTheDocument();
    });
  });

  it("co the chon che do trac nghiem", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });
    axiosClient.default.post.mockResolvedValue({ data: mockQuizQuestions });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText("Lesson 1")).toBeInTheDocument();
    });

    const lessonCard = screen.getAllByText("Lesson 1")[0].closest("button") || screen.getAllByText("Lesson 1")[0].parentElement;
    if (lessonCard) {
      await userEvent.click(lessonCard);
    }

    await waitFor(() => {
      expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument();
    });
  });

  it("hien thi dung format trang", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValue({ data: mockLessons });

    renderWithProviders(<QuizPage />, { initialEntries: ["/quiz"] });

    await waitFor(() => {
      expect(screen.getByText(/Chọn một bài học hoặc bộ từ/i)).toBeInTheDocument();
    });
  });
});
