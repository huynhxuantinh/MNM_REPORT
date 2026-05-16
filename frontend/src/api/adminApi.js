import axiosClient from "./axiosClient";

const adminApi = {
  getStats:     ()               => axiosClient.get("/auth/admin/stats/"),
  getUsers:     (params)         => axiosClient.get("/auth/admin/users/", { params }),
  updateUser:   (id, data)       => axiosClient.patch(`/auth/admin/users/${id}/`, data),
  toggleActive:    (id, isActive)   => axiosClient.patch(`/auth/admin/users/${id}/`, { is_active: isActive }),
  getQuizResults:   (params)         => axiosClient.get("/quiz/admin/results/", { params }),
  getLearningKpiBaseline: (range = "7d") => axiosClient.get("/learning/kpi/baseline/", { params: { range } }),
  getLearningOnboardingFunnel: (range = "7d") => axiosClient.get("/learning/kpi/onboarding-funnel/", { params: { range } }),
};

export default adminApi;
