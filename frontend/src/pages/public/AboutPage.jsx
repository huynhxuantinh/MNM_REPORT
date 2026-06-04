import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Link,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import {
  ArrowForwardRounded as ArrowForwardRoundedIcon,
  VolumeUpRounded as VolumeIcon,
  AutorenewRounded as LoopIcon,
  AutoStoriesRounded as BookIcon,
  EmojiEventsRounded as CupIcon,
  FactCheckRounded as CheckIcon,
  AltRouteRounded as RouteIcon,
  StyleRounded as CardIcon,
  UpdateRounded as UpdateIcon,
  LeaderboardRounded as LeaderboardIcon,
  EmailRounded as EmailIcon,
  FacebookRounded as FacebookIcon,
  GitHub as GitHubIcon,
  OpenInNewRounded as OpenInNewIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
} from "@mui/icons-material";
import { colors } from "@/styles/theme";

const facebookUrl = "https://www.facebook.com/afmzxje/";
const githubUrl = "https://github.com/huynhxuantinh";
const articleUrl = "https://www.zencityfoundation.org/post/tai-sao-hoc-tieng-anh-quan-trong";
const contactEmail = "afmzxje@gmail.com";

// Helper for SEO Metadata injection
const updateMetaTag = (name, content, isProperty = false) => {
  const attribute = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

// ── VĨ MÔ TEXT-TO-SPEECH PLAYBACK SYSTEM ──────────────────────────────────────
const speakWord = (word) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
};

// ── CUSTOM HEADER & FOOTER CONTACT BUTTON ─────────────────────────────────────
const ContactButton = ({ href, icon, children }) => (
  <Button
    component={Link}
    href={href}
    target={href.startsWith("http") ? "_blank" : undefined}
    rel={href.startsWith("http") ? "noreferrer" : undefined}
    variant="outlined"
    startIcon={icon}
    sx={{
      borderColor: "rgba(255,255,255,0.4)",
      color: "#fff",
      px: 3,
      py: 1.2,
      borderRadius: "30px",
      fontSize: "0.88rem",
      fontWeight: 800,
      textTransform: "none",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        borderColor: "#fff",
        bgcolor: "rgba(255,255,255,0.1)",
        transform: "translateY(-2px)",
      },
    }}
  >
    {children}
  </Button>
);

const AboutPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // ── SEO NÂNG CAO ──────────────────────────────────────────────────────────
    document.title = "NoroStu - Tự học Tiếng Anh hiệu quả bằng phương pháp khoa học";

    updateMetaTag("description", "NoroStu là nền tảng tự học tiếng Anh miễn phí đột phá. Ghi nhớ từ vựng lâu hơn gấp 10 lần bằng phương pháp khoa học, thẻ Flashcard tương tác 3D và thuật toán lặp lại ngắt quãng SRS.");
    updateMetaTag("keywords", "noro stu, norostu, tự học tiếng anh, học từ vựng, flashcard tiếng anh, thuật toán srs, lặp lại ngắt quãng, học tiếng anh game hóa");
    
    // Open Graph
    updateMetaTag("og:title", "NoroStu - Tự học Tiếng Anh hiệu quả bằng phương pháp khoa học", true);
    updateMetaTag("og:description", "Ghi nhớ từ vựng lâu hơn gấp 10 lần bằng thẻ Flashcard 3D và thuật toán ôn tập thông minh.", true);
    updateMetaTag("og:type", "website", true);
    updateMetaTag("og:url", window.location.href, true);
    updateMetaTag("og:image", window.location.origin + "/logo.png", true);

    // Twitter
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", "NoroStu - Tự học Tiếng Anh hiệu quả bằng phương pháp khoa học");
    updateMetaTag("twitter:description", "Ghi nhớ từ vựng lâu hơn gấp 10 lần bằng thẻ Flashcard 3D và thuật toán ôn tập thông minh.");

    // Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleSpeech = (e, word) => {
    e.stopPropagation();
    speakWord(word);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "#0d0f14" : colors.neutralWarm,
        color: "text.primary",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* ── STYLE SHEET FOR ANIMATIONS ───────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float1 {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float2 {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(-1.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes softPulse {
          0% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.08); opacity: 0.75; }
          100% { transform: scale(1); opacity: 0.55; }
        }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-on-scroll.revealed {
          opacity: 1;
          transform: translateY(0px);
        }
      `}} />

      {/* Decorative Orbs */}
      <Box
        sx={{
          position: "absolute",
          top: "-5%",
          left: "-10%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(colors.greenAccent, 0.1)} 0%, transparent 70%)`,
          animation: "softPulse 8s infinite ease-in-out",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "35%",
          right: "-10%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(colors.gold, 0.08)} 0%, transparent 70%)`,
          animation: "softPulse 10s infinite ease-in-out",
          animationDelay: "2.5s",
          pointerEvents: "none",
        }}
      />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          borderBottom: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          backdropFilter: "blur(16px)",
          backgroundColor: isDark ? "rgba(13, 15, 20, 0.8)" : "rgba(255, 255, 255, 0.85)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            py: 1.8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            component={RouterLink}
            to="/about"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="NoroStu Logo"
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                boxShadow: "0 6px 16px rgba(0,98,65,0.2)",
              }}
            />
            <Box>
              <Typography
                sx={{
                  color: isDark ? "#fff" : colors.greenStarbucks,
                  fontWeight: 900,
                  fontSize: "1.2rem",
                  letterSpacing: "-0.5px",
                  lineHeight: 1.1,
                }}
              >
                NoroStu
              </Typography>
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.2px",
                }}
              >
                TỰ HỌC TIẾNG ANH HIỆU QUẢ
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              sx={{
                borderRadius: "30px",
                px: 3,
                fontWeight: 800,
                borderColor: colors.greenAccent,
                color: isDark ? "#fff" : colors.greenAccent,
                "&:hover": {
                  bgcolor: alpha(colors.greenAccent, 0.08),
                  borderColor: colors.greenStarbucks,
                },
              }}
            >
              Đăng nhập
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              sx={{
                borderRadius: "30px",
                px: 3,
                fontWeight: 800,
                bgcolor: colors.greenAccent,
                color: "#fff",
                boxShadow: `0 4px 12px ${alpha(colors.greenAccent, 0.35)}`,
                "&:hover": {
                  bgcolor: colors.greenStarbucks,
                  boxShadow: `0 6px 16px ${alpha(colors.greenAccent, 0.45)}`,
                },
              }}
            >
              Bắt đầu học
            </Button>
          </Stack>
        </Container>
      </Box>

      <Box component="main">
        {/* ── SECTION 1: HERO ─────────────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          position: "relative",
          zIndex: 1,
          background: isDark
            ? "transparent"
            : "linear-gradient(150deg, rgba(0,98,65,0.06) 0%, rgba(242,240,235,1) 50%, rgba(203,162,88,0.08) 100%)",
        }}
      >
        <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 11 }, pb: { xs: 8, md: 13 } }}>
          <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
            {/* Left Column */}
            <Grid item xs={12} md={7.2}>
              <Box className="reveal-on-scroll">
                <Chip
                  label="🔥 Học tiếng Anh bằng thuật toán ghi nhớ SRS"
                  sx={{
                    bgcolor: isDark ? "rgba(0,117,74,0.18)" : colors.greenLight,
                    color: isDark ? "#4ade80" : colors.greenHouse,
                    fontWeight: 800,
                    px: 1.8,
                    py: 2,
                    mb: 3.5,
                    fontSize: "0.85rem",
                  }}
                />
                <Typography
                  component="h1"
                  sx={{
                    color: isDark ? "#fff" : colors.greenHouse,
                    fontSize: { xs: "2.4rem", sm: "3.2rem", md: "3.8rem", lg: "4.5rem" },
                    lineHeight: 1.15,
                    fontWeight: 900,
                    letterSpacing: "-1.5px",
                  }}
                >
                  Nhớ từ vựng lâu gấp 10 lần bằng <br />
                  <Box
                    component="span"
                    sx={{
                      background: `linear-gradient(135deg, ${colors.greenAccent} 0%, #469c66 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      display: "inline-block",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Phương pháp
                  </Box>{" "}
                  <Box
                    component="span"
                    sx={{
                      background: `linear-gradient(135deg, ${colors.gold} 0%, #e5c185 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      display: "inline-block",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Khoa học
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    mt: 3,
                    color: "text.secondary",
                    fontSize: { xs: "1.1rem", md: "1.22rem" },
                    lineHeight: 1.65,
                    maxWidth: 600,
                  }}
                >
                  NoroStu kết hợp hệ thống{" "}
                  <Box component="span" sx={{ fontWeight: 800, color: isDark ? "#fff" : "text.primary" }}>
                    Lặp lại ngắt quãng (SRS)
                  </Box>{" "}
                  cùng các yếu tố{" "}
                  <Box component="span" sx={{ fontWeight: 800, color: isDark ? "#fff" : "text.primary" }}>
                    trò chơi hóa (gamification)
                  </Box>{" "}
                  giúp bạn dễ dàng thiết lập thói quen học hàng ngày, ghi nhớ từ vựng sâu sắc và giao tiếp tự tin.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ mt: 5 }}>
                  <Button
                    component={RouterLink}
                    to="/register"
                    size="large"
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{
                      borderRadius: "30px",
                      px: 5,
                      py: 2,
                      fontWeight: 800,
                      fontSize: "1rem",
                      bgcolor: colors.greenAccent,
                      color: "#fff",
                      boxShadow: `0 8px 22px ${alpha(colors.greenAccent, 0.35)}`,
                      "&:hover": {
                        bgcolor: colors.greenStarbucks,
                        transform: "scale(1.02)",
                        boxShadow: `0 10px 26px ${alpha(colors.greenAccent, 0.45)}`,
                      },
                      transition: "all 0.3s cubic-bezier(0.2, 1, 0.2, 1)",
                    }}
                  >
                    Học miễn phí ngay
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    size="large"
                    variant="outlined"
                    sx={{
                      borderRadius: "30px",
                      px: 5,
                      py: 2,
                      fontWeight: 800,
                      fontSize: "1rem",
                      borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                      color: "text.primary",
                      "&:hover": {
                        borderColor: colors.greenAccent,
                        bgcolor: alpha(colors.greenAccent, 0.05),
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Đã có tài khoản
                  </Button>
                </Stack>
              </Box>
            </Grid>

            {/* Right Column 3D Mockup */}
            <Grid item xs={12} md={4.8} sx={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <Box
                className="reveal-on-scroll"
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 420,
                  height: 380,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* Floating semantic bubbles */}
                <Paper
                  elevation={2}
                  sx={{
                    position: "absolute",
                    top: -10,
                    left: -40,
                    bgcolor: colors.greenAccent,
                    color: "#fff",
                    borderRadius: "15px",
                    px: 2,
                    py: 0.8,
                    fontWeight: 900,
                    fontSize: "0.8rem",
                    animation: "float1 6s infinite ease-in-out",
                    zIndex: 10,
                  }}
                >
                  Fluent 🗣️
                </Paper>

                <Paper
                  elevation={2}
                  sx={{
                    position: "absolute",
                    top: 130,
                    right: -30,
                    bgcolor: colors.gold,
                    color: colors.greenHouse,
                    borderRadius: "15px",
                    px: 2,
                    py: 0.8,
                    fontWeight: 900,
                    fontSize: "0.8rem",
                    animation: "float2 7s infinite ease-in-out",
                    zIndex: 10,
                  }}
                >
                  Mastery 🏆
                </Paper>

                <Paper
                  elevation={2}
                  sx={{
                    position: "absolute",
                    bottom: 90,
                    left: -45,
                    bgcolor: "#336791",
                    color: "#fff",
                    borderRadius: "15px",
                    px: 2,
                    py: 0.8,
                    fontWeight: 900,
                    fontSize: "0.8rem",
                    animation: "float2 6.5s infinite ease-in-out",
                    zIndex: 10,
                  }}
                >
                  Vocabulary 📚
                </Paper>

                <Paper
                  elevation={2}
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: -10,
                    bgcolor: "#e65100",
                    color: "#fff",
                    borderRadius: "15px",
                    px: 2,
                    py: 0.8,
                    fontWeight: 900,
                    fontSize: "0.8rem",
                    animation: "float1 8s infinite ease-in-out",
                    zIndex: 10,
                  }}
                >
                  Streak 🔥 18 ngày
                </Paper>

                {/* Card 1: Sample vocabulary card (Technology theme) */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: "20px",
                    bgcolor: isDark ? "#1c1f2e" : "#ffffff",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    width: "90%",
                    alignSelf: "flex-start",
                    zIndex: 2,
                    transform: "rotate(-3deg)",
                    transition: "all 0.3s ease",
                    "&:hover": { transform: "rotate(0deg) scale(1.02)", zIndex: 5 },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Chip label="Technology" size="small" sx={{ bgcolor: "rgba(0,117,74,0.06)", color: colors.greenAccent, fontWeight: 800 }} />
                    <Button
                      onClick={(e) => handleSpeech(e, "Algorithm")}
                      aria-label="Phát âm Algorithm"
                      sx={{
                        minWidth: 0,
                        p: 1,
                        borderRadius: "50%",
                        color: colors.greenAccent,
                        bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      }}
                    >
                      <VolumeIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: "10px", bgcolor: isDark ? "rgba(0,117,74,0.15)" : colors.greenLight, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.greenAccent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="2.5" fill={alpha(colors.greenAccent, 0.3)} />
                        <circle cx="5" cy="19" r="2.5" fill={alpha(colors.greenAccent, 0.1)} />
                        <circle cx="19" cy="19" r="2.5" fill={alpha(colors.greenAccent, 0.1)} />
                        <line x1="12" y1="7.5" x2="18.5" y2="16.5" />
                        <line x1="12" y1="7.5" x2="5.5" y2="16.5" />
                        <line x1="7.5" y1="19" x2="16.5" y2="19" />
                      </svg>
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? "#fff" : colors.greenHouse }}>
                        Algorithm
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                        /ˈæl.ɡə.rɪ.ðəm/
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                    Nghĩa: Thuật toán, quy trình giải quyết vấn đề
                  </Typography>
                </Paper>

                {/* Card 2: 3D Flip Card */}
                <Box
                  sx={{
                    perspective: "1000px",
                    width: "90%",
                    height: 180,
                    alignSelf: "flex-end",
                    cursor: "pointer",
                    zIndex: 4,
                    transform: "rotate(3deg)",
                    transition: "transform 0.3s",
                    "&:hover": { transform: "rotate(0deg) scale(1.02)", zIndex: 6 },
                  }}
                  onClick={() => setIsFlipped(!isFlipped)}
                  aria-label="Bấm vào để lật thẻ từ vựng"
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      transformStyle: "preserve-3d",
                      transition: "transform 0.6s cubic-bezier(0.2, 0.85, 0.3, 1)",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <Paper
                      elevation={3}
                      sx={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        borderRadius: "20px",
                        bgcolor: isDark ? "#252836" : "#ffffff",
                        border: "1px solid",
                        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 3,
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 900, color: colors.gold, mb: 1 }}>
                        Serendipity
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic", mb: 1 }}>
                        /ˌser.ənˈdɪp.ə.t̬i/
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.greenAccent, fontWeight: 800 }}>
                        💡 CHẠM ĐỂ GIẢI MÃ NGHĨA
                      </Typography>
                    </Paper>

                    {/* Back */}
                    <Paper
                      elevation={3}
                      sx={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        borderRadius: "20px",
                        border: `2px solid ${colors.gold}`,
                        bgcolor: isDark ? "#171a25" : "#faf8f5",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2.5,
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: colors.gold }}>
                          Serendipity
                        </Typography>
                        <Button
                          onClick={(e) => handleSpeech(e, "Serendipity")}
                          aria-label="Phát âm Serendipity"
                          sx={{ minWidth: 0, p: 0.5, color: colors.gold }}
                        >
                          <VolumeIcon sx={{ fontSize: 16 }} />
                        </Button>
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", textAlign: "center", mb: 1 }}>
                        Sự tình cờ may mắn, ngẫu nhiên thú vị
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic", textAlign: "center", px: 2 }}>
                        "We found the cafe by serendipity."
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── SECTION 2: CORE STUDY METHODS ────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 9, md: 12 }, borderTop: "1px solid", borderBottom: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }} className="reveal-on-scroll">
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 900,
                color: isDark ? "#fff" : colors.greenStarbucks,
                mb: 2,
                letterSpacing: "-0.5px",
              }}
            >
              Tại sao NoroStu hiệu quả hơn?
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 620, mx: "auto", lineHeight: 1.6 }}>
              Không ép buộc, không học vẹt. Phương pháp học cá nhân hóa giúp bạn tiếp thu từ vựng một cách khoa học và đều đặn.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: <LoopIcon sx={{ fontSize: 36 }} />,
                title: "Thuật toán SRS",
                desc: "Ôn tập đúng thời điểm bạn sắp quên — ghi nhớ trọn đời thay vì học vẹt.",
                color: colors.greenAccent,
                bgAlpha: "rgba(0, 117, 74, 0.06)",
              },
              {
                icon: <VolumeIcon sx={{ fontSize: 36 }} />,
                title: "Phát âm chuẩn quốc tế",
                desc: "Nghe cả giọng Anh-Anh và Anh-Mỹ, kèm phiên âm IPA chính xác.",
                color: colors.gold,
                bgAlpha: "rgba(203, 162, 88, 0.06)",
              },
              {
                icon: <BookIcon sx={{ fontSize: 36 }} />,
                title: "Thư viện từ vựng chủ đề",
                desc: "Từ A1 đến C2, tiếng Anh công sở, du lịch, IELTS, TOEIC — học đúng thứ bạn cần.",
                color: "#336791",
                bgAlpha: "rgba(51, 103, 145, 0.06)",
              },
              {
                icon: <CupIcon sx={{ fontSize: 36 }} />,
                title: "Học qua trò chơi",
                desc: "Tích XP, duy trì Streak hằng ngày, leo bảng xếp hạng cùng hàng nghìn học viên.",
                color: "#e65100",
                bgAlpha: "rgba(230, 81, 0, 0.06)",
              },
            ].map((item, idx) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={item.title}
                className="reveal-on-scroll"
                sx={{
                  transitionDelay: `${idx * 0.15}s`,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 4.5,
                    height: "100%",
                    borderRadius: "20px",
                    bgcolor: isDark ? "rgba(28, 31, 46, 0.5)" : "#ffffff",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    transition: "all 0.3s ease",
                    display: "flex",
                    gap: 3,
                    alignItems: "flex-start",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      borderColor: item.color,
                      boxShadow: `0 10px 24px ${alpha(item.color, 0.08)}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "15px",
                      bgcolor: isDark ? "rgba(255,255,255,0.03)" : item.bgAlpha,
                      color: item.color,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? "#fff" : colors.greenHouse, mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, fontSize: "0.95rem" }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── SECTION 3: 3D TIMELINE ──────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 9, md: 12 }, bgcolor: isDark ? "#0a0b0e" : "rgba(237,235,233,0.3)" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 10 }} className="reveal-on-scroll">
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontWeight: 900, color: isDark ? "#fff" : colors.greenHouse, mb: 2 }}
            >
              Hành trình của bạn bắt đầu từ đây
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Tiến trình 5 bước học tập tinh giản giúp bạn làm chủ vốn từ tiếng Anh bền vững.
            </Typography>
          </Box>

          <Box sx={{ position: "relative", mt: { xs: 4, md: 8 } }}>
            {/* Horizontal Connecting Line for Desktop */}
            <Box
              sx={{
                display: { xs: "none", md: "block" },
                position: "absolute",
                top: 22, // Center of the 44px circle
                left: "10%",
                right: "10%",
                height: "3px",
                bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,117,74,0.12)",
                zIndex: 0,
              }}
            />

            {/* Vertical Connecting Line for Mobile */}
            <Box
              sx={{
                display: { xs: "block", md: "none" },
                position: "absolute",
                top: 22,
                bottom: 22,
                left: 22,
                width: "3px",
                bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,117,74,0.12)",
                zIndex: 0,
              }}
            />

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              sx={{ position: "relative", zIndex: 1 }}
            >
              {[
                { num: "01", icon: <CheckIcon sx={{ fontSize: 24 }} />, title: "Kiểm tra đầu vào", desc: "Bài test nhanh xác định trình độ hiện tại của bạn." },
                { num: "02", icon: <RouteIcon sx={{ fontSize: 24 }} />, title: "Lộ trình cá nhân", desc: "Hệ thống tự đề xuất chủ đề từ vựng phù hợp nhất." },
                { num: "03", icon: <CardIcon sx={{ fontSize: 24 }} />, title: "Học qua Flashcard", desc: "Ghi nhớ từ mới qua âm thanh và câu ví dụ sinh động." },
                { num: "04", icon: <UpdateIcon sx={{ fontSize: 24 }} />, title: "Ôn tập SRS", desc: "Luyện tập mỗi ngày theo lịch thông minh, không bao giờ quên." },
                { num: "05", icon: <LeaderboardIcon sx={{ fontSize: 24 }} />, title: "Thử thách & Leo rank", desc: "Làm quiz, đoạt cúp, đua top bảng xếp hạng tuần." },
              ].map((step, idx) => (
                <Box
                  key={step.num}
                  className="reveal-on-scroll"
                  sx={{
                    width: { xs: "100%", md: "20%" },
                    display: "flex",
                    flexDirection: { xs: "row", md: "column" },
                    alignItems: { xs: "flex-start", md: "center" },
                    gap: 3,
                    transitionDelay: { xs: "0s", md: `${idx * 0.15}s` },
                  }}
                >
                  {/* Step Circle */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      bgcolor: idx === 0 ? colors.gold : isDark ? "#252836" : "#ffffff",
                      color: idx === 0 ? colors.greenHouse : colors.greenAccent,
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      border: "2px solid",
                      borderColor: idx === 0 ? colors.gold : colors.greenAccent,
                      flexShrink: 0,
                      zIndex: 2,
                    }}
                  >
                    {step.icon}
                  </Box>

                  {/* Card Content */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      flexGrow: 1,
                      width: "100%",
                      borderRadius: "20px",
                      bgcolor: isDark ? "rgba(28, 31, 46, 0.7)" : "#ffffff",
                      border: "1.5px solid",
                      borderColor: idx === 0 ? colors.gold : "transparent",
                      boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.25)" : "0 8px 20px rgba(0,0,0,0.03)",
                      transition: "all 0.3s ease",
                      textAlign: { xs: "left", md: "center" },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: { xs: "flex-start", md: "center" },
                      "&:hover": {
                        transform: "translateY(-5px)",
                        borderColor: colors.greenAccent,
                      },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 950, color: colors.gold, mb: 0.5, display: "block", fontFamily: "monospace" }}>
                      BƯỚC {step.num}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? "#fff" : colors.greenHouse, mb: 1 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
                      {step.desc}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ── SECTION 4: CTA BANNER ───────────────────────────────────────────── */}
      <Box component="section">
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
          <Paper
            elevation={4}
            sx={{
              p: { xs: 6, md: 9 },
              borderRadius: "32px",
              background: isDark
                ? `linear-gradient(135deg, ${colors.greenHouse} 0%, #151821 100%)`
                : `linear-gradient(135deg, ${colors.greenStarbucks} 0%, ${colors.greenHouse} 100%)`,
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 20px 50px ${alpha(colors.greenStarbucks, 0.25)}`,
            }}
          >
            {/* Decorative backdrop mesh */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 5,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ maxWidth: 660 }}>
                <Typography
                  variant="h3"
                  component="h2"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "2rem", md: "3rem" },
                    letterSpacing: "-1px",
                    lineHeight: 1.1,
                  }}
                >
                  Bắt đầu hành trình chinh phục tiếng Anh ngay hôm nay
                </Typography>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mt: 2, mb: 4 }}>
                  Hoàn toàn miễn phí. Không cần thẻ tín dụng.
                </Typography>

                {/* Contact Channels */}
                <Stack direction="row" flexWrap="wrap" gap={2}>
                  <ContactButton href={facebookUrl} icon={<FacebookIcon />}>
                    Facebook
                  </ContactButton>
                  <ContactButton href={githubUrl} icon={<GitHubIcon />}>
                    GitHub
                  </ContactButton>
                  <ContactButton href={articleUrl} icon={<OpenInNewIcon />}>
                    Xem khoa học
                  </ContactButton>
                  <ContactButton href={`mailto:${contactEmail}`} icon={<EmailIcon />}>
                    Email
                  </ContactButton>
                </Stack>
              </Box>

              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="large"
                endIcon={<CheckCircleRoundedIcon />}
                sx={{
                  bgcolor: colors.gold,
                  color: colors.greenHouse,
                  fontWeight: 900,
                  fontSize: "1.1rem",
                  borderRadius: "40px",
                  px: 6,
                  py: 2.2,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                  "&:hover": {
                    bgcolor: colors.goldLight,
                    transform: "scale(1.04)",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.32)",
                  },
                  transition: "all 0.3s cubic-bezier(0.2, 1, 0.2, 1)",
                  flexShrink: 0,
                }}
              >
                Đăng ký miễn phí
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>

    {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{
          bgcolor: isDark ? "#090a0d" : colors.ceramic,
          py: 5,
          borderTop: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2.5,
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }}>
              © 2026 NoroStu. Nền tảng ghi nhớ tiếng Anh theo cơ chế lặp ngắt quãng hàng đầu.
            </Typography>

            <Stack direction="row" spacing={4}>
              <Link
                component={RouterLink}
                to="/about"
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  fontWeight: 800,
                  "&:hover": { color: colors.greenAccent },
                }}
              >
                Giới thiệu
              </Link>
              <Link
                component={RouterLink}
                to="/login"
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  fontWeight: 800,
                  "&:hover": { color: colors.greenAccent },
                }}
              >
                Đăng nhập
              </Link>
              <Link
                component={RouterLink}
                to="/register"
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  fontWeight: 800,
                  "&:hover": { color: colors.greenAccent },
                }}
              >
                Đăng ký
              </Link>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage;
