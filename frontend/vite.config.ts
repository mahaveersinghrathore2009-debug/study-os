import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// StudyOS frontend. In production it is loaded by Electron and talks to the
// local FastAPI backend on 127.0.0.1:8000.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist" },
});
