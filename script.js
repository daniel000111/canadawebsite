function copyIP() {
  navigator.clipboard.writeText("btecanada.net");
  alert("Server IP copied to clipboard!");
}

function scrollStaff(direction) {
  const carousel = document.getElementById("staffCarousel");
  if (!carousel) return;

  // scroll by about 1 card width + gap
  const scrollAmount = 280;
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

  if (menu.classList.contains("open") && e.target.closest(".nav-center a")) {
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

// ---------- Showcase screenshots (carousel + gallery) ----------
let SHOTS = [];
let shotIndex = 0;
let shotTimer = null;

async function loadShots() {
  if (SHOTS.length) return SHOTS;

  try {
    const res = await fetch("screenshots.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load screenshots.json");
    SHOTS = await res.json();
    return SHOTS;
  } catch (err) {
    console.error(err);
    return [];
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Home carousel: random subset
async function initShotCarousel() {
  const track = document.getElementById("shotTrack");
  const dotsWrap = document.getElementById("shotDots");
  if (!track || !dotsWrap) return;

  const all = await loadShots();
  const picks = shuffle(all).slice(0, Math.min(6, all.length)); // show up to 6 random slides

  track.innerHTML = "";
  dotsWrap.innerHTML = "";
  shotIndex = 0;

  picks.forEach((s, i) => {
    const slide = document.createElement("div");
    slide.className = "shot-slide";
    slide.style.backgroundImage = `url("${s.file}")`;

    slide.innerHTML = `
      <div class="shot-overlay"></div>
      <div class="shot-caption">
        <h3>${s.place}</h3>
      </div>
    `;
    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "shot-dot" + (i === 0 ? " active" : "");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => goToShot(i, picks.length));
    dotsWrap.appendChild(dot);
  });

  // store current carousel picks on the element so arrows work with them
  track.dataset.count = String(picks.length);

  startShotAuto();
  updateShotUI(picks.length);
}

function updateShotUI(count) {
  const track = document.getElementById("shotTrack");
  const dots = document.querySelectorAll(".shot-dot");
  if (!track) return;

  track.style.transform = `translateX(-${shotIndex * 100}%)`;
  dots.forEach((d, idx) => d.classList.toggle("active", idx === shotIndex));
}

function goToShot(i, count) {
  shotIndex = (i + count) % count;
  updateShotUI(count);
  startShotAuto();
}

function shotPrev() {
  const track = document.getElementById("shotTrack");
  if (!track) return;
  const count = Number(track.dataset.count || "0");
  if (!count) return;

  goToShot(shotIndex - 1, count);
}

function shotNext() {
  const track = document.getElementById("shotTrack");
  if (!track) return;
  const count = Number(track.dataset.count || "0");
  if (!count) return;

  goToShot(shotIndex + 1, count);
}

function startShotAuto() {
  if (shotTimer) clearInterval(shotTimer);

  const track = document.getElementById("shotTrack");
  if (!track) return;
  const count = Number(track.dataset.count || "0");
  if (count <= 1) return;

  shotTimer = setInterval(() => {
    goToShot(shotIndex + 1, count);
  }, 4500);
}

// Showcase page: render all
async function initShotGrid() {
  const grid = document.getElementById("shotGrid");
  if (!grid) return;

  const all = await loadShots();
  grid.innerHTML = "";

  all.forEach((s) => {
  const card = document.createElement("div");
  card.className = "shot-card";
  card.style.cursor = "zoom-in";
  card.innerHTML = `
    <img src="${s.file}" alt="${s.place}">
    <div class="shot-card-body">
      <p class="shot-place">${s.place}</p>
    </div>
  `;

  card.addEventListener("click", () => {
    openLightbox(s.file, s.place);
  });
    grid.appendChild(card);
  });
}

// Init when page loads
document.addEventListener("DOMContentLoaded", () => {
  initShotCarousel();
  initShotGrid();
});

// ---------- Lightbox ----------
function openLightbox(src, caption) {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCaption");

  if (!box || !img || !cap) return;

  img.src = src;
  img.alt = caption || "";
  cap.textContent = caption || "";

  box.classList.add("open");
  box.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const box = document.getElementById("lightbox");
  if (!box) return;

  box.classList.remove("open");
  box.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
}

// Close with ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

