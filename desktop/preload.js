// Minimal preload: no privileged APIs are exposed yet.
// StudyOS talks to its local backend over HTTP on 127.0.0.1.
window.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("root");
  if (el) el.style.opacity = "1";
});
