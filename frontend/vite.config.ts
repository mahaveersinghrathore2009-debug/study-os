import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// StudyOS frontend. In production it is loaded by Electron from the file://
// protocol, so the build must use relative asset paths (base "./").
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist" },
});
