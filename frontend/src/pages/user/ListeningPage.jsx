import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { HeadphonesRounded as HeadphonesRoundedIcon } from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const LEVEL_FILTERS = ["all", "A1", "A2", "B1"];

const ListeningCard = ({ passage, onStart, isStarting }) => (
  <SbCard sx={{ border: `1px solid ${colors.greenAccent}22` }}>
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>
            {passage.title}
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
            {passage.level} · {passage.topic || "general"} · {passage.estimated_seconds || 30}s ·{" "}
            {passage.question_count || 0} câu hỏi
          </Typography>
        </Box>
        <Chip
          icon={<HeadphonesRoundedIcon sx={{ fontSize: "14px !important" }} />}
          label="Listening"
          size="small"
          sx={{ bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent, fontWeight: 700 }}
        />
      </Stack>

      <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", lineHeight: 1.65 }}>
        {passage.translation_vi || "Nghe một đoạn ngắn, sau đó trả lời toàn bộ câu hỏi nghe hiểu của bài."}
      </Typography>

      <Stack direction="row" justifyContent="flex-end">
        <SbButton
          variant="primary"
          startIcon={<HeadphonesRoundedIcon />}
          onClick={() => onStart(passage.id)}
          loading={isStarting}
        >
          Bắt đầu nghe
        </SbButton>
      </Stack>
    </Stack>
  </SbCard>
);

const ListeningPage = () => {
  const navigate = useNavigate();
  const [levelFilter, setLevelFilter] = useState("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["listening-passages"],
    queryFn: () => learningApi.getListeningPassages().then((response) => response.data),
    staleTime: 0,
  });

  const startMutation = useMutation({
    mutationFn: (passageId) =>
      learningApi.startListeningPassageSession(passageId).then((response) => response.data),
    onSuccess: (session) => {
      navigate(`/listening/session/${session.id}`);
    },
  });

  const passages = useMemo(() => {
    const items = data?.results || [];
    if (levelFilter === "all") return items;
    return items.filter((item) => item.level === levelFilter);
  }, [data?.results, levelFilter]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          {error?.response?.data?.detail || "Không thể tải danh sách bài nghe."}
        </Alert>
        <SbButton variant="outlined" onClick={() => refetch()}>
          Thử lại
        </SbButton>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: colors.greenStarbucks }}>
          Luyện nghe
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
          Mỗi bài là một đoạn nghe hoàn chỉnh. Nghe trước, rồi trả lời toàn bộ câu hỏi ở dưới như một bài
          mini test.
        </Typography>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Cấp độ</InputLabel>
          <Select value={levelFilter} label="Cấp độ" onChange={(event) => setLevelFilter(event.target.value)}>
            {LEVEL_FILTERS.map((level) => (
              <MenuItem key={level} value={level}>
                {level === "all" ? "Tất cả" : level}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
          {passages.length} bài nghe khả dụng
        </Typography>
      </Stack>

      {!!startMutation.error && (
        <Alert severity="error">
          {startMutation.error?.response?.data?.detail || "Không thể bắt đầu bài nghe."}
        </Alert>
      )}

      {passages.length === 0 ? (
        <Alert severity="info">Chưa có bài nghe phù hợp với bộ lọc hiện tại.</Alert>
      ) : (
        <Stack spacing={1.25}>
          {passages.map((passage) => (
            <ListeningCard
              key={`passage-${passage.id}`}
              passage={passage}
              onStart={(passageId) => startMutation.mutate(passageId)}
              isStarting={startMutation.isPending && startMutation.variables === passage.id}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default ListeningPage;
