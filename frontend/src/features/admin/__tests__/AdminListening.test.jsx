import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import AdminListening from "@/features/admin/AdminListening";

vi.mock("@/services/learningApi", () => ({
  default: {
    getAdminListeningPassages: vi.fn(),
    createAdminListeningPassage: vi.fn(),
    updateAdminListeningPassage: vi.fn(),
    deleteAdminListeningPassage: vi.fn(),
    getAdminListeningQuestions: vi.fn(),
    createAdminListeningQuestion: vi.fn(),
    updateAdminListeningQuestion: vi.fn(),
    deleteAdminListeningQuestion: vi.fn(),
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

describe("AdminListening", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getAdminListeningPassages.mockResolvedValue({ data: { count: 0, results: [] } });
    learningApi.createAdminListeningPassage.mockResolvedValue({ data: { id: 1 } });
    learningApi.updateAdminListeningPassage.mockResolvedValue({ data: { id: 1 } });
    learningApi.getAdminListeningQuestions.mockResolvedValue({ data: { count: 0, results: [] } });
    learningApi.createAdminListeningQuestion.mockResolvedValue({ data: { id: 11 } });
  });

  it("creates listening passage with transcript fields", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    renderWithProviders(<AdminListening />);

    fireEvent.click(await screen.findByRole("button", { name: /tao passage moi/i }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText(/Tieu de/i), { target: { value: "Family Greeting" } });
    fireEvent.change(within(dialog).getByLabelText(/Topic/i), { target: { value: "family" } });
    fireEvent.change(within(dialog).getByLabelText(/Transcript/i), {
      target: { value: "Anna says hello to her parents in the morning." },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ban dich tieng Viet/i), {
      target: { value: "Anna chao bo me vao buoi sang." },
    });
    fireEvent.change(within(dialog).getByLabelText(/Thoi luong \(giay\)/i), { target: { value: "30" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /luu passage/i }));

    await waitFor(() => {
      expect(learningApi.createAdminListeningPassage).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Family Greeting",
          topic: "family",
          transcript: "Anna says hello to her parents in the morning.",
          translation_vi: "Anna chao bo me vao buoi sang.",
          estimated_seconds: 30,
        }),
      );
    });
  });

  it("shows readiness warning and disables publish toggle when passage has fewer than three questions", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getAdminListeningPassages.mockResolvedValueOnce({
      data: {
        count: 1,
        results: [
          {
            id: 55,
            title: "Draft Listening",
            topic: "travel",
            level: "A1",
            transcript: "Draft transcript",
            translation_vi: "",
            estimated_seconds: 28,
            tts_lang: "en-US",
            tts_rate: 0.9,
            is_published: false,
            question_count: 2,
          },
        ],
      },
    });

    renderWithProviders(<AdminListening />);

    expect(await screen.findByText(/Draft Listening/i)).toBeInTheDocument();
    expect(screen.getByText(/Can it nhat 3 cau hoi truoc khi public/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("creates question inside question manager dialog", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getAdminListeningPassages.mockResolvedValueOnce({
      data: {
        count: 1,
        results: [
          {
            id: 88,
            title: "Morning Routine",
            topic: "daily_life",
            level: "A1",
            transcript: "Tom wakes up at six.",
            translation_vi: "Tom thuc day luc sau gio.",
            estimated_seconds: 25,
            tts_lang: "en-US",
            tts_rate: 0.9,
            is_published: false,
            question_count: 0,
          },
        ],
      },
    });

    renderWithProviders(<AdminListening />);
    fireEvent.click(await screen.findByLabelText(/quan-ly-cau-hoi-88/i));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Noi dung cau hoi/i), {
      target: { value: "What time does Tom wake up?" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Lua chon \(moi dong 1 lua chon\)/i), {
      target: { value: "At five\nAt six\nAt seven" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Lua chon dung/i), {
      target: { value: "At six" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /them cau hoi/i }));

    await waitFor(() => {
      expect(learningApi.createAdminListeningQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          passage: 88,
          question_type: "multiple_choice",
          prompt: "What time does Tom wake up?",
          choices_json: ["At five", "At six", "At seven"],
          correct_answer: { option: "At six" },
        }),
      );
    });
  });
});
