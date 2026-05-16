import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react({ disableOxcRecommendation: true })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Increase chunk size warning threshold from 500 kB to 600 kB.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split React and ReactDOM.
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor-react";
            }
            // Split MUI core and icons.
            if (id.includes("node_modules/@mui/")) {
              return "vendor-mui";
            }
            // Split Redux stack.
            if (id.includes("node_modules/@reduxjs/") || id.includes("node_modules/react-redux/") || id.includes("node_modules/redux/")) {
              return "vendor-redux";
            }
            // Split React Query.
            if (id.includes("node_modules/@tanstack/")) {
              return "vendor-query";
            }
            // Split charting libs.
            if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3-")) {
              return "vendor-charts";
            }
            // Split React Router.
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
      allowedHosts: ["frontend", "mnm_frontend", "host.docker.internal"],
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
