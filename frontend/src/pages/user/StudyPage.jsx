import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Box, LinearProgress, Stack, Typography } from "@mui/material";
import { VolumeUpRounded as VolumeUpRoundedIcon } from "@mui/icons-material";
import { SbButton, SbCard } from "@/components/ui";
import learningApi from "@/services/learningApi";
import { colors } from "@/styles/theme";

const speak = (text) => {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
};

const StudyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["study-lesson", id],
    queryFn: () => learningApi.getLesson(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 0,
  });

  const startSessionMutation = useMutation({
    mutationFn: (lessonId) =>
      learningApi.startLearningSession(lessonId, "study_flashcard_cta").then((r) => r.data),
    onSuccess: (session) => navigate(`/learning/session/${session.id}`),
  });

  const words = useMemo(() => {
    const rawWords = (data?.words || []).map((item) => item?.word).filter(Boolean);
    const seen = new Set();
    const unique = [];

    for (const word of rawWords) {
      const normalizedText = String(word?.text || "").trim().toLowerCase();
      const key = normalizedText
        ? `text:${normalizedText}`
        : (word?.id != null ? `id:${word.id}` : "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(word);
    }

    return unique;
  }, [data]);

  const currentWord = words[index] || null;
  const atFirst = index <= 0;
  const atLast = index >= Math.max(0, words.length - 1);
  const progress = words.length > 0
    ? (isDone ? 100 : Math.round(((index + 1) / words.length) * 100))
    : 0;

  const restartFlashcards = () => {
    setIndex(0);
    setFlipped(false);
    setIsDone(false);
  };

  const goNext = () => {
    if (!words.length) return;
    if (isDone) return;
    if (atLast) {
      setFlipped(false);
      setIsDone(true);
      return;
    }
    setFlipped(false);
    setIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (!words.length) return;
    if (isDone) {
      setIsDone(false);
      setFlipped(false);
      setIndex(Math.max(0, words.length - 1));
      return;
    }
    if (atFirst) return;
    setFlipped(false);
    setIndex((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Enter") return;
      if (isDone || !currentWord) return;
      if (!flipped) {
        event.preventDefault();
        setFlipped(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flipped, isDone, currentWord]);

  if (!id) {
    navigate("/learning", { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 860, mx: "auto", py: 3 }}>
        <SbCard>
          <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>
            Đang tải flashcard...
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </SbCard>
      </Box>
    );
  }

  if (isError) {
    const message = error?.response?.data?.detail || "Không tải được dữ liệu flashcard.";
    return (
      <Box sx={{ maxWidth: 860, mx: "auto", py: 3 }}>
        <SbCard>
          <Stack spacing={2}>
            <Alert severity="error">{message}</Alert>
            <Stack direction="row" spacing={1}>
              <SbButton variant="primary" onClick={() => refetch()}>
                Thử lại
              </SbButton>
              <SbButton variant="outlined" onClick={() => navigate("/learning")}>
                Về lộ trình
              </SbButton>
            </Stack>
          </Stack>
        </SbCard>
      </Box>
    );
  }

  if (!words.length) {
    return (
      <Box sx={{ maxWidth: 860, mx: "auto", py: 3 }}>
        <SbCard>
          <Stack spacing={2}>
            <Alert severity="warning">
              Bài này chưa có dữ liệu từ vựng để học flashcard.
            </Alert>
            <Stack direction="row" spacing={1}>
              <SbButton variant="outlined" onClick={() => navigate("/learning")}>
                Về lộ trình
              </SbButton>
              <SbButton
                variant="primary"
                onClick={() => startSessionMutation.mutate(Number(id))}
                loading={startSessionMutation.isPending}
              >
                Làm bài luôn
              </SbButton>
            </Stack>
          </Stack>
        </SbCard>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 860, mx: "auto", py: 3 }}>
      <Stack spacing={2}>
        <SbCard>
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>
              Flashcard: {data?.title}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              {isDone ? `Đã hoàn tất ${words.length}/${words.length} từ` : `Từ ${index + 1}/${words.length}`}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 99,
                bgcolor: "rgba(0,0,0,0.1)",
                "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
              }}
            />
          </Stack>
        </SbCard>

        {!isDone ? (
          <SbCard
            sx={{
              cursor: "pointer",
              minHeight: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setFlipped((v) => !v)}
          >
            <Stack spacing={1.5} alignItems="center" sx={{ textAlign: "center", px: 2 }}>
              {!flipped ? (
                <>
                  <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: colors.greenStarbucks }}>
                    {currentWord?.text}
                  </Typography>
                  <SbButton
                    variant="outlined"
                    size="small"
                    startIcon={<VolumeUpRoundedIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentWord?.text);
                    }}
                  >
                    Phát âm
                  </SbButton>
                  <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                    Bấm vào thẻ hoặc nhấn Enter để xem nghĩa
                  </Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: colors.greenStarbucks }}>
                    {currentWord?.definition_vi || currentWord?.definition_en || "Chưa có nghĩa"}
                  </Typography>
                  {!!currentWord?.example_en && (
                    <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
                      {currentWord.example_en}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                    Bấm vào thẻ để quay lại từ gốc
                  </Typography>
                </>
              )}
            </Stack>
          </SbCard>
        ) : (
          <SbCard>
            <Stack spacing={1.25}>
              <Alert severity="success">
                Bạn đã xem hết flashcard của bài này.
              </Alert>
              <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
                Bạn có thể ôn lại từ đầu hoặc chuyển sang làm bài luyện tập.
              </Typography>
            </Stack>
          </SbCard>
        )}

        <Stack direction="row" spacing={1.5}>
          <SbButton variant="outlined" onClick={goPrev} disabled={atFirst && !isDone}>
            Từ trước
          </SbButton>
          {!isDone ? (
            <SbButton variant="primary" onClick={goNext}>
              {atLast ? "Hoàn tất" : "Từ tiếp theo"}
            </SbButton>
          ) : (
            <SbButton variant="primary" onClick={restartFlashcards}>
              Ôn lại từ đầu
            </SbButton>
          )}
          <Box sx={{ flex: 1 }} />
          <SbButton
            variant="outlined"
            onClick={() => startSessionMutation.mutate(Number(id))}
            loading={startSessionMutation.isPending}
          >
            Làm bài ngay
          </SbButton>
        </Stack>
      </Stack>
    </Box>
  );
};

export default StudyPage;
