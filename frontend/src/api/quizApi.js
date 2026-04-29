import axiosClient from "./axiosClient";

const quizApi = {
  generate: (params) =>
    axiosClient.get("/quiz/generate/", { params }),
  submit: (data) => axiosClient.post("/quiz/submit/", data),
  getHistory: () => axiosClient.get("/quiz/sessions/"),
};

export default quizApi;
