import { TextField, InputAdornment } from "@mui/material";
import { colors } from "@/styles/theme";

/**
 * SbInput – Starbucks floating-label input field.
 *
 * Áp dụng:
 * - Green Accent focus border
 * - Green tint background khi hợp lệ
 * - Red tint background khi lỗi
 * - Floating label animation
 */
const SbInput = ({
  label,
  error,
  success,
  helperText,
  startAdornment,
  endAdornment,
  sx,
  ...props
}) => {
  const getBgColor = () => {
    if (error)   return "hsl(4 82% 43% / 5%)";
    if (success) return "rgba(212,233,226,0.33)";
    return "transparent";
  };

  return (
    <TextField
      label={label}
      error={error}
      helperText={helperText}
      variant="outlined"
      fullWidth
      InputProps={{
        startAdornment: startAdornment && (
          <InputAdornment position="start">{startAdornment}</InputAdornment>
        ),
        endAdornment: endAdornment && (
          <InputAdornment position="end">{endAdornment}</InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "8px",
          backgroundColor: getBgColor(),
          transition: "background-color 0.2s ease",
          "& fieldset": { borderColor: error ? colors.red : "rgba(0,0,0,0.23)" },
          "&:hover fieldset": {
            borderColor: error ? colors.red : colors.greenUplift,
          },
          "&.Mui-focused fieldset": {
            borderColor: error ? colors.red : colors.greenAccent,
            borderWidth: 2,
          },
        },
        "& .MuiInputLabel-root": {
          color: colors.textBlackSoft,
          "&.Mui-focused": { color: error ? colors.red : colors.greenAccent },
        },
        "& .MuiFormHelperText-root": {
          marginLeft: 0,
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export default SbInput;
