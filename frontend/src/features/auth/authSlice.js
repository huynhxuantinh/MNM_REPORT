import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import axiosClient from "@/services/axiosClient";
import { getToken, setToken, clearToken } from "@/services/tokenStore";

// Đọc user từ localStorage để hiển thị ngay khi tải trang trước khi initAuth hoàn thành
const loadUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Thunks ──────────────────────────────────────────────────────────────────

// Khôi phục phiên từ refresh token (HTTP-only cookie) khi reload trang
export const initAuth = createAsyncThunk(
  "auth/initAuth",
  async (_, { rejectWithValue }) => {
    try {
      let token = getToken();
      if (!token) {
        const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
        const { data: refreshData } = await axios.post(
          `${baseURL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        setToken(refreshData.access);
      }

      const { data: user } = await axiosClient.get("/auth/me/");
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (err) {
      clearToken();
      localStorage.removeItem("user");
      return rejectWithValue(err.response?.data);
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      // Trả về { access, user } — refresh token được server đặt vào HTTP-only cookie
      const { data } = await axiosClient.post("/auth/login/", credentials);
      setToken(data.access);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get("/auth/me/");
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// ── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:            loadUser(),
    isAuthenticated: false,  // Xác nhận qua initAuth, không đọc localStorage
    initializing:    true,   // True trong khi initAuth đang chạy
    loading:         false,
    error:           null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.initializing = false;
      state.error = null;
      clearToken();
      localStorage.removeItem("user");
    },
    setUser(state, { payload }) {
      const nextUser = state.user ? { ...state.user, ...payload } : payload;
      state.user = nextUser;
      localStorage.setItem("user", JSON.stringify(nextUser));
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── initAuth ──
      .addCase(initAuth.pending, (state) => {
        state.initializing = true;
      })
      .addCase(initAuth.fulfilled, (state, { payload }) => {
        state.initializing = false;
        state.isAuthenticated = true;
        state.user = payload;
      })
      .addCase(initAuth.rejected, (state) => {
        state.initializing = false;
        state.isAuthenticated = false;
        state.user = null;
      })

      // ── login ──
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = payload.user ?? null;
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // ── fetchMe ──
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        clearToken();
        localStorage.removeItem("user");
      });
  },
});

export const { logout, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;


