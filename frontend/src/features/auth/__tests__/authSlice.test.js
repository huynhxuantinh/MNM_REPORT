import { describe, it, expect, beforeEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  logout,
  setUser,
  clearError,
  login,
} from "../authSlice";

// Mock axiosClient để không gọi API thật
vi.mock("@/services/axiosClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const createStore = (preloadedState) =>
  configureStore({ reducer: { auth: authReducer }, preloadedState });

const MOCK_USER = { id: 1, email: "test@example.com", username: "test", role: "user" };
const MOCK_TOKENS = { access: "access-token", refresh: "refresh-token", user: MOCK_USER };

describe("authSlice - reducers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("logout xóa user và isAuthenticated", () => {
    const store = createStore({
      auth: { user: MOCK_USER, isAuthenticated: true, loading: false, error: null },
    });
    store.dispatch(logout());
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("setUser cập nhật user trong store", () => {
    const store = createStore({
      auth: { user: null, isAuthenticated: false, loading: false, error: null },
    });
    store.dispatch(setUser(MOCK_USER));
    expect(store.getState().auth.user).toEqual(MOCK_USER);
  });

  it("clearError xóa lỗi", () => {
    const store = createStore({
      auth: { user: null, isAuthenticated: false, loading: false, error: "Lỗi gì đó" },
    });
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });
});

describe("authSlice - login thunk", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("login.pending đặt loading=true và xóa error", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.post.mockReturnValue(new Promise(() => {})); // never resolves

    const store = createStore({
      auth: { user: null, isAuthenticated: false, loading: false, error: "cũ" },
    });
    store.dispatch(login({ email: "a@b.com", password: "pass" }));
    const state = store.getState().auth;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it("login.fulfilled đặt isAuthenticated=true và lưu user", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.post.mockResolvedValue({ data: MOCK_TOKENS });

    const store = createStore({
      auth: { user: null, isAuthenticated: false, loading: false, error: null },
    });
    await store.dispatch(login({ email: "test@example.com", password: "pass" }));
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(MOCK_USER);
    expect(state.loading).toBe(false);
  });

  it("login.rejected lưu error từ server", async () => {
    const axiosClient = await import("@/services/axiosClient");
    axiosClient.default.post.mockRejectedValue({
      response: { data: { detail: "Sai mật khẩu" } },
    });

    const store = createStore({
      auth: { user: null, isAuthenticated: false, loading: false, error: null },
    });
    await store.dispatch(login({ email: "test@example.com", password: "wrong" }));
    const state = store.getState().auth;
    expect(state.error).toEqual({ detail: "Sai mật khẩu" });
    expect(state.isAuthenticated).toBe(false);
  });
});


