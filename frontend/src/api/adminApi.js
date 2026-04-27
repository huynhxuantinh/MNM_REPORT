import axiosClient from "./axiosClient";

const adminApi = {
  getStats:    ()          => axiosClient.get("/auth/admin/stats/"),
  getUsers:    (params)    => axiosClient.get("/auth/admin/users/", { params }),
  updateUser:  (id, data)  => axiosClient.patch(`/auth/admin/users/${id}/`, data),
};

export default adminApi;
