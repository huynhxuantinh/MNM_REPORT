import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Box, CircularProgress } from "@mui/material";
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import NotFoundPage from "@/pages/NotFoundPage";

const HomePage = lazy(() => import("@/pages/HomePage"));
const VocabularyPage = lazy(() => import("@/pages/VocabularyPage"));
const WordSetsPage = lazy(() => import("@/pages/WordSetsPage"));
const LearningPage = lazy(() => import("@/pages/LearningPage"));
const LearningPlacementPage = lazy(() => import("@/pages/LearningPlacementPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const LearningSessionPage = lazy(() => import("@/pages/LearningSessionPage"));
const StudyPage = lazy(() => import("@/pages/StudyPage"));
const ReviewPage = lazy(() => import("@/pages/ReviewPage"));
const QuizPage = lazy(() => import("@/pages/QuizPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const WordDetailPage = lazy(() => import("@/pages/WordDetailPage"));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage"));

const AdminDashboard = lazy(() => import("@/features/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/features/admin/AdminUsers"));
const AdminWords = lazy(() => import("@/features/admin/AdminWords"));
const AdminWordSets = lazy(() => import("@/features/admin/AdminWordSets"));
const AdminLessons = lazy(() => import("@/features/admin/AdminLessons"));
const AdminContent = lazy(() => import("@/features/admin/AdminContent"));
const AdminQuizResults = lazy(() => import("@/features/admin/AdminQuizResults"));
const AdminLearningPath = lazy(() => import("@/features/admin/AdminLearningPath"));

import { initAuth } from "@/features/auth/authSlice";
import learningApi from "@/api/learningApi";
import ErrorBoundary from "@/components/ErrorBoundary";
import { applyRouteSeo } from "@/utils/seo";

const PageFallback = () => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <CircularProgress sx={{ color: "#00704a" }} />
  </Box>
);

const GuestRoute = ({ children }) => {
  const { isAuthenticated, initializing, user } = useSelector((state) => state.auth);
  if (initializing) return <PageFallback />;
  if (!isAuthenticated) return children;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/" replace />;
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useSelector((state) => state.auth);
  if (initializing) return <PageFallback />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, initializing, user } = useSelector((state) => state.auth);
  if (initializing) return <PageFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

const HomeRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return children;
};

const PlacementGateRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, initializing, user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  const { data: placementStatus, isLoading } = useQuery({
    queryKey: ["placement-status"],
    queryFn: () => learningApi.getPlacementStatus().then((response) => response.data),
    enabled: isAuthenticated && !initializing && !isAdmin,
    staleTime: 0,
    retry: 1,
  });

  if (initializing) return <PageFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return children;

  const isPlacementRoute =
    location.pathname.startsWith("/learning/onboarding")
    || location.pathname.startsWith("/learning/placement");

  if (isLoading) return <PageFallback />;

  const hasCompletedPlacement = !!placementStatus?.has_completed_placement;
  if (!hasCompletedPlacement && !isPlacementRoute) {
    return <Navigate to="/learning/onboarding" replace />;
  }
  if (hasCompletedPlacement && isPlacementRoute) {
    return <Navigate to="/learning" replace />;
  }

  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  useEffect(() => {
    applyRouteSeo(location.pathname);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <PlacementGateRoute>
                <MainLayout />
              </PlacementGateRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<HomeRoute><ErrorBoundary><Suspense fallback={<PageFallback />}><HomePage /></Suspense></ErrorBoundary></HomeRoute>} />
          <Route path="vocabulary" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><VocabularyPage /></Suspense></ErrorBoundary>} />
          <Route path="vocabulary/:id" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><WordDetailPage /></Suspense></ErrorBoundary>} />
          <Route path="wordsets" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><WordSetsPage /></Suspense></ErrorBoundary>} />
          <Route path="learning" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><LearningPage /></Suspense></ErrorBoundary>} />
          <Route path="learning/onboarding" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><OnboardingPage /></Suspense></ErrorBoundary>} />
          <Route path="learning/placement" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><LearningPlacementPage /></Suspense></ErrorBoundary>} />
          <Route path="learning/session/:sessionId" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><LearningSessionPage /></Suspense></ErrorBoundary>} />
          <Route path="learning/:id/study" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><StudyPage /></Suspense></ErrorBoundary>} />
          <Route path="review" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ReviewPage /></Suspense></ErrorBoundary>} />
          <Route path="quiz" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><QuizPage /></Suspense></ErrorBoundary>} />
          <Route path="leaderboard" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><LeaderboardPage /></Suspense></ErrorBoundary>} />
          <Route path="profile" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ProfilePage /></Suspense></ErrorBoundary>} />
          <Route path="notifications" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><NotificationsPage /></Suspense></ErrorBoundary>} />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminDashboard /></Suspense></ErrorBoundary>} />
          <Route path="users" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminUsers /></Suspense></ErrorBoundary>} />
          <Route path="words" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminWords /></Suspense></ErrorBoundary>} />
          <Route path="wordsets" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminWordSets /></Suspense></ErrorBoundary>} />
          <Route path="lessons" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminLessons /></Suspense></ErrorBoundary>} />
          <Route path="content" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminContent /></Suspense></ErrorBoundary>} />
          <Route path="quizzes" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminQuizResults /></Suspense></ErrorBoundary>} />
          <Route path="learning" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminLearningPath /></Suspense></ErrorBoundary>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
