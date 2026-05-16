import { Chip, Box } from "@mui/material";
import { LocalFireDepartmentRounded as LocalFireDepartmentRoundedIcon } from "@mui/icons-material";
import { StarRounded as StarRoundedIcon } from "@mui/icons-material";
import { BoltRounded as BoltRoundedIcon } from "@mui/icons-material";
import { EmojiEventsRounded as EmojiEventsRoundedIcon } from "@mui/icons-material";
import { colors } from "@/styles/theme";

/**
 * SbBadge – pill badge cho gamification stats.
 *
 * type:
 *   "xp"      – XP điểm kinh nghiệm (green accent)
 *   "level"   – Cấp độ hiện tại (starbucks green)
 *   "streak"  – Streak ngày học (gold)
 *   "rewards" – Phần thưởng (gold outline)
 *   "custom"  – Tùy chỉnh hoàn toàn
 */
const typeConfig = {
  xp: {
    icon: <BoltRoundedIcon sx={{ fontSize: 14 }} />,
    bgcolor: colors.greenAccent,
    color: "#fff",
    label: (v) => `${v} XP`,
  },
  level: {
    icon: <EmojiEventsRoundedIcon sx={{ fontSize: 14 }} />,
    bgcolor: colors.greenStarbucks,
    color: "#fff",
    label: (v) => `Level ${v}`,
  },
  streak: {
    icon: <LocalFireDepartmentRoundedIcon sx={{ fontSize: 14 }} />,
    bgcolor: "transparent",
    color: colors.gold,
    border: `1px solid ${colors.gold}`,
    label: (v) => `${v} ngày`,
  },
  rewards: {
    icon: <StarRoundedIcon sx={{ fontSize: 14 }} />,
    bgcolor: "transparent",
    color: colors.gold,
    border: `1px solid ${colors.gold}`,
    label: (v) => `${v}★`,
  },
};

const SbBadge = ({
  type = "xp",
  value,
  label,
  size = "small",
  sx,
}) => {
  const cfg = typeConfig[type];
  const displayLabel = label ?? (cfg?.label ? cfg.label(value) : String(value));

  return (
    <Chip
      icon={cfg?.icon}
      label={displayLabel}
      size={size}
      sx={{
        borderRadius: "50px",
        fontWeight: 700,
        fontSize: size === "small" ? "0.72rem" : "0.8125rem",
        letterSpacing: "0.02em",
        height: size === "small" ? 24 : 32,
        bgcolor: cfg?.bgcolor ?? colors.greenAccent,
        color: cfg?.color ?? "#fff",
        border: cfg?.border ?? "none",
        "& .MuiChip-icon": {
          color: "inherit",
          marginLeft: "6px",
        },
        "& .MuiChip-label": {
          px: 0.75,
        },
        ...sx,
      }}
    />
  );
};

/**
 * SbStatRow – nhóm nhiều badge trên một hàng ngang.
 * Dùng trên sidebar hoặc profile card.
 */
export const SbStatRow = ({ xp, level, streak, sx }) => (
  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", ...sx }}>
    {level   !== undefined && <SbBadge type="level"  value={level} />}
    {xp      !== undefined && <SbBadge type="xp"     value={xp} />}
    {streak  !== undefined && <SbBadge type="streak" value={streak} />}
  </Box>
);

export default SbBadge;
