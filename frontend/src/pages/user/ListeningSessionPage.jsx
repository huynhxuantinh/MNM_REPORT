import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const buildAnswerValue = (question, answer) => {
  if (!question) return {};
  if (question.question_type === "fill_blank") {
    return { text: answer || "" };
  }
  return { option: answer || "" };
};

const extractAnswerValue = (question, answerRow) => {
  if (!question || !answerRow?.submitted_answer) return "";
  if (question.question_type === "fill_blank") {
    return answerRow.submitted_answer.text || "";
  }
  return answerRow.submitted_answer.option || "";
};

const getCorrectAnswerValue = (question) => {
  const correctAnswer = question?.correct_answer || {};
  if (question?.question_type === "fill_blank") {
    return correctAnswer.text || "";
  }
  return correctAnswer.option || "";
};

const normalizeAnswer = (value) => String(value || "").trim().toLowerCase();

const ListeningSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [ttsRate, setTtsRate] = useState(0.9);
  const [ttsWarning, setTtsWarning] = useState("");
  const [finishPayload, setFinishPayload] = useState(null);

  const { data: payload, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["listening-module-session", sessionId],
    queryFn: () => learningApi.getListeningModuleSession(sessionId).then((response) => response.data),
    staleTime: 0,
  });

  const session = payload;
  const passage = payload?.passage;
  const questions = useMemo(
    () => (passage?.questions || []).slice().sort((a, b) => a.order_index - b.order_index),
    [passage?.questions],
  );

  useEffect(() => {
    if (!payload?.answers || !questions.length) return;
    const next = {};
    questions.forEach((question) => {
      const answerRow = payload.answers.find((item) => item.question_id === question.id);
      if (answerRow) next[question.id] = extractAnswerValue(question, answerRow);
    });
    setSelectedAnswers(next);
  }, [payload?.answers, questions]);

  useEffect(() => {
    if (passage?.tts_rate) setTtsRate(passage.tts_rate);
  }, [passage?.tts_rate]);

  const speakTranscript = useCallback(
    (restart = true) => {
      const text = passage?.transcript || "";
      if (!text) return;
      if (
        typeof window === "undefined" ||
        !window.speechSynthesis ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        setTtsWarning("Thiết bị hiện tại không hỗ trợ trình đọc văn bản.");
        return;
      }

      const voices =
        typeof window.speechSynthesis.getVoices === "function"
          ? window.speechSynthesis.getVoices()
          : [];
      const preferredLang = passage?.tts_lang || "en-US";
      const voice =
        voices.find((item) => item.lang === preferredLang) ||
        voices.find((item) => item.lang?.startsWith("en-GB")) ||
        voices.find((item) => item.lang?.startsWith("en"));

      if (voices.length > 0 && !voice) {
        setTtsWarning("Thiết bị không có giọng đọc tiếng Anh phù hợp.");
        return;
      }

      setTtsWarning("");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferredLang;
      utterance.rate = ttsRate;
      if (voice) utterance.voice = voice;
      if (restart) window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [passage?.transcript, passage?.tts_lang, ttsRate],
  );

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      for (const question of questions) {
        const localValue = selectedAnswers[question.id];
        await learningApi.answerListeningModuleSession(sessionId, {
          question_id: question.id,
          submitted_answer: buildAnswerValue(question, localValue),
        });
      }
      const finish = await learningApi.finishListeningModuleSession(sessionId);
      return finish.data;
    },
    onSuccess: (data) => {
      setFinishPayload(data);
      setShowTranscript(true);
      refetch();
    },
  });

  const answeredCount = useMemo(
    () => questions.filter((question) => String(selectedAnswers[question.id] || "").trim().length > 0).length,
    [questions, selectedAnswers],
  );
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const result = finishPayload || (session?.status === "completed" ? session : null);
  const showResults = Boolean(result?.summary);
  const resultScore = Number(result?.summary?.score_pct || 0);
  const resultPassed = resultScore >= 70;
  const submittedAnswerMap = useMemo(
    () => new Map((payload?.answers || []).map((answer) => [answer.question_id, answer])),
    [payload?.answers],
  );
  const isLearningActivity = Boolean(
    finishPayload?.activity_progress || session?.unit_activity || result?.unit_activity || result?.activity_progress,
  );
  const backTarget = isLearningActivity ? "/learning" : "/listening";
  const backLabel = isLearningActivity ? "Về lộ trình" : "Về danh sách nghe";

  const handleBackToSource = useCallback(() => {
    if (isLearningActivity) {
      queryClient.invalidateQueries({ queryKey: ["learning-path-v2"] });
      queryClient.invalidateQueries({ queryKey: ["home-learning-path"] });
    }
    navigate(backTarget);
  }, [backTarget, isLearningActivity, navigate, queryClient]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !session || !passage) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error?.response?.data?.detail || "Không tải được bài nghe."}</Alert>
        <SbButton variant="outlined" onClick={() => refetch()}>
          Thử lại
        </SbButton>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 900, mx: "auto" }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: colors.greenStarbucks }}>
          {passage.title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap" }}>
          <Chip label="Listening" size="small" color="primary" />
          <Chip label={passage.level} size="small" />
          <Chip label={passage.topic || "general"} size="small" />
          <Chip label={`${passage.estimated_seconds || 30}s`} size="small" />
          <Chip label={`${questions.length} câu hỏi`} size="small" />
        </Stack>
      </Box>

      <SbCard>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>Đoạn nghe</Typography>
              <Typography sx={{ fontSize: "0.84rem", color: "text.secondary", lineHeight: 1.6 }}>
                Nghe một lần hoặc nhiều lần, sau đó trả lời toàn bộ câu hỏi bên dưới rồi nộp bài.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <SbButton size="small" variant="outlined" onClick={() => speakTranscript(true)}>
                Nghe
              </SbButton>
              <SbButton
                size="small"
                variant="outlined"
                onClick={() => {
                  if (typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.pause();
                  }
                }}
              >
                Tạm dừng
              </SbButton>
              <SbButton size="small" variant="outlined" onClick={() => speakTranscript(true)}>
                Đọc lại
              </SbButton>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <SbButton size="small" variant={ttsRate === 0.8 ? "primary" : "outlined"} onClick={() => setTtsRate(0.8)}>
              0.8x
            </SbButton>
            <SbButton size="small" variant={ttsRate === 1 ? "primary" : "outlined"} onClick={() => setTtsRate(1)}>
              1.0x
            </SbButton>
            <SbButton size="small" variant="outlined" data-cy="listening-transcript-toggle" onClick={() => setShowTranscript((prev) => !prev)}>
              {showTranscript ? "Ẩn transcript" : "Xem transcript"}
            </SbButton>
          </Stack>

          {!!ttsWarning && <Alert severity="warning">{ttsWarning}</Alert>}

          {showTranscript && (
            <Stack spacing={0.75}>
              <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.75 }}>{passage.transcript}</Typography>
              {!!passage.translation_vi && (
                <Typography sx={{ fontSize: "0.84rem", color: "text.secondary", lineHeight: 1.7 }}>
                  {passage.translation_vi}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </SbCard>

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "rgba(0,0,0,0.1)",
              "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
            }}
          />
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.75 }}>
            Đã trả lời {answeredCount}/{questions.length} câu
          </Typography>
        </Box>
        <SbButton
          variant="outlined"
          onClick={handleBackToSource}
          sx={{ flexShrink: 0 }}
          data-cy="listening-back-btn"
        >
          {backLabel}
        </SbButton>
      </Stack>

      <SbCard>
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Câu hỏi nghe hiểu</Typography>

          {questions.map((question, index) => {
            const correctValue = getCorrectAnswerValue(question);
            const selectedValue = selectedAnswers[question.id] || "";
            const submittedAnswer = submittedAnswerMap.get(question.id);
            const isTextCorrect = showResults && normalizeAnswer(selectedValue) === normalizeAnswer(correctValue);

            return (
              <Stack
                key={question.id}
                spacing={1.25}
                sx={{
                  pb: 2,
                  borderBottom: index < questions.length - 1 ? "1px solid rgba(0,0,0,0.08)" : "none",
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  Câu {question.order_index}. {question.prompt}
                </Typography>

                {(question.question_type === "multiple_choice" || question.question_type === "true_false") && (
                  <Stack spacing={1}>
                    {(question.choices_json || []).map((choice) => {
                      const isSelected = selectedValue === choice;
                      const isCorrectChoice = showResults && normalizeAnswer(choice) === normalizeAnswer(correctValue);
                      const isWrongChoice = showResults && isSelected && !isCorrectChoice;

                      return (
                        <SbButton
                          key={String(question.id) + "-" + choice}
                          variant={isCorrectChoice || (!showResults && isSelected) ? "primary" : "outlined"}
                          disabled={showResults}
                          onClick={() => setSelectedAnswers((prev) => ({ ...prev, [question.id]: choice }))}
                          sx={{
                            justifyContent: "space-between",
                            borderColor: isWrongChoice ? colors.red : undefined,
                            bgcolor: isWrongChoice ? "rgba(229, 57, 53, 0.08)" : undefined,
                            color: isWrongChoice ? colors.red : undefined,
                          }}
                        >
                          <span>{choice}</span>
                          {isCorrectChoice && <Chip size="small" label="Đáp án đúng" color="success" />}
                          {isWrongChoice && <Chip size="small" label="Bạn chọn" color="error" />}
                        </SbButton>
                      );
                    })}
                  </Stack>
                )}

                {question.question_type === "fill_blank" && (
                  <Stack spacing={1}>
                    <TextField
                      label="Nhập đáp án"
                      value={selectedAnswers[question.id] || ""}
                      disabled={showResults}
                      onChange={(event) =>
                        setSelectedAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                      }
                      fullWidth
                    />
                    {showResults && (
                      <Alert severity={submittedAnswer?.is_correct || isTextCorrect ? "success" : "error"}>
                        Đáp án đúng: {correctValue || "Chưa có đáp án mẫu"}
                      </Alert>
                    )}
                  </Stack>
                )}
              </Stack>
            );
          })}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Typography sx={{ fontSize: "0.84rem", color: "text.secondary" }}>
              Hoàn thành toàn bộ câu hỏi rồi bấm nộp bài để chấm điểm.
            </Typography>
            <SbButton
              variant="primary"
              disabled={!allAnswered || showResults}
              loading={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              data-cy="listening-submit-btn"
            >
              Nộp bài
            </SbButton>
          </Stack>
        </Stack>
      </SbCard>

      {!!submitMutation.error && (
        <Alert severity="error">
          {submitMutation.error?.response?.data?.detail || "Không thể nộp bài nghe."}
        </Alert>
      )}

      {!!result?.summary && (
        <SbCard
          sx={{
            border: "1px solid " + (resultPassed ? colors.greenAccent : colors.red) + "33",
            bgcolor: resultPassed ? "rgba(0, 137, 83, 0.06)" : "rgba(229, 57, 53, 0.06)",
          }}
        >
          <Stack spacing={1.4}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>Kết quả bài nghe</Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                  {resultPassed ? "Bạn đã đạt yêu cầu bài nghe này." : "Bạn nên nghe lại và xem phần đáp án đúng."}
                </Typography>
              </Box>
              <Chip color={resultPassed ? "success" : "error"} label={resultPassed ? "Đạt" : "Cần luyện lại"} />
            </Stack>
            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700 }}>Điểm nghe</Typography>
                <Typography sx={{ fontWeight: 800 }}>{resultScore}%</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, resultScore))}
                sx={{
                  height: 10,
                  borderRadius: 8,
                  bgcolor: "rgba(0,0,0,0.1)",
                  "& .MuiLinearProgress-bar": { bgcolor: resultPassed ? colors.greenAccent : colors.red },
                }}
              />
            </Box>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Chip label={"Tổng câu: " + result.summary.total_questions} />
              <Chip label={"Đã trả lời: " + result.summary.answered_questions} />
              <Chip color="success" label={"Đúng: " + result.summary.correct_answers} />
              <Chip label={"XP: " + (result.summary.xp_earned ?? 0)} />
              <Chip label={"Tổng XP: " + (result.summary.total_xp ?? 0)} />
              <Chip label={"Level " + (result.summary.level ?? 1)} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ pt: 1 }}>
              <SbButton variant="primary" onClick={handleBackToSource} data-cy="listening-result-back-btn">
                {backLabel}
              </SbButton>
              <SbButton variant="outlined" onClick={() => setShowTranscript(true)}>
                Xem transcript
              </SbButton>
            </Stack>
          </Stack>
        </SbCard>
      )}
    </Stack>
  );
};

export default ListeningSessionPage;
