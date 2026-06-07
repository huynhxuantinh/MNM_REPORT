import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Avatar, CircularProgress, Chip } from "@mui/material";
import { keyframes } from "@mui/system";
import { colors } from "@/styles/theme";
import learningApi from "@/services/learningApi";

const floatUp = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(203,162,88,0.4), 0 0 40px rgba(203,162,88,0.2); }
  50% { box-shadow: 0 0 35px rgba(203,162,88,0.7), 0 0 70px rgba(203,162,88,0.35); }
`;

const pulseGlowSilver = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(192,200,220,0.4), 0 0 40px rgba(192,200,220,0.15); }
  50% { box-shadow: 0 0 30px rgba(192,200,220,0.6), 0 0 60px rgba(192,200,220,0.25); }
`;

const pulseGlowBronze = keyframes`
  0%, 100% { box-shadow: 0 0 18px rgba(205,127,50,0.4), 0 0 36px rgba(205,127,50,0.15); }
  50% { box-shadow: 0 0 28px rgba(205,127,50,0.6), 0 0 50px rgba(205,127,50,0.25); }
`;

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const starTwinkle = keyframes`
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const crownBounce = keyframes`
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-6px) rotate(5deg); }
`;

const rotateStar = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1,
  delay: `${Math.random() * 4}s`,
  duration: `${Math.random() * 2 + 2}s`,
}));

const StarField = () => (
  <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
    {STARS.map((s) => (
      <Box
        key={s.id}
        sx={{
          position: "absolute",
          top: s.top,
          left: s.left,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          animation: `${starTwinkle} ${s.duration} ${s.delay} ease-in-out infinite`,
        }}
      />
    ))}
  </Box>
);

const RANK_CFG = {
  1: {
    gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 60%, #f6d365 100%)",
    glow: pulseGlow,
    glowColor: "rgba(246,211,101,0.55)",
    border: "rgba(246,211,101,0.8)",
    crown: "👑",
    label: "#1",
    avatarSize: 96,
    height: 210,
    zIndex: 3,
    shimmerColor: "rgba(255,255,255,0.35)",
    badge: "#FFD700",
  },
  2: {
    gradient: "linear-gradient(135deg, #c0c8dc 0%, #8a9bb4 60%, #c0c8dc 100%)",
    glow: pulseGlowSilver,
    glowColor: "rgba(192,200,220,0.45)",
    border: "rgba(192,200,220,0.8)",
    crown: "🥈",
    label: "#2",
    avatarSize: 76,
    height: 170,
    zIndex: 2,
    shimmerColor: "rgba(255,255,255,0.25)",
    badge: "#C0C8DC",
  },
  3: {
    gradient: "linear-gradient(135deg, #e8a87c 0%, #c57d4f 60%, #e8a87c 100%)",
    glow: pulseGlowBronze,
    glowColor: "rgba(205,127,50,0.45)",
    border: "rgba(205,127,50,0.8)",
    crown: "🥉",
    label: "#3",
    avatarSize: 68,
    height: 150,
    zIndex: 1,
    shimmerColor: "rgba(255,255,255,0.20)",
    badge: "#CD7F32",
  },
};

const getDisplayName = (user) => {
  const fullName = user?.full_name?.trim();
  if (fullName) return fullName;
  const username = user?.username?.trim();
  if (username) return username;
  return `User ${user?.id ?? user?.user_id ?? ""}`.trim();
};

const getAvatarInitial = (user) => getDisplayName(user).charAt(0)?.toUpperCase() || "?";

const PodiumItem = ({ user, fixedWidth = false }) => {
  const cfg = RANK_CFG[user.rank];
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: fixedWidth ? "0 1 260px" : 1,
        px: { xs: 0.5, sm: 1.5 },
        zIndex: cfg.zIndex,
        animation: user.rank === 1 ? `${floatUp} 3s ease-in-out infinite` : `${floatUp} 3.5s ${user.rank === 2 ? "0.5s" : "1s"} ease-in-out infinite`,
      }}
    >
      <Typography
        sx={{
          fontSize: user.rank === 1 ? "2.4rem" : "1.8rem",
          mb: -0.5,
          lineHeight: 1,
          animation: `${crownBounce} 2s ease-in-out infinite`,
          animationDelay: `${user.rank * 0.3}s`,
          filter: `drop-shadow(0 0 8px ${cfg.glowColor})`,
        }}
      >
        {cfg.crown}
      </Typography>

      <Box sx={{ position: "relative", mb: 1.5, "&::before": { content: '""', position: "absolute", inset: -4, borderRadius: "50%", background: cfg.gradient, zIndex: -1, animation: `${cfg.glow} 2.5s ease-in-out infinite` } }}>
        <Avatar
          src={user.avatar_url}
          sx={{
            width: cfg.avatarSize,
            height: cfg.avatarSize,
            border: `3px solid ${cfg.border}`,
            fontSize: user.rank === 1 ? "2.2rem" : "1.6rem",
            fontWeight: 900,
            background: "linear-gradient(135deg, #1c1f2e, #252836)",
            color: cfg.badge,
          }}
        >
          {getAvatarInitial(user)}
        </Avatar>
      </Box>

      <Typography sx={{ fontWeight: 900, fontSize: user.rank === 1 ? "1.05rem" : "0.88rem", color: "#fff", textAlign: "center", mb: 0.5, maxWidth: 150, px: 0.5, lineHeight: 1.35, textShadow: `0 2px 6px rgba(0,0,0,0.9), 0 0 16px ${cfg.glowColor}, 0 0 30px ${cfg.glowColor}`, wordBreak: "break-word", overflowWrap: "break-word", letterSpacing: "0.01em" }}>
        {getDisplayName(user)}
      </Typography>

      <Box sx={{ width: "100%", height: cfg.height, borderRadius: "18px 18px 0 0", background: cfg.gradient, backgroundSize: "800px 100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, pt: 1, "&::after": { content: '""', position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%", background: `linear-gradient(90deg, transparent, ${cfg.shimmerColor}, transparent)`, animation: `${shimmer} 3s ${user.rank * 0.4}s ease-in-out infinite` } }}>
        <Typography sx={{ fontWeight: 900, fontSize: user.rank === 1 ? "2.4rem" : "1.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
          {cfg.label}
        </Typography>
        <Typography sx={{ fontWeight: 900, fontSize: user.rank === 1 ? "1.9rem" : "1.4rem", color: "#fff", lineHeight: 1, textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.3)", letterSpacing: "-0.02em" }}>
          {user.xp.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.95)", fontWeight: 800, letterSpacing: "0.12em", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          XP TUẦN
        </Typography>
        <Chip label={`Lv.${user.level}`} size="small" sx={{ mt: 0.75, bgcolor: "rgba(0,0,0,0.35)", color: "#fff", fontWeight: 900, fontSize: "0.75rem", height: 22, border: "1px solid rgba(255,255,255,0.4)", letterSpacing: "0.04em" }} />
        <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.92)", fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          🔥 {user.streak ?? 0}
        </Typography>
      </Box>
    </Box>
  );
};

const rankRowColors = [
  { bg: "rgba(0,116,74,0.12)", border: "rgba(0,116,74,0.35)", text: colors.greenAccent },
  { bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.25)", text: "#60a5fa" },
  { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", text: "#fbbf24" },
  { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", text: "#a78bfa" },
  { bg: "rgba(251,113,133,0.08)", border: "rgba(251,113,133,0.25)", text: "#fb7185" },
];

const RankRow = ({ user, delay }) => {
  const colorSet = rankRowColors[(user.rank - 4) % rankRowColors.length];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: "14px 20px", borderRadius: "16px", border: `1px solid ${colorSet.border}`, background: colorSet.bg, backdropFilter: "blur(8px)", cursor: "default", transition: "all 0.25s ease", animation: `${slideInLeft} 0.5s ${delay}s both`, "&:hover": { transform: "translateX(6px) scale(1.01)", border: `1px solid ${colorSet.text}`, background: colorSet.bg.replace("0.08", "0.15").replace("0.12", "0.20"), boxShadow: `0 4px 20px ${colorSet.border}` } }}>
      <Box sx={{ minWidth: 42, height: 42, borderRadius: "12px", background: `linear-gradient(135deg, ${colorSet.text}22, ${colorSet.text}44)`, border: `1.5px solid ${colorSet.text}55`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1rem", color: colorSet.text, flexShrink: 0 }}>
        #{user.rank}
      </Box>
      <Avatar src={user.avatar_url} sx={{ width: 44, height: 44, border: `2px solid ${colorSet.text}66`, fontWeight: 800, bgcolor: `${colorSet.text}22`, color: colorSet.text, fontSize: "1.1rem", flexShrink: 0 }}>
        {getAvatarInitial(user)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {getDisplayName(user)}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>
          Level {user.level} • Streak {user.streak ?? 0} • {user.sessions_completed ?? 0} phiên
        </Typography>
      </Box>
      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", color: colorSet.text, lineHeight: 1 }}>
          {user.xp.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 700, letterSpacing: "0.06em" }}>
          XP TUẦN
        </Typography>
      </Box>
    </Box>
  );
};

const LeaderboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-weekly"],
    queryFn: () => learningApi.getCurrentLeague().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Box sx={{ textAlign: "center" }}>
          <Box sx={{ width: 56, height: 56, mx: "auto", mb: 2, fontSize: "2.5rem", animation: `${rotateStar} 2s linear infinite`, display: "flex", alignItems: "center", justifyContent: "center" }}>⭐</Box>
          <CircularProgress size={28} sx={{ color: colors.gold }} />
        </Box>
      </Box>
    );
  }

  const leaderboard = data?.leaderboard || [];
  const top3 = leaderboard.slice(0, 3).map((item) => ({ ...item, xp: item.xp_earned }));
  const others = leaderboard.slice(3).map((item) => ({ ...item, xp: item.xp_earned }));
  const podiumSlots = top3.length === 1
    ? [top3[0]]
    : top3.length === 2
      ? [top3[1], top3[0]]
      : [top3[1], top3[0], top3[2]];

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", pb: 6, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ position: "relative", borderRadius: "28px", overflow: "hidden", mb: 4, py: { xs: 4, sm: 5 }, px: 3, background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 40%, #0d2137 80%, #0f2027 100%)", animation: `${fadeInUp} 0.6s both` }}>
        <StarField />
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography sx={{ fontSize: "2.8rem", lineHeight: 1, mb: 1, filter: "drop-shadow(0 0 16px rgba(246,211,101,0.6))" }}>🏆</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.7rem", sm: "2.3rem" }, background: "linear-gradient(270deg, #f6d365, #fda085, #f97316, #f6d365)", backgroundSize: "300% 300%", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", color: "#f6d365", animation: `${shimmer} 4s ease infinite`, letterSpacing: "-0.02em", mb: 0.5 }}>
            Top Tuần
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.04em" }}>
            {data?.season?.title || "BXH tuần hiện tại"}
          </Typography>
        </Box>
      </Box>

      {top3.length > 0 && (
        <Box sx={{ position: "relative", px: { xs: 0, sm: 2 }, mb: 5, animation: `${fadeInUp} 0.7s 0.1s both`, overflow: "visible" }}>
          <Box sx={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: 2, background: "linear-gradient(90deg, transparent, rgba(246,211,101,0.5), rgba(246,211,101,0.7), rgba(246,211,101,0.5), transparent)", borderRadius: "50%", filter: "blur(4px)" }} />
          {podiumSlots.length === 1 ? (
            <Box sx={{ display: "flex", justifyContent: "center", overflow: "visible" }}>
              <PodiumItem user={podiumSlots[0]} fixedWidth />
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "visible" }}>
              {podiumSlots.map((slot) => (
                <PodiumItem key={`${slot.rank}-${slot.user_id}`} user={slot} />
              ))}
            </Box>
          )}
        </Box>
      )}

      {data?.me && (
        <Box sx={{ mb: 3, p: 2, borderRadius: "18px", background: "rgba(0,116,74,0.08)", border: "1px solid rgba(0,116,74,0.2)" }}>
          <Typography sx={{ fontWeight: 800, color: colors.greenAccent, mb: 0.5 }}>Vị trí của bạn tuần này</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Hạng #{data.me.rank} • {(data.me.xp_earned ?? 0).toLocaleString()} XP tuần
          </Typography>
        </Box>
      )}

      {others.length > 0 && (
        <Box sx={{ animation: `${fadeInUp} 0.6s 0.2s both` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, px: 0.5 }}>
            <Box sx={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))", borderRadius: 1 }} />
            <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "text.secondary", letterSpacing: "0.12em", textTransform: "uppercase" }}>Thứ hạng tiếp theo</Typography>
            <Box sx={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)", borderRadius: 1 }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {others.map((user, idx) => (
              <RankRow key={user.user_id} user={user} delay={0.05 * idx} />
            ))}
          </Box>
        </Box>
      )}

      {!leaderboard.length && (
        <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
          <Typography sx={{ fontSize: "3rem", mb: 2 }}>🌌</Typography>
          <Typography sx={{ fontWeight: 700 }}>Tuần này chưa có bảng xếp hạng</Typography>
          <Typography sx={{ fontSize: "0.875rem", mt: 0.5 }}>Hãy hoàn thành bài học để lên bảng.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default LeaderboardPage;
