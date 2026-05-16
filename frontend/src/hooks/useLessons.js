import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import learningApi from "@/api/learningApi";

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

export const useLesson = (id, options = {}) => {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => learningApi.getLesson(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

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
