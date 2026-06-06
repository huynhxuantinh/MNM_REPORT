import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers";
import AdminLessons from "@/features/admin/AdminLessons";

vi.mock("@/services/learningApi", () => ({
  default: {
    getLessons: vi.fn(),
    createLesson: vi.fn(),
    updateLesson: vi.fn(),
    deleteLesson: vi.fn(),
    addWordToLesson: vi.fn(),
    removeWordFromLesson: vi.fn(),
    getLesson: vi.fn(),
  },
}));

vi.mock("@/services/vocabularyApi", () => ({
  default: {
    getWords: vi.fn(),
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

describe("AdminLessons", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getLessons.mockResolvedValue({ data: { count: 0, results: [] } });
    learningApi.createLesson.mockResolvedValue({ data: { id: 1 } });
    learningApi.updateLesson.mockResolvedValue({ data: { id: 1 } });
  });

  it("shows listening fields when skill_tag becomes listening", async () => {
    renderWithProviders(<AdminLessons />);

    fireEvent.click(await screen.findByRole("button", { name: /tao bai hoc moi/i }));

    const dialog = await screen.findByRole("dialog");
    const skillSelect = within(dialog).getAllByRole("combobox")[1];
    fireEvent.mouseDown(skillSelect);
    const listbox = await screen.findByRole("listbox");
    fireEvent.click(within(listbox).getByText("Listening"));

    expect(within(dialog).getByLabelText(/Transcript/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Ban dich tieng Viet/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Thoi luong \(giay\)/i)).toBeInTheDocument();
  });

  it("submits listening payload", async () => {
    const learningApi = (await import("@/services/learningApi")).default;

    renderWithProviders(<AdminLessons />);

    fireEvent.click(await screen.findByRole("button", { name: /tao bai hoc moi/i }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText(/Ten bai hoc/i), { target: { value: "Listening Demo" } });
    fireEvent.change(within(dialog).getByLabelText(/Mo ta/i), { target: { value: "Demo bai nghe" } });
    fireEvent.change(within(dialog).getByLabelText(/Topic/i), { target: { value: "daily_routine" } });

    const skillSelect = within(dialog).getAllByRole("combobox")[1];
    fireEvent.mouseDown(skillSelect);
    const listbox = await screen.findByRole("listbox");
    fireEvent.click(within(listbox).getByText("Listening"));

    fireEvent.change(within(dialog).getByLabelText(/Transcript/i), {
      target: { value: "Anna takes a bus to school every morning." },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ban dich tieng Viet/i), {
      target: { value: "Anna di xe buyt den truong moi buoi sang." },
    });
    fireEvent.change(within(dialog).getByLabelText(/Thoi luong \(giay\)/i), { target: { value: "35" } });
    fireEvent.change(within(dialog).getByLabelText(/Ngon ngu TTS/i), { target: { value: "en-US" } });
    fireEvent.change(within(dialog).getByLabelText(/Toc do doc/i), { target: { value: "0.8" } });

    fireEvent.click(within(dialog).getByRole("button", { name: /luu/i }));

    await waitFor(() => {
      expect(learningApi.createLesson).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Listening Demo",
          description: "Demo bai nghe",
          topic: "daily_routine",
          skill_tag: "listening",
          listening_transcript: "Anna takes a bus to school every morning.",
          listening_translation_vi: "Anna di xe buyt den truong moi buoi sang.",
          listening_estimated_seconds: 35,
          listening_tts_lang: "en-US",
          listening_tts_rate: 0.8,
        }),
      );
    });
  });

  it("shows listening readiness warning and disables publish toggle", async () => {
    const learningApi = (await import("@/services/learningApi")).default;
    learningApi.getLessons.mockResolvedValueOnce({
      data: {
        count: 1,
        results: [
          {
            id: 88,
            title: "Listening Not Ready",
            description: "Need more data",
            level: "A1",
            skill_tag: "listening",
            word_count: 2,
            is_published: false,
            listening_transcript: "",
            listening_estimated_seconds: 30,
          },
        ],
      },
    });

    renderWithProviders(<AdminLessons />);

    expect(await screen.findByText(/Listening Not Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Thieu transcript/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});

