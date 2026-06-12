import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  Button,
} from "@mui/material";
import { QuizRounded as QuizRoundedIcon } from "@mui/icons-material";
import { MenuBookRounded as MenuBookRoundedIcon } from "@mui/icons-material";
import { LibraryBooksRounded as LibraryBooksRoundedIcon } from "@mui/icons-material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { CancelRounded as CancelRoundedIcon } from "@mui/icons-material";
import { EmojiEventsRounded as EmojiEventsRoundedIcon } from "@mui/icons-material";
import { ArrowForwardRounded as ArrowForwardRoundedIcon } from "@mui/icons-material";
import { RestartAltRounded as RestartAltRoundedIcon } from "@mui/icons-material";
import { SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/services/learningApi";
import vocabularyApi from "@/services/vocabularyApi";
import quizApi from "@/services/quizApi";

const LEVEL_COLOR = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" },
  A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" },
  B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" },
  C2: { bg: "#fafafa", color: "#37474f" },
};

const OPTION_LABELS = ["A", "B", "C", "D"];

const scoreLabel = (percent) => {
  if (percent >= 90) return { text: "Xuất sắc", color: colors.greenAccent };
  if (percent >= 70) return { text: "Tốt lắm", color: "#2196f3" };
  if (percent >= 50) return { text: "Ổn, cố thêm", color: "#ff9800" };
  return { text: "Cần ôn thêm", color: colors.red };
};

const shuffle = (array) => {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
  }
  return result;
};

const SelectPhase = ({ onStartQuiz, prefillSource }) => {
  const [tabIndex, setTabIndex] = useState(prefillSource?.sourceType === "wordset" ? 1 : 0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [prefillConsumed, setPrefillConsumed] = useState(false);

  const { data: lessonData, isLoading: isLessonLoading } = useQuery({
    queryKey: ["quiz-lessons"],
    queryFn: () => learningApi.getLessons({ page_size: 50 }).then((response) => response.data),
    staleTime: 60_000,
  });

  const { data: wordsetData, isLoading: isWordsetLoading } = useQuery({
    queryKey: ["quiz-wordsets"],
    queryFn: () => vocabularyApi.getSets({ page_size: 50 }).then((response) => response.data),
    staleTime: 60_000,
  });

  const list = tabIndex === 0 ? (lessonData?.results || []) : (wordsetData?.results || []);
  const isLoading = tabIndex === 0 ? isLessonLoading : isWordsetLoading;
  const sourceType = tabIndex === 0 ? "lesson" : "wordset";

  useEffect(() => {
    if (!prefillSource || prefillConsumed) return;
    const expectedTab = prefillSource.sourceType === "wordset" ? 1 : 0;
    if (tabIndex !== expectedTab) {
      setTabIndex(expectedTab);
      return;
    }
    if (isLoading) return;

    const found = list.find((item) => item.id === prefillSource.sourceId);
    if (found) {
      setSelectedItem(found);
    }
    setPrefillConsumed(true);
  }, [prefillSource, prefillConsumed, tabIndex, isLoading, list]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: colors.greenStarbucks }}>
          Kiểm tra từ vựng
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", mt: 0.5 }}>
          Chọn một bài học hoặc bộ từ để kiểm tra khả năng nhớ nghĩa và phản xạ của bạn.
        </Typography>
      </Box>

      {prefillSource && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
          Đã chọn sẵn {prefillSource.sourceType === "wordset" ? "bộ từ" : "bài học"}
          {prefillSource.sourceName ? `: ${prefillSource.sourceName}` : ""}. Bạn chỉ cần chọn chế độ quiz.
        </Alert>
      )}

      <Tabs value={tabIndex} onChange={(_, nextValue) => setTabIndex(nextValue)} sx={{ mb: 3 }}>
        <Tab label="Bài học" icon={<MenuBookRoundedIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Bộ từ" icon={<LibraryBooksRoundedIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton variant="rounded" height={130} sx={{ borderRadius: "14px" }} />
              </Grid>
            ))
          : list.length === 0
            ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <MenuBookRoundedIcon sx={{ fontSize: 56, color: colors.greenAccent, opacity: 0.3, mb: 1 }} />
                  <Typography sx={{ color: "text.secondary" }}>
                    Chưa có {tabIndex === 0 ? "bài học" : "bộ từ"} nào đủ điều kiện.
                  </Typography>
                </Box>
              </Grid>
            )
            : list.map((item) => {
                const levelColor = LEVEL_COLOR[item.level] ?? {};
                const wordCount = item.word_count ?? 0;
                const canStart = wordCount >= 4;
                const title = tabIndex === 0 ? item.title : item.name;

                return (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card
                      sx={{
                        borderRadius: "14px",
                        border: "1px solid rgba(0,0,0,0.07)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        opacity: canStart ? 1 : 0.55,
                        transition: "transform 0.15s, box-shadow 0.15s",
                        "&:hover": canStart ? { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" } : {},
                      }}
                    >
                      <CardActionArea disabled={!canStart} onClick={() => setSelectedItem(item)} sx={{ p: 2.5, minHeight: 120 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                          {item.level && (
                            <Chip
                              label={item.level}
                              size="small"
                              sx={{ bgcolor: levelColor.bg, color: levelColor.color, fontWeight: 700, fontSize: "0.72rem", height: 22 }}
                            />
                          )}
                          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{wordCount} từ</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary", mb: 0.5 }} noWrap>
                          {title}
                        </Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: canStart ? "text.secondary" : colors.red }}>
                          {canStart ? "Bấm để chọn chế độ quiz" : "Cần ít nhất 4 từ để tạo quiz"}
                        </Typography>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
      </Grid>

      <Dialog open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, textAlign: "center" }}>Chọn chế độ kiểm tra</DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ textAlign: "center", color: "text.secondary", mb: 1 }}>
            {tabIndex === 0 ? selectedItem?.title : selectedItem?.name}
          </Typography>

          <CardActionArea
            onClick={() => {
              onStartQuiz(selectedItem, sourceType, "mc");
              setSelectedItem(null);
            }}
            sx={{ p: 2, borderRadius: "12px", border: `2px solid ${colors.greenAccent}`, textAlign: "center", bgcolor: `${colors.greenAccent}08` }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: colors.greenStarbucks }}>Trắc nghiệm</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Chọn đáp án đúng từ 4 lựa chọn.</Typography>
          </CardActionArea>

          <CardActionArea
            onClick={() => {
              onStartQuiz(selectedItem, sourceType, "match");
              setSelectedItem(null);
            }}
            sx={{ p: 2, borderRadius: "12px", border: "2px solid #2196f3", textAlign: "center", bgcolor: "#2196f308" }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#1565c0" }}>Nối từ</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Ghép từ tiếng Anh với nghĩa tiếng Việt.</Typography>
          </CardActionArea>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "center" }}>
          <Button onClick={() => setSelectedItem(null)} color="inherit" sx={{ borderRadius: "10px" }}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const MultipleChoicePhase = ({ sourceId, sourceType, quizId: fixedQuizId, activityId, activityTitle, onFinish }) => {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [current, setCurrent] = useState(0);
  const [quizId, setQuizId] = useState(null);

  const params = fixedQuizId
    ? { quiz_id: fixedQuizId, type: "mc" }
    : sourceType === "lesson"
      ? { lesson_id: sourceId, type: "mc" }
      : { wordset_id: sourceId, type: "mc" };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quiz-generate-mc", params],
    queryFn: () =>
      quizApi.generate(params).then((response) => {
        setQuizId(response.data.quiz_id);
        return response.data;
      }),
    staleTime: 0,
    gcTime: 0,
  });

  const submitMutation = useMutation({
    mutationFn: quizApi.submit,
    onSuccess: () => {
      if (activityId) {
        qc.invalidateQueries({ queryKey: ["learning-path-v2"] });
        qc.invalidateQueries({ queryKey: ["home-learning-path"] });
      }
    },
  });

  const questions = data?.questions ?? [];
  const total = questions.length;
  const currentQuestion = questions[current];
  const selectedIndex = answers[current];
  const isRevealed = Boolean(revealed[current]);
  const isLast = current === total - 1;

  const handleSelect = (optionIndex) => {
    if (revealed[current]) return;
    setAnswers((prev) => ({ ...prev, [current]: optionIndex }));
    setRevealed((prev) => ({ ...prev, [current]: true }));
  };

  const handleNext = () => {
    if (submitMutation.isPending) return;
    if (current < total - 1) {
      setCurrent((prev) => prev + 1);
      return;
    }

    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_index) {
        correct += 1;
      }
    });
    const score = Math.round((correct / total) * 100);
    const resultPayload = { type: "mc", questions, answers, correct, total, score, sourceTitle: activityTitle || data.source_title, activityId };
    submitMutation.mutate({
      quiz_id: quizId,
      score,
      total_questions: total,
      correct_answers: correct,
      ...(activityId ? { activity_id: activityId } : {}),
    }, {
      onSuccess: () => onFinish(resultPayload),
    });
  };

  useEffect(() => {
    const handleKeyboardShortcuts = (event) => {
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.isComposing || submitMutation.isPending) {
        return;
      }

      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 4) {
        const option = currentQuestion?.options?.[digit - 1];
        if (!option) return;
        event.preventDefault();
        handleSelect(digit - 1);
        return;
      }

      if (event.key === "Enter" && isRevealed) {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [currentQuestion, isRevealed, submitMutation.isPending]);

  if (isLoading) {
    return <LinearProgress sx={{ maxWidth: 400, mx: "auto", mt: 10, borderRadius: 2 }} />;
  }
  if (isError) {
    return <Alert severity="error">Lỗi khi tạo câu hỏi trắc nghiệm.</Alert>;
  }
  if (!currentQuestion) {
    return <Alert severity="warning">Không có câu hỏi phù hợp để bắt đầu quiz.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 680, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Câu {current + 1} / {total}</Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: colors.greenStarbucks }}>{data.source_title}</Typography>
        </Box>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 0.75 }}>
          Phím tắt: 1-4 để chọn đáp án, Enter để sang câu tiếp theo.
        </Typography>
        <LinearProgress
          variant="determinate"
          value={((current + 1) / total) * 100}
          sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.08)", "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent } }}
        />
      </Box>

      <Box sx={{ bgcolor: "background.paper", borderRadius: "16px", p: { xs: 2.5, sm: 4 }, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", mb: 2.5 }}>
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1 }}>Nghĩa của từ này là gì?</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "2rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>
          {currentQuestion.word_text}
        </Typography>
        {currentQuestion.phonetic && (
          <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", mt: 0.5, mb: 2.5 }}>
            {currentQuestion.phonetic}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correct_index;
            const isSelected = index === selectedIndex;
            let bgColor = "#fafafa";
            let borderColor = "rgba(0,0,0,0.10)";
            let textColor = "text.primary";

            if (isRevealed) {
              if (isCorrect) {
                bgColor = `${colors.greenAccent}14`;
                borderColor = colors.greenAccent;
                textColor = colors.greenStarbucks;
              } else if (isSelected) {
                bgColor = `${colors.red}0d`;
                borderColor = colors.red;
                textColor = colors.red;
              }
            }

            return (
              <Box
                key={index}
                onClick={() => handleSelect(index)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.75,
                  borderRadius: "12px",
                  border: `1.5px solid ${borderColor}`,
                  bgcolor: bgColor,
                  cursor: isRevealed ? "default" : "pointer",
                  "&:hover": !isRevealed ? { borderColor: colors.greenAccent, bgcolor: `${colors.greenAccent}08` } : {},
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    flexShrink: 0,
                    bgcolor: isRevealed && isCorrect
                      ? colors.greenAccent
                      : isRevealed && isSelected && !isCorrect
                        ? colors.red
                        : "rgba(0,0,0,0.08)",
                    color: isRevealed && (isCorrect || isSelected) ? "#fff" : "text.secondary",
                  }}
                >
                  {OPTION_LABELS[index]}
                </Box>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: isRevealed && isCorrect ? 700 : 400, color: textColor, flex: 1 }}>
                  {option}
                </Typography>
                {isRevealed && isCorrect && <CheckCircleRoundedIcon sx={{ fontSize: 20, color: colors.greenAccent }} />}
                {isRevealed && isSelected && !isCorrect && <CancelRoundedIcon sx={{ fontSize: 20, color: colors.red }} />}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Collapse in={isRevealed}>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <SbButton variant="contained" onClick={handleNext} endIcon={<ArrowForwardRoundedIcon />}>
            {isLast ? "Xem kết quả" : "Câu tiếp"}
          </SbButton>
        </Box>
      </Collapse>
      {submitMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Khong the luu ket qua quiz. Vui long thu lai.
        </Alert>
      )}
    </Box>
  );
};

const MatchingPhase = ({ sourceId, sourceType, quizId: fixedQuizId, activityId, activityTitle, onFinish }) => {
  const qc = useQueryClient();
  const [quizId, setQuizId] = useState(null);
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [errors, setErrors] = useState(0);
  const [flashError, setFlashError] = useState(false);

  const params = fixedQuizId
    ? { quiz_id: fixedQuizId, type: "match" }
    : sourceType === "lesson"
      ? { lesson_id: sourceId, type: "match" }
      : { wordset_id: sourceId, type: "match" };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quiz-generate-match", params],
    queryFn: () =>
      quizApi.generate(params).then((response) => {
        setQuizId(response.data.quiz_id);
        const words = response.data.questions;
        setLeftItems(shuffle(words));
        setRightItems(shuffle(words));
        return response.data;
      }),
    staleTime: 0,
    gcTime: 0,
  });

  const submitMutation = useMutation({
    mutationFn: quizApi.submit,
    onSuccess: () => {
      if (activityId) {
        qc.invalidateQueries({ queryKey: ["learning-path-v2"] });
        qc.invalidateQueries({ queryKey: ["home-learning-path"] });
      }
    },
  });

  useEffect(() => {
    if (!data?.questions || leftItems.length > 0) return;
    const words = data.questions;
    setLeftItems(shuffle(words));
    setRightItems(shuffle(words));
  }, [data, leftItems.length]);

  const checkMatch = (leftId, rightId) => {
    if (leftId === rightId) {
      setMatchedIds((prev) => {
        const next = new Set(prev).add(leftId);
        if (next.size === data.questions.length) {
          const totalPairs = data.questions.length;
          setErrors((currentErrors) => {
            const score = Math.max(0, 100 - currentErrors * 10);
            const resultPayload = { type: "match", total: totalPairs, errors: currentErrors, score, sourceTitle: activityTitle || data.source_title, activityId };
            submitMutation.mutate({
              quiz_id: quizId,
              score,
              total_questions: totalPairs + currentErrors,
              correct_answers: totalPairs,
              ...(activityId ? { activity_id: activityId } : {}),
            }, {
              onSuccess: () => {
                setTimeout(() => onFinish(resultPayload), 400);
              },
            });
            return currentErrors;
          });
        }
        return next;
      });
      setSelectedLeft(null);
      setSelectedRight(null);
      return;
    }

    setErrors((prev) => prev + 1);
    setFlashError(true);
    setTimeout(() => {
      setSelectedLeft(null);
      setSelectedRight(null);
      setFlashError(false);
    }, 350);
  };

  const handleSelectLeft = (id) => {
    if (matchedIds.has(id) || flashError) return;
    if (selectedLeft === id) {
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(id);
    if (selectedRight) {
      checkMatch(id, selectedRight);
    }
  };

  const handleSelectRight = (id) => {
    if (matchedIds.has(id) || flashError) return;
    if (selectedRight === id) {
      setSelectedRight(null);
      return;
    }
    setSelectedRight(id);
    if (selectedLeft) {
      checkMatch(selectedLeft, id);
    }
  };

  if (isLoading) {
    return <LinearProgress sx={{ maxWidth: 400, mx: "auto", mt: 10, borderRadius: 2 }} />;
  }
  if (isError) {
    return <Alert severity="error">Lỗi khi tạo bài tập nối từ.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "#1565c0" }}>
          Nối từ - {data.source_title}
        </Typography>
        <Chip label={`Sai: ${errors} lần`} color={errors > 0 ? "error" : "default"} variant={errors > 0 ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />
      </Box>

      <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 2 }}>
        Chọn một từ ở cột trái và một nghĩa tương ứng ở cột phải.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {leftItems.map((item) => {
              const isMatched = matchedIds.has(item.id);
              const isSelected = selectedLeft === item.id;
              const isErrorState = isSelected && flashError;

              return (
                <CardActionArea
                  key={`left-${item.id}`}
                  disabled={isMatched || flashError}
                  onClick={() => handleSelectLeft(item.id)}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    border: "2px solid",
                    borderColor: isMatched ? colors.greenAccent : isErrorState ? colors.red : isSelected ? "#2196f3" : "rgba(0,0,0,0.08)",
                    bgcolor: isMatched ? `${colors.greenAccent}14` : isErrorState ? `${colors.red}14` : isSelected ? "#2196f314" : "background.paper",
                    opacity: isMatched ? 0.6 : 1,
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: isMatched ? colors.greenStarbucks : "text.primary" }}>
                    {item.text}
                  </Typography>
                </CardActionArea>
              );
            })}
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rightItems.map((item) => {
              const isMatched = matchedIds.has(item.id);
              const isSelected = selectedRight === item.id;
              const isErrorState = isSelected && flashError;

              return (
                <CardActionArea
                  key={`right-${item.id}`}
                  disabled={isMatched || flashError}
                  onClick={() => handleSelectRight(item.id)}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    border: "2px solid",
                    borderColor: isMatched ? colors.greenAccent : isErrorState ? colors.red : isSelected ? "#2196f3" : "rgba(0,0,0,0.08)",
                    bgcolor: isMatched ? `${colors.greenAccent}14` : isErrorState ? `${colors.red}14` : isSelected ? "#2196f314" : "background.paper",
                    opacity: isMatched ? 0.6 : 1,
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontSize: "0.95rem", color: isMatched ? colors.greenStarbucks : "text.secondary" }}>
                    {item.definition_vi}
                  </Typography>
                </CardActionArea>
              );
            })}
          </Box>
        </Grid>
      </Grid>

      {submitMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Khong the luu ket qua quiz. Vui long thu lai.
        </Alert>
      )}
    </Box>
  );
};

const ResultPhase = ({ result, onRetry, onBack, onBackToLearning, isActivityMode = false }) => {
  const { type, score, sourceTitle, total } = result;
  const label = scoreLabel(score);

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <Box sx={{ bgcolor: "background.paper", borderRadius: "20px", p: { xs: 3, sm: 4 }, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", textAlign: "center", mb: 3 }}>
        <EmojiEventsRoundedIcon sx={{ fontSize: 52, color: colors.gold, mb: 1 }} />
        {type === "mc" ? (
          <Typography sx={{ fontWeight: 800, fontSize: "3rem", color: colors.greenStarbucks, lineHeight: 1 }}>
            {result.correct}/{total}
          </Typography>
        ) : (
          <Typography sx={{ fontWeight: 800, fontSize: "2.5rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>
            {score} điểm
          </Typography>
        )}
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: label.color, mt: 0.5 }}>{label.text}</Typography>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mt: 0.5 }}>
          {sourceTitle} - {type === "mc" ? "Trắc nghiệm" : "Nối từ"}
        </Typography>

        {type === "match" && (
          <Typography sx={{ mt: 2, fontSize: "0.9rem", color: result.errors > 0 ? colors.red : colors.greenAccent }}>
            Bạn đã nối sai {result.errors} lần.
          </Typography>
        )}

        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            mt: 2.5,
            height: 10,
            borderRadius: 5,
            bgcolor: "rgba(0,0,0,0.08)",
            "& .MuiLinearProgress-bar": { bgcolor: score >= 70 ? colors.greenAccent : score >= 50 ? "#ff9800" : colors.red },
          }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
        <SbButton variant="outlined" startIcon={<RestartAltRoundedIcon />} onClick={onRetry}>
          Làm lại
        </SbButton>
        <SbButton variant="contained" onClick={isActivityMode ? onBackToLearning : onBack}>
          {isActivityMode ? "Về lộ trình" : "Chọn bài khác"}
        </SbButton>
      </Box>
    </Box>
  );
};

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const quizSource = location.state?.quizSource ?? null;
  const activityQuiz = location.state?.activityQuiz ?? null;
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const routeActivityId = searchParams.get("activity_id") || activityQuiz?.activity?.id || null;
  const routeQuizId = searchParams.get("quiz_id") || activityQuiz?.quiz_id || activityQuiz?.startedPayload?.quiz_id || null;
  const routeActivityTitle = activityQuiz?.activity?.title || null;
  const initialConfig = routeQuizId
    ? {
      sourceId: null,
      sourceType: "quiz",
      quizType: "mc",
      quizId: routeQuizId,
      activityId: routeActivityId,
      activityTitle: routeActivityTitle,
    }
    : null;
  const [phase, setPhase] = useState(initialConfig ? "quiz-mc" : "select");
  const [config, setConfig] = useState(initialConfig);
  const [result, setResult] = useState(null);

  const prefillSource = useMemo(() => {
    if (!quizSource?.sourceId || !quizSource?.sourceType) return null;
    return quizSource;
  }, [quizSource]);

  const handleStartQuiz = (sourceObj, sourceType, quizType) => {
    setConfig({ sourceId: sourceObj.id, sourceType, quizType });
    setPhase(`quiz-${quizType}`);
  };

  const handleFinish = (payload) => {
    setResult(payload);
    setPhase("result");
  };

  const handleBackToLearning = () => {
    qc.invalidateQueries({ queryKey: ["learning-path-v2"] });
    qc.invalidateQueries({ queryKey: ["home-learning-path"] });
    navigate("/learning");
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 0, sm: 1 } }}>
      {phase === "select" && <SelectPhase onStartQuiz={handleStartQuiz} prefillSource={prefillSource} />}
      {phase === "quiz-mc" && (
        <MultipleChoicePhase
          sourceId={config.sourceId}
          sourceType={config.sourceType}
          quizId={config.quizId}
          activityId={config.activityId}
          activityTitle={config.activityTitle}
          onFinish={handleFinish}
        />
      )}
      {phase === "quiz-match" && (
        <MatchingPhase
          sourceId={config.sourceId}
          sourceType={config.sourceType}
          quizId={config.quizId}
          activityId={config.activityId}
          activityTitle={config.activityTitle}
          onFinish={handleFinish}
        />
      )}
      {phase === "result" && (
        <ResultPhase
          result={result}
          onRetry={() => setPhase(`quiz-${config.quizType}`)}
          onBack={() => setPhase("select")}
          onBackToLearning={handleBackToLearning}
          isActivityMode={Boolean(result?.activityId || config?.activityId)}
        />
      )}
    </Box>
  );
};

export default QuizPage;
