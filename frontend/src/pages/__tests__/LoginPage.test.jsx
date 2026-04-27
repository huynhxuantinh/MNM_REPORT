import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import LoginPage from "../LoginPage";

vi.mock("@/api/axiosClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock window.matchMedia cho MUI
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

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("hiển thị form đăng nhập", () => {
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    expect(screen.getByRole("heading", { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it("hiển thị lỗi khi gửi form rỗng", async () => {
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    const btn = screen.getByRole("button", { name: /đăng nhập/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText("Email là bắt buộc")).toBeInTheDocument();
    });
  });

  it("hiển thị lỗi khi email không hợp lệ", async () => {
    const { container } = renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    const emailInput = container.querySelector('input[type="email"]');
    await userEvent.type(emailInput, "notvalid");
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText("Email không hợp lệ")).toBeInTheDocument();
    });
  });

  it("gọi login API khi form hợp lệ", async () => {
    const axiosClient = await import("@/api/axiosClient");
    axiosClient.default.post.mockResolvedValue({
      data: {
        access: "access-token",
        refresh: "refresh-token",
        user: { id: 1, email: "test@example.com", username: "test", role: "user" },
      },
    });

    const { container } = renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "pass123");
    await userEvent.click(screen.getByRole("button", { name: /^đăng nhập$/i }));

    await waitFor(() => {
      expect(axiosClient.default.post).toHaveBeenCalledWith(
        "/auth/token/",
        { email: "test@example.com", password: "pass123" }
      );
    });
  });

  it("hiển thị link đăng ký", () => {
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    expect(screen.getByRole("link", { name: /đăng ký ngay/i })).toBeInTheDocument();
  });

  it("hiển thị link quên mật khẩu", () => {
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    expect(screen.getByRole("link", { name: /quên mật khẩu/i })).toBeInTheDocument();
  });
});
