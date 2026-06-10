// 현재 연도 표시
document.getElementById("year").textContent = new Date().getFullYear();

// 테마 전환 (라이트 / 다크)
const toggle = document.getElementById("theme-toggle");
const root = document.documentElement;

// 저장된 테마 또는 시스템 설정 적용
const saved = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initial = saved || (prefersDark ? "dark" : "light");
applyTheme(initial);

toggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
});

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  toggle.textContent = theme === "dark" ? "☀️" : "🌙";
}
