import { Card, CardContent } from "@mui/material";
import { colors } from "@/styles/theme";

// "default" không set bgcolor/color — tự kế thừa từ MUI theme (tự adapt dark/light)
const variantStyles = {
  default: {},
  dark:  { bgcolor: colors.greenHouse,   color: colors.textWhite },
  gold:  { bgcolor: colors.goldLightest, color: "text.primary" },
  cream: { bgcolor: "action.hover",      color: "text.primary" },
};

const SbCard = ({
  variant = "default",
  noPadding = false,
  children,
  sx,
  contentSx,
  ...props
}) => {
  const style = variantStyles[variant] ?? {};

  return (
    <Card
      sx={{
        borderRadius: "12px",
        backgroundImage: "none",
        ...style,
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
