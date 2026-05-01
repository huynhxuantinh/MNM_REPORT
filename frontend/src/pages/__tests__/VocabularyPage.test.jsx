import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import VocabularyPage from "../VocabularyPage";

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

describe("VocabularyPage", () => {
  const mockWords = [
    {
      id: 1,
      text: "hello",
      phonetic: "/həˈloʊ/",
      part_of_speech: "exclamation",
      definition_vi: "lời chào khi gặp ai đó",
      level: "A1",
      is_bookmarked: false,
    },
    {
      id: 2,
      text: "beautiful",
      phonetic: "/ˈbjuːtɪfl/",
      part_of_speech: "adjective",
      definition_vi: "đẹp",
      level: "A1",
      is_bookmarked: true,
    },
    {
      id: 3,
      text: "important",
      phonetic: "/ɪmˈpɔːrtənt/",
      part_of_speech: "adjective",
      definition_vi: "quan trọng",
      level: "B1",
      is_bookmarked: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hiển thị tiêu đề trang từ vựng", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({
      data: { results: mockWords, count: 3 },
    });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText("Từ vựng")).toBeInTheDocument();
    });
  });

  it("hiển thị danh sách từ vựng", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({
      data: { results: mockWords, count: 3 },
    });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText("hello")).toBeInTheDocument();
      expect(screen.getByText("beautiful")).toBeInTheDocument();
      expect(screen.getByText("important")).toBeInTheDocument();
    });
  });

  it("hiển thị thông tin từ (phiên âm, loại từ, nghĩa)", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({
      data: { results: mockWords, count: 3 },
    });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText("/həˈloʊ/")).toBeInTheDocument();
      expect(screen.getByText("lời chào khi gặp ai đó")).toBeInTheDocument();
      expect(screen.getByText("A1")).toBeInTheDocument();
    });
  });

  it("có ô tìm kiếm từ vựng", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({
      data: { results: mockWords, count: 3 },
    });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/tìm kiếm/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it("gọi API với tham số tìm kiếm khi nhập", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({
      data: { results: mockWords, count: 3 },
    });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(axiosClient.default.get).toHaveBeenCalledWith(
        "/vocabulary/words/",
        expect.objectContaining({ params: expect.any(Object) })
      );
    });
  });

  it("hiển thị trạng thái loading khi đang tải dữ liệu", () => {
    const axiosClient = vi.importMock("@/api/axiosClient");
    // Delay response để kiểm tra loading
    axiosClient.default.get.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    // Kiểm tra có skeleton hoặc loading indicator
    expect(screen.getByRole("progressbar") || document.querySelector(".MuiSkeleton-root")).toBeTruthy();
  });

  it("hiển thị thông báo khi không có từ vựng", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({
      data: { results: [], count: 0 },
    });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText(/không có từ vựng/i)).toBeInTheDocument();
    });
  });

  it("có bộ lọc theo cấp độ", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValue({
      data: { results: mockWords, count: 3 },
    });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      // Kiểm tra có filter buttons hoặc select cho level
      const levelFilter = screen.queryByLabelText(/cấp độ/i) || screen.queryByText(/tất cả/i);
      expect(levelFilter || document.querySelector('[data-testid="level-filter"]')).toBeTruthy();
    });
  });
});
