import { Skeleton, Box, Grid, Card, CardContent } from "@mui/material";

/**
 * Skeleton components for loading states
 * Follows Starbucks design system styling
 */

// ── Table Skeleton ───────────────────────────────────────────────────────────

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {/* Header */}
    <Box sx={{ display: "flex", gap: 2, mb: 2, px: 2 }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={`header-${i}`}
          variant="rectangular"
          height={32}
          sx={{
            flex: 1,
            borderRadius: "8px",
            bgcolor: "rgba(0, 117, 74, 0.08)",
          }}
        />
      ))}
    </Box>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box
        key={`row-${rowIndex}`}
        sx={{
          display: "flex",
          gap: 2,
          mb: 1.5,
          px: 2,
          py: 1.5,
          borderRadius: "10px",
          bgcolor: rowIndex % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`cell-${rowIndex}-${colIndex}`}
            variant="rectangular"
            height={24}
            sx={{
              flex: 1,
              borderRadius: "6px",
            }}
          />
        ))}
      </Box>
    ))}
  </Box>
);

// ── Card Skeleton ───────────────────────────────────────────────────────────

export const CardSkeleton = ({ count = 3 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid item xs={12} sm={6} md={4} key={i}>
        <Card
          sx={{
            borderRadius: "14px",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Skeleton
                variant="circular"
                width={44}
                height={44}
                sx={{ bgcolor: "rgba(0, 117, 74, 0.1)" }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="50%" height={16} />
              </Box>
            </Box>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="70%" height={20} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// ── Stats Card Skeleton ───────────────────────────────────────────────────────

export const StatsCardSkeleton = ({ count = 3 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid item xs={12} sm={4} key={i}>
        <Box
          sx={{
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: "14px",
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Skeleton
            variant="rounded"
            width={50}
            height={50}
            sx={{ borderRadius: "13px", bgcolor: "rgba(0, 117, 74, 0.1)" }}
          />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={48} height={36} />
            <Skeleton variant="text" width={100} height={16} />
          </Box>
        </Box>
      </Grid>
    ))}
  </Grid>
);

// ── Lesson Card Skeleton (for Study/Review pages) ──────────────────────────────

export const WordCardSkeleton = () => (
  <Box
    sx={{
      bgcolor: "#fff",
      borderRadius: "16px",
      p: { xs: 2.5, sm: 4 },
      boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
      minHeight: { xs: 300, sm: 360 },
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {/* Word text skeleton */}
    <Skeleton
      variant="text"
      width={200}
      height={60}
      sx={{ mb: 1, bgcolor: "rgba(0, 117, 74, 0.1)" }}
    />

    {/* Phonetic skeleton */}
    <Skeleton variant="text" width={120} height={24} sx={{ mb: 4 }} />

    {/* POS chip skeleton */}
    <Skeleton
      variant="rounded"
      width={80}
      height={28}
      sx={{ borderRadius: "50px", mb: 3, bgcolor: "rgba(0, 117, 74, 0.1)" }}
    />

    {/* Definition skeleton */}
    <Skeleton variant="text" width="90%" height={30} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="70%" height={30} sx={{ mb: 4 }} />

    {/* Example skeleton */}
    <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
    <Skeleton variant="text" width="60%" height={20} />
  </Box>
);

// ── List Item Skeleton ───────────────────────────────────────────────────────

export const ListItemSkeleton = ({ count = 5 }) => (
  <Box>
    {Array.from({ length: count }).map((_, i) => (
      <Box
        key={i}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: 2,
          px: 2,
          borderBottom: i < count - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}
      >
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
        <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: "50px" }} />
      </Box>
    ))}
  </Box>
);

// ── Form Skeleton ────────────────────────────────────────────────────────────

export const FormSkeleton = ({ fields = 4 }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
    {Array.from({ length: fields }).map((_, i) => (
      <Box key={i}>
        <Skeleton variant="text" width={100} height={16} sx={{ mb: 0.5 }} />
        <Skeleton
          variant="rounded"
          width="100%"
          height={48}
          sx={{ borderRadius: "12px", bgcolor: "rgba(0,0,0,0.04)" }}
        />
      </Box>
    ))}
    <Skeleton
      variant="rounded"
      width="100%"
      height={44}
      sx={{ borderRadius: "50px", mt: 2, bgcolor: "rgba(0, 117, 74, 0.2)" }}
    />
  </Box>
);

// ── Page Header Skeleton ───────────────────────────────────────────────────────

export const PageHeaderSkeleton = () => (
  <Box sx={{ mb: 3 }}>
    <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
    <Skeleton variant="text" width={300} height={20} />
  </Box>
);

// ── Dashboard Skeleton (Teacher/Admin) ────────────────────────────────────────

export const DashboardSkeleton = () => (
  <Box>
    <PageHeaderSkeleton />
    <Box sx={{ mb: 3.5 }}>
      <StatsCardSkeleton count={3} />
    </Box>
    <Grid container spacing={3}>
      <Grid item xs={12} lg={6}>
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: "12px",
            p: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
          <TableSkeleton rows={3} columns={4} />
        </Box>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: "12px",
            p: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
          <TableSkeleton rows={3} columns={4} />
        </Box>
      </Grid>
    </Grid>
  </Box>
);

// ── Export all ───────────────────────────────────────────────────────────────

const Skeletons = {
  Table: TableSkeleton,
  Card: CardSkeleton,
  StatsCard: StatsCardSkeleton,
  WordCard: WordCardSkeleton,
  ListItem: ListItemSkeleton,
  Form: FormSkeleton,
  PageHeader: PageHeaderSkeleton,
  Dashboard: DashboardSkeleton,
};

export default Skeletons;
