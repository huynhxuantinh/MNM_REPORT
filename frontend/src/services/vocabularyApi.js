import axiosClient from "./axiosClient";

const vocabularyApi = {
  // Words
  getWords: (params) => axiosClient.get("/vocabulary/words/", { params }),
  getWord: (id) => axiosClient.get(`/vocabulary/words/${id}/`),
  createWord: (data) => axiosClient.post("/vocabulary/words/", data),
  updateWord: (id, data) => axiosClient.patch(`/vocabulary/words/${id}/`, data),
  deleteWord: (id) => axiosClient.delete(`/vocabulary/words/${id}/`),
  bookmarkWord: (id) => axiosClient.post(`/vocabulary/words/${id}/bookmark/`),
  importCsv: (form) =>
    axiosClient.post("/vocabulary/words/import/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Word sets
  getSets: (params) => axiosClient.get("/vocabulary/sets/", { params }),
  getSet: (id) => axiosClient.get(`/vocabulary/sets/${id}/`),
  createSet: (data) => axiosClient.post("/vocabulary/sets/", data),
  updateSet: (id, data) => axiosClient.patch(`/vocabulary/sets/${id}/`, data),
  deleteSet: (id) => axiosClient.delete(`/vocabulary/sets/${id}/`),
  addWordToSet: (setId, data) => axiosClient.post(`/vocabulary/sets/${setId}/words/`, data),
  removeWordFromSet: (setId, wordId) => axiosClient.delete(`/vocabulary/sets/${setId}/words/${wordId}/`),
  importSetCsv: (formData) =>
    axiosClient.post("/vocabulary/sets/import/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Bookmarks
  getBookmarks: () => axiosClient.get("/vocabulary/bookmarks/"),
};

export default vocabularyApi;
