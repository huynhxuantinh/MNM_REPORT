import axiosClient from "./axiosClient";

const vocabularyApi = {
  // ── Words ─────────────────────────────────────────────────────────────────
  getWords:     (params) => axiosClient.get("/vocabulary/words/", { params }),
  getWord:      (id)     => axiosClient.get(`/vocabulary/words/${id}/`),
  createWord:   (data)   => axiosClient.post("/vocabulary/words/", data),
  updateWord:   (id, d)  => axiosClient.patch(`/vocabulary/words/${id}/`, d),
  deleteWord:   (id)     => axiosClient.delete(`/vocabulary/words/${id}/`),
  bookmarkWord: (id)     => axiosClient.post(`/vocabulary/words/${id}/bookmark/`),
  importCsv:    (form)   => axiosClient.post("/vocabulary/words/import/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }),

  // ── WordSets ──────────────────────────────────────────────────────────────
  getSets:      (params) => axiosClient.get("/vocabulary/sets/", { params }),
  getSet:       (id)     => axiosClient.get(`/vocabulary/sets/${id}/`),
  createSet:    (data)   => axiosClient.post("/vocabulary/sets/", data),
  updateSet:    (id, d)  => axiosClient.patch(`/vocabulary/sets/${id}/`, d),
  deleteSet:    (id)     => axiosClient.delete(`/vocabulary/sets/${id}/`),
  addWordToSet: (id, d)  => axiosClient.post(`/vocabulary/sets/${id}/words/`, d),
  removeWordFromSet: (setId, wordId) =>
    axiosClient.delete(`/vocabulary/sets/${setId}/words/${wordId}/`),
  importSetCsv: (fd) => axiosClient.post("/vocabulary/sets/import/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  }),

  // ── Bookmarks ─────────────────────────────────────────────────────────────
  getBookmarks: () => axiosClient.get("/vocabulary/bookmarks/"),
};

export default vocabularyApi;
