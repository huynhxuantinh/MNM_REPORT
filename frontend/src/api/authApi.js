import axiosClient from "./axiosClient";

const authApi = {
  login:          (data) => axiosClient.post("/auth/token/", data),
  register:       (data) => axiosClient.post("/auth/register/", data),
  forgotPassword: (data) => axiosClient.post("/auth/forgot-password/", data),
  resetPassword:  (data) => axiosClient.post("/auth/reset-password/", data),
  changePassword: (data) => axiosClient.post("/auth/change-password/", data),
  getMe:          ()     => axiosClient.get("/auth/me/"),
  updateMe:       (data) => axiosClient.put("/auth/me/", data),
};

export default authApi;
