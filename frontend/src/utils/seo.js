const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://norostu.com").replace(/\/$/, "");

const DEFAULT_SEO = {
  title: "NoroStu | Hoc tu vung tieng Anh hieu qua",
  description:
    "Nen tang hoc tieng Anh theo self-learning: lesson, SRS, quiz, va theo doi tien trinh.",
  robots: "index,follow",
};

const ROUTE_SEO = [
  {
    test: /^\/$/,
    title: "NoroStu | Trang chu",
    description: "Theo doi tien trinh hoc, XP, streak va bat dau buoi hoc moi.",
  },
  {
    test: /^\/vocabulary$/,
    title: "NoroStu | Tu vung",
    description: "Duyet danh sach tu vung theo level, tra cuu va luu bookmark.",
  },
  {
    test: /^\/wordsets$/,
    title: "NoroStu | Bo tu",
    description: "Hoc theo bo tu vung theo chu de va cap do.",
  },
  {
    test: /^\/learning$/,
    title: "NoroStu | Hoc tap",
    description: "Hoc theo lo trinh bai hoc va muc tieu hang ngay.",
  },
  {
    test: /^\/review$/,
    title: "NoroStu | On tap SRS",
    description: "On tap theo lich SRS (SM-2) de nho tu vung lau hon.",
  },
  {
    test: /^\/quiz$/,
    title: "NoroStu | Quiz",
    description: "Luyen quiz tieng Anh de tang phan xa va do chinh xac.",
  },
  {
    test: /^\/leaderboard$/,
    title: "NoroStu | Xep hang",
    description: "Xem bang xep hang hoc vien theo XP.",
  },
  {
    test: /^\/profile$/,
    title: "NoroStu | Ho so",
    description: "Quan ly thong tin ca nhan va thong ke hoc tap.",
  },
  {
    test: /^\/notifications$/,
    title: "NoroStu | Thong bao",
    description: "Xem thong bao lien quan den tien trinh hoc va muc tieu.",
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

const pickSeo = (pathname) => {
  const found = ROUTE_SEO.find((item) => item.test.test(pathname));
  return found ? { ...DEFAULT_SEO, ...found } : DEFAULT_SEO;
};

export const applyRouteSeo = (pathname) => {
  const seo = pickSeo(pathname);
  const canonicalUrl = `${SITE_URL}${pathname || "/"}`;

  document.title = seo.title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", seo.robots);

  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:url", canonicalUrl);
  upsertMeta("property", "og:site_name", "NoroStu");

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);

  upsertLink("canonical", canonicalUrl);
};

