import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowForwardRounded as ArrowForwardRoundedIcon,
  AutoStoriesRounded as AutoStoriesRoundedIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
  EmailRounded as EmailRoundedIcon,
  EmojiEventsRounded as EmojiEventsRoundedIcon,
  FacebookRounded as FacebookRoundedIcon,
  GitHub as GitHubIcon,
  OpenInNewRounded as OpenInNewRoundedIcon,
  PsychologyRounded as PsychologyRoundedIcon,
  QueryStatsRounded as QueryStatsRoundedIcon,
} from "@mui/icons-material";
import { colors } from "@/styles/theme";

const facebookUrl = "https://www.facebook.com/afmzxje/";
const githubUrl = "https://github.com/huynhxuantinh";
const articleUrl = "https://www.zencityfoundation.org/post/tai-sao-hoc-tieng-anh-quan-trong";
const contactEmail = "afmzxje@gmail.com";

const pillars = [
  {
    icon: <PsychologyRoundedIcon />,
    title: "Ghi nhớ bằng SRS",
    text: "NoroStu dùng cơ chế ôn tập ngắt quãng SM-2 để đưa từ vựng quay lại đúng thời điểm cần ôn.",
  },
  {
    icon: <AutoStoriesRoundedIcon />,
    title: "Học theo bài",
    text: "Từ vựng được gom theo bài học và cấp độ, giúp người học đi theo một lộ trình rõ ràng.",
  },
  {
    icon: <QueryStatsRoundedIcon />,
    title: "Theo dõi tiến độ",
    text: "XP, streak, mục tiêu ngày và số từ đã học giúp người học thấy mình đang tiến bộ ra sao.",
  },
  {
    icon: <EmojiEventsRoundedIcon />,
    title: "Tạo động lực",
    text: "Bảng xếp hạng, tim, phần thưởng và quiz giúp việc học đều đặn hơn mà không quá nặng.",
  },
];

const steps = [
  "Tạo tài khoản và xác thực email.",
  "Làm placement hoặc bắt đầu từ cơ bản.",
  "Học bài mới theo lộ trình.",
  "Ôn tập SRS hằng ngày để nhớ lâu.",
  "Luyện quiz và theo dõi XP, level, streak.",
];

const ContactButton = ({ href, icon, children }) => (
  <Button
    component={Link}
    href={href}
    target={href.startsWith("http") ? "_blank" : undefined}
    rel={href.startsWith("http") ? "noreferrer" : undefined}
    variant="outlined"
    startIcon={icon}
    sx={{
      borderColor: "rgba(255,255,255,0.55)",
      color: "#fff",
      "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
    }}
  >
    {children}
  </Button>
);

const AboutPage = () => (
  <Box sx={{ minHeight: "100vh", bgcolor: colors.neutralWarm, color: "text.primary" }}>
    <Box
      component="header"
      sx={{
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        bgcolor: "background.paper",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box component={RouterLink} to="/about" sx={{ display: "flex", alignItems: "center", gap: 1.25, textDecoration: "none" }}>
          <Box component="img" src="/logo.png" alt="NoroStu" sx={{ width: 40, height: 40, borderRadius: 2 }} />
          <Box>
            <Typography sx={{ color: colors.greenStarbucks, fontWeight: 900, lineHeight: 1 }}>
              NoroStu
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.76rem" }}>
              Học từ vựng hiệu quả
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/login" variant="outlined">
            Đăng nhập
          </Button>
          <Button component={RouterLink} to="/register" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
            Bắt đầu
          </Button>
        </Stack>
      </Container>
    </Box>

    <Box
      component="main"
      sx={{
        background:
          "linear-gradient(140deg, rgba(0,98,65,0.12) 0%, rgba(242,240,235,1) 44%, rgba(203,162,88,0.16) 100%)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <Grid container spacing={{ xs: 4, md: 7 }} alignItems="center">
          <Grid item xs={12} md={7}>
            <Chip
              label="Self-learning English platform"
              sx={{ bgcolor: colors.greenLight, color: colors.greenHouse, fontWeight: 800, mb: 2 }}
            />
            <Typography
              component="h1"
              sx={{
                color: colors.greenStarbucks,
                fontSize: { xs: "2.5rem", md: "4.4rem" },
                lineHeight: 0.96,
                fontWeight: 900,
                maxWidth: 760,
              }}
            >
              Học từ vựng tiếng Anh đều hơn, nhớ lâu hơn.
            </Typography>
            <Typography sx={{ mt: 2.5, color: "text.secondary", fontSize: { xs: "1rem", md: "1.12rem" }, maxWidth: 680 }}>
              NoroStu kết hợp bài học, SRS, quiz, XP và streak để biến việc học từ vựng thành một thói quen dễ theo dõi.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
              <Button component={RouterLink} to="/register" size="large" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
                Tạo tài khoản miễn phí
              </Button>
              <Button component={RouterLink} to="/login" size="large" variant="outlined">
                Tôi đã có tài khoản
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box
              sx={{
                bgcolor: colors.greenHouse,
                color: "#fff",
                borderRadius: 4,
                p: { xs: 3, md: 4 },
                boxShadow: "0 24px 70px rgba(30,57,50,0.26)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box sx={{ position: "absolute", inset: "auto -30px -50px auto", width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(0,117,74,0.35)" }} />
              <Typography sx={{ fontWeight: 900, fontSize: "1.6rem", mb: 3 }}>
                Một ngày học trên NoroStu
              </Typography>
              <Stack spacing={2.2}>
                {steps.map((step, index) => (
                  <Box key={step} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", position: "relative" }}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        bgcolor: index === 0 ? colors.gold : "rgba(255,255,255,0.14)",
                        color: index === 0 ? colors.greenHouse : "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.86)", lineHeight: 1.55 }}>
                      {step}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>

    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Typography component="h2" sx={{ color: colors.greenStarbucks, fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 900, mb: 1 }}>
        NoroStu tập trung vào việc học thật
      </Typography>
      <Typography sx={{ color: "text.secondary", maxWidth: 760, mb: 4 }}>
        Trang web không phụ thuộc giáo viên hay gói học. Người học có thể tự bắt đầu, tự luyện, tự ôn và theo dõi kết quả mỗi ngày.
      </Typography>

      <Grid container spacing={2.5}>
        {pillars.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Box
              sx={{
                height: "100%",
                bgcolor: "background.paper",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 3,
                p: 2.5,
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              }}
            >
              <Box sx={{ color: colors.greenAccent, mb: 1.5, "& svg": { fontSize: 32 } }}>{item.icon}</Box>
              <Typography sx={{ fontWeight: 900, color: colors.greenStarbucks, mb: 1 }}>
                {item.title}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.92rem", lineHeight: 1.6 }}>
                {item.text}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>

    <Box sx={{ bgcolor: colors.greenStarbucks, color: "#fff" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: { md: "center" }, justifyContent: "space-between" }}>
        <Box>
          <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: "1.7rem", md: "2.2rem" } }}>
            Sẵn sàng bắt đầu lộ trình của bạn?
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>
            Tạo tài khoản, chọn placement hoặc học lại từ A1.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
            <ContactButton href={facebookUrl} icon={<FacebookRoundedIcon />}>
              Facebook
            </ContactButton>
            <ContactButton href={githubUrl} icon={<GitHubIcon />}>
              GitHub
            </ContactButton>
            <ContactButton href={articleUrl} icon={<OpenInNewRoundedIcon />}>
              Vì sao học tiếng Anh quan trọng?
            </ContactButton>
            <ContactButton href={`mailto:${contactEmail}`} icon={<EmailRoundedIcon />}>
              {contactEmail}
            </ContactButton>
          </Stack>
        </Box>
        <Button
          component={RouterLink}
          to="/register"
          variant="contained"
          endIcon={<CheckCircleRoundedIcon />}
          sx={{ bgcolor: "#fff", color: colors.greenStarbucks, "&:hover": { bgcolor: colors.greenLight } }}
        >
          Bắt đầu học
        </Button>
      </Container>
    </Box>

    <Container component="footer" maxWidth="lg" sx={{ py: 3 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
        © 2026 NoroStu. Học từ vựng tiếng Anh với SRS, quiz và lộ trình cá nhân.
      </Typography>
    </Container>
  </Box>
);

export default AboutPage;
