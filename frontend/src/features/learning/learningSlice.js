import { createSlice } from "@reduxjs/toolkit";

/**
 * Learning Slice - Quản lý state cho quá trình học tập
 * Bao gồm: study session, review session, progress tracking
 */

const createInitialStudyStats = () => ({
  wordsLearned: 0,
  xpEarned: 0,
  startTime: null,
  endTime: null,
});

const createInitialReviewStats = () => ({
  total: 0,
  correct: 0,
  wrong: 0,
  xpEarned: 0,
  startTime: null,
  endTime: null,
});

const countStudiedWords = (studiedWordIds) => Object.keys(studiedWordIds || {}).length;

const initialState = {
  // ── Study Session ─────────────────────────────────────────────────────────
  currentLesson: null,        // Lesson đang học
  studyWords: [],             // Danh sách từ trong bài học
  currentWordIndex: 0,        // Index từ hiện tại
  studiedWordIds: {},         // Các từ đã xem qua (serializable map)
  studyComplete: false,       // Hoàn thành bài học chưa
  studyStats: createInitialStudyStats(),

  // ── Review Session (SRS) ─────────────────────────────────────────────────
  reviewQueue: [],            // Danh sách từ cần ôn
  currentReviewIndex: 0,    // Index từ đang ôn
  reviewResults: [],          // Kết quả các lần ôn (quality 0-5)
  reviewComplete: false,      // Hoàn thành phiên ôn chưa
  reviewStats: createInitialReviewStats(),

  // ── UI State ─────────────────────────────────────────────────────────────
  isFlipped: false,           // Card đang flip chưa (study/review)
  isSpeaking: false,          // Đang phát âm chưa
  showAnswer: false,        // Hiển thị đáp án (review mode)

  // ── Loading States ───────────────────────────────────────────────────────
  loading: false,
  error: null,
};

const learningSlice = createSlice({
  name: "learning",
  initialState,
  reducers: {
    // ── Study Session Actions ───────────────────────────────────────────────
    startStudySession: (state, action) => {
      const { lesson, words } = action.payload;
      state.currentLesson = lesson;
      state.studyWords = words || [];
      state.currentWordIndex = 0;
      state.studiedWordIds = {};
      state.studyComplete = false;
      state.studyStats = {
        ...createInitialStudyStats(),
        startTime: Date.now(),
      };
      state.isFlipped = false;
      state.isSpeaking = false;
    },

    nextStudyWord: (state) => {
      // Đánh dấu từ hiện tại đã học
      const currentWord = state.studyWords[state.currentWordIndex];
      if (currentWord) {
        state.studiedWordIds[currentWord.id] = true;
      }
      // Reset flip state
      state.isFlipped = false;
      state.isSpeaking = false;

      // Chuyển sang từ tiếp theo
      if (state.currentWordIndex < state.studyWords.length - 1) {
        state.currentWordIndex += 1;
      } else {
        state.studyComplete = true;
        state.studyStats.endTime = Date.now();
        state.studyStats.wordsLearned = countStudiedWords(state.studiedWordIds);
      }
    },

    previousStudyWord: (state) => {
      if (state.currentWordIndex > 0) {
        state.currentWordIndex -= 1;
        state.isFlipped = false;
        state.isSpeaking = false;
      }
    },

    goToStudyWord: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.studyWords.length) {
        state.currentWordIndex = index;
        state.isFlipped = false;
        state.isSpeaking = false;
      }
    },

    markWordStudied: (state, action) => {
      const wordId = action.payload;
      state.studiedWordIds[wordId] = true;
    },

    addStudyXp: (state, action) => {
      const xp = action.payload;
      state.studyStats.xpEarned += xp;
    },

    completeStudySession: (state) => {
      state.studyComplete = true;
      state.studyStats.endTime = Date.now();
      state.studyStats.wordsLearned = countStudiedWords(state.studiedWordIds);
    },

    resetStudySession: (state) => {
      state.currentLesson = null;
      state.studyWords = [];
      state.currentWordIndex = 0;
      state.studiedWordIds = {};
      state.studyComplete = false;
      state.studyStats = createInitialStudyStats();
      state.isFlipped = false;
      state.isSpeaking = false;
    },

    // ── Review Session Actions ──────────────────────────────────────────────
    startReviewSession: (state, action) => {
      const { words } = action.payload;
      state.reviewQueue = words || [];
      state.currentReviewIndex = 0;
      state.reviewResults = [];
      state.reviewComplete = false;
      state.showAnswer = false;
      state.reviewStats = {
        ...createInitialReviewStats(),
        total: words?.length || 0,
        startTime: Date.now(),
      };
      state.isFlipped = false;
      state.isSpeaking = false;
    },

    submitReviewAnswer: (state, action) => {
      const { quality, wordId } = action.payload;
      const result = {
        wordId,
        quality,
        timestamp: Date.now(),
      };
      state.reviewResults.push(result);

      // Cập nhật stats
      if (quality >= 3) {
        state.reviewStats.correct += 1;
        state.reviewStats.xpEarned += 5; // XP_REVIEW_CORRECT
      } else {
        state.reviewStats.wrong += 1;
        state.reviewStats.xpEarned += 2; // XP_REVIEW_WRONG
      }

      // Chuyển sang từ tiếp theo
      state.showAnswer = false;
      state.isFlipped = false;
      state.isSpeaking = false;

      if (state.currentReviewIndex < state.reviewQueue.length - 1) {
        state.currentReviewIndex += 1;
      } else {
        state.reviewComplete = true;
        state.reviewStats.endTime = Date.now();
      }
    },

    showReviewAnswer: (state) => {
      state.showAnswer = true;
    },

    resetReviewSession: (state) => {
      state.reviewQueue = [];
      state.currentReviewIndex = 0;
      state.reviewResults = [];
      state.reviewComplete = false;
      state.showAnswer = false;
      state.reviewStats = createInitialReviewStats();
      state.isFlipped = false;
      state.isSpeaking = false;
    },

    // ── UI Actions ───────────────────────────────────────────────────────────
    flipCard: (state) => {
      state.isFlipped = !state.isFlipped;
    },

    setSpeaking: (state, action) => {
      state.isSpeaking = action.payload;
    },

    // ── Loading/Error ────────────────────────────────────────────────────────
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },

    // ── Reset All ───────────────────────────────────────────────────────────
    resetAll: () => {
      return {
        ...initialState,
        studiedWordIds: {},
        studyStats: createInitialStudyStats(),
        reviewStats: createInitialReviewStats(),
      };
    },
  },
});

// ── Selectors ───────────────────────────────────────────────────────────────

export const selectLearning = (state) => state.learning;

export const selectCurrentStudyWord = (state) => {
  const { studyWords, currentWordIndex } = state.learning;
  return studyWords[currentWordIndex] || null;
};

export const selectStudyProgress = (state) => {
  const { studyWords, currentWordIndex, studiedWordIds } = state.learning;
  return {
    current: currentWordIndex + 1,
    total: studyWords.length,
    percentage: studyWords.length > 0
      ? Math.round(((currentWordIndex + 1) / studyWords.length) * 100)
      : 0,
    studiedCount: countStudiedWords(studiedWordIds),
  };
};

export const selectCurrentReviewWord = (state) => {
  const { reviewQueue, currentReviewIndex } = state.learning;
  return reviewQueue[currentReviewIndex] || null;
};

export const selectReviewProgress = (state) => {
  const { reviewQueue, currentReviewIndex, reviewResults } = state.learning;
  return {
    current: currentReviewIndex + 1,
    total: reviewQueue.length,
    percentage: reviewQueue.length > 0
      ? Math.round(((currentReviewIndex + 1) / reviewQueue.length) * 100)
      : 0,
    answeredCount: reviewResults.length,
  };
};

export const selectReviewSummary = (state) => {
  const { reviewResults, reviewStats } = state.learning;
  const qualityCounts = reviewResults.reduce((acc, r) => {
    acc[r.quality] = (acc[r.quality] || 0) + 1;
    return acc;
  }, {});

  return {
    total: reviewStats.total,
    correct: reviewStats.correct,
    wrong: reviewStats.wrong,
    xpEarned: reviewStats.xpEarned,
    qualityCounts,
    accuracy: reviewStats.total > 0
      ? Math.round((reviewStats.correct / reviewStats.total) * 100)
      : 0,
  };
};

// ── Export ───────────────────────────────────────────────────────────────────

export const {
  // Study
  startStudySession,
  nextStudyWord,
  previousStudyWord,
  goToStudyWord,
  markWordStudied,
  addStudyXp,
  completeStudySession,
  resetStudySession,
  // Review
  startReviewSession,
  submitReviewAnswer,
  showReviewAnswer,
  resetReviewSession,
  // UI
  flipCard,
  setSpeaking,
  // Loading/Error
  setLoading,
  setError,
  clearError,
  // Reset
  resetAll,
} = learningSlice.actions;

export default learningSlice.reducer;
