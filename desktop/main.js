// StudyOS Electron main process.
// Boots the local FastAPI backend (if not already running), then loads the UI.
const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const BACKEND_PORT = 8000;
const DEV_URL = "http://localhost:5173";
let backendProc = null;

function isBackendRunning() {
  return new Promise((resolve) => {
    const net = require("net");
    const sock = net.connect(BACKEND_PORT, "127.0.0.1");
    sock.once("connect", () => { sock.end(); resolve(true); });
    sock.once("error", () => resolve(false));
  });
}

function resolveBackendCommand() {
  // 1. Packaged app: the frozen backend exe ships inside the resources dir.
  const bundled = path.join(process.resourcesPath, "studyos-backend.exe");
  if (fs.existsSync(bundled)) return bundled;
  // 2. Dev: a virtualenv inside the project, then system python.
  const candidates = [
    path.join(__dirname, "..", "backend", "..", ".venv", "Scripts", "python.exe"),
    path.join(__dirname, "..", ".venv", "Scripts", "python.exe"),
    "python",
    "py",
  ];
  for (const c of candidates) {
    try {
      if (c !== "python" && c !== "py" && !fs.existsSync(c)) continue;
      return c;
    } catch {
      /* ignore */
    }
  }
  return "python";
}

async function startBackend() {
  if (await isBackendRunning()) {
    console.log("StudyOS backend already running on port", BACKEND_PORT);
    return;
  }
  const exe = resolveBackendCommand();
  const isBundled = exe === path.join(process.resourcesPath, "studyos-backend.exe");
  const backendDir = path.join(__dirname, "..", "backend");
  const args = isBundled
    ? []                                    // frozen exe runs uvicorn itself
    : ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(BACKEND_PORT)];
  backendProc = spawn(exe, args, {
    cwd: isBundled ? undefined : backendDir,
    stdio: "ignore",
    windowsHide: true,
  });
  backendProc.on("error", (err) => console.error("Failed to start backend:", err.message));
  backendProc.unref();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: "#0b0e17",
    title: "StudyOS",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const packagedIndex = path.join(process.resourcesPath, "frontend", "dist", "index.html");
  const devIndex = path.join(__dirname, "..", "frontend", "dist", "index.html");
  const distIndex = fs.existsSync(packagedIndex) ? packagedIndex : devIndex;
  if (fs.existsSync(distIndex)) {
    win.loadFile(distIndex);
  } else {
    win.loadURL(DEV_URL); // dev mode: `npm run dev` in frontend/
  }
}

app.whenReady().then(async () => {
  await startBackend();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", () => {
  if (backendProc) backendProc.kill();
});
