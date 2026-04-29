import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Card, CardActionArea, Chip, Skeleton,
  Alert, LinearProgress, Button, Collapse, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, TablePagination,
} from "@mui/material";
import QuizRoundedIcon          from "@mui/icons-material/QuizRounded";
import MenuBookRoundedIcon       from "@mui/icons-material/MenuBookRounded";
import CheckCircleRoundedIcon    from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon         from "@mui/icons-material/CancelRounded";
import EmojiEventsRoundedIcon    from "@mui/icons-material/EmojiEventsRounded";
import ArrowForwardRoundedIcon   from "@mui/icons-material/ArrowForwardRounded";
import RestartAltRoundedIcon     from "@mui/icons-material/RestartAltRounded";
import HistoryRoundedIcon        from "@mui/icons-material/HistoryRounded";
import { SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/api/learningApi";
import quizApi from "@/api/quizApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_COLOR = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" },
  A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" },
  B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" },
  C2: { bg: "#fafafa", color: "#37474f" },
  TOEIC: { bg: "#e0f7fa", color: "#006064" },
};

const scoreLabel = (pct) => {
  if (pct >= 90) return { text: "Xuất sắc! 🏆", color: colors.greenAccent };
  if (pct >= 70) return { text: "Tốt lắm! 👏",  color: "#2196f3" };
  if (pct >= 50) return { text: "Ổn! Cố thêm nhé 💪", color: "#ff9800" };
  return { text: "Cần ôn thêm 📚", color: colors.red };
};

// ── Phase 1: Chọn bài học ─────────────────────────────────────────────────────

const SelectPhase = ({ onSelect }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["quiz-lessons"],
    queryFn: () => learningApi.getLessons({ page_size: 50 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const lessons = data?.results ?? [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: colors.greenStarbucks }}>
          Kiểm tra từ vựng
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: colors.textBlackSoft, mt: 0.5 }}>
          Chọn bài học để bắt đầu bài kiểm tra trắc nghiệm
        </Typography>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách bài học. Vui lòng thử lại.
        </Alert>
      )}

      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={130} sx={{ borderRadius: "14px" }} />
              </Grid>
            ))
          : lessons.length === 0
            ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <MenuBookRoundedIcon sx={{ fontSize: 56, color: colors.greenAccent, opacity: 0.3, mb: 1 }} />
                  <Typography sx={{ color: colors.textBlackSoft }}>
                    Chưa có bài học nào.
                  </Typography>
                </Box>
              </Grid>
            )
            : lessons.map((lesson) => {
                const lc = LEVEL_COLOR[lesson.level] ?? {};
                const wordCount = lesson.word_count ?? 0;
                const canStart = wordCount >= 4;
                return (
                  <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                    <Card
                      sx={{
                        borderRadius: "14px",
                        border: "1px solid rgba(0,0,0,0.07)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        opacity: canStart ? 1 : 0.55,
                        transition: "transform 0.15s, box-shadow 0.15s",
                        "&:hover": canStart
                          ? { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" }
                          : {},
                      }}
                    >
                      <CardActionArea
                        disabled={!canStart}
                        onClick={() => onSelect(lesson)}
                        sx={{ p: 2.5, minHeight: 120 }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                          {lesson.level && (
                            <Chip
                              label={lesson.level}
                              size="small"
                              sx={{ bgcolor: lc.bg, color: lc.color, fontWeight: 700, fontSize: "0.72rem", height: 22 }}
                            />
                          )}
                          <Typography sx={{ fontSize: "0.78rem", color: colors.textBlackSoft }}>
                            {wordCount} từ
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: colors.textBlack, mb: 0.5 }} noWrap>
                          {lesson.title}
                        </Typography>
                        {!canStart && (
                          <Typography sx={{ fontSize: "0.76rem", color: colors.red }}>
                            Cần ít nhất 4 từ
                          </Typography>
                        )}
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
      </Grid>
    </Box>
  );
};

// ── Phase 2: Làm bài quiz ─────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];

const QuizPhase = ({ lesson, onFinish }) => {
  const [answers, setAnswers] = useState({}); // { [questionIndex]: selectedOptionIndex }
  const [revealed, setRevealed] = useState({}); // { [questionIndex]: true }
  const [current, setCurrent] = useState(0);
  const [quizId, setQuizId] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quiz-generate", lesson.id],
    queryFn: () => quizApi.generate(lesson.id).then((r) => {
      setQuizId(r.data.quiz_id);
      return r.data;
    }),
    staleTime: 0,
    gcTime: 0,
  });

  const submitMutation = useMutation({
    mutationFn: quizApi.submit,
  });

  const questions = data?.questions ?? [];
  const total = questions.length;

  const handleSelect = (optionIdx) => {
    if (revealed[current]) return;
    setAnswers((prev) => ({ ...prev, [current]: optionIdx }));
    setRevealed((prev) => ({ ...prev, [current]: true }));
  };

  const handleNext = () => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      // Tính điểm và kết thúc
      let correct = 0;
      questions.forEach((q, i) => {
        if (answers[i] === q.correct_index) correct++;
      });
      const score = Math.round((correct / total) * 100);
      submitMutation.mutate({ quiz_id: quizId, score, total_questions: total, correct_answers: correct });
      onFinish({ questions, answers, correct, total, score, lessonTitle: data.lesson_title });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <LinearProgress sx={{ mb: 3, borderRadius: 4, "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent } }} />
        <Typography sx={{ color: colors.textBlackSoft }}>Đang tạo câu hỏi...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ borderRadius: "10px" }}>
        Không thể tạo câu hỏi. Bài học có thể chưa đủ từ vựng.
      </Alert>
    );
  }

  const q = questions[current];
  const selectedIdx = answers[current];
  const isRevealed = revealed[current];
  const isLast = current === total - 1;

  return (
    <Box sx={{ maxWidth: 680, mx: "auto" }}>
      {/* Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
          <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
            Câu {current + 1} / {total}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: colors.greenStarbucks }}>
            {lesson.title}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={((current + 1) / total) * 100}
          sx={{
            height: 6, borderRadius: 3,
            bgcolor: "rgba(0,0,0,0.08)",
            "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
          }}
        />
      </Box>

      {/* Câu hỏi */}
      <Box
        sx={{
          bgcolor: "#fff",
          borderRadius: "16px",
          p: { xs: 2.5, sm: 4 },
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          mb: 2.5,
        }}
      >
        <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft, mb: 1 }}>
          Nghĩa của từ này là gì?
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "2rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>
          {q.word_text}
        </Typography>
        {q.phonetic && (
          <Typography sx={{ fontSize: "0.9rem", color: colors.textBlackSoft, mt: 0.5, mb: 2.5 }}>
            {q.phonetic}
          </Typography>
        )}

        {/* Các đáp án */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct_index;
            const isSelected = idx === selectedIdx;

            let bgColor = "#fafafa";
            let borderColor = "rgba(0,0,0,0.10)";
            let textColor = colors.textBlack;

            if (isRevealed) {
              if (isCorrect) {
                bgColor = `${colors.greenAccent}14`;
                borderColor = colors.greenAccent;
                textColor = colors.greenStarbucks;
              } else if (isSelected && !isCorrect) {
                bgColor = `${colors.red}0d`;
                borderColor = colors.red;
                textColor = colors.red;
              }
            }

            return (
              <Box
                key={idx}
                onClick={() => handleSelect(idx)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  p: 1.75,
                  borderRadius: "12px",
                  border: `1.5px solid ${borderColor}`,
                  bgcolor: bgColor,
                  cursor: isRevealed ? "default" : "pointer",
                  transition: "all 0.15s",
                  "&:hover": !isRevealed
                    ? { borderColor: colors.greenAccent, bgcolor: `${colors.greenAccent}08` }
                    : {},
                }}
              >
                <Box
                  sx={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "0.8rem", flexShrink: 0,
                    bgcolor: isRevealed && isCorrect
                      ? colors.greenAccent
                      : isRevealed && isSelected && !isCorrect
                        ? colors.red
                        : "rgba(0,0,0,0.08)",
                    color: isRevealed && (isCorrect || (isSelected && !isCorrect)) ? "#fff" : colors.textBlackSoft,
                  }}
                >
                  {OPTION_LABELS[idx]}
                </Box>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: isRevealed && isCorrect ? 700 : 400, color: textColor, flex: 1 }}>
                  {opt}
                </Typography>
                {isRevealed && isCorrect && (
                  <CheckCircleRoundedIcon sx={{ fontSize: 20, color: colors.greenAccent, flexShrink: 0 }} />
                )}
                {isRevealed && isSelected && !isCorrect && (
                  <CancelRoundedIcon sx={{ fontSize: 20, color: colors.red, flexShrink: 0 }} />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Nút tiếp theo */}
      <Collapse in={isRevealed}>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <SbButton
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForwardRoundedIcon />}
          >
            {isLast ? "Xem kết quả" : "Câu tiếp"}
          </SbButton>
        </Box>
      </Collapse>
    </Box>
  );
};

// ── Phase 3: Kết quả ──────────────────────────────────────────────────────────

const ResultPhase = ({ result, onRetry, onBack }) => {
  const { questions, answers, correct, total, score, lessonTitle } = result;
  const label = scoreLabel(score);

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      {/* Score card */}
      <Box
        sx={{
          bgcolor: "#fff",
          borderRadius: "20px",
          p: { xs: 3, sm: 4 },
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          textAlign: "center",
          mb: 3,
        }}
      >
        <EmojiEventsRoundedIcon sx={{ fontSize: 52, color: colors.gold, mb: 1 }} />
        <Typography sx={{ fontWeight: 800, fontSize: "3rem", color: colors.greenStarbucks, lineHeight: 1 }}>
          {correct}/{total}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: label.color, mt: 0.5 }}>
          {label.text}
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft, mt: 0.5 }}>
          {lessonTitle} — {score}%
        </Typography>

        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            mt: 2.5, height: 10, borderRadius: 5,
            bgcolor: "rgba(0,0,0,0.08)",
            "& .MuiLinearProgress-bar": {
              bgcolor: score >= 70 ? colors.greenAccent : score >= 50 ? "#ff9800" : colors.red,
            },
          }}
        />
      </Box>

      {/* Chi tiết từng câu */}
      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: colors.greenStarbucks, mb: 1.5 }}>
        Chi tiết
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
        {questions.map((q, i) => {
          const isCorrect = answers[i] === q.correct_index;
          return (
            <Box
              key={i}
              sx={{
                display: "flex", alignItems: "flex-start", gap: 1.5,
                p: 1.75, borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.07)",
                bgcolor: isCorrect ? `${colors.greenAccent}08` : `${colors.red}06`,
              }}
            >
              {isCorrect
                ? <CheckCircleRoundedIcon sx={{ color: colors.greenAccent, fontSize: 20, mt: 0.1, flexShrink: 0 }} />
                : <CancelRoundedIcon sx={{ color: colors.red, fontSize: 20, mt: 0.1, flexShrink: 0 }} />}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  {q.word_text}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
                  {q.options[q.correct_index]}
                </Typography>
                {!isCorrect && answers[i] !== undefined && (
                  <Typography sx={{ fontSize: "0.78rem", color: colors.red }}>
                    Bạn chọn: {q.options[answers[i]]}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <SbButton
          variant="outlined"
          startIcon={<RestartAltRoundedIcon />}
          onClick={onRetry}
        >
          Làm lại
        </SbButton>
        <SbButton variant="contained" onClick={onBack}>
          Chọn bài khác
        </SbButton>
      </Box>
    </Box>
  );
};

// ── Main QuizPage ─────────────────────────────────────────────────────────────

const QuizPage = () => {
  const [phase, setPhase] = useState("select"); // "select" | "quiz" | "result"
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setPhase("quiz");
  };

  const handleFinish = (result) => {
    setQuizResult(result);
    setPhase("result");
  };

  const handleRetry = () => {
    setPhase("quiz");
  };

  const handleBack = () => {
    setSelectedLesson(null);
    setQuizResult(null);
    setPhase("select");
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 0, sm: 1 } }}>
      {/* Icon header */}
      {phase === "select" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <QuizRoundedIcon sx={{ color: colors.greenAccent, fontSize: 22 }} />
        </Box>
      )}

      {phase === "select" && (
        <SelectPhase onSelect={handleSelectLesson} />
      )}

      {phase === "quiz" && selectedLesson && (
        <QuizPhase
          key={selectedLesson.id}
          lesson={selectedLesson}
          onFinish={handleFinish}
        />
      )}

      {phase === "result" && quizResult && (
        <ResultPhase
          result={quizResult}
          onRetry={handleRetry}
          onBack={handleBack}
        />
      )}
    </Box>
  );
};

export default QuizPage;
