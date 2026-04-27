import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Tăng ngưỡng cảnh báo chunk size lên 600 kB (mặc định 500 kB)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Tách vendor React và ReactDOM
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor-react";
            }
            // Tách MUI core + icons thành chunk riêng (thư viện lớn nhất)
            if (id.includes("node_modules/@mui/")) {
              return "vendor-mui";
            }
            // Tách Redux + React-Redux + Toolkit
            if (id.includes("node_modules/@reduxjs/") || id.includes("node_modules/react-redux/") || id.includes("node_modules/redux/")) {
              return "vendor-redux";
            }
            // Tách React Query
            if (id.includes("node_modules/@tanstack/")) {
              return "vendor-query";
            }
            // Tách biểu đồ Recharts (nặng nhưng ít dùng)
            if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3-")) {
              return "vendor-charts";
            }
            // Tách React Router
            if (id.includes("node_modules/react-router")) {
              return "vendor-router";
            }
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      watch: {
        usePolling: true,
        interval: 1000,
      },
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://backend:8000",
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.js",
      css: false,
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        include: ["src/**/*.{js,jsx}"],
        exclude: ["src/main.jsx", "src/test/**"],
      },
    },
  };
});
