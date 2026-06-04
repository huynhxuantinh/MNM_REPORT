import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import vocabularyApi from "@/services/vocabularyApi";

/**
 * Hook để lấy danh sách từ vựng có phân trang, tìm kiếm, lọc
 * @param {Object} params - { search, level, part_of_speech, page, page_size }
 */
export const useWords = (params = {}, options = {}) => {
  const { search, level, part_of_speech, page = 1, page_size = 20 } = params;

  return useQuery({
    queryKey: ["words", { search, level, part_of_speech, page, page_size }],
    queryFn: () =>
      vocabularyApi.getWords({
        search,
        level,
        part_of_speech,
        page,
        page_size,
      }).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook để lấy chi tiết một từ
 * @param {number} id - ID của từ
 */
export const useWord = (id, options = {}) => {
  return useQuery({
    queryKey: ["word", id],
    queryFn: () => vocabularyApi.getWord(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook để toggle bookmark một từ
 */
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wordId, isBookmarked }) =>
      isBookmarked
        ? vocabularyApi.removeBookmark(wordId)
        : vocabularyApi.addBookmark(wordId),
    onSuccess: (_, variables) => {
      // Invalidate queries liên quan
      queryClient.invalidateQueries({ queryKey: ["words"] });
      queryClient.invalidateQueries({ queryKey: ["word", variables.wordId] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
};

/**
 * Hook để lấy danh sách từ đã bookmark
 */
export const useBookmarks = (options = {}) => {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => vocabularyApi.getBookmarks().then((res) => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Hook để lấy danh sách bộ từ (WordSets)
 */
export const useWordSets = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["wordsets", params],
    queryFn: () => vocabularyApi.getSets(params).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook để lấy chi tiết bộ từ
 */
export const useWordSet = (id, options = {}) => {
  return useQuery({
    queryKey: ["wordset", id],
    queryFn: () => vocabularyApi.getSet(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export default useWords;


