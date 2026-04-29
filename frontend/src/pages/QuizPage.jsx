import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Card, CardActionArea, Chip, Skeleton,
  Alert, LinearProgress, Button, Collapse, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import QuizRoundedIcon          from "@mui/icons-material/QuizRounded";
import MenuBookRoundedIcon       from "@mui/icons-material/MenuBookRounded";
import LibraryBooksRoundedIcon   from "@mui/icons-material/LibraryBooksRounded";
import CheckCircleRoundedIcon    from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon         from "@mui/icons-material/CancelRounded";
import EmojiEventsRoundedIcon    from "@mui/icons-material/EmojiEventsRounded";
import ArrowForwardRoundedIcon   from "@mui/icons-material/ArrowForwardRounded";
import RestartAltRoundedIcon     from "@mui/icons-material/RestartAltRounded";
import { SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/api/learningApi";
import vocabularyApi from "@/api/vocabularyApi";
import quizApi from "@/api/quizApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_COLOR = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" },
  A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" },
  B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" },
  C2: { bg: "#fafafa", color: "#37474f" },
};

const scoreLabel = (pct) => {
  if (pct >= 90) return { text: "Xuất sắc! 🏆", color: colors.greenAccent };
  if (pct >= 70) return { text: "Tốt lắm! 👏",  color: "#2196f3" };
  if (pct >= 50) return { text: "Ổn! Cố thêm nhé 💪", color: "#ff9800" };
  return { text: "Cần ôn thêm 📚", color: colors.red };
};

// Hàm xáo trộn mảng
function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Phase 1: Chọn bài học / bộ từ ─────────────────────────────────────────────

const SelectPhase = ({ onStartQuiz }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: lessonData, isLoading: isLessonLoading } = useQuery({
    queryKey: ["quiz-lessons"],
    queryFn: () => learningApi.getLessons({ page_size: 50 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: wordsetData, isLoading: isWordsetLoading } = useQuery({
    queryKey: ["quiz-wordsets"],
    queryFn: () => vocabularyApi.getSets({ page_size: 50 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const list = tabIndex === 0 ? (lessonData?.results || []) : (wordsetData?.results || []);
  const isLoading = tabIndex === 0 ? isLessonLoading : isWordsetLoading;
  const sourceType = tabIndex === 0 ? "lesson" : "wordset";

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: colors.greenStarbucks }}>
          Kiểm tra từ vựng
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: colors.textBlackSoft, mt: 0.5 }}>
          Chọn một bài học hoặc bộ từ để kiểm tra trí nhớ của bạn
        </Typography>
      </Box>

      <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ mb: 3 }}>
        <Tab label="Bài học" icon={<MenuBookRoundedIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Bộ từ (WordSets)" icon={<LibraryBooksRoundedIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={130} sx={{ borderRadius: "14px" }} />
              </Grid>
            ))
          : list.length === 0
            ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <MenuBookRoundedIcon sx={{ fontSize: 56, color: colors.greenAccent, opacity: 0.3, mb: 1 }} />
                  <Typography sx={{ color: colors.textBlackSoft }}>
                    Chưa có {tabIndex === 0 ? "bài học" : "bộ từ"} nào.
                  </Typography>
                </Box>
              </Grid>
            )
            : list.map((item) => {
                const lc = LEVEL_COLOR[item.level] ?? {};
                const wordCount = item.word_count ?? 0;
                const canStart = wordCount >= 4;
                const title = tabIndex === 0 ? item.title : item.name;

                return (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card
                      sx={{
                        borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)", opacity: canStart ? 1 : 0.55,
                        transition: "transform 0.15s, box-shadow 0.15s",
                        "&:hover": canStart ? { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" } : {},
                      }}
                    >
                      <CardActionArea disabled={!canStart} onClick={() => setSelectedItem(item)} sx={{ p: 2.5, minHeight: 120 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                          {item.level && <Chip label={item.level} size="small" sx={{ bgcolor: lc.bg, color: lc.color, fontWeight: 700, fontSize: "0.72rem", height: 22 }} />}
                          <Typography sx={{ fontSize: "0.78rem", color: colors.textBlackSoft }}>{wordCount} từ</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: colors.textBlack, mb: 0.5 }} noWrap>{title}</Typography>
                        {!canStart && <Typography sx={{ fontSize: "0.76rem", color: colors.red }}>Cần ít nhất 4 từ</Typography>}
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
      </Grid>

      {/* Dialog chọn loại Quiz */}
      <Dialog open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, textAlign: "center" }}>Chọn chế độ kiểm tra</DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ textAlign: "center", color: colors.textBlackSoft, mb: 1 }}>
            {tabIndex === 0 ? selectedItem?.title : selectedItem?.name}
          </Typography>
          
          <CardActionArea 
            onClick={() => { onStartQuiz(selectedItem, sourceType, "mc"); setSelectedItem(null); }}
            sx={{ p: 2, borderRadius: "12px", border: `2px solid ${colors.greenAccent}`, textAlign: "center", bgcolor: `${colors.greenAccent}08` }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: colors.greenStarbucks }}>Trắc nghiệm</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>Chọn đáp án đúng từ 4 lựa chọn</Typography>
          </CardActionArea>

          <CardActionArea 
            onClick={() => { onStartQuiz(selectedItem, sourceType, "match"); setSelectedItem(null); }}
            sx={{ p: 2, borderRadius: "12px", border: `2px solid #2196f3`, textAlign: "center", bgcolor: `#2196f308` }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#1565c0" }}>Nối từ</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>Ghép nối từ tiếng Anh và nghĩa tiếng Việt</Typography>
          </CardActionArea>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "center" }}>
          <Button onClick={() => setSelectedItem(null)} color="inherit" sx={{ borderRadius: "10px" }}>Hủy</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Phase 2A: Trắc nghiệm (Multiple Choice) ───────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];

const MultipleChoicePhase = ({ sourceId, sourceType, onFinish }) => {
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [current, setCurrent] = useState(0);
  const [quizId, setQuizId] = useState(null);

  const params = sourceType === "lesson" ? { lesson_id: sourceId, type: "mc" } : { wordset_id: sourceId, type: "mc" };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quiz-generate-mc", params],
    queryFn: () => quizApi.generate(params).then((r) => {
      setQuizId(r.data.quiz_id);
      return r.data;
    }),
    staleTime: 0, gcTime: 0,
  });

  const submitMutation = useMutation({ mutationFn: quizApi.submit });

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
      let correct = 0;
      questions.forEach((q, i) => { if (answers[i] === q.correct_index) correct++; });
      const score = Math.round((correct / total) * 100);
      submitMutation.mutate({ quiz_id: quizId, score, total_questions: total, correct_answers: correct });
      onFinish({ type: "mc", questions, answers, correct, total, score, sourceTitle: data.source_title });
    }
  };

  if (isLoading) return <LinearProgress sx={{ maxWidth: 400, mx: "auto", mt: 10, borderRadius: 2 }} />;
  if (isError) return <Alert severity="error">Lỗi khi tạo câu hỏi.</Alert>;

  const q = questions[current];
  const selectedIdx = answers[current];
  const isRevealed = revealed[current];
  const isLast = current === total - 1;

  return (
    <Box sx={{ maxWidth: 680, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
          <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>Câu {current + 1} / {total}</Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: colors.greenStarbucks }}>{data.source_title}</Typography>
        </Box>
        <LinearProgress variant="determinate" value={((current + 1) / total) * 100} sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.08)", "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent } }} />
      </Box>

      <Box sx={{ bgcolor: "#fff", borderRadius: "16px", p: { xs: 2.5, sm: 4 }, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", mb: 2.5 }}>
        <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft, mb: 1 }}>Nghĩa của từ này là gì?</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "2rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>{q.word_text}</Typography>
        {q.phonetic && <Typography sx={{ fontSize: "0.9rem", color: colors.textBlackSoft, mt: 0.5, mb: 2.5 }}>{q.phonetic}</Typography>}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct_index;
            const isSelected = idx === selectedIdx;
            let bgColor = "#fafafa", borderColor = "rgba(0,0,0,0.10)", textColor = colors.textBlack;

            if (isRevealed) {
              if (isCorrect) { bgColor = `${colors.greenAccent}14`; borderColor = colors.greenAccent; textColor = colors.greenStarbucks; }
              else if (isSelected) { bgColor = `${colors.red}0d`; borderColor = colors.red; textColor = colors.red; }
            }

            return (
              <Box key={idx} onClick={() => handleSelect(idx)} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.75, borderRadius: "12px", border: `1.5px solid ${borderColor}`, bgcolor: bgColor, cursor: isRevealed ? "default" : "pointer", "&:hover": !isRevealed ? { borderColor: colors.greenAccent, bgcolor: `${colors.greenAccent}08` } : {} }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0, bgcolor: isRevealed && isCorrect ? colors.greenAccent : isRevealed && isSelected && !isCorrect ? colors.red : "rgba(0,0,0,0.08)", color: isRevealed && (isCorrect || isSelected) ? "#fff" : colors.textBlackSoft }}>
                  {OPTION_LABELS[idx]}
                </Box>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: isRevealed && isCorrect ? 700 : 400, color: textColor, flex: 1 }}>{opt}</Typography>
                {isRevealed && isCorrect && <CheckCircleRoundedIcon sx={{ fontSize: 20, color: colors.greenAccent }} />}
                {isRevealed && isSelected && !isCorrect && <CancelRoundedIcon sx={{ fontSize: 20, color: colors.red }} />}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Collapse in={isRevealed}>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <SbButton variant="contained" onClick={handleNext} endIcon={<ArrowForwardRoundedIcon />}>{isLast ? "Xem kết quả" : "Câu tiếp"}</SbButton>
        </Box>
      </Collapse>
    </Box>
  );
};

// ── Phase 2B: Nối từ (Matching) ───────────────────────────────────────────────

const MatchingPhase = ({ sourceId, sourceType, onFinish }) => {
  const [quizId, setQuizId] = useState(null);
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [errors, setErrors] = useState(0);
  const [flashError, setFlashError] = useState(false);

  const params = sourceType === "lesson" ? { lesson_id: sourceId, type: "match" } : { wordset_id: sourceId, type: "match" };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quiz-generate-match", params],
    queryFn: () => quizApi.generate(params).then((r) => {
      setQuizId(r.data.quiz_id);
      
      // Khởi tạo các mảng xáo trộn khi lấy được data
      const words = r.data.questions;
      setLeftItems(shuffle(words));
      setRightItems(shuffle(words));
      
      return r.data;
    }),
    staleTime: 0, gcTime: 0,
  });

  const submitMutation = useMutation({ mutationFn: quizApi.submit });

  useEffect(() => {
    // Chỉ khởi tạo khi có data
    if (data?.questions && leftItems.length === 0) {
      const words = data.questions;
      setLeftItems(shuffle(words));
      setRightItems(shuffle(words));
    }
  }, [data]);

  const checkMatch = (leftId, rightId) => {
    if (leftId === rightId) {
      setMatchedIds(prev => {
        const newSet = new Set(prev).add(leftId);
        
        // Kiểm tra kết thúc
        if (newSet.size === data.questions.length) {
          const totalPairs = data.questions.length;
          // Sử dụng hàm setState để lấy giá trị errors mới nhất một cách an toàn
          setErrors(currentErrors => {
            const score = Math.max(0, 100 - currentErrors * 10);
            submitMutation.mutate({ quiz_id: quizId, score, total_questions: totalPairs + currentErrors, correct_answers: totalPairs });
            
            setTimeout(() => {
              onFinish({ type: "match", total: totalPairs, errors: currentErrors, score, sourceTitle: data.source_title });
            }, 600);
            
            return currentErrors;
          });
        }
        return newSet;
      });
      
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setErrors(e => e + 1);
      setFlashError(true);
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setFlashError(false);
      }, 600);
    }
  };

  const handleSelectLeft = (id) => {
    if (matchedIds.has(id) || flashError) return;
    if (selectedLeft === id) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(id);
      if (selectedRight) {
        checkMatch(id, selectedRight);
      }
    }
  };

  const handleSelectRight = (id) => {
    if (matchedIds.has(id) || flashError) return;
    if (selectedRight === id) {
      setSelectedRight(null);
    } else {
      setSelectedRight(id);
      if (selectedLeft) {
        checkMatch(selectedLeft, id);
      }
    }
  };

  if (isLoading) return <LinearProgress sx={{ maxWidth: 400, mx: "auto", mt: 10, borderRadius: 2 }} />;
  if (isError) return <Alert severity="error">Lỗi khi tạo bài tập nối từ.</Alert>;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "#1565c0" }}>Nối từ – {data.source_title}</Typography>
        <Chip label={`Sai: ${errors} lần`} color={errors > 0 ? "error" : "default"} variant={errors > 0 ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {leftItems.map(item => {
              const isMatched = matchedIds.has(item.id);
              const isSelected = selectedLeft === item.id;
              const isErrorState = isSelected && flashError;
              
              return (
                <CardActionArea
                  key={`left-${item.id}`}
                  disabled={isMatched || flashError}
                  onClick={() => handleSelectLeft(item.id)}
                  sx={{
                    p: 2, borderRadius: "12px", border: "2px solid",
                    borderColor: isMatched ? colors.greenAccent : isErrorState ? colors.red : isSelected ? "#2196f3" : "rgba(0,0,0,0.08)",
                    bgcolor: isMatched ? `${colors.greenAccent}14` : isErrorState ? `${colors.red}14` : isSelected ? "#2196f314" : "#fff",
                    opacity: isMatched ? 0.6 : 1, transition: "all 0.2s",
                    textAlign: "center"
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: isMatched ? colors.greenStarbucks : colors.textBlack }}>{item.text}</Typography>
                </CardActionArea>
              );
            })}
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rightItems.map(item => {
              const isMatched = matchedIds.has(item.id);
              const isSelected = selectedRight === item.id;
              const isErrorState = isSelected && flashError;
              
              return (
                <CardActionArea
                  key={`right-${item.id}`}
                  disabled={isMatched || flashError}
                  onClick={() => handleSelectRight(item.id)}
                  sx={{
                    p: 2, borderRadius: "12px", border: "2px solid",
                    borderColor: isMatched ? colors.greenAccent : isErrorState ? colors.red : isSelected ? "#2196f3" : "rgba(0,0,0,0.08)",
                    bgcolor: isMatched ? `${colors.greenAccent}14` : isErrorState ? `${colors.red}14` : isSelected ? "#2196f314" : "#fff",
                    opacity: isMatched ? 0.6 : 1, transition: "all 0.2s",
                    textAlign: "center"
                  }}
                >
                  <Typography sx={{ fontSize: "0.95rem", color: isMatched ? colors.greenStarbucks : colors.textBlackSoft }}>{item.definition_vi}</Typography>
                </CardActionArea>
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// ── Phase 3: Kết quả ──────────────────────────────────────────────────────────

const ResultPhase = ({ result, onRetry, onBack }) => {
  const { type, score, sourceTitle, total } = result;
  const label = scoreLabel(score);

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <Box sx={{ bgcolor: "#fff", borderRadius: "20px", p: { xs: 3, sm: 4 }, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", textAlign: "center", mb: 3 }}>
        <EmojiEventsRoundedIcon sx={{ fontSize: 52, color: colors.gold, mb: 1 }} />
        {type === "mc" ? (
          <Typography sx={{ fontWeight: 800, fontSize: "3rem", color: colors.greenStarbucks, lineHeight: 1 }}>{result.correct}/{total}</Typography>
        ) : (
          <Typography sx={{ fontWeight: 800, fontSize: "2.5rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>{score} Điểm</Typography>
        )}
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: label.color, mt: 0.5 }}>{label.text}</Typography>
        <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft, mt: 0.5 }}>{sourceTitle} — {type === "mc" ? "Trắc nghiệm" : "Nối từ"}</Typography>
        
        {type === "match" && (
          <Typography sx={{ mt: 2, fontSize: "0.9rem", color: result.errors > 0 ? colors.red : colors.greenAccent }}>
            Bạn đã nối sai {result.errors} lần.
          </Typography>
        )}

        <LinearProgress variant="determinate" value={score} sx={{ mt: 2.5, height: 10, borderRadius: 5, bgcolor: "rgba(0,0,0,0.08)", "& .MuiLinearProgress-bar": { bgcolor: score >= 70 ? colors.greenAccent : score >= 50 ? "#ff9800" : colors.red } }} />
      </Box>

      {/* Hành động */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
        <SbButton variant="outlined" startIcon={<RestartAltRoundedIcon />} onClick={onRetry}>Làm lại</SbButton>
        <SbButton variant="contained" onClick={onBack}>Chọn bài khác</SbButton>
      </Box>
    </Box>
  );
};

// ── Main QuizPage ─────────────────────────────────────────────────────────────

const QuizPage = () => {
  const [phase, setPhase] = useState("select"); // select | quiz-mc | quiz-match | result
  const [config, setConfig] = useState(null);
  const [result, setResult] = useState(null);

  const handleStartQuiz = (sourceObj, sourceType, quizType) => {
    setConfig({ sourceId: sourceObj.id, sourceType, quizType });
    setPhase(`quiz-${quizType}`);
  };

  const handleFinish = (res) => {
    setResult(res);
    setPhase("result");
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 0, sm: 1 } }}>
      {phase === "select" && <SelectPhase onStartQuiz={handleStartQuiz} />}
      {phase === "quiz-mc" && <MultipleChoicePhase sourceId={config.sourceId} sourceType={config.sourceType} onFinish={handleFinish} />}
      {phase === "quiz-match" && <MatchingPhase sourceId={config.sourceId} sourceType={config.sourceType} onFinish={handleFinish} />}
      {phase === "result" && <ResultPhase result={result} onRetry={() => setPhase(`quiz-${config.quizType}`)} onBack={() => setPhase("select")} />}
    </Box>
  );
};

export default QuizPage;
