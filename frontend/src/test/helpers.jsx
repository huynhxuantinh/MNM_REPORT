import { render } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer from "@/features/auth/authSlice";
import vocabularyReducer from "@/features/vocabulary/vocabularySlice";
import learningReducer from "@/features/learning/learningSlice";
import quizReducer from "@/features/quiz/quizSlice";

export const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      auth: authReducer,
      vocabulary: vocabularyReducer,
      learning: learningReducer,
      quiz: quizReducer,
    },
    preloadedState,
  });

export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    initialEntries = ["/"],
    ...renderOptions
  } = {}
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  return { store, queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};
