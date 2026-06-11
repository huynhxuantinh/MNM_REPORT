import axiosClient from "./axiosClient";

const learningApi = {
  getLessons: (params) => axiosClient.get("/learning/lessons/", { params }),
  getLesson: (id) => axiosClient.get(`/learning/lessons/${id}/`),
  createLesson: (data) => axiosClient.post("/learning/lessons/", data),
  updateLesson: (id, data) => axiosClient.patch(`/learning/lessons/${id}/`, data),
  deleteLesson: (id) => axiosClient.delete(`/learning/lessons/${id}/`),
  addWordToLesson: (lessonId, wordId) => axiosClient.post(`/learning/lessons/${lessonId}/words/`, { word_id: wordId }),
  removeWordFromLesson: (lessonId, wordId) => axiosClient.delete(`/learning/lessons/${lessonId}/words/${wordId}/`),
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
  getLearningPathV2: () => axiosClient.get("/learning/path/v2/"),
  startActivity: (activityId, source = "learning_path") =>
    axiosClient.post(`/learning/activities/${activityId}/start/`, {}, { params: { source } }),
  submitWritingActivity: (activityId, data) =>
    axiosClient.post(`/learning/activities/${activityId}/writing/submit/`, data),
  getListeningPath: () => axiosClient.get("/learning/listening/"),
  getListeningPassages: () => axiosClient.get("/listening/passages/"),
  getListeningPassage: (passageId) => axiosClient.get(`/listening/passages/${passageId}/`),
  getAdminListeningPassages: (params) => axiosClient.get("/listening/admin/passages/", { params }),
  getAdminListeningPassage: (id) => axiosClient.get(`/listening/admin/passages/${id}/`),
  createAdminListeningPassage: (data) => axiosClient.post("/listening/admin/passages/", data),
  updateAdminListeningPassage: (id, data) => axiosClient.patch(`/listening/admin/passages/${id}/`, data),
  deleteAdminListeningPassage: (id) => axiosClient.delete(`/listening/admin/passages/${id}/`),
  getAdminListeningQuestions: (params) => axiosClient.get("/listening/admin/questions/", { params }),
  createAdminListeningQuestion: (data) => axiosClient.post("/listening/admin/questions/", data),
  updateAdminListeningQuestion: (id, data) => axiosClient.patch(`/listening/admin/questions/${id}/`, data),
  deleteAdminListeningQuestion: (id) => axiosClient.delete(`/listening/admin/questions/${id}/`),
  getPlacementStatus: () => axiosClient.get("/learning/placement/status/"),
  getPlacementQuestions: (count = 12) => axiosClient.get("/learning/placement/questions/", { params: { count } }),
  submitPlacement: (answers, source = "placement_page") =>
    axiosClient.post("/learning/placement/submit/", { answers }, { params: { source } }),
  skipPlacement: () => axiosClient.post("/learning/placement/skip/"),
  startLearningSession: (lessonId, source = "learning_page") =>
    axiosClient.post("/learning/session/start/", { lesson_id: lessonId }, { params: { source } }),
  startListeningSession: (lessonId, source = "listening_page") =>
    axiosClient.post("/learning/listening/session/start/", { lesson_id: lessonId }, { params: { source } }),
  startListeningPassageSession: (passageId) =>
    axiosClient.post("/listening/session/start/", { passage_id: passageId }),
  getRecoverableSession: () => axiosClient.get("/learning/session/recover/"),
  resumeLearningSession: (sessionId, source = "learning_page") =>
    axiosClient.post(`/learning/session/${sessionId}/resume/`, {}, { params: { source } }),
  switchSessionEasy: (sessionId) => axiosClient.post(`/learning/session/${sessionId}/switch-easy/`),
  getLearningSession: (sessionId) => axiosClient.get(`/learning/session/${sessionId}/`),
  getListeningSession: (sessionId) => axiosClient.get(`/learning/listening/session/${sessionId}/`),
  getListeningModuleSession: (sessionId) => axiosClient.get(`/listening/session/${sessionId}/`),
  answerLearningSession: (sessionId, data) => axiosClient.post(`/learning/session/${sessionId}/answer/`, data),
  answerListeningModuleSession: (sessionId, data) => axiosClient.post(`/listening/session/${sessionId}/answer/`, data),
  finishLearningSession: (sessionId) => axiosClient.post(`/learning/session/${sessionId}/finish/`),
  finishListeningModuleSession: (sessionId) => axiosClient.post(`/listening/session/${sessionId}/finish/`),
  quitLearningSession: (sessionId, reason = "") => axiosClient.post(`/learning/session/${sessionId}/quit/`, { reason }),
  startCheckpoint: (unitId) => axiosClient.post("/learning/checkpoint/start/", { unit_id: unitId }),
  submitCheckpoint: (sessionId) => axiosClient.post(`/learning/checkpoint/${sessionId}/submit/`),
  getDailyGoal: () => axiosClient.get("/learning/daily-goal/"),
  claimDailyGoal: () => axiosClient.post("/learning/daily-goal/claim/"),
  claimStreakFreeze: () => axiosClient.post("/learning/streak-freeze/claim/"),

  getNotifications: () => axiosClient.get("/learning/notifications/"),
  markRead: (id) => axiosClient.put(`/learning/notifications/${id}/read/`),
  markAllRead: () => axiosClient.put("/learning/notifications/read-all/"),

  // Admin: Course/Unit management
  getAdminCourses: () => axiosClient.get("/learning/admin/courses/"),
  createAdminCourse: (data) => axiosClient.post("/learning/admin/courses/", data),
  updateAdminCourse: (id, data) => axiosClient.patch(`/learning/admin/courses/${id}/`, data),
  deleteAdminCourse: (id) => axiosClient.delete(`/learning/admin/courses/${id}/`),
  getAdminUnits: (courseId) => axiosClient.get("/learning/admin/units/", { params: { course_id: courseId } }),
  createAdminUnit: (data) => axiosClient.post("/learning/admin/units/", data),
  updateAdminUnit: (id, data) => axiosClient.patch(`/learning/admin/units/${id}/`, data),
  deleteAdminUnit: (id) => axiosClient.delete(`/learning/admin/units/${id}/`),
  getAdminUnitLessons: (unitId) => axiosClient.get(`/learning/admin/units/${unitId}/lessons/`),
  addLessonToUnit: (unitId, lessonId, orderIndex = 0) =>
    axiosClient.post(`/learning/admin/units/${unitId}/lessons/`, { lesson_id: lessonId, order_index: orderIndex }),
  removeLessonFromUnit: (unitId, lessonId) =>
    axiosClient.delete(`/learning/admin/units/${unitId}/lessons/${lessonId}/`),
};

export default learningApi;
