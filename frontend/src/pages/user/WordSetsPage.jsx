import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { SearchRounded as SearchRoundedIcon } from "@mui/icons-material";
import { BookmarkBorderRounded as BookmarkBorderRoundedIcon } from "@mui/icons-material";
import { BookmarkRounded as BookmarkRoundedIcon } from "@mui/icons-material";
import { CollectionsBookmarkRounded as CollectionsBookmarkRoundedIcon } from "@mui/icons-material";
import { VolumeUpRounded as VolumeUpRoundedIcon } from "@mui/icons-material";
import { AddRounded as AddRoundedIcon } from "@mui/icons-material";
import { QuizRounded as QuizRoundedIcon } from "@mui/icons-material";
import { SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import vocabularyApi from "@/services/vocabularyApi";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "TOEIC"];
const PAGE_SIZE = 18;

const LEVEL_COLOR = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" },
  A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" },
  B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" },
  C2: { bg: "#fafafa", color: "#37474f" },
  TOEIC: { bg: "#e0f7fa", color: "#006064" },
};

const EMPTY_FORM = { name: "", description: "", level: "", is_public: true };

const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
};

const WordSetDetailDialog = ({ open, setId, onClose, onStartQuiz }) => {
  const [bookmarkState, setBookmarkState] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["wordset-detail", setId],
    queryFn: () => vocabularyApi.getSet(setId).then((response) => response.data),
    enabled: open && !!setId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!data?.words) return;
    const initialState = {};
    data.words.forEach(({ word }) => {
      initialState[word.id] = word.is_bookmarked;
    });
    setBookmarkState(initialState);
  }, [data]);

  const bookmarkMutation = useMutation({
    mutationFn: (wordId) => vocabularyApi.bookmarkWord(wordId),
    onSuccess: (response, wordId) => {
      const added = response.data.bookmarked;
      setBookmarkState((prev) => ({ ...prev, [wordId]: added }));
      setToastMsg(added ? "Đã thêm vào bookmark" : "Đã bỏ bookmark");
    },
  });

  const setData = data;
  const setLevelColor = LEVEL_COLOR[setData?.level] ?? {};
  const wordCount = setData?.word_count ?? setData?.words?.length ?? 0;
  const canStartQuiz = wordCount >= 4;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { borderRadius: "16px", maxHeight: "85vh" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                bgcolor: `${colors.greenAccent}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CollectionsBookmarkRoundedIcon sx={{ color: colors.greenAccent, fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: colors.greenStarbucks }}>
                {isLoading ? <Skeleton width={220} /> : setData?.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                {setData?.level && (
                  <Chip
                    label={setData.level}
                    size="small"
                    sx={{
                      height: 20,
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      bgcolor: setLevelColor.bg,
                      color: setLevelColor.color,
                    }}
                  />
                )}
                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  {isLoading ? "" : `${wordCount} từ`}
                </Typography>
              </Box>
            </Box>
          </Box>
          {setData?.description && (
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mt: 1, ml: "60px" }}>
              {setData.description}
            </Typography>
          )}
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          <Alert severity="info" sx={{ borderRadius: 0 }}>
            Mở bộ từ để nghe phát âm, bookmark từng từ hoặc làm quiz nhanh cho bộ từ này.
          </Alert>

          {isLoading ? (
            <Box sx={{ p: 3 }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Skeleton width="30%" height={20} />
                  <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
                </Box>
              ))}
            </Box>
          ) : !setData?.words?.length ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ color: "text.secondary" }}>Bộ từ này chưa có từ nào.</Typography>
            </Box>
          ) : (
            setData.words.map(({ word }, index) => {
              const isBookmarked = bookmarkState[word.id] ?? word.is_bookmarked;
              const wordLevelColor = LEVEL_COLOR[word.level] ?? {};

              return (
                <Box
                  key={word.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 3,
                    py: 1.75,
                    borderBottom: index < setData.words.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.015)" },
                    transition: "background 0.15s",
                  }}
                >
                  <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", minWidth: 24, textAlign: "right" }}>
                    {index + 1}
                  </Typography>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: colors.greenStarbucks }}>
                        {word.text}
                      </Typography>
                      {word.phonetic && (
                        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{word.phonetic}</Typography>
                      )}
                      {word.part_of_speech && (
                        <Chip
                          label={word.part_of_speech}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.68rem",
                            color: "text.secondary",
                            bgcolor: "rgba(0,0,0,0.06)",
                          }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: "0.85rem", color: "text.primary", mt: 0.25 }}>
                      {word.definition_vi}
                    </Typography>
                  </Box>

                  {word.level && (
                    <Chip
                      label={word.level}
                      size="small"
                      sx={{
                        height: 20,
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        bgcolor: wordLevelColor.bg,
                        color: wordLevelColor.color,
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <Tooltip title="Nghe phát âm" arrow>
                    <IconButton
                      size="small"
                      onClick={() => speak(word.text)}
                      sx={{ color: "text.secondary", "&:hover": { color: colors.greenAccent } }}
                    >
                      <VolumeUpRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={isBookmarked ? "Bỏ bookmark" : "Bookmark từ này"} arrow>
                    <IconButton
                      size="small"
                      onClick={() => bookmarkMutation.mutate(word.id)}
                      disabled={bookmarkMutation.isPending}
                      sx={{ color: isBookmarked ? colors.greenAccent : "text.secondary" }}
                    >
                      {isBookmarked ? (
                        <BookmarkRoundedIcon sx={{ fontSize: 20 }} />
                      ) : (
                        <BookmarkBorderRoundedIcon sx={{ fontSize: 20 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Tooltip
            arrow
            title={canStartQuiz ? "Tạo quiz nhanh từ bộ từ này" : "Cần ít nhất 4 từ để làm quiz"}
          >
            <Box>
              <SbButton
                variant="outlined"
                startIcon={<QuizRoundedIcon />}
                disabled={!canStartQuiz}
                onClick={() => onStartQuiz?.(setData)}
              >
                Làm quiz bộ từ
              </SbButton>
            </Box>
          </Tooltip>
          <SbButton variant="outlined" onClick={onClose}>
            Đóng
          </SbButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toastMsg}
        autoHideDuration={2000}
        onClose={() => setToastMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={toastMsg}
      />
    </>
  );
};

const WordSetCard = ({ set, onClick }) => {
  const levelColor = LEVEL_COLOR[set.level] ?? {};

  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.08)",
        bgcolor: "background.paper",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        p: 2.5,
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" },
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            bgcolor: `${colors.greenAccent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CollectionsBookmarkRoundedIcon sx={{ color: colors.greenAccent, fontSize: 20 }} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          {set.level && (
            <Chip
              label={set.level}
              size="small"
              sx={{ height: 20, fontWeight: 700, fontSize: "0.7rem", bgcolor: levelColor.bg, color: levelColor.color }}
            />
          )}
          <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>{set.word_count ?? 0} từ</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: colors.greenStarbucks, mb: 0.5 }} noWrap>
        {set.name}
      </Typography>

      {set.description ? (
        <Typography
          sx={{
            fontSize: "0.82rem",
            color: "text.secondary",
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {set.description}
        </Typography>
      ) : (
        <Box sx={{ flex: 1 }} />
      )}

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5, gap: 1 }}>
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }} noWrap>
          {set.created_by_name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {!set.is_public && (
            <Chip
              label="Riêng tư"
              size="small"
              sx={{ height: 18, fontSize: "0.65rem", color: "text.secondary", bgcolor: "rgba(0,0,0,0.06)" }}
            />
          )}
          <Chip
            label="Xem chi tiết"
            size="small"
            sx={{ height: 18, fontSize: "0.65rem", color: colors.greenAccent, bgcolor: `${colors.greenAccent}12` }}
          />
        </Box>
      </Box>
    </Box>
  );
};

const CreateWordSetDialog = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errMsg, setErrMsg] = useState("");

  const { mutate: createSet, isPending } = useMutation({
    mutationFn: (payload) => vocabularyApi.createSet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordsets-public"] });
      setForm(EMPTY_FORM);
      setErrMsg("");
      onClose();
    },
    onError: (error) => {
      setErrMsg(error?.response?.data?.name?.[0] || "Tạo bộ từ thất bại. Vui lòng thử lại.");
    },
  });

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrMsg("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: colors.greenStarbucks }}>Tạo bộ từ vựng mới</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        {errMsg && <Alert severity="error" sx={{ borderRadius: "10px" }}>{errMsg}</Alert>}

        <TextField
          label="Tên bộ từ"
          required
          fullWidth
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          inputProps={{ maxLength: 200 }}
        />

        <TextField
          label="Mô tả"
          fullWidth
          multiline
          rows={2}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          inputProps={{ maxLength: 500 }}
        />

        <FormControl fullWidth size="small">
          <InputLabel>Cấp độ</InputLabel>
          <Select value={form.level} label="Cấp độ" onChange={(event) => setForm({ ...form, level: event.target.value })}>
            <MenuItem value="">Không chọn</MenuItem>
            {LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={form.is_public}
              onChange={(event) => setForm({ ...form, is_public: event.target.checked })}
              sx={{ "& .MuiSwitch-thumb": { bgcolor: form.is_public ? colors.greenAccent : "#bbb" } }}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>{form.is_public ? "Công khai" : "Riêng tư"}</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {form.is_public ? "Tất cả người dùng đều xem được" : "Chỉ bạn và admin xem được"}
              </Typography>
            </Box>
          }
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">Hủy</Button>
        <Button
          onClick={() => createSet(form)}
          variant="contained"
          disabled={!form.name.trim() || isPending}
          sx={{ bgcolor: colors.greenAccent, borderRadius: "10px", textTransform: "none", "&:hover": { bgcolor: colors.greenStarbucks } }}
        >
          {isPending ? "Đang tạo..." : "Tạo bộ từ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const WordSetsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const canCreate = false;

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detailDialog, setDetailDialog] = useState({ open: false, setId: null });
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, levelFilter]);

  if (user?.role === "admin") {
    return <Navigate to="/admin/wordsets" replace />;
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wordsets-public", debouncedSearch, levelFilter, page],
    queryFn: () =>
      vocabularyApi.getSets({
        search: debouncedSearch || undefined,
        level: levelFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      }).then((response) => response.data),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  const isPaginated = !!data && typeof data === "object" && Array.isArray(data.results);
  const sets = isPaginated ? data.results : Array.isArray(data) ? data : [];
  const totalCount = isPaginated ? (data.count ?? sets.length) : sets.length;
  const totalPages = isPaginated ? Math.max(1, Math.ceil((data.count ?? 0) / PAGE_SIZE)) : 1;
  const showPagination = isPaginated && totalPages > 1;

  const handleOpenDetail = (setId) => setDetailDialog({ open: true, setId });
  const handleCloseDetail = () => setDetailDialog({ open: false, setId: null });
  const handleResetFilter = () => {
    setSearch("");
    setDebouncedSearch("");
    setLevelFilter("");
    setPage(1);
  };
  const handleStartQuiz = (setData) => {
    handleCloseDetail();
    navigate("/quiz", {
      state: {
        quizSource: {
          sourceType: "wordset",
          sourceId: setData.id,
          sourceName: setData.name,
        },
      },
    });
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <CollectionsBookmarkRoundedIcon sx={{ color: colors.greenAccent, fontSize: 26 }} />
            <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: colors.greenStarbucks }}>
              Bộ từ vựng
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
            Khám phá bộ từ theo chủ đề, nghe phát âm, bookmark và mở quiz nhanh khi cần.
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{
              bgcolor: colors.greenAccent,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": { bgcolor: colors.greenStarbucks },
            }}
          >
            Tạo bộ từ mới
          </Button>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
        Gợi ý: bấm vào một bộ từ để xem danh sách từ, nghe phát âm và mở quiz trực tiếp từ popup chi tiết.
      </Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Tìm bộ từ..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
            onClick={() => setLevelFilter("")}
            sx={{
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
              bgcolor: !levelFilter ? colors.greenAccent : "rgba(0,0,0,0.07)",
              color: !levelFilter ? "#fff" : "text.secondary",
            }}
          />
          {LEVELS.map((level) => {
            const levelColor = LEVEL_COLOR[level] ?? {};
            const active = levelFilter === level;
            return (
              <Chip
                key={level}
                label={level}
                onClick={() => setLevelFilter(active ? "" : level)}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  bgcolor: active ? levelColor.color : levelColor.bg || "rgba(0,0,0,0.07)",
                  color: active ? "#fff" : levelColor.color || "text.secondary",
                  border: active ? "none" : `1px solid ${levelColor.color || "transparent"}33`,
                }}
              />
            );
          })}
        </Box>

        {(search || levelFilter) && (
          <SbButton variant="outlined" size="small" onClick={handleResetFilter}>
            Xóa lọc
          </SbButton>
        )}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách bộ từ. Vui lòng thử lại.
        </Alert>
      )}

      {!isLoading && (
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 2 }}>
          {totalCount} bộ từ
          {levelFilter ? ` · ${levelFilter}` : ""}
          {debouncedSearch ? ` · \"${debouncedSearch}\"` : ""}
          {showPagination ? ` · trang ${page}/${totalPages}` : ""}
        </Typography>
      )}

      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 9 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: "14px" }} />
              </Grid>
            ))
          : sets.length === 0
            ? (
              <Grid item xs={12}>
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <CollectionsBookmarkRoundedIcon sx={{ fontSize: 56, color: colors.greenAccent, opacity: 0.2, mb: 1 }} />
                  <Typography sx={{ color: "text.secondary", mb: 1 }}>
                    {debouncedSearch || levelFilter ? "Không tìm thấy bộ từ phù hợp." : "Chưa có bộ từ nào."}
                  </Typography>
                  {(debouncedSearch || levelFilter) && (
                    <SbButton variant="outlined" size="small" onClick={handleResetFilter}>
                      Xóa điều kiện tìm kiếm
                    </SbButton>
                  )}
                </Box>
              </Grid>
            )
            : sets.map((setItem) => (
              <Grid item xs={12} sm={6} md={4} key={setItem.id}>
                <WordSetCard set={setItem} onClick={() => handleOpenDetail(setItem.id)} />
              </Grid>
            ))}
      </Grid>

      {showPagination && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, nextPage) => setPage(nextPage)}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Box>
      )}

      <WordSetDetailDialog
        open={detailDialog.open}
        setId={detailDialog.setId}
        onClose={handleCloseDetail}
        onStartQuiz={handleStartQuiz}
      />

      {canCreate && <CreateWordSetDialog open={openCreate} onClose={() => setOpenCreate(false)} />}
    </Box>
  );
};

export default WordSetsPage;
