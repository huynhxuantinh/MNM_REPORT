import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import VocabularyPage from "../VocabularyPage";

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
      phonetic: "həˈloʊ",
      part_of_speech: "exclamation",
      definition_vi: "loi chao khi gap ai do",
      level: "A1",
      is_bookmarked: false,
    },
    {
      id: 2,
      text: "beautiful",
      phonetic: "ˈbjuːtɪfl",
      part_of_speech: "adjective",
      definition_vi: "dep",
      level: "A1",
      is_bookmarked: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hien thi tieu de trang", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getAllByText("Từ vựng").length).toBeGreaterThan(0);
    });
  });

  it("hien thi danh sach tu", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText("hello")).toBeInTheDocument();
      expect(screen.getByText("beautiful")).toBeInTheDocument();
    });
  });

  it("hien thi thong tin tu", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText("/həˈloʊ/")).toBeInTheDocument();
      expect(screen.getByText("loi chao khi gap ai do")).toBeInTheDocument();
      expect(screen.getAllByText("A1").length).toBeGreaterThan(0);
    });
  });

  it("co o tim kiem", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Tìm từ vựng...")).toBeInTheDocument();
    });
  });

  it("goi API words endpoint", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(axiosClient.default.get).toHaveBeenCalledWith(
        "/vocabulary/words/",
        expect.objectContaining({ params: expect.any(Object) }),
      );
    });
  });

  it("hien thi loading", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });
    expect(document.querySelector(".MuiSkeleton-root")).toBeTruthy();
  });

  it("hien thi empty state", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: [], count: 0 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getByText("Chưa có từ nào")).toBeInTheDocument();
    });
  });

  it("co bo loc level", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.get.mockResolvedValueOnce({ data: { results: mockWords, count: 2 } });

    renderWithProviders(<VocabularyPage />, { initialEntries: ["/vocabulary"] });

    await waitFor(() => {
      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
    });
  });
});
