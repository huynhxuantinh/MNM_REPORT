import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Avatar, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import { colors } from "@/styles/theme";
import learningApi from "@/api/learningApi";

const PodiumItem = ({ user, rank }) => {
  if (!user) return <Box sx={{ flex: 1 }} />;
  
  const isFirst = rank === 1;
  const rankColor = rank === 1 ? colors.gold : rank === 2 ? "#b0bec5" : "#d7ccc8"; // Gold, Silver, Bronze
  const height = rank === 1 ? 200 : rank === 2 ? 160 : 140;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, px: { xs: 0.5, sm: 1 }, zIndex: isFirst ? 2 : 1 }}>
      {/* Crown/Medal */}
      <EmojiEventsRoundedIcon sx={{ fontSize: isFirst ? 56 : 40, color: rankColor, mb: -1.5, zIndex: 10, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
      
      {/* Avatar */}
      <Avatar
        src={user.avatar_url}
        sx={{
          width: isFirst ? 80 : 64, height: isFirst ? 80 : 64,
          border: `4px solid ${rankColor}`, mb: 1, bgcolor: "background.paper",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        {user.full_name?.charAt(0)}
      </Avatar>
      
      {/* Podium Block */}
      <Box
        sx={{
          width: "100%", height,
          bgcolor: rankColor,
          borderRadius: "16px 16px 0 0",
          display: "flex", flexDirection: "column", alignItems: "center", pt: 2, pb: 1,
          boxShadow: isFirst ? "0 -8px 24px rgba(0,0,0,0.15)" : "none",
          backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.05) 100%)",
          overflow: "hidden"
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: "1.8rem", color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.2)", lineHeight: 1 }}>
          #{rank}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#fff", textAlign: "center", px: 1, mt: 1, width: "100%" }} noWrap>
          {user.full_name}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", mt: 0.5, textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
          {user.xp} <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.9 }}>XP</Typography>
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
          Level {user.level}
        </Typography>
      </Box>
    </Box>
  );
};

const LeaderboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => learningApi.getLeaderboard().then(r => r.data)
  });

  if (isLoading) return <Box sx={{ textAlign: "center", mt: 10 }}><CircularProgress sx={{ color: colors.greenAccent }} /></Box>;

  const top3 = data?.slice(0, 3) || [];
  const others = data?.slice(3) || [];

  // Thứ tự hiển thị bục: Hạng 2 (Trái) - Hạng 1 (Giữa) - Hạng 3 (Phải)
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", pb: 5 }}>
      <Box sx={{ mb: 5, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.8rem", sm: "2.2rem" }, color: colors.greenStarbucks }}>
          Bảng Vàng Thành Tích
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          Top học viên xuất sắc nhất hệ thống
        </Typography>
      </Box>

      {/* Podium */}
      {top3.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", mb: 5, px: { xs: 0, sm: 4 }, height: 260 }}>
          <PodiumItem user={podiumOrder[0]} rank={2} />
          <PodiumItem user={podiumOrder[1]} rank={1} />
          <PodiumItem user={podiumOrder[2]} rank={3} />
        </Box>
      )}

      {/* List */}
      {others.length > 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#fafafa" }}>
                <TableCell sx={{ fontWeight: 800, color: "text.secondary", width: 60, borderBottom: "2px solid rgba(0,0,0,0.06)" }}>Hạng</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "text.secondary", borderBottom: "2px solid rgba(0,0,0,0.06)" }}>Học viên</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "text.secondary", borderBottom: "2px solid rgba(0,0,0,0.06)" }}>Level</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "text.secondary", borderBottom: "2px solid rgba(0,0,0,0.06)" }}>XP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {others.map((user, idx) => (
                <TableRow key={user.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell sx={{ fontWeight: 800, color: "text.secondary", fontSize: "1.1rem" }}>#{idx + 4}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar src={user.avatar_url} sx={{ width: 38, height: 38, bgcolor: `${colors.greenAccent}22`, color: colors.greenStarbucks, fontWeight: 700 }}>
                        {user.full_name?.charAt(0)}
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, color: "text.primary" }}>{user.full_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography sx={{ fontWeight: 700, color: "text.secondary", bgcolor: "rgba(0,0,0,0.04)", py: 0.5, px: 1, borderRadius: "6px", display: "inline-block", minWidth: 24 }}>
                      {user.level}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>{user.xp} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>XP</Typography></Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default LeaderboardPage;
