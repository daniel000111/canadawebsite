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
  updateThemeToggleLabel();
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
  updateThemeToggleLabel();
}

function updateThemeToggleLabel() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const label = isDark ? "Dark" : "Light";
  const aria = isDark ? "Switch to light mode" : "Switch to dark mode";

  document.querySelectorAll(".theme-btn").forEach((btn) => {
    const textEl = btn.querySelector(".theme-label");
    if (textEl) textEl.textContent = label;
    btn.setAttribute("aria-label", aria);
    btn.setAttribute("title", aria);
  });
}

function toggleMapNav() {
  const body = document.body;
  if (!body || !body.classList.contains("map-page")) return;

  const btn = document.querySelector(".map-nav-toggle");
  const isHidden = body.classList.toggle("nav-hidden");

  if (btn) {
    btn.setAttribute("aria-pressed", isHidden ? "true" : "false");
    btn.setAttribute("aria-label", isHidden ? "Show navigation" : "Hide navigation");
    btn.setAttribute("title", isHidden ? "Show navigation" : "Hide navigation");
  }
}

// -------------------------------
// SHOWCASE PAGE: grid + fullscreen lightbox (works with your HTML)
// Requires: <div id="shotGrid"></div> and your lightbox IDs
// Data: screenshots.json [{ file: "...", place: "...", prov: "...", builders: ["..."] }, ...]
// -------------------------------

let SHOTS = [];
let CURRENT = 0;
let LIGHTBOX_ZOOM = 1;
const LIGHTBOX_ZOOM_MIN = 1;
const LIGHTBOX_ZOOM_MAX = 3;
const LIGHTBOX_ZOOM_STEP = 0.15;

document.addEventListener("DOMContentLoaded", () => {
  initShowcaseGrid();
  initDocsGate();
  initLightboxZoom();
});

async function initShowcaseGrid() {
  const grid = document.getElementById("shotGrid");
  if (!grid) return; // not on showcase.html

  try {
    const res = await fetch("screenshots.json", { cache: "no-store" });
    if (!res.ok) throw new Error("screenshots.json not found");
    const data = await res.json();

    SHOTS = (Array.isArray(data) ? data : [])
      .map(s => ({
        file: String(s.file || "").trim(),
        place: String(s.place || "").trim(),
        prov: String(s.prov || "").trim(),
        builders: Array.isArray(s.builders) ? s.builders.map(b => String(b || "").trim()).filter(Boolean) : []
      }))
      .filter(s => s.file);

    if (!SHOTS.length) {
      grid.innerHTML = `<p style="color:var(--muted);">No screenshots in screenshots.json</p>`;
      return;
    }

    grid.innerHTML = "";
    SHOTS.forEach((s, i) => {
      const card = document.createElement("div");
      card.className = "shot-card";
      card.style.cursor = "zoom-in";

      const prov = escapeHtml(s.prov || "");
      const builders = (s.builders || []).map(escapeHtml).join(", ");
      card.innerHTML = `
        <img src="${s.file}" alt="${escapeHtml(s.place || "Screenshot")}" loading="lazy" />
        <div class="shot-card-body">
          <div class="shot-title">
            <p class="shot-place">${escapeHtml(s.place || "Unknown Location")}</p>
            ${prov ? `<span class="shot-pill">${prov}</span>` : ""}
          </div>
          ${builders ? `<p class="shot-builders">Builders: <code>${builders}</code></p>` : ""}
        </div>
      `;

      card.addEventListener("click", () => openLightbox(i));
      grid.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p style="color:var(--muted);">Couldn’t load screenshots.json</p>`;
  }
}

function openLightbox(index) {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCaption");
  const frame = document.querySelector(".lightbox-frame");

  if (!box || !img || !cap) {
    console.error("Lightbox elements missing from HTML");
    return;
  }

  CURRENT = index;

  const s = SHOTS[CURRENT];
  img.src = s.file;
  img.alt = s.place || "Screenshot";
  cap.textContent = s.place || "";
  resetLightboxZoom();
  if (frame) {
    frame.classList.remove("swap");
    void frame.offsetWidth;
    frame.classList.add("swap");
  }

  box.classList.add("open");
  document.documentElement.classList.add("lightbox-open");
  box.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");

  if (!box) return;

  box.classList.remove("open");
  document.documentElement.classList.remove("lightbox-open");
  box.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (img) {
    img.src = "";
    resetLightboxZoom();
  }
}

// ESC to close
document.addEventListener("keydown", (e) => {
  const box = document.getElementById("lightbox");
  if (!box || !box.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") lightboxPrev();
  if (e.key === "ArrowRight") lightboxNext();
});

function initLightboxZoom() {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  if (!box || !img) return;

  img.addEventListener("click", (e) => {
    e.stopPropagation();
    if (LIGHTBOX_ZOOM <= 1) {
      setLightboxZoom(1.6);
      img.classList.add("zoomed");
    } else {
      resetLightboxZoom();
    }
  });

  img.addEventListener("mousemove", (e) => {
    if (LIGHTBOX_ZOOM <= 1) return;
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.setProperty("--zoom-x", `${x}%`);
    img.style.setProperty("--zoom-y", `${y}%`);
  });

  img.addEventListener("mouseleave", () => {
    if (LIGHTBOX_ZOOM <= 1) return;
    img.style.setProperty("--zoom-x", "50%");
    img.style.setProperty("--zoom-y", "50%");
  });

  box.addEventListener(
    "wheel",
    (e) => {
      if (!box.classList.contains("open")) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      const nextZoom = LIGHTBOX_ZOOM + dir * LIGHTBOX_ZOOM_STEP;
      setLightboxZoom(nextZoom);
    },
    { passive: false }
  );
}

function setLightboxZoom(value) {
  const img = document.getElementById("lightboxImg");
  if (!img) return;
  LIGHTBOX_ZOOM = Math.min(LIGHTBOX_ZOOM_MAX, Math.max(LIGHTBOX_ZOOM_MIN, value));
  img.style.setProperty("--zoom", LIGHTBOX_ZOOM.toFixed(2));
  if (LIGHTBOX_ZOOM > 1) {
    img.classList.add("zoomed");
  } else {
    img.classList.remove("zoomed");
    img.style.setProperty("--zoom-x", "50%");
    img.style.setProperty("--zoom-y", "50%");
  }
}

function resetLightboxZoom() {
  const img = document.getElementById("lightboxImg");
  if (!img) return;
  LIGHTBOX_ZOOM = 1;
  img.classList.remove("zoomed");
  img.style.removeProperty("--zoom");
  img.style.setProperty("--zoom-x", "50%");
  img.style.setProperty("--zoom-y", "50%");
}

function lightboxPrev() {
  if (!SHOTS.length) return;
  CURRENT = (CURRENT - 1 + SHOTS.length) % SHOTS.length;
  openLightbox(CURRENT);
}

function lightboxNext() {
  if (!SHOTS.length) return;
  CURRENT = (CURRENT + 1) % SHOTS.length;
  openLightbox(CURRENT);
}

// helper
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// -------------------------------
// DOCS PAGE: lightweight gate (client-side only)
// -------------------------------

function initDocsGate() {
  const gate = document.querySelector(".docs-gate");
  if (!gate) return;

  const form = gate.querySelector("form");
  const input = gate.querySelector("input[type=\"password\"]");
  const error = gate.querySelector(".docs-error");
  const content = document.querySelector(".docs-content");
  const unlockKey = "docsUnlocked";
  const password = gate.getAttribute("data-password") || "";

  if (localStorage.getItem(unlockKey) === "true") {
    gate.hidden = true;
    if (content) content.hidden = false;
    return;
  }

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (value && value === password) {
      localStorage.setItem(unlockKey, "true");
      gate.hidden = true;
      if (content) content.hidden = false;
    } else if (error) {
      error.textContent = "Incorrect password. Please try again.";
    }
  });
}

// -------------------------------
// HOME PAGE CAROUSEL (uses screenshots.json)
// -------------------------------

let carouselShots = [];
let carouselIndex = 0;
let carouselTimer = null;

async function initShotCarousel() {
  const track = document.getElementById("shotTrack");
  const dotsWrap = document.getElementById("shotDots");
  if (!track || !dotsWrap) return; // not on home page

  // Reuse the same loader if it exists, otherwise fetch directly
  const shots = (typeof loadShots === "function")
    ? await loadShots("screenshots.json")
    : await (await fetch("screenshots.json", { cache: "no-store" })).json();

  if (!Array.isArray(shots) || shots.length === 0) {
    track.innerHTML = `<div style="padding:2rem;color:var(--muted);">No screenshots found.</div>`;
    return;
  }

  // pick random up to 6
  carouselShots = shuffleArray(shots).slice(0, Math.min(6, shots.length));
  carouselIndex = 0;

  track.innerHTML = "";
  dotsWrap.innerHTML = "";

  carouselShots.forEach((s, i) => {
    const slide = document.createElement("div");
    slide.className = "shot-slide";
    slide.style.backgroundImage = `url("${s.file}")`;

    const prov = escapeHtml(s.prov || "");
    const builders = (s.builders || []).map(escapeHtml).join(", ");
    slide.innerHTML = `
      <div class="shot-overlay"></div>
      <div class="shot-caption">
        <div class="shot-title">
          <h3>${escapeHtml(s.place || "Unknown Location")}</h3>
          ${prov ? `<span class="shot-pill">${prov}</span>` : ""}
        </div>
        ${builders ? `<p class="shot-builders">Builders: <code>${builders}</code></p>` : ""}
      </div>
    `;

    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "shot-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => goToShot(i));
    dotsWrap.appendChild(dot);
  });

  updateCarouselUI();
  startCarouselAuto();
}

function shotPrev() {
  if (!carouselShots.length) return;
  carouselIndex = (carouselIndex - 1 + carouselShots.length) % carouselShots.length;
  updateCarouselUI();
  startCarouselAuto();
}

function shotNext() {
  if (!carouselShots.length) return;
  carouselIndex = (carouselIndex + 1) % carouselShots.length;
  updateCarouselUI();
  startCarouselAuto();
}

function goToShot(i) {
  carouselIndex = i;
  updateCarouselUI();
  startCarouselAuto();
}

function updateCarouselUI() {
  const track = document.getElementById("shotTrack");
  if (!track) return;

  track.style.transform = `translateX(-${carouselIndex * 100}%)`;

  const dots = document.querySelectorAll("#shotDots .shot-dot");
  dots.forEach((d, idx) => d.classList.toggle("active", idx === carouselIndex));
}

function startCarouselAuto() {
  if (carouselTimer) clearInterval(carouselTimer);
  if (carouselShots.length <= 1) return;

  carouselTimer = setInterval(() => {
    shotNext();
  }, 4500);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Init on page load (only runs if elements exist)
document.addEventListener("DOMContentLoaded", () => {
  initShotCarousel();
});
