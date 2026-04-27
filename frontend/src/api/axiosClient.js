import axios from "axios";
import { getToken, setToken, clearToken } from "./tokenStore";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
  withCredentials: true, // Gửi cookie (refresh token) trong mọi request
});

// Đính kèm access token vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động refresh token khi nhận 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // Refresh token nằm trong HTTP-only cookie, không cần gửi trong body
        const { data } = await axios.post(
          `${axiosClient.defaults.baseURL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        setToken(data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return axiosClient(original);
      } catch {
        clearToken();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
