import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import learningApi from "@/api/learningApi";

/**
 * Hook để lấy danh sách từ cần ôn tập hôm nay (SRS queue)
 */
export const useReviewQueue = (options = {}) => {
  return useQuery({
    queryKey: ["review-queue"],
    queryFn: () => learningApi.getReviewList().then((res) => res.data),
    staleTime: 1 * 60 * 1000, // 1 minute - cần fresh vì thay đổi liên tục
    ...options,
  });
};

/**
 * Hook để lấy tóm tắt ôn tập (mastered/learning/new)
 */
export const useReviewSummary = (options = {}) => {
  return useQuery({
    queryKey: ["review-summary"],
    queryFn: () => learningApi.getReviewSummary().then((res) => res.data),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook để lấy lịch sử ôn tập
 * @param {number} days - Số ngày quá khứ (default: 30)
 */
export const useReviewHistory = (days = 30, options = {}) => {
  return useQuery({
    queryKey: ["review-history", days],
    queryFn: () =>
      learningApi.getReviewHistory(days).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook để submit kết quả ôn tập (SM-2 quality 0-5)
 */
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wordId, quality }) =>
      learningApi.submitAnswer(wordId, quality),
    onSuccess: () => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["review-summary"] });
      queryClient.invalidateQueries({ queryKey: ["review-history"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
};

/**
 * Hook để lấy due count (số từ đến hạn) - dùng cho badge trên navbar
 */
export const useDueCount = (options = {}) => {
  return useQuery({
    queryKey: ["due-count"],
    queryFn: async () => {
      const res = await learningApi.getReviewList();
      return res.data?.length || 0;
    },
    staleTime: 1 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook tổng hợp cho review session
 * Trả về queue, summary, và mutate function
 */
export const useReviewSession = () => {
  const queryClient = useQueryClient();

  const {
    data: queue = [],
    isLoading: isQueueLoading,
    isError: isQueueError,
  } = useReviewQueue();

  const { data: summary, isLoading: isSummaryLoading } = useReviewSummary();

  const submitMutation = useSubmitReview();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    queryClient.invalidateQueries({ queryKey: ["review-summary"] });
  };

  return {
    queue,
    summary,
    isLoading: isQueueLoading || isSummaryLoading,
    isError: isQueueError,
    submitReview: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    refresh,
  };
};
