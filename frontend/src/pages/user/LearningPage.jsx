import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { LockRounded as LockRoundedIcon } from "@mui/icons-material";
import { PlayArrowRounded as PlayArrowRoundedIcon } from "@mui/icons-material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { FactCheckRounded as FactCheckRoundedIcon } from "@mui/icons-material";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
import { StyleRounded as FlashcardIcon } from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const LEARNING_UX_HINT_KEY = "learning_ux_hint_dismissed_v1";

const UnitCard = ({
  unit,
  onStart,
  onStudy,
  onStartCheckpoint,
  startingLessonId,
  startingCheckpointUnitId,
  disabled,
}) => {
  const completedLessons = unit.progress?.completed_lessons ?? 0;
  const totalLessons = unit.lesson_count ?? unit.lessons?.length ?? 0;
  const progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const isCompleted = !!unit.progress?.completed_at;
  const checkpointPassed = !!unit.progress?.checkpoint_passed;
  const canStartCheckpoint = unit.unlocked && totalLessons > 0 && completedLessons >= totalLessons && !checkpointPassed;

  return (
    <SbCard
      sx={{
        border: `1px solid ${unit.unlocked ? `${colors.greenAccent}33` : "rgba(0,0,0,0.08)"}`,
        opacity: unit.unlocked ? 1 : 0.7,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: colors.greenStarbucks }}>
            Unit {unit.order_index}: {unit.title}
          </Typography>
          {unit.unlocked ? (
            isCompleted ? (
              <Chip
                icon={<CheckCircleRoundedIcon sx={{ fontSize: "14px !important" }} />}
                label="Hoàn thành"
                size="small"
                sx={{ bgcolor: `${colors.greenAccent}20`, color: colors.greenAccent, fontWeight: 700 }}
              />
            ) : (
              <Chip label="Đã mở" size="small" sx={{ bgcolor: `${colors.gold}20`, color: colors.gold, fontWeight: 700 }} />
            )
          ) : (
            <Chip icon={<LockRoundedIcon sx={{ fontSize: "14px !important" }} />} label="Khóa" size="small" />
          )}
        </Stack>
        {unit.placement_recommended && (
          <Chip
            label="Gợi ý từ placement"
            size="small"
            sx={{ width: "fit-content", bgcolor: `${colors.greenStarbucks}15`, color: colors.greenStarbucks, fontWeight: 700 }}
          />
        )}

        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
          {unit.description || "Chưa có mô tả."}
        </Typography>

        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              Tiến độ
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", fontWeight: 700 }}>
              {completedLessons}/{totalLessons}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 7,
              borderRadius: 3,
              bgcolor: "rgba(0,0,0,0.1)",
              "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
            }}
          />
        </Box>

        <Stack spacing={1}>
          {(unit.lessons || []).map((item) => {
            const lessonId = item.lesson?.id ?? item.lesson_id ?? null;
            const lessonTitle = item.lesson?.title || item.title || "Bài học";
            const lessonLevel = item.lesson?.level || item.level || "A1";
            const wordsLearned = item.lesson?.words_learned ?? item.words_learned ?? 0;
            const wordsTotal = item.lesson?.words_total ?? item.words_total ?? 0;

            return (
            <Stack
              key={`${unit.id}-${item.order_index}-${lessonId || "na"}`}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1}
              sx={{ p: 1.25, borderRadius: 2, bgcolor: "background.default" }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  Bài {item.order_index}: {lessonTitle}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                  {lessonLevel} · Đã học {wordsLearned}/{wordsTotal} từ
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75}>
                <Tooltip title="Mở chế độ flashcard để học nghĩa từng từ trước" arrow>
                  <Box>
                    <SbButton
                      size="small"
                      variant="outlined"
                      startIcon={<FlashcardIcon sx={{ fontSize: 18 }} />}
                      disabled={!unit.unlocked || !lessonId}
                      onClick={() => onStudy(lessonId)}
                      sx={{ minWidth: 0, px: 1.5 }}
                    >
                      Flashcard
                    </SbButton>
                  </Box>
                </Tooltip>
                <SbButton
                  size="small"
                  variant="primary"
                  data-cy={lessonId ? `learning-start-${lessonId}` : "learning-start-disabled"}
                  startIcon={<PlayArrowRoundedIcon />}
                  disabled={!unit.unlocked || disabled || !lessonId}
                  loading={startingLessonId === lessonId}
                  onClick={() => onStart(lessonId)}
                >
                  Làm bài
                </SbButton>
              </Stack>
            </Stack>
          )})}
        </Stack>

        {canStartCheckpoint && (
          <Tooltip
            title="Checkpoint giúp xác nhận bạn nắm chắc unit trước khi mở khóa unit tiếp theo."
            arrow
          >
            <Box>
              <SbButton
                variant="outlined"
                startIcon={<FactCheckRoundedIcon />}
                disabled={disabled}
                loading={startingCheckpointUnitId === unit.id}
                onClick={() => onStartCheckpoint(unit.id)}
              >
                Làm kiểm tra unit
              </SbButton>
            </Box>
          </Tooltip>
        )}
        {checkpointPassed && (
          <Alert severity="success" sx={{ py: 0 }}>
            Đã vượt qua kiểm tra unit
          </Alert>
        )}
      </Stack>
    </SbCard>
  );
};

const LearningPage = () => {
  const navigate = useNavigate();
  const [quickStudyLoading, setQuickStudyLoading] = useState(false);
  const [quickStudyError, setQuickStudyError] = useState("");
  const [recoverRefreshing, setRecoverRefreshing] = useState(false);
  const [recoverRefreshNote, setRecoverRefreshNote] = useState("");
  const [showUxHint, setShowUxHint] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LEARNING_UX_HINT_KEY) !== "1";
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["learning-path"],
    queryFn: () => learningApi.getLearningPath().then((response) => response.data),
    staleTime: 0,
  });
  const { data: placementStatus } = useQuery({
    queryKey: ["placement-status"],
    queryFn: () => learningApi.getPlacementStatus().then((response) => response.data),
    staleTime: 0,
  });
  const { data: recoverData, refetch: refetchRecover } = useQuery({
    queryKey: ["learning-recover-session"],
    queryFn: () => learningApi.getRecoverableSession().then((response) => response.data),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const startMutation = useMutation({
    mutationFn: (lessonId) => learningApi.startLearningSession(lessonId, "learning_path").then((response) => response.data),
    onSuccess: (session) => {
      navigate(`/learning/session/${session.id}`);
    },
  });
  const checkpointStartMutation = useMutation({
    mutationFn: (unitId) => learningApi.startCheckpoint(unitId).then((response) => response.data),
    onSuccess: (session) => {
      navigate(`/learning/session/${session.id}`);
    },
  });
  const resumeMutation = useMutation({
    mutationFn: (sessionId) => learningApi.resumeLearningSession(sessionId, "learning_page").then((response) => response.data),
    onSuccess: (payload) => {
      navigate(`/learning/session/${payload.session?.id}`);
    },
  });
  const { data: dailyGoalData, refetch: refetchDailyGoal } = useQuery({
    queryKey: ["daily-goal"],
    queryFn: () => learningApi.getDailyGoal().then((response) => response.data),
    staleTime: 0,
  });
  const claimDailyGoalMutation = useMutation({
    mutationFn: () => learningApi.claimDailyGoal().then((response) => response.data),
    onSuccess: () => {
      refetchDailyGoal();
    },
  });
  const claimFreezeMutation = useMutation({
    mutationFn: () => learningApi.claimStreakFreeze().then((response) => response.data),
    onSuccess: () => {
      refetchDailyGoal();
    },
  });

  const units = useMemo(() => data?.units || [], [data]);
  const mainUnits = useMemo(
    () => units.filter((unit) => !(unit.lessons || []).every((item) => item?.lesson?.skill_tag === "listening")),
    [units],
  );
  const shouldShowOnboarding = !!placementStatus?.should_show_onboarding;
  const recommendedStartUnitId = data?.placement?.recommended_start_unit_id ?? null;
  const recommendedLevel = data?.placement?.recommended_level ?? null;
  const hasLearningProgress = useMemo(
    () => mainUnits.some((unit) => {
      const progress = unit?.progress;
      if (progress?.started_at || progress?.completed_at || (progress?.completed_lessons || 0) > 0) return true;
      return (unit?.lessons || []).some((item) => {
        const lesson = item?.lesson || {};
        return Boolean(lesson?.user_progress?.started_at || lesson?.user_progress?.completed_at || (lesson?.words_learned || 0) > 0);
      });
    }),
    [mainUnits],
  );
  const startingLessonId = startMutation.variables;
  const startingCheckpointUnitId = checkpointStartMutation.variables;
  const studiedMinutes = dailyGoalData?.today?.studied_minutes ?? 0;
  const goalMinutes = dailyGoalData?.today?.goal_minutes ?? dailyGoalData?.target_minutes ?? 10;
  const progressPercent = Math.min(100, Math.round((studiedMinutes / Math.max(1, goalMinutes)) * 100));
  const overMinutes = Math.max(0, studiedMinutes - goalMinutes);
  const isGoalAchieved = !!dailyGoalData?.today?.is_achieved || studiedMinutes >= goalMinutes;
  const isGoalClaimed = !!dailyGoalData?.today?.claimed_at;

  const handleStartSession = (lessonId) => {
    if (!lessonId) return;
    startMutation.mutate(lessonId);
  };
  const handleStudy = (lessonId) => {
    if (!lessonId) return;
    navigate(`/learning/${lessonId}/study`);
  };
  const handleStartCheckpoint = (unitId) => {
    if (!unitId) return;
    checkpointStartMutation.mutate(unitId);
  };
  const recoverSession = recoverData?.session;
  const getNextLessonId = () => {
    let unlockedUnits = [...mainUnits]
      .filter((unit) => !!unit?.unlocked)
      .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0));
    if (!hasLearningProgress && recommendedStartUnitId) {
      const recommendedIndex = unlockedUnits.findIndex((unit) => unit?.id === recommendedStartUnitId);
      if (recommendedIndex >= 0) {
        unlockedUnits = unlockedUnits.slice(recommendedIndex);
      }
    }
    const fallbackLessonIds = [];

    for (const unit of unlockedUnits) {
      const lessonLinks = [...(unit?.lessons || [])]
        .filter((item) => {
          const lessonId = item?.lesson?.id ?? item?.lesson_id ?? null;
          const isPublished = item?.lesson?.is_published !== false;
          return !!lessonId && isPublished;
        })
        .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0));
      if (!lessonLinks.length) continue;

      for (const link of lessonLinks) {
        const lessonId = link?.lesson?.id ?? link?.lesson_id ?? null;
        if (lessonId) fallbackLessonIds.push(lessonId);
      }
      for (const link of lessonLinks) {
        const lesson = link?.lesson || {};
        const lessonId = lesson?.id ?? link?.lesson_id ?? null;
        const completedAt = lesson?.user_progress?.completed_at;
        const wordsTotal = Number(lesson?.words_total || 0);
        const wordsLearned = Number(lesson?.words_learned || 0);
        const isFullyLearnedByWordCount = wordsTotal > 0 && wordsLearned >= wordsTotal;
        const isCompleted = Boolean(completedAt) || isFullyLearnedByWordCount;
        if (lessonId && !isCompleted) {
          return lessonId;
        }
      }
    }

    // Fallback: if user already completed all unlocked lessons, allow relearn.
    if (fallbackLessonIds.length > 0) {
      return fallbackLessonIds[0];
    }

    return null;
  };

  const handleQuickStudy = async () => {
    if (quickStudyLoading || resumeMutation.isPending || startMutation.isPending) return;
    setQuickStudyError("");
    if (recoverData?.has_recoverable_session && recoverSession?.id) {
      resumeMutation.mutate(recoverSession.id);
      return;
    }

    setQuickStudyLoading(true);
    try {
      const reviewData = await learningApi.getReviewList().then((response) => response.data);
      const dueCount = (reviewData?.words || []).length;
      if (dueCount > 0) {
        navigate("/review");
        return;
      }
      const lessonId = getNextLessonId();
      if (!lessonId) {
        setQuickStudyError("Hiện chưa có bài học phù hợp để bắt đầu.");
        return;
      }
      startMutation.mutate(lessonId);
    } catch (err) {
      setQuickStudyError(err?.response?.data?.detail || "Không thể bắt đầu học nhanh.");
    } finally {
      setQuickStudyLoading(false);
    }
  };

  const dismissUxHint = () => {
    setShowUxHint(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LEARNING_UX_HINT_KEY, "1");
    }
  };

  const handleRefreshRecover = async () => {
    if (recoverRefreshing) return;
    setRecoverRefreshing(true);
    setRecoverRefreshNote("");
    try {
      const [recoverResult] = await Promise.all([
        refetchRecover(),
        refetch(),
        refetchDailyGoal(),
      ]);
      const hasRecoverable = !!recoverResult?.data?.has_recoverable_session;
      setRecoverRefreshNote(
        hasRecoverable
          ? "Đã cập nhật: vẫn còn phiên học dở. Bấm Tiếp tục phiên học để quay lại."
          : "Đã cập nhật: không còn phiên học dở."
      );
    } catch (err) {
      setRecoverRefreshNote("Không thể làm mới trạng thái. Vui lòng thử lại.");
    } finally {
      setRecoverRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    const message = error?.response?.data?.detail || "Không thể tải lộ trình học.";
    return (
      <Stack spacing={2}>
        <Alert severity="error">{message}</Alert>
        <SbButton variant="outlined" onClick={() => refetch()}>
          Thử lại
        </SbButton>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: colors.greenStarbucks }}>
          Lộ trình học
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
          {data?.name || "Khóa học"} · {units.length} unit
        </Typography>
      </Box>

      {!!recoverData?.has_recoverable_session && !!recoverSession && (
        <Alert
          severity="warning"
          action={(
            <Stack direction="row" spacing={1}>
              <SbButton
                size="small"
                variant="outlined"
                loading={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate(recoverSession.id)}
              >
                Tiếp tục phiên học
              </SbButton>
              <SbButton
                size="small"
                variant="text"
                loading={recoverRefreshing}
                onClick={handleRefreshRecover}
              >
                Kiểm tra lại
              </SbButton>
            </Stack>
          )}
        >
          Bạn đang có phiên học chưa xong: {recoverSession.lesson_title} (bước {recoverData.next_step_index || 1}).
        </Alert>
      )}

      {!hasLearningProgress && recommendedStartUnitId && recommendedLevel && (
        <Alert severity="info">
          Placement đề xuất bạn bắt đầu từ {mainUnits.find((unit) => unit.id === recommendedStartUnitId)?.title || "unit phù hợp"} ({recommendedLevel}).
        </Alert>
      )}

      {!!recoverRefreshNote && (
        <Alert severity="info">
          {recoverRefreshNote}
        </Alert>
      )}

      {!!placementStatus && shouldShowOnboarding && (
        <Alert
          severity="info"
          action={
              <SbButton size="small" variant="outlined" onClick={() => navigate("/learning/onboarding")}>
                Tiếp tục onboarding
              </SbButton>
          }
        >
          Bạn chưa hoàn thành placement. Làm placement trước để hệ thống đề xuất độ khó phù hợp.
        </Alert>
      )}

      {!!placementStatus && !placementStatus.has_completed_placement && !shouldShowOnboarding && (
        <Alert
          severity="info"
          action={(
            <SbButton size="small" variant="outlined" onClick={() => navigate("/learning/placement")}>
              Làm placement
            </SbButton>
          )}
        >
          Bạn đang học theo lộ trình cơ bản. Có thể làm placement bất kỳ lúc nào để tối ưu độ khó.
        </Alert>
      )}

      {showUxHint && (
        <Alert
          severity="info"
          action={(
            <SbButton size="small" variant="text" onClick={dismissUxHint}>
              Ẩn
            </SbButton>
          )}
        >
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: "0.86rem", fontWeight: 700 }}>
              Hướng dẫn nhanh
            </Typography>
            <Typography sx={{ fontSize: "0.82rem" }}>
              Tim: sai đáp án sẽ mất tim, tim sẽ tự hồi theo thời gian.
            </Typography>
            <Typography sx={{ fontSize: "0.82rem" }}>
              Streak Freeze: tự dùng 1 freeze để giữ streak khi bạn nghỉ học 1 ngày.
            </Typography>
            <Typography sx={{ fontSize: "0.82rem" }}>
              Checkpoint: hoàn thành checkpoint để xác nhận kiến thức và mở khóa tiến độ chắc chắn hơn.
            </Typography>
          </Stack>
        </Alert>
      )}

      {!!dailyGoalData && (
        <SbCard>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>
              Mục tiêu ngày
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(0,0,0,0.1)",
                "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
              }}
            />
            <Typography sx={{ fontSize: "0.9rem" }}>
              {studiedMinutes}/{goalMinutes} phút
              {overMinutes > 0 ? ` (vượt +${overMinutes})` : ""}
            </Typography>
            {isGoalAchieved && (
              <Typography sx={{ fontSize: "0.82rem", color: colors.greenAccent, fontWeight: 700 }}>
                Đã hoàn thành mục tiêu hôm nay
              </Typography>
            )}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography sx={{ fontSize: "0.9rem" }}>
                Tim: {dailyGoalData.hearts?.current ?? 0}/{dailyGoalData.hearts?.max ?? 10}
              </Typography>
              <Tooltip arrow title="Mỗi câu sai thường trừ 1 tim. Hết tim cần chờ hồi hoặc quay lại sau.">
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography sx={{ fontSize: "0.9rem" }}>
                Streak Freeze: {dailyGoalData.streak?.freeze_count ?? 0}
              </Typography>
              <Tooltip
                arrow
                title="Nếu bạn nghỉ 1 ngày, hệ thống sẽ tự dùng 1 freeze để giữ streak không bị reset."
              >
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
              </Tooltip>
            </Stack>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              Dùng để bảo vệ streak khi lỡ nghỉ học 1 ngày.
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              Phím tắt khi làm bài: nhấn 1-4 để chọn đáp án, Enter để gửi nhanh.
            </Typography>
            <SbButton
              size="small"
              variant="primary"
              data-cy="learning-quick-study"
              loading={quickStudyLoading || resumeMutation.isPending}
              onClick={handleQuickStudy}
            >
              Học tiếp 5 phút
            </SbButton>
            <SbButton
              size="small"
              variant="outlined"
              disabled={!isGoalAchieved || isGoalClaimed}
              loading={claimDailyGoalMutation.isPending}
              onClick={() => claimDailyGoalMutation.mutate()}
            >
              {isGoalClaimed ? "Đã nhận thưởng" : `Nhận +${dailyGoalData.reward_xp ?? 0} XP`}
            </SbButton>
            {isGoalClaimed && (
              <Alert severity="success" sx={{ py: 0 }}>
                Bạn đã nhận thưởng mục tiêu ngày hôm nay.
              </Alert>
            )}
            <SbButton
              size="small"
              variant="outlined"
              loading={claimFreezeMutation.isPending}
              onClick={() => claimFreezeMutation.mutate()}
            >
              Mua Freeze (-50 XP)
            </SbButton>
            {!!claimDailyGoalMutation.error && (
              <Alert severity="error">
                {claimDailyGoalMutation.error?.response?.data?.detail || "Không thể nhận thưởng mục tiêu ngày."}
              </Alert>
            )}
            {!!claimFreezeMutation.error && (
              <Alert severity="error">
                {claimFreezeMutation.error?.response?.data?.detail || "Không thể mua streak freeze."}
              </Alert>
            )}
          </Stack>
        </SbCard>
      )}

      {!!startMutation.error && (
        <Alert severity="error">
          {startMutation.error?.response?.data?.detail || "Không thể bắt đầu phiên học."}
        </Alert>
      )}
      {!!checkpointStartMutation.error && (
        <Alert severity="error">
          {checkpointStartMutation.error?.response?.data?.detail || "Không thể bắt đầu kiểm tra unit."}
        </Alert>
      )}
      {!!resumeMutation.error && (
        <Alert severity="error">
          {resumeMutation.error?.response?.data?.detail || "Không thể tiếp tục phiên học."}
        </Alert>
      )}
      {!!quickStudyError && (
        <Alert severity="error">{quickStudyError}</Alert>
      )}

      {mainUnits.length === 0 && (
        <Alert severity="info">
          Chưa có learning path. Chạy lệnh seed: <strong>python manage.py seed_learning_path</strong>
        </Alert>
      )}

      {mainUnits.map((unit) => (
        <UnitCard
          key={unit.id}
          unit={unit}
          onStart={handleStartSession}
          onStudy={handleStudy}
          onStartCheckpoint={handleStartCheckpoint}
          startingLessonId={startingLessonId}
          startingCheckpointUnitId={startingCheckpointUnitId}
          disabled={startMutation.isPending || checkpointStartMutation.isPending}
        />
      ))}
    </Stack>
  );
};

export default LearningPage;
