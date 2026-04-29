import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Chip, LinearProgress,
  CircularProgress, IconButton, Tooltip, Skeleton, keyframes
} from "@mui/material";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import { SbButton, SbCard, SbBadge } from "@/components/ui";
import { setUser } from "@/features/auth/authSlice";
import { colors } from "@/styles/theme";
import learningApi from "@/api/learningApi";

// ── Part-of-speech badge colors ───────────────────────────────────────────────

const POS_COLORS = {
  noun:         { bg: "#e3f2fd", color: "#1565c0" },
  verb:         { bg: "#e8f5e9", color: "#2e7d32" },
  adjective:    { bg: "#fff3e0", color: "#e65100" },
  adverb:       { bg: "#f3e5f5", color: "#6a1b9a" },
  preposition:  { bg: "#fce4ec", color: "#c62828" },
  conjunction:  { bg: "#e0f7fa", color: "#006064" },
  pronoun:      { bg: "#f1f8e9", color: "#33691e" },
  interjection: { bg: "#fff8e1", color: "#f57f17" },
};

const posStyle = (pos) =>
  POS_COLORS[pos?.toLowerCase()] ?? { bg: colors.greenLight, color: colors.greenHouse };

// ── Speak word ────────────────────────────────────────────────────────────────

const speakWord = (text, setSpeaking) => {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  if (setSpeaking) {
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const pulseAnim = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 117, 74, 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(0, 117, 74, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 117, 74, 0); }
`;

// ── Flip card ─────────────────────────────────────────────────────────────────

const CARD_HEIGHT = { xs: 300, sm: 360 };

const CardFace = ({ sx, children }) => (
  <Box sx={{
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: "16px",
    bgcolor: "#fff",
    boxShadow: "0 2px 12px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    p: "24px 28px",
    overflow: "hidden",
    ...sx,
  }}>
    {children}
  </Box>
);

const FlipCard = ({ flipped, front, back, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      perspective: "1400px",
      height: CARD_HEIGHT,
      cursor: !flipped ? "pointer" : "default",
      userSelect: "none",
    }}
  >
    <Box sx={{
      position: "relative",
      width: "100%",
      height: "100%",
      transformStyle: "preserve-3d",
      transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
    }}>
      <CardFace>
        {front}
      </CardFace>
      <CardFace sx={{ transform: "rotateY(180deg)", justifyContent: "flex-start", pt: { xs: 3, sm: 4 } }}>
        {back}
      </CardFace>
    </Box>
  </Box>
);

// ── Card content: front ───────────────────────────────────────────────────────

const CardFront = ({ word, speaking, setSpeaking }) => {
  const ps = posStyle(word.part_of_speech);
  return (
    <Box sx={{ textAlign: "center", width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.25, mb: 0.75 }}>
        <Typography sx={{
          fontSize: { xs: "2.8rem", sm: "3.4rem" },
          fontWeight: 800,
          color: colors.greenStarbucks,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          {word.text}
        </Typography>
        <Tooltip title="Nghe phát âm" arrow>
          <IconButton
            onClick={(e) => { e.stopPropagation(); speakWord(word.text, setSpeaking); }}
            size="small"
            sx={{
              color: colors.greenAccent,
              bgcolor: `${colors.greenAccent}14`,
              "&:hover": { bgcolor: `${colors.greenAccent}28` },
              animation: speaking ? `${pulseAnim} 1.5s infinite` : "none",
            }}
          >
            <VolumeUpRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {word.phonetic && (
        <Typography sx={{ fontSize: "1.1rem", color: colors.textBlackSoft, fontStyle: "italic", letterSpacing: "0.03em", mb: 1 }}>
          /{word.phonetic}/
        </Typography>
      )}

      {word.part_of_speech && (
        <Chip label={word.part_of_speech} size="small"
          sx={{ bgcolor: ps.bg, color: ps.color, fontWeight: 700, fontSize: "0.72rem", mb: 2 }} />
      )}

      <Box sx={{ mt: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, color: colors.textBlackSoft }}>
        <TouchAppRoundedIcon sx={{ fontSize: 16 }} />
        <Typography sx={{ fontSize: "0.78rem" }}>Nhấn thẻ hoặc nút dưới để xem nghĩa</Typography>
      </Box>
    </Box>
  );
};

// ── Card content: back ────────────────────────────────────────────────────────

const CardBack = ({ word }) => (
  <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: colors.textBlack, lineHeight: 1.3, mb: 0.5 }}>
        {word.definition_vi}
      </Typography>
      {word.definition_en && (
        <Typography sx={{ fontSize: "0.95rem", color: colors.textBlackSoft }}>
          {word.definition_en}
        </Typography>
      )}
    </Box>

    {word.example_en && (
      <Box sx={{
        bgcolor: `${colors.greenAccent}0d`,
        border: `1px solid ${colors.greenAccent}28`,
        borderRadius: "10px",
        p: "12px 16px",
        mt: 1
      }}>
        <Typography sx={{ fontSize: "0.95rem", fontStyle: "italic", color: colors.rewardsGreen, lineHeight: 1.6 }}>
          "{word.example_en}"
        </Typography>
        {word.example_vi && (
          <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft, mt: 0.5 }}>
            → {word.example_vi}
          </Typography>
        )}
      </Box>
    )}
  </Box>
);

// ── Completion screen ─────────────────────────────────────────────────────────

const CompletionScreen = ({ lesson, result, understoodCount, totalCount, onBack }) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <Box sx={{ textAlign: "center", maxWidth: 440, width: "100%", px: 2 }}>
      <EmojiEventsRoundedIcon sx={{ fontSize: 72, color: colors.gold, mb: 1 }} />
      <Typography sx={{ fontWeight: 800, fontSize: "1.8rem", color: colors.greenStarbucks, letterSpacing: "-0.02em", mb: 0.5 }}>
        Xuất sắc! 🎉
      </Typography>
      <Typography sx={{ color: colors.textBlackSoft, mb: 3 }}>
        Bạn đã hoàn thành bài <strong>{lesson?.title}</strong>
      </Typography>

      {/* Stats row */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {result && (
          <>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                <BoltRoundedIcon sx={{ color: colors.greenAccent, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenAccent }}>
                  +{result.xp_earned}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>XP kiếm được</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                <AutoStoriesRoundedIcon sx={{ color: colors.greenStarbucks, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks }}>
                  {result.new_words}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>Từ mới vào SRS</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                <LocalFireDepartmentRoundedIcon sx={{ color: colors.gold, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.gold }}>
                  {result.streak}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>Streak ngày</Typography>
            </Box>
          </>
        )}

        <Box sx={{ textAlign: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
            <CheckRoundedIcon sx={{ color: colors.greenAccent, fontSize: 20 }} />
            <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenAccent }}>
              {understoodCount}/{totalCount}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>Từ đã hiểu</Typography>
        </Box>
      </Box>

      {/* XP total */}
      {result && (
        <Box sx={{ bgcolor: `${colors.greenAccent}0e`, border: `1px solid ${colors.greenAccent}30`, borderRadius: "10px", p: "10px 16px", mb: 3 }}>
          <Typography sx={{ fontSize: "0.875rem", color: colors.greenHouse }}>
            Tổng XP: <strong>{result.total_xp}</strong> · Level: <strong>{result.level}</strong>
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
        <SbButton variant="outlined" onClick={onBack} startIcon={<ArrowBackRoundedIcon />}>
          Về danh sách
        </SbButton>
        <SbButton variant="primary" onClick={() => window.location.reload()}>
          Học lại
        </SbButton>
      </Box>
    </Box>
  </Box>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const StudyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentIdx, setCurrentIdx]   = useState(0);
  const [revealed, setRevealed]       = useState(false);
  const [understood, setUnderstood]   = useState(new Set());
  const [completed, setCompleted]     = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [started, setStarted]         = useState(false);
  const [speaking, setSpeaking]       = useState(false);

  // Fetch lesson detail
  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => learningApi.getLesson(id).then((r) => r.data),
    staleTime: 0,
  });

  const words = lesson?.words ?? [];
  const currentWord = words[currentIdx]?.word;
  const progress = words.length > 0 ? ((currentIdx + 1) / words.length) * 100 : 0;

  // Start lesson once data is loaded
  useEffect(() => {
    if (lesson && !started) {
      setStarted(true);
      learningApi.startLesson(id).catch(() => {});
    }
  }, [lesson, started, id]);

  // Reset reveal on card change
  useEffect(() => {
    setRevealed(false);
  }, [currentIdx]);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    try {
      const { data } = await learningApi.completeLesson(id);
      setCompletionData(data);
      // Update user XP in Redux state
      if (data.total_xp !== undefined) {
        dispatch(setUser({ xp: data.total_xp, level: data.level }));
      }
    } catch {
      // Lesson already completed — still show completion screen
    } finally {
      setIsCompleting(false);
      setCompleted(true);
    }
  }, [id, dispatch]);

  const goNext = useCallback(() => {
    if (currentIdx >= words.length - 1) {
      handleComplete();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, words.length, handleComplete]);

  const handleUnderstood = () => {
    setUnderstood((prev) => new Set([...prev, currentWord?.id]));
    goNext();
  };

  // ── Loading / error states ──

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 640, mx: "auto" }} role="progressbar">
        {/* Header skeleton */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="30%" height={16} sx={{ mb: 0.75 }} />
            <Skeleton width="100%" height={8} sx={{ borderRadius: 4 }} />
          </Box>
          <Skeleton width={40} height={16} />
        </Box>
        {/* Card skeleton */}
        <Skeleton
          variant="rectangular"
          height={320}
          sx={{ borderRadius: "16px" }}
        />
        {/* Button skeleton */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Skeleton width={120} height={44} sx={{ borderRadius: "50px" }} />
          <Skeleton width={160} height={44} sx={{ borderRadius: "50px" }} />
        </Box>
      </Box>
    );
  }

  if (isError || !lesson) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography sx={{ fontWeight: 700, mb: 1, color: colors.red }}>Không tìm thấy bài học</Typography>
        <SbButton variant="outlined" onClick={() => navigate("/learning")}>
          Quay lại
        </SbButton>
      </Box>
    );
  }

  if (words.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <AutoStoriesRoundedIcon sx={{ fontSize: 56, color: colors.greenLight, mb: 1 }} />
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Bài học chưa có từ nào</Typography>
        <SbButton variant="outlined" onClick={() => navigate("/learning")}>Quay lại</SbButton>
      </Box>
    );
  }

  // ── Completion screen ──

  if (completed) {
    return (
      <CompletionScreen
        lesson={lesson}
        result={completionData}
        understoodCount={understood.size}
        totalCount={words.length}
        onBack={() => navigate("/learning")}
      />
    );
  }

  // ── Flashcard study ──

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 640, mx: "auto" }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Tooltip title="Thoát bài học" arrow>
          <IconButton
            onClick={() => navigate("/learning")}
            sx={{ color: colors.textBlackSoft }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: colors.textBlack, noWrap: true }}>
              {lesson.title}
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: colors.textBlackSoft, fontWeight: 600, flexShrink: 0 }}>
              {currentIdx + 1} / {words.length}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6, borderRadius: 3,
              bgcolor: "rgba(0,0,0,0.08)",
              "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent, transition: "transform 0.4s ease" },
            }}
          />
        </Box>
      </Box>

      {/* ── Understood counter ────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <SbBadge type="xp" value={understood.size} label={`${understood.size} đã hiểu`} size="small" />
      </Box>

      {/* ── Word card ────────────────────────────────────────────────── */}
      {currentWord ? (
        <FlipCard
          flipped={revealed}
          onClick={!revealed ? () => setRevealed(true) : undefined}
          front={<CardFront word={currentWord} speaking={speaking} setSpeaking={setSpeaking} />}
          back={<CardBack word={currentWord} />}
        />
      ) : (
        <SbCard sx={{ minHeight: CARD_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ textAlign: "center", color: colors.textBlackSoft }}>
            Không có dữ liệu từ
          </Typography>
        </SbCard>
      )}

      {/* ── Navigation buttons ────────────────────────────────────────── */}
      {!revealed ? (
        <SbButton
          variant="primary"
          size="large"
          fullWidth
          onClick={() => setRevealed(true)}
        >
          Xem nghĩa
        </SbButton>
      ) : (
        <Box sx={{ display: "flex", gap: 1.5 }}>
          {/* Previous */}
          {currentIdx > 0 && (
            <Tooltip title="Xem lại từ trước" arrow>
              <Box>
                <SbButton
                  variant="outlined"
                  size="large"
                  onClick={() => setCurrentIdx((i) => i - 1)}
                  sx={{ minWidth: 0, px: 2 }}
                >
                  <ArrowBackRoundedIcon />
                </SbButton>
              </Box>
            </Tooltip>
          )}

          {/* Tiếp theo */}
          <SbButton
            variant="outlined"
            size="large"
            sx={{ flex: 1 }}
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={goNext}
          >
            {currentIdx === words.length - 1 ? "Hoàn thành" : "Tiếp theo"}
          </SbButton>

          {/* Đã hiểu */}
          <SbButton
            variant="primary"
            size="large"
            sx={{ flex: 1.5 }}
            startIcon={<CheckRoundedIcon />}
            onClick={handleUnderstood}
            loading={isCompleting && currentIdx === words.length - 1}
          >
            {currentIdx === words.length - 1 ? "Đã hiểu & Hoàn thành" : "Đã hiểu ✓"}
          </SbButton>
        </Box>
      )}

      {/* ── Keyboard hint ──────────────────────────────────────────────── */}
      <Typography sx={{ textAlign: "center", fontSize: "0.75rem", color: colors.textBlackSoft }}>
        {!revealed ? "Nhấn vào card hoặc Space để xem nghĩa" : "← → để chuyển bài · Enter = Đã hiểu"}
      </Typography>
    </Box>
  );
};

export default StudyPage;
