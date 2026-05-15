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
  getCurrentLeague: ()           => axiosClient.get("/learning/league/current/"),

  // -- Duolingo-like path/session --
  getLearningPath:      ()               => axiosClient.get("/learning/path/"),
  getPlacementStatus:   ()               => axiosClient.get("/learning/placement/status/"),
  getPlacementQuestions:(count = 12)     => axiosClient.get("/learning/placement/questions/", { params: { count } }),
  submitPlacement:      (answers)        => axiosClient.post("/learning/placement/submit/", { answers }),
  startLearningSession: (lessonId)       => axiosClient.post("/learning/session/start/", { lesson_id: lessonId }),
  getRecoverableSession:()               => axiosClient.get("/learning/session/recover/"),
  resumeLearningSession:(sessionId)      => axiosClient.post(`/learning/session/${sessionId}/resume/`),
  switchSessionEasy:   (sessionId)       => axiosClient.post(`/learning/session/${sessionId}/switch-easy/`),
  getLearningSession:   (sessionId)      => axiosClient.get(`/learning/session/${sessionId}/`),
  answerLearningSession:(sessionId, data)=> axiosClient.post(`/learning/session/${sessionId}/answer/`, data),
  finishLearningSession:(sessionId)      => axiosClient.post(`/learning/session/${sessionId}/finish/`),
  quitLearningSession:  (sessionId, reason = "") => axiosClient.post(`/learning/session/${sessionId}/quit/`, { reason }),
  startCheckpoint:      (unitId)         => axiosClient.post("/learning/checkpoint/start/", { unit_id: unitId }),
  submitCheckpoint:     (sessionId)      => axiosClient.post(`/learning/checkpoint/${sessionId}/submit/`),
  getDailyGoal:         ()               => axiosClient.get("/learning/daily-goal/"),
  claimDailyGoal:       ()               => axiosClient.post("/learning/daily-goal/claim/"),
  claimStreakFreeze:    ()               => axiosClient.post("/learning/streak-freeze/claim/"),

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications: ()   => axiosClient.get("/learning/notifications/"),
  markRead:         (id) => axiosClient.put(`/learning/notifications/${id}/read/`),
  markAllRead:      ()   => axiosClient.put("/learning/notifications/read-all/"),
};

export default learningApi;
