import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import learningApi from "@/api/learningApi";

/**
 * Hook để lấy danh sách bài học
 * @param {Object} params - { level, is_published, page, page_size }
 */
export const useLessons = (params = {}, options = {}) => {
  const { level, is_published, page = 1, page_size = 20, ...rest } = params;

  return useQuery({
    queryKey: ["lessons", { level, is_published, page, page_size, ...rest }],
    queryFn: () =>
      learningApi.getLessons({
        level,
        is_published,
        page,
        page_size,
        ...rest,
      }).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook để lấy chi tiết một bài học
 * @param {number} id - ID bài học
 */
export const useLesson = (id, options = {}) => {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => learningApi.getLesson(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook để bắt đầu học một bài (gọi API start)
 */
export const useStartLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId) => learningApi.startLesson(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
    },
  });
};

/**
 * Hook để hoàn thành bài học (gọi API complete)
 */
export const useCompleteLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId) => learningApi.completeLesson(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
};

/**
 * Hook để lấy danh sách bài học được giao (assignments)
 */
export const useAssignments = (options = {}) => {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: () => learningApi.getAssignments().then((res) => res.data),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook để lấy tiến trình học tập của user
 */
export const useLearningProgress = (options = {}) => {
  return useQuery({
    queryKey: ["learning-progress"],
    queryFn: () => learningApi.getProgress().then((res) => res.data),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export default useLessons;
