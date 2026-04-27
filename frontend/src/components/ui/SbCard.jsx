import { Card, CardContent } from "@mui/material";
import { colors } from "@/styles/theme";

/**
 * SbCard – Starbucks-style content card.
 *
 * variant:
 *   "default" – White card on warm canvas (standard)
 *   "dark"    – House Green panel (Rewards / feature)
 *   "gold"    – Gold-cream surface (partnership / premium)
 *   "cream"   – Ceramic/warm-cream surface (utility)
 */
const variantStyles = {
  default: {
    bgcolor: "#fff",
    color: colors.textBlack,
  },
  dark: {
    bgcolor: colors.greenHouse,
    color: colors.textWhite,
  },
  gold: {
    bgcolor: colors.goldLightest,
    color: colors.textBlack,
  },
  cream: {
    bgcolor: colors.ceramic,
    color: colors.textBlack,
  },
};

const SbCard = ({
  variant = "default",
  noPadding = false,
  children,
  sx,
  contentSx,
  ...props
}) => {
  const style = variantStyles[variant] ?? variantStyles.default;

  return (
    <Card
      sx={{
        borderRadius: "12px",
        boxShadow: "0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)",
        backgroundImage: "none",
        bgcolor: style.bgcolor,
        color: style.color,
        ...sx,
      }}
      {...props}
    >
      {noPadding ? children : (
        <CardContent sx={{ p: "20px 24px", "&:last-child": { pb: "20px" }, ...contentSx }}>
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default SbCard;
