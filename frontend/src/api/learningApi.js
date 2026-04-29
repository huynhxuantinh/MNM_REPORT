import axiosClient from "./axiosClient";

const learningApi = {
  // ── Lessons ──────────────────────────────────────────────────────────────
  getLessons:     (params) => axiosClient.get("/learning/lessons/", { params }),
  getLesson:      (id)     => axiosClient.get(`/learning/lessons/${id}/`),
  createLesson:   (data)   => axiosClient.post("/learning/lessons/", data),
  updateLesson:   (id, d)  => axiosClient.patch(`/learning/lessons/${id}/`, d),
  deleteLesson:   (id)     => axiosClient.delete(`/learning/lessons/${id}/`),
  startLesson:    (id)     => axiosClient.post(`/learning/lessons/${id}/start/`),
  completeLesson: (id)     => axiosClient.post(`/learning/lessons/${id}/complete/`),

  // ── Assignments ───────────────────────────────────────────────────────────
  getAssignments:   ()       => axiosClient.get("/learning/assignments/"),
  createAssignment: (data)   => axiosClient.post("/learning/assignments/", data),
  deleteAssignment: (id)     => axiosClient.delete(`/learning/assignments/${id}/`),

  // ── Review SRS ────────────────────────────────────────────────────────────
  getReviewList:    ()           => axiosClient.get("/learning/review/"),
  getReviewSummary: ()           => axiosClient.get("/learning/review/summary/"),
  getReviewHistory: (days = 30)  => axiosClient.get("/learning/review/history/", { params: { days } }),
  submitAnswer:     (wordId, q)  => axiosClient.post(`/learning/review/${wordId}/answer/`, { quality: q }),
  getProfileStats:  ()           => axiosClient.get("/learning/profile/stats/"),
  getLeaderboard:   ()           => axiosClient.get("/learning/leaderboard/"),

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications: ()   => axiosClient.get("/learning/notifications/"),
  markRead:         (id) => axiosClient.put(`/learning/notifications/${id}/read/`),
  markAllRead:      ()   => axiosClient.put("/learning/notifications/read-all/"),
};

export default learningApi;
