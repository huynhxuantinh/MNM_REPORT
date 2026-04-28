import axiosClient from "./axiosClient";

const quizApi = {
  generate: (lessonId) =>
    axiosClient.get("/quiz/generate/", { params: { lesson_id: lessonId } }),
  submit: (data) => axiosClient.post("/quiz/submit/", data),
  getHistory: () => axiosClient.get("/quiz/sessions/"),
};

export default quizApi;
