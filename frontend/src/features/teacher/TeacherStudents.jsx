import { Box, Typography } from "@mui/material";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import { colors } from "@/styles/theme";

const TeacherStudents = () => (
  <Box sx={{ textAlign: "center", py: 6 }}>
    <PeopleRoundedIcon sx={{ fontSize: 56, color: colors.greenAccent, opacity: 0.4, mb: 2 }} />
    <Typography sx={{ fontWeight: 700, color: colors.greenStarbucks, mb: 1 }}>
      Danh sách học sinh
    </Typography>
    <Typography sx={{ fontSize: "0.875rem", color: colors.textBlackSoft }}>
      Tính năng đang được phát triển.
    </Typography>
  </Box>
);

export default TeacherStudents;
