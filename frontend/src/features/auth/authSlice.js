import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "@/api/axiosClient";

// ── Helpers ───────────────────────────────────��───────────────���────────────

const loadUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveAuth = (data) => {
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
};

const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

// ── Thunks ──────────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post("/auth/token/", credentials);
      saveAuth(data);
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
    isAuthenticated: !!localStorage.getItem("access_token"),
    loading:         false,
    error:           null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      clearAuth();
    },
    setUser(state, { payload }) {
      state.user = payload;
      localStorage.setItem("user", JSON.stringify(payload));
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
        // Token hết hạn → logout
        state.user = null;
        state.isAuthenticated = false;
        clearAuth();
      });
  },
});

export const { logout, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
