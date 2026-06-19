import { useQuery } from "@tanstack/react-query";
import learningApi from "@/services/learningApi";

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

