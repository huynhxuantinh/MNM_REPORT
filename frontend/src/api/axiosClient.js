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

// Queue để xử lý concurrent refresh requests
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

// Tự động refresh token khi nhận 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Nếu không phải 401 hoặc là request refresh token thì reject
    if (error.response?.status !== 401 || original.url?.includes("/token/refresh/")) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        // Refresh token nằm trong HTTP-only cookie
        const { data } = await axios.post(
          `${axiosClient.defaults.baseURL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        const newToken = data.access;
        setToken(newToken);
        onTokenRefreshed(newToken);

        // Retry original request với token mới
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(original);
      } catch (refreshError) {
        // Refresh thất bại → logout
        clearToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu đang refresh, queue request này và đợi token mới
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        resolve(axiosClient(original));
      });
    });
  }
);

export default axiosClient;
