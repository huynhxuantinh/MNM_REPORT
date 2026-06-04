import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { PeopleRounded as PeopleRoundedIcon } from "@mui/icons-material";
import { PersonRounded as PersonRoundedIcon } from "@mui/icons-material";
import { AdminPanelSettingsRounded as AdminPanelSettingsRoundedIcon } from "@mui/icons-material";
import { LibraryBooksRounded as LibraryBooksRoundedIcon } from "@mui/icons-material";
import { MenuBookRounded as MenuBookRoundedIcon } from "@mui/icons-material";
import { RepeatRounded as RepeatRoundedIcon } from "@mui/icons-material";
import { QuizRounded as QuizRoundedIcon } from "@mui/icons-material";
import { TrendingUpRounded as TrendingUpRoundedIcon } from "@mui/icons-material";
import { InsightsRounded as InsightsRoundedIcon } from "@mui/icons-material";
import { RocketLaunchRounded as RocketLaunchRoundedIcon } from "@mui/icons-material";
import { BoltRounded as BoltRoundedIcon } from "@mui/icons-material";
import { FlagRounded as FlagRoundedIcon } from "@mui/icons-material";
import { BeenhereRounded as BeenhereRoundedIcon } from "@mui/icons-material";
import adminApi from "@/services/adminApi";

const ADMIN_ACCENT = "#5c6bc0";
const ADMIN_BG = "#1a1f3a";

const StatCard = ({ icon, label, value, color, loading, sub }) => (
  <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            bgcolor: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ color, display: "flex" }}>{icon}</Box>
        </Box>
      </Box>

      {loading ? (
        <>
          <Skeleton width="60%" height={36} />
          <Skeleton width="80%" height={20} sx={{ mt: 0.5 }} />
        </>
      ) : (
        <>
          <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: ADMIN_BG, lineHeight: 1 }}>
            {typeof value === "number" ? value.toLocaleString() : value ?? "-"}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.5 }}>{label}</Typography>
          {sub && (
            <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 0.25 }}>{sub}</Typography>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const SectionTitle = ({ children }) => (
  <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: ADMIN_BG, mb: 2, mt: 1 }}>{children}</Typography>
);

const toPct = (value) => (value === null || value === undefined ? "-" : `${value}%`);

const AdminDashboard = () => {
  const [range, setRange] = useState("7d");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ["learning-kpi-baseline", range],
    queryFn: () => adminApi.getLearningKpiBaseline(range).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ["learning-kpi-funnel", range],
    queryFn: () => adminApi.getLearningOnboardingFunnel(range).then((r) => r.data),
    staleTime: 30_000,
  });

  const s = data ?? {};
  const k = kpiData ?? {};
  const f = funnelData ?? {};

  const onboardingSub = useMemo(() => {
    const enter = f?.counts?.placement_enter ?? 0;
    const submit = f?.counts?.placement_submit ?? 0;
    return `${submit}/${enter} placement submit`;
  }, [f]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>System Dashboard</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
          Product + learning KPI snapshot
        </Typography>
      </Box>

      <SectionTitle>Learning KPI</SectionTitle>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1.5, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>Range filter</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={range}
          onChange={(_, value) => value && setRange(value)}
        >
          <ToggleButton value="7d">7d</ToggleButton>
          <ToggleButton value="28d">28d</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard icon={<InsightsRoundedIcon />} label="D1 retention" value={toPct(k?.retention?.d1)} color="#00897b" loading={kpiLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard icon={<InsightsRoundedIcon />} label="D7 retention" value={toPct(k?.retention?.d7)} color="#1e88e5" loading={kpiLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard icon={<RocketLaunchRoundedIcon />} label="First lesson start rate" value={toPct(k?.first_lesson_start_rate)} color="#7cb342" loading={kpiLoading} sub={onboardingSub} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard icon={<BeenhereRoundedIcon />} label="Session completion rate" value={toPct(k?.session_completion_rate)} color="#fb8c00" loading={kpiLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard icon={<FlagRoundedIcon />} label="Daily goal claim rate" value={toPct(k?.daily_goal_claim_rate)} color="#8e24aa" loading={kpiLoading} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <SectionTitle>User</SectionTitle>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard icon={<PeopleRoundedIcon />} label="Total users" value={s.total_users} color={ADMIN_ACCENT} loading={isLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard icon={<PersonRoundedIcon />} label="Learners" value={s.students} color="#43a047" loading={isLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard icon={<AdminPanelSettingsRoundedIcon />} label="Admins" value={s.admins} color="#e53935" loading={isLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard icon={<TrendingUpRoundedIcon />} label="New this week" value={s.new_users_this_week} color="#00acc1" loading={isLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard icon={<PeopleRoundedIcon />} label="Active users" value={s.active_users} color="#7cb342" loading={isLoading} sub={`${s.inactive_users ?? 0} inactive`} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <SectionTitle>Content</SectionTitle>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={<LibraryBooksRoundedIcon />} label="Words" value={s.total_words} color="#8e24aa" loading={isLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={<MenuBookRoundedIcon />} label="Lessons" value={s.total_lessons} color="#1e88e5" loading={isLoading} sub={`${s.published_lessons ?? 0} published`} />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={<LibraryBooksRoundedIcon />} label="Word sets" value={s.total_wordsets} color="#6d4c41" loading={isLoading} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <SectionTitle>Activity</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={<RepeatRoundedIcon />} label="Reviews today" value={s.reviews_today} color="#00897b" loading={isLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={<RepeatRoundedIcon />} label="Total reviews" value={s.total_reviews} color="#039be5" loading={isLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={<QuizRoundedIcon />} label="Quiz results" value={s.total_quiz_results} color="#e91e63" loading={isLoading} />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={<BoltRoundedIcon />} label="Sessions per DAU" value={k?.sessions_per_dau ?? "-"} color="#3949ab" loading={kpiLoading || funnelLoading} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;


