const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://norostu.com").replace(/\/$/, "");

const DEFAULT_SEO = {
  title: "NoroStu | Hoc tu vung tieng Anh hieu qua",
  description:
    "Nen tang hoc tieng Anh theo self-learning: lesson, SRS, quiz, va theo doi tien trinh.",
  robots: "index,follow",
  image: `${SITE_URL}/logo.png`,
  type: "website",
};

const ROUTE_SEO = [
  {
    test: /^\/$/,
    title: "NoroStu | Hoc tu vung tieng Anh voi SRS",
    description: "NoroStu giup hoc tu vung tieng Anh bang SRS, lesson, quiz, XP, streak va lo trinh ca nhan hoa.",
  },
  {
    test: /^\/about$/,
    title: "Gioi thieu NoroStu | Hoc tu vung tieng Anh voi SRS",
    description: "Tim hieu NoroStu: nen tang hoc tu vung tieng Anh self-learning voi SRS, lesson, quiz, XP va streak.",
  },
  {
    test: /^\/vocabulary$/,
    title: "Tu vung tieng Anh theo cap do | NoroStu",
    description: "Tra cuu va hoc tu vung tieng Anh theo level A1-A2, TOEIC, IELTS, bookmark va lich on tap.",
    robots: "noindex,nofollow",
  },
  {
    test: /^\/learning$/,
    title: "Lo trinh hoc tieng Anh ca nhan hoa | NoroStu",
    description: "Hoc theo lesson, placement, muc tieu ngay, tim, XP va tien trinh ca nhan.",
    robots: "noindex,nofollow",
  },
  {
    test: /^\/review$/,
    title: "On tap SRS SM-2 cho tu vung | NoroStu",
    description: "On tap tu vung dung thoi diem bang thuat toan SRS SM-2 de ghi nho lau hon.",
    robots: "noindex,nofollow",
  },
  {
    test: /^\/leaderboard$/,
    title: "Bang xep hang hoc vien | NoroStu",
    description: "Xem bang xep hang hoc vien theo XP.",
    robots: "noindex,nofollow",
  },
  {
    test: /^\/profile$/,
    title: "NoroStu | Ho so",
    description: "Quan ly thong tin ca nhan va thong ke hoc tap.",
    robots: "noindex,nofollow",
  },
  {
    test: /^\/notifications$/,
    title: "NoroStu | Thong bao",
    description: "Xem thong bao lien quan den tien trinh hoc va muc tieu.",
    robots: "noindex,nofollow",
  },
  {
    test: /^\/admin(?:\/.*)?$/,
    title: "NoroStu | Admin",
    description: "Khu vuc quan tri he thong.",
    robots: "noindex,nofollow",
  },
  {
    test: /^\/(?:login|register|forgot-password|reset-password|verify-email)$/,
    title: "NoroStu | Tai khoan",
    description: "Dang nhap, dang ky va quan ly xac thuc tai khoan.",
    robots: "noindex,nofollow",
  },
  {
    test: /^\/learning\/(?:session|placement|onboarding)(?:\/.*)?$/,
    title: "NoroStu | Learning Session",
    description: "Phien hoc ca nhan hoa theo muc tieu va nang luc.",
    robots: "noindex,nofollow",
  },
];

const upsertMeta = (attr, key, content) => {
  let node = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
};

const upsertLink = (rel, href) => {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
};

const upsertJsonLd = (id, payload) => {
  let node = document.head.querySelector(`script[type="application/ld+json"][data-seo-id="${id}"]`);
  if (!node) {
    node = document.createElement("script");
    node.setAttribute("type", "application/ld+json");
    node.setAttribute("data-seo-id", id);
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(payload);
};

const pickSeo = (pathname) => {
  const found = ROUTE_SEO.find((item) => item.test.test(pathname));
  return found ? { ...DEFAULT_SEO, ...found } : DEFAULT_SEO;
};

const normalizePathname = (pathname) => {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
};

const buildRouteSchema = (seo, canonicalUrl) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${canonicalUrl}#webpage`,
  "url": canonicalUrl,
  "name": seo.title,
  "description": seo.description,
  "isPartOf": { "@id": `${SITE_URL}/#website` },
  "inLanguage": "vi-VN",
});

export const applyRouteSeo = (pathname) => {
  const normalizedPath = normalizePathname(pathname);
  const seo = pickSeo(normalizedPath);
  const canonicalUrl = `${SITE_URL}${normalizedPath}`;

  document.title = seo.title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", seo.robots);
  upsertMeta("name", "application-name", "NoroStu");
  upsertMeta("name", "author", "NoroStu Contributors");

  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:type", seo.type);
  upsertMeta("property", "og:url", canonicalUrl);
  upsertMeta("property", "og:site_name", "NoroStu");
  upsertMeta("property", "og:locale", "vi_VN");
  upsertMeta("property", "og:image", seo.image);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", seo.image);

  upsertLink("canonical", canonicalUrl);
  upsertJsonLd("route-webpage", buildRouteSchema(seo, canonicalUrl));
};
