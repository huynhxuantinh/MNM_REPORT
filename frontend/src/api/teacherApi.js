import axiosClient from "./axiosClient";

const teacherApi = {
  // ── Stats ─────────────────────────────────────────────────────────────────
  getTeacherStats: () =>
    axiosClient.get("/learning/teacher/stats/"),

  // ── Lessons ───────────────────────────────────────────────────────────────
  getLessons:   (params) => axiosClient.get("/learning/lessons/", { params }),
  getLesson:    (id)     => axiosClient.get(`/learning/lessons/${id}/`),
  createLesson: (data)   => axiosClient.post("/learning/lessons/", data),
  updateLesson: (id, data) => axiosClient.patch(`/learning/lessons/${id}/`, data),
  deleteLesson: (id)     => axiosClient.delete(`/learning/lessons/${id}/`),

  // ── Words trong bài ───────────────────────────────────────────────────────
  // POST body: { word_id: <id> }   (order_index tuỳ chọn)
  addWordToLesson: (lessonId, wordId) =>
    axiosClient.post(`/learning/lessons/${lessonId}/words/`, { word_id: wordId }),
  removeWordFromLesson: (lessonId, wordId) =>
    axiosClient.delete(`/learning/lessons/${lessonId}/words/${wordId}/`),

  // ── Assignments ───────────────────────────────────────────────────────────
  // createAssignment body: { lesson_id, student_ids: [], due_date? }
  getAssignments:   ()       => axiosClient.get("/learning/assignments/"),
  createAssignment: (data)   => axiosClient.post("/learning/assignments/", data),
  deleteAssignment: (id)     => axiosClient.delete(`/learning/assignments/${id}/`),

  // ── Học sinh (dành cho giáo viên) ─────────────────────────────────────────
  // Hỗ trợ ?search=<keyword>
  getStudents: (params) => axiosClient.get("/auth/teacher/students/", { params }),
};

export default teacherApi;
