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

function toggleSettingsMenu(event) {
  event.stopPropagation();
  const wrap = event.currentTarget.closest(".settings-wrap");
  if (!wrap) return;
  const menu = wrap.querySelector(".settings-menu");
  if (!menu) return;

  const isOpen = menu.classList.contains("open");
  document.querySelectorAll(".settings-menu.open").forEach((el) => {
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  });
  document.querySelectorAll(".settings-btn[aria-expanded=\"true\"]").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });

  if (!isOpen) {
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    event.currentTarget.setAttribute("aria-expanded", "true");
  }
}

function initSettingsMenu() {
  document.querySelectorAll(".settings-menu").forEach((menu) => {
    menu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });
  document.addEventListener("click", () => {
    document.querySelectorAll(".settings-menu.open").forEach((el) => {
      el.classList.remove("open");
      el.setAttribute("aria-hidden", "true");
    });
    document.querySelectorAll(".settings-btn[aria-expanded=\"true\"]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

function initAdminLink() {
  const adminLinks = document.querySelectorAll("#adminLink");
  if (!adminLinks.length) return;
  const logoutButtons = document.querySelectorAll("#logoutBtnMenu");

  function setAdminLink(isAuthed) {
    adminLinks.forEach((link) => {
      if (isAuthed) {
        link.textContent = "Admin Panel";
        link.setAttribute("href", "admin.html");
      } else {
        link.textContent = "Admin Login";
        link.setAttribute("href", "login.html");
      }
    });
    logoutButtons.forEach((btn) => {
      btn.style.display = isAuthed ? "inline-flex" : "none";
    });
  }

  if (!window.supabase) {
    setAdminLink(!!getCachedSupabaseSession());
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    setAdminLink(!!getCachedSupabaseSession());
    return;
  }
  client.auth.getSession().then(({ data }) => {
    setAdminLink(!!data.session);
  });

  client.auth.onAuthStateChange((_event, session) => {
    setAdminLink(!!session);
  });
}

function initLogoutButton() {
  const logoutButtons = document.querySelectorAll("#logoutBtnMenu");
  if (!logoutButtons.length) return;

  const client = getSupabaseClient();
  logoutButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (client) {
        await client.auth.signOut();
      } else {
        clearSupabaseSession();
      }
      window.location.href = "login.html";
    });
  });
}

function resolveDiscordAvatar(user) {
  const meta = user?.user_metadata || {};
  const avatarUrl = meta.avatar_url || meta.picture;
  if (avatarUrl) return avatarUrl;
  const discordId = meta.provider_id || meta.sub;
  const avatarHash = meta.avatar;
  if (discordId && avatarHash) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=128`;
  }
  return "";
}

function resolveDisplayName(user) {
  const meta = user?.user_metadata || {};
  return meta.full_name
    || meta.name
    || meta.preferred_username
    || user?.email
    || "Builder";
}

function setSettingsProfile(user) {
  const profile = document.getElementById("settingsProfile");
  if (!profile) return;
  if (!user) {
    profile.style.display = "none";
    return;
  }
  const avatarUrl = resolveDiscordAvatar(user);
  const name = resolveDisplayName(user);
  const avatarEl = document.getElementById("settingsAvatar");
  const nameEl = document.getElementById("settingsName");

  if (avatarEl && avatarUrl) {
    avatarEl.src = avatarUrl;
    avatarEl.alt = `${name} avatar`;
  }
  if (nameEl) {
    nameEl.textContent = name;
  }
  if (avatarUrl || name) {
    profile.style.display = "grid";
  }
}

function initSettingsProfile() {
  const profile = document.getElementById("settingsProfile");
  if (!profile) return;

  const cached = getCachedSupabaseSession();
  if (cached?.user) {
    setSettingsProfile(cached.user);
  }

  if (!window.supabase) return;
  const client = getSupabaseClient();
  if (!client) return;

  client.auth.getSession().then(({ data }) => {
    setSettingsProfile(data.session?.user || null);
  });

  client.auth.onAuthStateChange((_event, session) => {
    setSettingsProfile(session?.user || null);
  });
}

function getCachedSupabaseSession() {
  try {
    const ref = (SUPABASE_URL || "").replace("https://", "").split(".")[0];
    const key = `sb-${ref}-auth-token`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.expires_at && Date.now() / 1000 > data.expires_at) return null;
    return data;
  } catch (err) {
    return null;
  }
}

function clearSupabaseSession() {
  try {
    const ref = (SUPABASE_URL || "").replace("https://", "").split(".")[0];
    const key = `sb-${ref}-auth-token`;
    localStorage.removeItem(key);
  } catch (err) {
    return;
  }
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
// Data: Supabase table `screenshots` with image_path, place, prov, builders
// -------------------------------

let SHOTS = [];
let CURRENT = 0;
let LIGHTBOX_ZOOM = 1;
const LIGHTBOX_ZOOM_MIN = 1;
const LIGHTBOX_ZOOM_MAX = 3;
const LIGHTBOX_ZOOM_STEP = 0.15;

const SUPABASE_URL = "https://ggrszibzbsvqrsowuctg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncnN6aWJ6YnN2cXJzb3d1Y3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY4ODEsImV4cCI6MjA4NTkwMjg4MX0.GKsex6OlVv9Wtzkr4c1DmhpHsv_8l2I-6l0mmDtl0qc";
const SUPABASE_TABLE = "screenshots";
const SUPABASE_BUCKET = "screenshots";

window.APP_SUPABASE = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY
};

function getSupabaseClient() {
  if (!window.supabase) return null;
  if (!window.APP_SUPABASE_CLIENT) {
    window.APP_SUPABASE_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return window.APP_SUPABASE_CLIENT;
}

document.addEventListener("DOMContentLoaded", () => {
  initShowcaseGrid();
  initDocsGate();
  initLightboxZoom();
  initSettingsMenu();
  initSettingsProfile();
  initAdminLink();
  initLogoutButton();
});

async function initShowcaseGrid() {
  const grid = document.getElementById("shotGrid");
  if (!grid) return; // not on showcase.html

  try {
    SHOTS = await loadShots();

    if (!SHOTS.length) {
      grid.innerHTML = `<p style="color:var(--muted);">No screenshots found.</p>`;
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
    grid.innerHTML = `<p style="color:var(--muted);">Couldn’t load screenshots.</p>`;
  }
}

async function loadShots() {
  try {
    return await fetchShotsFromSupabase();
  } catch (err) {
    console.warn("Supabase fetch failed, falling back to screenshots.json", err);
    const res = await fetch("screenshots.json", { cache: "no-store" });
    if (!res.ok) throw new Error("screenshots.json not found");
    const data = await res.json();
    return normalizeShotData(data, false);
  }
}

async function fetchShotsFromSupabase() {
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=image_path,place,prov,builders&order=created_at.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!res.ok) throw new Error("Supabase fetch failed");
  const data = await res.json();
  return normalizeShotData(data, true);
}

function normalizeShotData(data, fromSupabase) {
  return (Array.isArray(data) ? data : [])
    .map(s => {
      const imagePath = String(fromSupabase ? s.image_path : s.file || "").trim();
      const file = imagePath
        ? (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
          ? imagePath
          : `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${imagePath}`
        : "";
      return {
        file,
        place: String(s.place || "").trim(),
        prov: String(s.prov || "").trim(),
        builders: Array.isArray(s.builders)
          ? s.builders.map(b => String(b || "").trim()).filter(Boolean)
          : []
      };
    })
    .filter(s => s.file);
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
  cap.textContent = `${s.place || ""} (scroll to zoom)`;
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
    ? await loadShots()
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

