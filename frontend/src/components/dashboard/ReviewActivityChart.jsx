import { Skeleton } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "@/styles/theme";

const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const ReviewActivityChart = ({ data, loading }) => {
  if (loading) return <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />;
  if (!data?.length) return null;

  const formatted = data.map((d, i) => ({ ...d, label: i % 5 === 0 ? fmtDate(d.date) : "" }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.greenAccent} stopOpacity={0.28} />
            <stop offset="95%" stopColor={colors.greenAccent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "text.secondary" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "text.secondary" }} axisLine={false} tickLine={false} />
        <ChartTooltip
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", fontSize: 12 }}
          formatter={(value) => [value, "Tu da on"]}
          labelFormatter={(_, payload) => (payload?.[0]?.payload?.date ? fmtDate(payload[0].payload.date) : "")}
        />
        <Area type="monotone" dataKey="count" stroke={colors.greenAccent} strokeWidth={2} fill="url(#reviewGrad)" dot={false} activeDot={{ r: 4, fill: colors.greenAccent }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ReviewActivityChart;

