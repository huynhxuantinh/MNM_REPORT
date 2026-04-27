import { Avatar, Box, Tooltip, LinearProgress, Typography } from "@mui/material";
import { colors } from "@/styles/theme";

/**
 * SbAvatar – avatar với level ring và XP progress.
 *
 * Props:
 *   user      – { username, full_name, level, xp }
 *   size      – "sm" | "md" | "lg"
 *   showRing  – hiển thị vòng tròn level (default: true)
 *   showXP    – hiển thị XP progress bar bên dưới (default: false)
 */
const sizeMap = {
  sm: { avatar: 32, ring: 36, fontSize: "0.75rem", stroke: 2 },
  md: { avatar: 40, ring: 46, fontSize: "0.875rem", stroke: 2.5 },
  lg: { avatar: 56, ring: 64, fontSize: "1rem", stroke: 3 },
};

const getInitials = (user) => {
  if (!user) return "?";
  const name = user.full_name || user.username || "";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
};

const getLevelXpThreshold = (level) => 100 * level * (level + 1) / 2;

const SbAvatar = ({
  user,
  size = "md",
  showRing = true,
  showXP = false,
  tooltip,
  sx,
}) => {
  const dim = sizeMap[size] ?? sizeMap.md;
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const prevThreshold = getLevelXpThreshold(level - 1);
  const nextThreshold = getLevelXpThreshold(level);
  const progress = nextThreshold > prevThreshold
    ? Math.round(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
    : 100;

  const avatarEl = (
    <Box
      sx={{
        position: "relative",
        width: showRing ? dim.ring : dim.avatar,
        height: showRing ? dim.ring : dim.avatar,
        flexShrink: 0,
        ...sx,
      }}
    >
      {showRing && (
        <Box
          component="svg"
          viewBox="0 0 100 100"
          sx={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            transform: "rotate(-90deg)",
          }}
        >
          {/* Track */}
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={`rgba(255,255,255,0.15)`}
            strokeWidth={dim.stroke * 2}
          />
          {/* Progress */}
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={colors.greenAccent}
            strokeWidth={dim.stroke * 2}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </Box>
      )}

      <Avatar
        alt={user?.username}
        sx={{
          width: dim.avatar,
          height: dim.avatar,
          fontSize: dim.fontSize,
          fontWeight: 700,
          bgcolor: colors.greenAccent,
          color: "#fff",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {getInitials(user)}
      </Avatar>

      {/* Level badge nhỏ góc phải dưới */}
      {showRing && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: dim.stroke * 7,
            height: dim.stroke * 7,
            borderRadius: "50%",
            bgcolor: colors.gold,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${dim.stroke * 2.2}px`,
            fontWeight: 800,
            border: "2px solid #fff",
            lineHeight: 1,
          }}
        >
          {level}
        </Box>
      )}
    </Box>
  );

  const wrapped = tooltip
    ? <Tooltip title={tooltip} arrow placement="bottom">{avatarEl}</Tooltip>
    : avatarEl;

  if (!showXP) return wrapped;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {wrapped}
      <Box sx={{ width: "100%" }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 4, borderRadius: 2 }}
        />
        <Typography variant="caption" sx={{ color: colors.textBlackSoft, fontSize: "0.7rem" }}>
          {xp} / {nextThreshold} XP
        </Typography>
      </Box>
    </Box>
  );
};

export default SbAvatar;
