import axios from "axios";
import { getToken, setToken, clearToken } from "./tokenStore";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
  withCredentials: true, // Send refresh-token cookie in every request
});

// Attach access token to each request.
axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Queue for concurrent refresh requests.
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

// Auto-refresh access token when API returns 401.
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Reject non-401 errors or refresh endpoint errors directly.
    if (error.response?.status !== 401 || original.url?.includes("/token/refresh/")) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        // Refresh token is stored in HTTP-only cookie.
        const { data } = await axios.post(
          `${axiosClient.defaults.baseURL}/auth/token/refresh/`,
          {},
          { withCredentials: true },
        );
        const newToken = data.access;
        setToken(newToken);
        onTokenRefreshed(newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(original);
      } catch (refreshError) {
        clearToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // If a refresh is in-flight, queue this request.
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        resolve(axiosClient(original));
      });
    });
  },
);

export default axiosClient;
