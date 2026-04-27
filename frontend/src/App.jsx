import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Box, CircularProgress } from "@mui/material";
import MainLayout from "@/components/layout/MainLayout";
// Auth pages load immediately (shown before JS hydrates)
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import NotFoundPage from "@/pages/NotFoundPage";
// Protected pages are lazy-loaded to split the initial bundle
const HomePage          = lazy(() => import("@/pages/HomePage"));
const VocabularyPage    = lazy(() => import("@/pages/VocabularyPage"));
const LearningPage      = lazy(() => import("@/pages/LearningPage"));
const StudyPage         = lazy(() => import("@/pages/StudyPage"));
const ReviewPage        = lazy(() => import("@/pages/ReviewPage"));
const QuizPage          = lazy(() => import("@/pages/QuizPage"));
const ProfilePage       = lazy(() => import("@/pages/ProfilePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const AdminPage         = lazy(() => import("@/pages/AdminPage"));
import { initAuth } from "@/features/auth/authSlice";
import ErrorBoundary from "@/components/ErrorBoundary";

const PageFallback = () => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <CircularProgress sx={{ color: "#00704a" }} />
  </Box>
);

// Redirect logged-in users away from auth pages
const GuestRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useSelector((state) => state.auth);
  if (initializing) return <PageFallback />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

// Redirect unauthenticated users to login
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useSelector((state) => state.auth);
  if (initializing) return <PageFallback />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const dispatch = useDispatch();

  // Khôi phục phiên từ refresh token cookie khi reload trang
  useEffect(() => {
    dispatch(initAuth());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ErrorBoundary>
      <Routes>
        {/* ── Auth routes (public, redirect to / if logged in) ── */}
        <Route path="/login"          element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"       element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />

        {/* ── Protected routes ── */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<ErrorBoundary><Suspense fallback={<PageFallback />}><HomePage /></Suspense></ErrorBoundary>} />
          <Route path="vocabulary"           element={<ErrorBoundary><Suspense fallback={<PageFallback />}><VocabularyPage /></Suspense></ErrorBoundary>} />
          <Route path="learning"             element={<ErrorBoundary><Suspense fallback={<PageFallback />}><LearningPage /></Suspense></ErrorBoundary>} />
          <Route path="learning/:id/study"   element={<ErrorBoundary><Suspense fallback={<PageFallback />}><StudyPage /></Suspense></ErrorBoundary>} />
          <Route path="review"               element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ReviewPage /></Suspense></ErrorBoundary>} />
          <Route path="quiz"                 element={<ErrorBoundary><Suspense fallback={<PageFallback />}><QuizPage /></Suspense></ErrorBoundary>} />
          <Route path="profile"              element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ProfilePage /></Suspense></ErrorBoundary>} />
          <Route path="notifications"        element={<ErrorBoundary><Suspense fallback={<PageFallback />}><NotificationsPage /></Suspense></ErrorBoundary>} />
          <Route path="admin"                element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminPage /></Suspense></ErrorBoundary>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
