import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Skeleton, Alert, Divider, IconButton, Tooltip, Snackbar,
  LinearProgress,
} from "@mui/material";
import SearchRoundedIcon              from "@mui/icons-material/SearchRounded";
import BookmarkBorderRoundedIcon      from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon            from "@mui/icons-material/BookmarkRounded";
import CollectionsBookmarkRoundedIcon from "@mui/icons-material/CollectionsBookmarkRounded";
import VolumeUpRoundedIcon            from "@mui/icons-material/VolumeUpRounded";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";
import vocabularyApi from "@/api/vocabularyApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "TOEIC"];

const LEVEL_COLOR = {
  A1:    { bg: "#e8f5e9", color: "#2e7d32" },
  A2:    { bg: "#e3f2fd", color: "#1565c0" },
  B1:    { bg: "#fff3e0", color: "#e65100" },
  B2:    { bg: "#fce4ec", color: "#c62828" },
  C1:    { bg: "#ede7f6", color: "#4527a0" },
  C2:    { bg: "#fafafa", color: "#37474f" },
  TOEIC: { bg: "#e0f7fa", color: "#006064" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
};

// ── WordSetDetailDialog ───────────────────────────────────────────────────────

const WordSetDetailDialog = ({ open, setId, onClose }) => {
  const [bookmarkState, setBookmarkState] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["wordset-detail", setId],
    queryFn: () => vocabularyApi.getSet(setId).then((r) => r.data),
    enabled: open && !!setId,
    staleTime: 0,
  });

  // Khởi tạo trạng thái bookmark từ dữ liệu API
  useEffect(() => {
    if (data?.words) {
      const init = {};
      data.words.forEach(({ word }) => { init[word.id] = word.is_bookmarked; });
      setBookmarkState(init);
    }
  }, [data]);

  const bookmarkMut = useMutation({
    mutationFn: (wordId) => vocabularyApi.bookmarkWord(wordId),
    onSuccess: (res, wordId) => {
      const added = res.data.bookmarked;
      setBookmarkState((prev) => ({ ...prev, [wordId]: added }));
      setToastMsg(added ? "Đã thêm vào bookmark" : "Đã bỏ bookmark");
    },
  });

  const set = data;
  const lc  = LEVEL_COLOR[set?.level] ?? {};

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper"
        PaperProps={{ sx: { borderRadius: "16px", maxHeight: "85vh" } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "12px", bgcolor: `${colors.greenAccent}18`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <CollectionsBookmarkRoundedIcon sx={{ color: colors.greenAccent, fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: colors.greenStarbucks }}>
                {isLoading ? <Skeleton width={180} /> : set?.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                {set?.level && (
                  <Chip label={set.level} size="small"
                    sx={{ height: 20, fontWeight: 700, fontSize: "0.7rem", bgcolor: lc.bg, color: lc.color }} />
                )}
                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  {isLoading ? "" : `${set?.word_count ?? 0} từ`}
                </Typography>
              </Box>
            </Box>
          </Box>
          {set?.description && (
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mt: 1, ml: "60px" }}>
              {set.description}
            </Typography>
          )}
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton width="30%" height={20} />
                  <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
                </Box>
              ))}
            </Box>
          ) : !set?.words?.length ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ color: "text.secondary" }}>Bộ từ chưa có từ nào.</Typography>
            </Box>
          ) : (
            set.words.map(({ word }, idx) => {
              const isBookmarked = bookmarkState[word.id] ?? word.is_bookmarked;
              return (
                <Box key={word.id} sx={{
                  display: "flex", alignItems: "center", gap: 2,
                  px: 3, py: 1.75,
                  borderBottom: idx < set.words.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.015)" },
                  transition: "background 0.15s",
                }}>
                  {/* Số thứ tự */}
                  <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", minWidth: 24, textAlign: "right" }}>
                    {idx + 1}
                  </Typography>

                  {/* Word info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: colors.greenStarbucks }}>
                        {word.text}
                      </Typography>
                      {word.phonetic && (
                        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {word.phonetic}
                        </Typography>
                      )}
                      {word.part_of_speech && (
                        <Chip label={word.part_of_speech} size="small"
                          sx={{ height: 18, fontSize: "0.68rem", color: "text.secondary", bgcolor: "rgba(0,0,0,0.06)" }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: "0.85rem", color: "text.primary", mt: 0.25 }}>
                      {word.definition_vi}
                    </Typography>
                  </Box>

                  {/* Level chip */}
                  {word.level && (() => { const lc2 = LEVEL_COLOR[word.level] ?? {}; return (
                    <Chip label={word.level} size="small"
                      sx={{ height: 20, fontWeight: 700, fontSize: "0.68rem", bgcolor: lc2.bg, color: lc2.color, flexShrink: 0 }} />
                  ); })()}

                  {/* TTS */}
                  <Tooltip title="Nghe phát âm" arrow>
                    <IconButton size="small" onClick={() => speak(word.text)}
                      sx={{ color: "text.secondary", "&:hover": { color: colors.greenAccent } }}>
                      <VolumeUpRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>

                  {/* Bookmark */}
                  <Tooltip title={isBookmarked ? "Bỏ bookmark" : "Bookmark từ này"} arrow>
                    <IconButton size="small"
                      onClick={() => bookmarkMut.mutate(word.id)}
                      disabled={bookmarkMut.isPending}
                      sx={{ color: isBookmarked ? colors.greenAccent : "text.secondary" }}>
                      {isBookmarked
                        ? <BookmarkRoundedIcon sx={{ fontSize: 20 }} />
                        : <BookmarkBorderRoundedIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <SbButton variant="outlined" onClick={onClose}>Đóng</SbButton>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toastMsg} autoHideDuration={2000} onClose={() => setToastMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={toastMsg} />
    </>
  );
};

// ── WordSetCard ───────────────────────────────────────────────────────────────

const WordSetCard = ({ set, onClick }) => {
  const lc = LEVEL_COLOR[set.level] ?? {};
  return (
    <Box onClick={onClick} sx={{
      borderRadius: "14px", border: "1px solid rgba(0,0,0,0.08)",
      bgcolor: "background.paper",
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      p: 2.5, cursor: "pointer",
      transition: "transform 0.15s, box-shadow 0.15s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" },
      height: "100%", display: "flex", flexDirection: "column",
    }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: "10px", bgcolor: `${colors.greenAccent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CollectionsBookmarkRoundedIcon sx={{ color: colors.greenAccent, fontSize: 20 }} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          {set.level && (
            <Chip label={set.level} size="small"
              sx={{ height: 20, fontWeight: 700, fontSize: "0.7rem", bgcolor: lc.bg, color: lc.color }} />
          )}
          <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
            {set.word_count ?? 0} từ
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: colors.greenStarbucks, mb: 0.5 }} noWrap>
        {set.name}
      </Typography>

      {set.description ? (
        <Typography sx={{
          fontSize: "0.82rem", color: "text.secondary", flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {set.description}
        </Typography>
      ) : (
        <Box sx={{ flex: 1 }} />
      )}

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5 }}>
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
          {set.created_by_name}
        </Typography>
        {!set.is_public && (
          <Chip label="Riêng tư" size="small"
            sx={{ height: 18, fontSize: "0.65rem", color: "text.secondary", bgcolor: "rgba(0,0,0,0.06)" }} />
        )}
      </Box>
    </Box>
  );
};

// ── Main WordSetsPage ─────────────────────────────────────────────────────────

const WordSetsPage = () => {
  const [search, setSearch]       = useState("");
  const [levelFilter, setLevel]   = useState("");
  const [debouncedSearch, setDS]  = useState("");
  const [detailDlg, setDetailDlg] = useState({ open: false, setId: null });

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => setDS(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wordsets-public", debouncedSearch, levelFilter],
    queryFn: () =>
      vocabularyApi.getSets({
        search: debouncedSearch || undefined,
        level:  levelFilter  || undefined,
        page_size: 60,
      }).then((r) => r.data),
    staleTime: 30_000,
  });

  const sets = data?.results ?? data ?? [];

  const handleOpen  = (setId) => setDetailDlg({ open: true, setId });
  const handleClose = () => setDetailDlg({ open: false, setId: null });

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <CollectionsBookmarkRoundedIcon sx={{ color: colors.greenAccent, fontSize: 26 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: colors.greenStarbucks }}>
            Bộ từ vựng
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
          Khám phá các bộ từ được tuyển chọn theo chủ đề và cấp độ
        </Typography>
      </Box>

      {/* Search + Level filter */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Tìm bộ từ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          <Chip
            label="Tất cả"
            onClick={() => setLevel("")}
            sx={{
              fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
              bgcolor: !levelFilter ? colors.greenAccent : "rgba(0,0,0,0.07)",
              color: !levelFilter ? "#fff" : "text.secondary",
            }}
          />
          {LEVELS.map((lv) => {
            const lc = LEVEL_COLOR[lv] ?? {};
            const active = levelFilter === lv;
            return (
              <Chip
                key={lv}
                label={lv}
                onClick={() => setLevel(active ? "" : lv)}
                sx={{
                  fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                  bgcolor: active ? lc.color : lc.bg || "rgba(0,0,0,0.07)",
                  color: active ? "#fff" : lc.color || "text.secondary",
                  border: active ? "none" : `1px solid ${lc.color || "transparent"}33`,
                }}
              />
            );
          })}
        </Box>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách bộ từ. Vui lòng thử lại.
        </Alert>
      )}

      {/* Count */}
      {!isLoading && (
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 2 }}>
          {sets.length} bộ từ
          {levelFilter ? ` · ${levelFilter}` : ""}
          {debouncedSearch ? ` · "${debouncedSearch}"` : ""}
        </Typography>
      )}

      {/* Grid */}
      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: "14px" }} />
              </Grid>
            ))
          : sets.length === 0
            ? (
              <Grid item xs={12}>
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <CollectionsBookmarkRoundedIcon sx={{ fontSize: 56, color: colors.greenAccent, opacity: 0.2, mb: 1 }} />
                  <Typography sx={{ color: "text.secondary" }}>
                    {debouncedSearch || levelFilter
                      ? "Không tìm thấy bộ từ phù hợp."
                      : "Chưa có bộ từ nào."}
                  </Typography>
                </Box>
              </Grid>
            )
            : sets.map((s) => (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <WordSetCard set={s} onClick={() => handleOpen(s.id)} />
              </Grid>
            ))}
      </Grid>

      {/* Detail Dialog */}
      <WordSetDetailDialog
        open={detailDlg.open}
        setId={detailDlg.setId}
        onClose={handleClose}
      />
    </Box>
  );
};

export default WordSetsPage;
