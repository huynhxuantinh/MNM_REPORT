import axiosClient from "./axiosClient";

const learningApi = {
  getLessons: (params) => axiosClient.get("/learning/lessons/", { params }),
  getLesson: (id) => axiosClient.get(`/learning/lessons/${id}/`),
  createLesson: (data) => axiosClient.post("/learning/lessons/", data),
  updateLesson: (id, data) => axiosClient.patch(`/learning/lessons/${id}/`, data),
  deleteLesson: (id) => axiosClient.delete(`/learning/lessons/${id}/`),
  startLesson: (id) => axiosClient.post(`/learning/lessons/${id}/start/`),
  completeLesson: (id) => axiosClient.post(`/learning/lessons/${id}/complete/`),

  getReviewList: () => axiosClient.get("/learning/review/"),
  getReviewSummary: () => axiosClient.get("/learning/review/summary/"),
  getReviewHistory: (days = 30) => axiosClient.get("/learning/review/history/", { params: { days } }),
  submitAnswer: (wordId, quality) => axiosClient.post(`/learning/review/${wordId}/answer/`, { quality }),
  getProfileStats: () => axiosClient.get("/learning/profile/stats/"),
  getLeaderboard: () => axiosClient.get("/learning/leaderboard/"),
  getCurrentLeague: () => axiosClient.get("/learning/league/current/"),

  getLearningPath: () => axiosClient.get("/learning/path/"),
  getPlacementStatus: () => axiosClient.get("/learning/placement/status/"),
  getPlacementQuestions: (count = 12) => axiosClient.get("/learning/placement/questions/", { params: { count } }),
  submitPlacement: (answers, source = "placement_page") =>
    axiosClient.post("/learning/placement/submit/", { answers }, { params: { source } }),
  startLearningSession: (lessonId, source = "learning_page") =>
    axiosClient.post("/learning/session/start/", { lesson_id: lessonId }, { params: { source } }),
  getRecoverableSession: () => axiosClient.get("/learning/session/recover/"),
  resumeLearningSession: (sessionId, source = "learning_page") =>
    axiosClient.post(`/learning/session/${sessionId}/resume/`, {}, { params: { source } }),
  switchSessionEasy: (sessionId) => axiosClient.post(`/learning/session/${sessionId}/switch-easy/`),
  getLearningSession: (sessionId) => axiosClient.get(`/learning/session/${sessionId}/`),
  answerLearningSession: (sessionId, data) => axiosClient.post(`/learning/session/${sessionId}/answer/`, data),
  finishLearningSession: (sessionId) => axiosClient.post(`/learning/session/${sessionId}/finish/`),
  quitLearningSession: (sessionId, reason = "") => axiosClient.post(`/learning/session/${sessionId}/quit/`, { reason }),
  startCheckpoint: (unitId) => axiosClient.post("/learning/checkpoint/start/", { unit_id: unitId }),
  submitCheckpoint: (sessionId) => axiosClient.post(`/learning/checkpoint/${sessionId}/submit/`),
  getDailyGoal: () => axiosClient.get("/learning/daily-goal/"),
  claimDailyGoal: () => axiosClient.post("/learning/daily-goal/claim/"),
  claimStreakFreeze: () => axiosClient.post("/learning/streak-freeze/claim/"),

  getNotifications: () => axiosClient.get("/learning/notifications/"),
  markRead: (id) => axiosClient.put(`/learning/notifications/${id}/read/`),
  markAllRead: () => axiosClient.put("/learning/notifications/read-all/"),
};

export default learningApi;
