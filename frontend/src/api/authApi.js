import axiosClient from "./axiosClient";

const authApi = {
  login:          (data) => axiosClient.post("/auth/login/", data, { withCredentials: true }),
  logout:         ()     => axiosClient.post("/auth/logout/", {}, { withCredentials: true }),
  register:       (data) => axiosClient.post("/auth/register/", data),
  verifyEmail:    (data) => axiosClient.post("/auth/verify-email/", data),
  forgotPassword: (data) => axiosClient.post("/auth/forgot-password/", data),
  resetPassword:  (data) => axiosClient.post("/auth/reset-password/", data),
  changePassword: (data) => axiosClient.put("/auth/change-password/", data),
  getMe:          ()     => axiosClient.get("/auth/me/"),
  updateMe:       (data) => axiosClient.put("/auth/me/", data),
};

export default authApi;
