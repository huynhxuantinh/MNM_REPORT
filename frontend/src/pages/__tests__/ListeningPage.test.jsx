import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import ListeningPage from "@/pages/user/ListeningPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/learningApi", () => ({
  default: {
    getListeningPassages: vi.fn(),
    startListeningPassageSession: vi.fn(),
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

describe("ListeningPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getListeningPassages.mockResolvedValue({
      data: {
        count: 1,
        results: [
          {
            id: 101,
            title: "Listening Demo",
            level: "A1",
            topic: "family",
            estimated_seconds: 35,
            question_count: 4,
            translation_vi: "Bài nghe demo về gia đình.",
          },
        ],
      },
    });
    learningApi.startListeningPassageSession.mockResolvedValue({ data: { id: 777 } });
  });

  it("renders dedicated listening lessons", async () => {
    renderWithProviders(<ListeningPage />, { initialEntries: ["/listening"] });

    await waitFor(() => {
      expect(screen.getByText(/Luyện nghe/i)).toBeInTheDocument();
      expect(screen.getByText(/Listening Demo/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Bắt đầu nghe/i })).toBeInTheDocument();
    });
  });

  it("starts a listening session from the dedicated page", async () => {
    renderWithProviders(<ListeningPage />, { initialEntries: ["/listening"] });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Bắt đầu nghe/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Bắt đầu nghe/i }));

    await waitFor(async () => {
      const learningApi = (await import("@/services/learningApi")).default;
      expect(learningApi.startListeningPassageSession).toHaveBeenCalledWith(101);
      expect(mockNavigate).toHaveBeenCalledWith("/listening/session/777");
    });
  });
});
