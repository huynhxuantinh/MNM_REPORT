import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Chip, Skeleton, Divider, Tooltip,
  IconButton, LinearProgress, Grid, Alert,
} from "@mui/material";
import { ArrowBackRounded as ArrowBackRoundedIcon } from "@mui/icons-material";
import { BookmarkBorderRounded as BookmarkBorderRoundedIcon } from "@mui/icons-material";
import { BookmarkRounded as BookmarkRoundedIcon } from "@mui/icons-material";
import { VolumeUpRounded as VolumeUpRoundedIcon } from "@mui/icons-material";
import { RepeatRounded as RepeatRoundedIcon } from "@mui/icons-material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { CalendarTodayRounded as CalendarTodayRoundedIcon } from "@mui/icons-material";
import { TrendingUpRounded as TrendingUpRoundedIcon } from "@mui/icons-material";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";
import vocabularyApi from "@/api/vocabularyApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_CHIP = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" }, A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" }, B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" }, C2: { bg: "#fafafa", color: "#212121" },
  TOEIC: { bg: "#fff8e1", color: "#f57f17" },
};

const POS_LABEL = {
  noun: "Danh từ", verb: "Động từ", adjective: "Tính từ",
  adverb: "Trạng từ", preposition: "Giới từ", conjunction: "Liên từ",
  pronoun: "Đại từ", other: "Khác",
};

// ── TTS helper ────────────────────────────────────────────────────────────────

const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
};

// ── SRS stat item ─────────────────────────────────────────────────────────────

const SrsStat = ({ icon, label, value, sub, color = colors.greenAccent }) => (
  <Box sx={{ textAlign: "center", p: 1.5 }}>
    <Box sx={{ color, display: "flex", justifyContent: "center", mb: 0.5 }}>{icon}</Box>
    <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color, lineHeight: 1 }}>
      {value}
    </Typography>
    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }}>{label}</Typography>
    {sub && <Typography sx={{ fontSize: "0.7rem", color: "text.disabled" }}>{sub}</Typography>}
  </Box>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const WordDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { data: word, isLoading, error } = useQuery({
    queryKey: ["word", id],
    queryFn: () => vocabularyApi.getWord(id).then((r) => r.data),
    staleTime: 60_000,
  });

  const { mutate: toggleBookmark, isPending: bookmarkPending } = useMutation({
    mutationFn: () => vocabularyApi.bookmarkWord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["word", id] });
      qc.invalidateQueries({ queryKey: ["words"] });
    },
  });

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Không tìm thấy từ vựng này.</Alert>
      </Box>
    );
  }

  const log   = word?.review_log;
  const today = new Date().toISOString().slice(0, 10);
  const isDue = log?.next_review_date && log.next_review_date <= today;

  // Accuracy %
  const accuracy = log?.total_reviews > 0
    ? Math.round((log.correct_count / log.total_reviews) * 100)
    : null;

  const levelStyle = LEVEL_CHIP[word?.level] ?? { bg: "#f5f5f5", color: "#555" };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── Back ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: colors.greenStarbucks }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          Từ vựng
        </Typography>
      </Box>

      {/* ── Hero card ── */}
      <SbCard sx={{ p: { xs: 3, md: 4 } }}>
        {isLoading ? (
          <>
            <Skeleton width="40%" height={56} />
            <Skeleton width="25%" height={28} sx={{ mt: 1 }} />
          </>
        ) : (
          <>
            {/* Top row: level + bookmark */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                {word.level && (
                  <Chip
                    label={word.level}
                    size="small"
                    sx={{ bgcolor: levelStyle.bg, color: levelStyle.color, fontWeight: 700, fontSize: "0.75rem" }}
                  />
                )}
                {word.part_of_speech && (
                  <Chip
                    label={POS_LABEL[word.part_of_speech] ?? word.part_of_speech}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.75rem" }}
                  />
                )}
              </Box>
              <Tooltip title={word.is_bookmarked ? "Bỏ bookmark" : "Bookmark"}>
                <IconButton
                  onClick={() => toggleBookmark()}
                  disabled={bookmarkPending}
                  sx={{ color: word.is_bookmarked ? colors.gold : "text.secondary" }}
                >
                  {word.is_bookmarked
                    ? <BookmarkRoundedIcon />
                    : <BookmarkBorderRoundedIcon />}
                </IconButton>
              </Tooltip>
            </Box>

            {/* Word + phonetic + TTS */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: "2.2rem", md: "2.8rem" }, color: colors.greenStarbucks, lineHeight: 1 }}>
                {word.text}
              </Typography>
              <Tooltip title="Phát âm">
                <IconButton onClick={() => speak(word.text)} sx={{ color: colors.greenAccent }}>
                  <VolumeUpRoundedIcon sx={{ fontSize: 28 }} />
                </IconButton>
              </Tooltip>
            </Box>
            {word.phonetic && (
              <Typography sx={{ fontSize: "1.1rem", color: "text.secondary", mb: 2, fontStyle: "italic" }}>
                {word.phonetic}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Definitions */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                  Định nghĩa (EN)
                </Typography>
                <Typography sx={{ fontSize: "1rem", color: "text.primary", lineHeight: 1.6 }}>
                  {word.definition_en || "—"}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                  Nghĩa tiếng Việt
                </Typography>
                <Typography sx={{ fontSize: "1rem", color: "text.primary", lineHeight: 1.6 }}>
                  {word.definition_vi || "—"}
                </Typography>
              </Box>
            </Box>

            {/* Examples */}
            {(word.example_en || word.example_vi) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ bgcolor: colors.greenLight + "40", borderRadius: "12px", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: colors.greenHouse, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Ví dụ
                  </Typography>
                  {word.example_en && (
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Typography sx={{ fontSize: "0.95rem", color: "text.primary", fontStyle: "italic", flex: 1, lineHeight: 1.5 }}>
                        "{word.example_en}"
                      </Typography>
                      <IconButton size="small" onClick={() => speak(word.example_en)} sx={{ color: colors.greenAccent, flexShrink: 0, mt: "-2px" }}>
                        <VolumeUpRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  )}
                  {word.example_vi && (
                    <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                      → {word.example_vi}
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </>
        )}
      </SbCard>

      {/* ── SRS stats card ── */}
      <SbCard>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
              Trạng thái ôn tập (SRS)
            </Typography>
            {isLoading ? (
              <Skeleton width={160} height={20} />
            ) : log ? (
              <Typography sx={{ fontSize: "0.8rem", color: isDue ? "#ef5350" : "text.secondary", fontWeight: isDue ? 700 : 400 }}>
                {isDue
                  ? `Đến hạn ôn hôm nay!`
                  : `Ôn tiếp ngày ${log.next_review_date ?? "—"}`}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                Chưa học từ này
              </Typography>
            )}
          </Box>
          {isDue && (
            <SbButton
              variant="primary"
              size="small"
              startIcon={<RepeatRoundedIcon />}
              onClick={() => navigate("/review")}
            >
              Ôn ngay
            </SbButton>
          )}
        </Box>

        {isLoading ? (
          <Grid container spacing={1}>
            {[1,2,3,4].map(i => <Grid item xs={3} key={i}><Skeleton height={80} /></Grid>)}
          </Grid>
        ) : log ? (
          <>
            <Grid container spacing={0} sx={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <Grid item xs={6} sm={3} sx={{ borderRight: "1px solid rgba(0,0,0,0.06)", borderBottom: { xs: "1px solid rgba(0,0,0,0.06)", sm: "none" } }}>
                <SrsStat
                  icon={<RepeatRoundedIcon />}
                  label="Tổng lần ôn"
                  value={log.total_reviews}
                  color={colors.greenAccent}
                />
              </Grid>
              <Grid item xs={6} sm={3} sx={{ borderRight: { sm: "1px solid rgba(0,0,0,0.06)" }, borderBottom: { xs: "1px solid rgba(0,0,0,0.06)", sm: "none" } }}>
                <SrsStat
                  icon={<CheckCircleRoundedIcon />}
                  label="Độ chính xác"
                  value={accuracy !== null ? `${accuracy}%` : "—"}
                  sub={`${log.correct_count}/${log.total_reviews} đúng`}
                  color="#43a047"
                />
              </Grid>
              <Grid item xs={6} sm={3} sx={{ borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                <SrsStat
                  icon={<CalendarTodayRoundedIcon />}
                  label="Khoảng cách ôn"
                  value={`${log.interval_days} ngày`}
                  color="#1e88e5"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SrsStat
                  icon={<TrendingUpRoundedIcon />}
                  label="Hệ số dễ (EF)"
                  value={log.easiness_factor}
                  sub="≥ 2.5 là tốt"
                  color={log.easiness_factor >= 2.5 ? "#43a047" : "#ef5350"}
                />
              </Grid>
            </Grid>

            {/* Accuracy bar */}
            {accuracy !== null && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Độ chính xác tổng thể</Typography>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: accuracy >= 70 ? "#43a047" : "#ef5350" }}>
                    {accuracy}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={accuracy}
                  sx={{
                    height: 6, borderRadius: 3,
                    bgcolor: "rgba(0,0,0,0.06)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: accuracy >= 70 ? "#43a047" : accuracy >= 40 ? colors.gold : "#ef5350",
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
            <RepeatRoundedIcon sx={{ fontSize: 36, mb: 1, opacity: 0.4 }} />
            <Typography sx={{ fontSize: "0.875rem" }}>
              Học bài học chứa từ này để bắt đầu theo dõi tiến trình SRS.
            </Typography>
          </Box>
        )}
      </SbCard>

    </Box>
  );
};

export default WordDetailPage;
