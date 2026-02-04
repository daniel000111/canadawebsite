/* -----------------------------
   Existing site functions
------------------------------ */

function copyIP() {
  // Use your real IP/domain here
  const ip = "btecanada.net";
  navigator.clipboard.writeText(ip);
  alert("Server IP copied to clipboard!");
}

function scrollStaff(direction) {
  const carousel = document.getElementById("staffCarousel");
  if (!carousel) return;

  const scrollAmount = 280; // ~ 1 card + gap
  carousel.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
}

function toggleNav() {
  const menu = document.getElementById("navMenu");
  const btn = document.querySelector(".nav-toggle");
  if (!menu || !btn) return;

  menu.classList.toggle("open");
  const isOpen = menu.classList.contains("open");
  btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("navMenu");
  const btn = document.querySelector(".nav-toggle");
  if (!menu || !btn) return;

  // Close menu after tapping a link
  if (menu.classList.contains("open") && e.target.closest("#navMenu a")) {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }
});

(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
})();

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }
}

// -------------------------------
// SHOWCASE PAGE (Grid + Lightbox)
// -------------------------------

const SHOTS_JSON_URL = "screenshots.json"; // change if you put it elsewhere
let ALL_SHOTS = [];
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  initShowcasePage();
});

async function initShowcasePage() {
  const grid = document.getElementById("shotGrid");
  if (!grid) return; // not on showcase page

  ALL_SHOTS = await loadShots(SHOTS_JSON_URL);

  if (!ALL_SHOTS.length) {
    grid.innerHTML = `
      <p style="color: var(--muted); max-width: 700px; margin: 0 auto;">
        No screenshots found. Make sure <code>${SHOTS_JSON_URL}</code> exists and contains an array of
        { "file": "...", "place": "..." }.
      </p>
    `;
    return;
  }

  renderShotGrid(grid, ALL_SHOTS);

  // Keyboard controls for lightbox
  document.addEventListener("keydown", (e) => {
    const box = document.getElementById("lightbox");
    if (!box || !box.classList.contains("open")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();
  });
}

async function loadShots(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + url);
    const data = await res.json();

    // Normalize
    return (Array.isArray(data) ? data : [])
      .map((s) => ({
        file: String(s.file || "").trim(),
        place: String(s.place || "").trim(),
      }))
      .filter((s) => s.file.length);
  } catch (err) {
    console.error(err);
    return [];
  }
}

function renderShotGrid(grid, shots) {
  grid.innerHTML = "";

  shots.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "shot-card";
    card.style.cursor = "zoom-in";

    card.innerHTML = `
      <img src="${s.file}" alt="${escapeHtml(s.place || "BTE Canada Screenshot")}" loading="lazy" />
      <div class="shot-card-body">
        <p class="shot-place">${escapeHtml(s.place || "Unknown Location")}</p>
      </div>
    `;

    card.addEventListener("click", () => openLightbox(i));
    grid.appendChild(card);
  });
}

// -------------------------------
// Lightbox functions (matches YOUR HTML)
// -------------------------------

function openLightbox(index) {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCaption");

  if (!box || !img || !cap) return;

  currentIndex = index;

  const shot = ALL_SHOTS[currentIndex];
  img.src = shot.file;
  img.alt = shot.place || "BTE Canada Screenshot";
  cap.textContent = shot.place || "";

  box.classList.add("open");
  box.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  if (!box) return;

  box.classList.remove("open");
  box.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (img) img.src = "";
}

// Optional next/prev (keyboard arrows)
function showPrev() {
  if (!ALL_SHOTS.length) return;
  currentIndex = (currentIndex - 1 + ALL_SHOTS.length) % ALL_SHOTS.length;
  updateLightbox();
}

function showNext() {
  if (!ALL_SHOTS.length) return;
  currentIndex = (currentIndex + 1) % ALL_SHOTS.length;
  updateLightbox();
}

function updateLightbox() {
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCaption");
  if (!img || !cap) return;

  const shot = ALL_SHOTS[currentIndex];
  img.src = shot.file;
  img.alt = shot.place || "BTE Canada Screenshot";
  cap.textContent = shot.place || "";
}

// -------------------------------
// Small helper
// -------------------------------
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

