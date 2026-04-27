import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import vocabularyReducer from "@/features/vocabulary/vocabularySlice";
import learningReducer from "@/features/learning/learningSlice";
import quizReducer from "@/features/quiz/quizSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vocabulary: vocabularyReducer,
    learning: learningReducer,
    quiz: quizReducer,
  },
});
