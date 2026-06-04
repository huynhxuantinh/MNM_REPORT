import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import VocabularyPage from "@/pages/user/VocabularyPage";

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

describe("VocabularyPage", () => {
  const mockWords = [
    {
      id: 1,
      text: "hello",
      phonetic: "hello",
      part_of_speech: "exclamation",
      definition_vi: "lời chào khi gặp ai đó",
      level: "A1",
      is_bookmarked: false,
    },
    {
      id: 2,
      text: "beautiful",
      phonetic: "beautiful",
      part_of_speech: "adjective",
      definition_vi: "đẹp",
      level: "A1",
      is_bookmarked: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hiển thị tiêu đề trang", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getAllByText("Từ vựng").length).toBeGreaterThan(0);
    });
  });

  it("hiển thị danh sách từ", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText("hello")).toBeInTheDocument();
      expect(screen.getByText("beautiful")).toBeInTheDocument();
    });
  });

  it("hiển thị thông tin từ", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText("/hello/")).toBeInTheDocument();
      expect(screen.getByText("lời chào khi gặp ai đó")).toBeInTheDocument();
      expect(screen.getAllByText("A1").length).toBeGreaterThan(0);
    });
  });

  it("có ô tìm kiếm", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Tìm từ vựng...")).toBeInTheDocument();
    });
  });

  it("gọi API words endpoint", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(axiosClient.default.get).toHaveBeenCalledWith(
        "/vocabulary/words/",
        expect.objectContaining({ params: expect.any(Object) }),
      );
    });
  });

  it("hiển thị loading", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });
    expect(document.querySelector(".MuiSkeleton-root")).toBeTruthy();
  });

  it("hiển thị empty state", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: [], count: 0 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText(/chưa có từ nào/i)).toBeInTheDocument();
    });
  });

  it("có bộ lọc level", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
    });
  });
});
