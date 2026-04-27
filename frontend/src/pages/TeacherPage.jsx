import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  Box, Typography, Tab, Tabs, Divider,
} from "@mui/material";
import CastForEducationRoundedIcon from "@mui/icons-material/CastForEducationRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import { colors } from "@/styles/theme";

// Tab panels — sẽ được điền nội dung ở các bước tiếp theo
import TeacherDashboard from "@/features/teacher/TeacherDashboard";
import TeacherLessons   from "@/features/teacher/TeacherLessons";
import TeacherAssignments from "@/features/teacher/TeacherAssignments";

const TABS = [
  { label: "Tổng quan",   icon: <DashboardRoundedIcon />,   component: <TeacherDashboard /> },
  { label: "Bài học",     icon: <MenuBookRoundedIcon />,     component: <TeacherLessons /> },
  { label: "Giao bài",    icon: <AssignmentRoundedIcon />,   component: <TeacherAssignments /> },
];

const TeacherPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [tab, setTab] = useState(0);

  // Guard: chỉ teacher và admin mới vào được
  if (!["teacher", "admin"].includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 44, height: 44, borderRadius: "12px",
            bgcolor: colors.greenAccent,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CastForEducationRoundedIcon sx={{ color: "#fff", fontSize: 24 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>
            Quản lý giáo viên
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft }}>
            Xin chào, {user?.full_name || user?.username}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ bgcolor: "#fff", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              color: colors.textBlackSoft,
              minHeight: 52,
              gap: 0.75,
            },
            "& .Mui-selected": { color: colors.greenAccent, fontWeight: 700 },
            "& .MuiTabs-indicator": { bgcolor: colors.greenAccent, height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          {TABS.map(({ label, icon }) => (
            <Tab key={label} label={label} icon={icon} iconPosition="start" />
          ))}
        </Tabs>

        <Divider />

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {TABS[tab].component}
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherPage;
