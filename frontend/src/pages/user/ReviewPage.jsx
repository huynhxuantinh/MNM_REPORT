import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  Skeleton,
  keyframes,
} from "@mui/material";
import { VolumeUpRounded as VolumeUpRoundedIcon } from "@mui/icons-material";
import { ArrowBackRounded as ArrowBackRoundedIcon } from "@mui/icons-material";
import { CheckRounded as CheckRoundedIcon } from "@mui/icons-material";
import { EmojiEventsRounded as EmojiEventsRoundedIcon } from "@mui/icons-material";
import { BoltRounded as BoltRoundedIcon } from "@mui/icons-material";
import { LocalFireDepartmentRounded as LocalFireDepartmentRoundedIcon } from "@mui/icons-material";
import { RepeatRounded as RepeatRoundedIcon } from "@mui/icons-material";
import { LibraryBooksRounded as LibraryBooksRoundedIcon } from "@mui/icons-material";
import { TouchAppRounded as TouchAppRoundedIcon } from "@mui/icons-material";
import { SbButton } from "@/components/ui";
import { setUser } from "@/features/auth/authSlice";
import { colors } from "@/styles/theme";
import learningApi from "@/services/learningApi";

const POS_COLORS = {
  noun: { bg: "#e3f2fd", color: "#1565c0" },
  verb: { bg: "#e8f5e9", color: "#2e7d32" },
  adjective: { bg: "#fff3e0", color: "#e65100" },
  adverb: { bg: "#f3e5f5", color: "#6a1b9a" },
  preposition: { bg: "#fce4ec", color: "#c62828" },
  conjunction: { bg: "#e0f7fa", color: "#006064" },
  pronoun: { bg: "#f1f8e9", color: "#33691e" },
  interjection: { bg: "#fff8e1", color: "#f57f17" },
};

const posStyle = (partOfSpeech) => POS_COLORS[partOfSpeech?.toLowerCase()] ?? { bg: colors.greenLight, color: colors.greenHouse };

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

const QUALITY_OPTIONS = [
  { q: 0, label: "Quên", sub: "Không nhớ gì", bg: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
  { q: 1, label: "Rất khó", sub: "Sai, nhớ khi thấy đáp án", bg: "#fbe9e7", color: "#bf360c", border: "#ffab91" },
  { q: 2, label: "Khó", sub: "Sai, mất nhiều công sức", bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
  { q: 3, label: "Ổn", sub: "Đúng, nhưng còn chậm", bg: "#fffde7", color: "#f57f17", border: "#ffe082" },
  { q: 4, label: "Tốt", sub: "Đúng sau chút do dự", bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  { q: 5, label: "Dễ", sub: "Nhớ ngay, hoàn hảo", bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
];

const CARD_HEIGHT = { xs: 300, sm: 340 };

const CardFace = ({ sx, children }) => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      borderRadius: "16px",
      bgcolor: "background.paper",
      boxShadow: "0 2px 12px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      p: "24px 28px",
      overflow: "hidden",
      ...sx,
    }}
  >
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
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}
    >
      <CardFace>{front}</CardFace>
      <CardFace sx={{ transform: "rotateY(180deg)", justifyContent: "flex-start", pt: 3 }}>{back}</CardFace>
    </Box>
  </Box>
);

const CardFront = ({ word, speaking, setSpeaking }) => {
  const partOfSpeechStyle = posStyle(word.part_of_speech);

  return (
    <Box sx={{ textAlign: "center", width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.25, mb: 0.75 }}>
        <Typography
          sx={{
            fontSize: { xs: "2.8rem", sm: "3.4rem" },
            fontWeight: 800,
            color: colors.greenStarbucks,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {word.text}
        </Typography>
        <Tooltip title="Nghe phát âm" arrow>
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              speakWord(word.text, setSpeaking);
            }}
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
        <Typography sx={{ fontSize: "1.1rem", color: "text.secondary", fontStyle: "italic", letterSpacing: "0.03em", mb: 1 }}>
          /{word.phonetic}/
        </Typography>
      )}

      {word.part_of_speech && (
        <Chip
          label={word.part_of_speech}
          size="small"
          sx={{ bgcolor: partOfSpeechStyle.bg, color: partOfSpeechStyle.color, fontWeight: 700, fontSize: "0.72rem" }}
        />
      )}

      <Box sx={{ mt: 2.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, color: "text.secondary" }}>
        <TouchAppRoundedIcon sx={{ fontSize: 16 }} />
        <Typography sx={{ fontSize: "0.78rem" }}>Nhấn để xem nghĩa</Typography>
      </Box>
    </Box>
  );
};

const CardBack = ({ word, log }) => (
  <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: "text.primary", lineHeight: 1.3, mb: 0.25 }}>
        {word.definition_vi}
      </Typography>
      {word.definition_en && (
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>{word.definition_en}</Typography>
      )}
    </Box>

    {word.example_en && (
      <Box sx={{ bgcolor: `${colors.greenAccent}0d`, border: `1px solid ${colors.greenAccent}28`, borderRadius: "10px", p: "10px 14px" }}>
        <Typography sx={{ fontSize: "0.875rem", fontStyle: "italic", color: colors.rewardsGreen, lineHeight: 1.6 }}>
          "{word.example_en}"
        </Typography>
        {word.example_vi && (
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mt: 0.4 }}>
            → {word.example_vi}
          </Typography>
        )}
      </Box>
    )}

    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}>
      {log.repetitions === 0
        ? "Lần đầu ôn tập"
        : `Ôn lần ${log.repetitions + 1} · khoảng cách hiện tại ${log.interval_days} ngày`}
    </Typography>
  </Box>
);

const CompletionScreen = ({ stats, onBack, onRestart }) => {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "65vh" }}>
      <Box sx={{ textAlign: "center", maxWidth: 460, width: "100%", px: 2 }}>
        <EmojiEventsRoundedIcon sx={{ fontSize: 76, color: colors.gold, mb: 1 }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1.85rem", color: colors.greenStarbucks, letterSpacing: "-0.02em", mb: 0.5 }}>
          Phiên ôn hoàn thành!
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 3 }}>
          Bạn đã ôn xong <strong>{stats.total}</strong> từ hôm nay
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 3, flexWrap: "wrap" }}>
          {[
            { Icon: CheckRoundedIcon, color: colors.greenAccent, value: `${accuracy}%`, label: "Độ chính xác" },
            { Icon: BoltRoundedIcon, color: colors.greenAccent, value: `+${stats.xpEarned}`, label: "XP kiếm được" },
            { Icon: LocalFireDepartmentRoundedIcon, color: colors.gold, value: stats.streak, label: "Streak ngày" },
          ].map(({ Icon, color, value, label }) => (
            <Box key={label} sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                <Icon sx={{ color, fontSize: 22 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", color }}>{value}</Typography>
              </Box>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ bgcolor: `${colors.greenAccent}0d`, border: `1px solid ${colors.greenAccent}28`, borderRadius: "12px", p: "14px 18px", mb: 3, textAlign: "left" }}>
          {[
            { label: "Nhớ tốt (Ổn → Dễ, chất lượng ≥ 3)", value: stats.correct, color: colors.greenAccent },
            { label: "Cần ôn thêm (Quên → Khó, chất lượng < 3)", value: stats.total - stats.correct, color: colors.red },
          ].map(({ label, value, color }) => (
            <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontSize: "0.8375rem", color: "text.secondary" }}>{label}</Typography>
              <Typography sx={{ fontSize: "0.8375rem", fontWeight: 700, color }}>{value} từ</Typography>
            </Box>
          ))}
          {stats.totalXP && (
            <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <Typography sx={{ fontSize: "0.84rem", color: colors.greenHouse }}>
                Tổng XP: <strong>{stats.totalXP}</strong> · Level: <strong>{stats.level}</strong>
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
          <SbButton variant="outlined" onClick={onBack} startIcon={<ArrowBackRoundedIcon />}>
            Về trang chủ
          </SbButton>
          <SbButton variant="primary" onClick={onRestart} startIcon={<RepeatRoundedIcon />}>
            Ôn lại
          </SbButton>
        </Box>
      </Box>
    </Box>
  );
};

const ReviewPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0, xpEarned: 0, streak: 0, totalXP: null, level: null });

  const flippedRef = useRef(flipped);
  const submittingRef = useRef(submitting);
  const handleQualityRef = useRef(null);
  flippedRef.current = flipped;
  submittingRef.current = submitting;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["review-list"],
    queryFn: () => learningApi.getReviewList().then((response) => response.data),
    staleTime: 0,
  });

  const items = data?.words ?? [];
  const current = items[currentIdx];
  const progress = items.length > 0 ? (currentIdx / items.length) * 100 : 0;

  useEffect(() => {
    setFlipped(false);
    setSpeaking(false);
  }, [currentIdx]);

  const advance = useCallback(() => {
    if (currentIdx >= items.length - 1) {
      setDone(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, items.length]);

  useEffect(() => {
    if (!done) return;
    queryClient.invalidateQueries({ queryKey: ["review-list"] });
    queryClient.invalidateQueries({ queryKey: ["review-summary"] });
    queryClient.invalidateQueries({ queryKey: ["review-history"] });
    queryClient.invalidateQueries({ queryKey: ["home-daily-goal"] });
    queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
  }, [done, queryClient]);

  const handleQuality = useCallback(async (quality) => {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      const { data: response } = await learningApi.submitAnswer(current.word.id, quality);
      setStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (quality >= 3 ? 1 : 0),
        xpEarned: prev.xpEarned + (response.xp_earned ?? 0),
        streak: response.streak ?? prev.streak,
        totalXP: response.total_xp ?? prev.totalXP,
        level: response.level ?? prev.level,
      }));
      if (response.total_xp !== undefined) {
        dispatch(setUser({ xp: response.total_xp, level: response.level }));
      }
    } catch {
      // Tiếp tục flow ngay cả khi lỗi mạng tạm thời.
    } finally {
      setSubmitting(false);
      advance();
    }
  }, [current, submitting, advance, dispatch]);

  handleQualityRef.current = handleQuality;

  useEffect(() => {
    const handler = (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (!flippedRef.current) setFlipped(true);
      }
      if (flippedRef.current && !submittingRef.current) {
        const digit = parseInt(event.key, 10);
        if (digit >= 0 && digit <= 5) {
          event.preventDefault();
          handleQualityRef.current(digit);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleRestart = () => {
    setCurrentIdx(0);
    setFlipped(false);
    setDone(false);
    setStats({ total: 0, correct: 0, xpEarned: 0, streak: 0, totalXP: null, level: null });
    refetch();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 640, mx: "auto" }} role="progressbar">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="30%" height={16} sx={{ mb: 0.75 }} />
            <Skeleton width="100%" height={8} sx={{ borderRadius: 4 }} />
          </Box>
          <Skeleton width={50} height={16} />
        </Box>
        <Skeleton variant="rectangular" height={{ xs: 300, sm: 340 }} sx={{ borderRadius: "16px" }} />
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Skeleton width={180} height={44} sx={{ borderRadius: "50px" }} />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography sx={{ fontWeight: 700, mb: 1, color: colors.red }}>Không tải được dữ liệu ôn tập</Typography>
        <SbButton variant="outlined" onClick={() => navigate("/")}>Về trang chủ</SbButton>
      </Box>
    );
  }

  if (!items.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "65vh" }}>
        <Box sx={{ textAlign: "center", maxWidth: 380, px: 2 }}>
          <CheckRoundedIcon sx={{ fontSize: 68, color: colors.greenAccent, mb: 1 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks, mb: 1 }}>
            Tất cả đã ôn xong!
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 3, fontSize: "0.9375rem" }}>
            Không có từ nào đến hạn hôm nay. Quay lại vào ngày mai hoặc học bài mới.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
            <SbButton variant="outlined" onClick={() => navigate("/")}>Trang chủ</SbButton>
            <SbButton variant="primary" startIcon={<LibraryBooksRoundedIcon />} onClick={() => navigate("/learning")}>
              Học bài mới
            </SbButton>
          </Box>
        </Box>
      </Box>
    );
  }

  if (done) {
    return <CompletionScreen stats={stats} onBack={() => navigate("/")} onRestart={handleRestart} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 640, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Tooltip title="Thoát ôn tập" arrow>
          <IconButton onClick={() => navigate("/")} sx={{ color: "text.secondary" }}>
            <ArrowBackRoundedIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "text.primary" }}>Ôn tập SRS</Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", fontWeight: 600 }}>Từ {currentIdx + 1}/{items.length}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 7,
              borderRadius: 4,
              bgcolor: "rgba(0,0,0,0.08)",
              "& .MuiLinearProgress-bar": {
                bgcolor: colors.greenAccent,
                transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CheckRoundedIcon sx={{ fontSize: 15, color: colors.greenAccent }} />
          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: colors.greenAccent }}>{stats.correct} đúng</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <BoltRoundedIcon sx={{ fontSize: 15, color: colors.gold }} />
          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: colors.gold }}>+{stats.xpEarned} XP</Typography>
        </Box>
      </Box>

      {current && (
        <FlipCard
          flipped={flipped}
          onClick={() => !flipped && setFlipped(true)}
          front={<CardFront word={current.word} speaking={speaking} setSpeaking={setSpeaking} />}
          back={<CardBack word={current.word} log={current} />}
        />
      )}

      {!flipped ? (
        <SbButton variant="primary" size="large" fullWidth onClick={() => setFlipped(true)}>
          Lật thẻ · Xem nghĩa
        </SbButton>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography sx={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Bạn nhớ từ này ở mức nào?
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.875 }}>
            {QUALITY_OPTIONS.map(({ q, label, sub, bg, color, border }) => (
              <Box
                key={q}
                onClick={() => !submitting && handleQuality(q)}
                sx={{
                  p: { xs: "8px 6px", sm: "10px 10px" },
                  borderRadius: "12px",
                  border: `2px solid ${border}`,
                  bgcolor: bg,
                  cursor: submitting ? "wait" : "pointer",
                  opacity: submitting ? 0.65 : 1,
                  transition: "transform 0.12s, box-shadow 0.15s",
                  "&:hover": submitting ? {} : { transform: "translateY(-2px)", boxShadow: `0 4px 14px ${border}99` },
                  "&:active": submitting ? {} : { transform: "scale(0.96)" },
                  textAlign: "center",
                  userSelect: "none",
                }}
              >
                <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", bgcolor: color, color: "#fff", fontSize: "0.72rem", fontWeight: 800, mb: 0.5 }}>
                  {q}
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: "0.8rem", sm: "0.9rem" }, color, lineHeight: 1.2 }}>{label}</Typography>
                <Typography sx={{ fontSize: "0.68rem", color, opacity: 0.7, mt: 0.25, display: { xs: "none", sm: "block" } }}>{sub}</Typography>
              </Box>
            ))}
          </Box>

          {submitting && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress size={18} sx={{ color: colors.greenAccent }} />
            </Box>
          )}
        </Box>
      )}

      <Typography sx={{ textAlign: "center", fontSize: "0.75rem", color: "text.secondary" }}>
        {!flipped ? "Space / Enter hoặc nhấn vào thẻ để lật" : "Nhấn phím 0-5 hoặc click để chấm điểm"}
      </Typography>
    </Box>
  );
};

export default ReviewPage;
