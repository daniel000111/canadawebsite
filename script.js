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
        link.textContent = "Login";
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


function initStatCounters() {
  const counters = Array.from(document.querySelectorAll(".stat-number[data-count]"));
  if (!counters.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setFinalValue(el) {
    const target = Number(el.dataset.count || "0");
    const suffix = el.dataset.suffix || "";
    el.textContent = `${target.toLocaleString()}${suffix}`;
  }

  function animateCount(el) {
    if (el.dataset.started === "true") return;
    el.dataset.started = "true";

    const target = Number(el.dataset.count || "0");
    const suffix = el.dataset.suffix || "";
    const duration = Number(el.dataset.duration || "1600");
    const start = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);
      const value = Math.round(target * eased);
      el.textContent = `${value.toLocaleString()}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  if (prefersReduced) {
    counters.forEach(setFinalValue);
    return;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.45 }
    );

    counters.forEach((el) => observer.observe(el));
  } else {
    counters.forEach(animateCount);
  }
}

function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal-on-scroll");
  if (!targets.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    targets.forEach((el) => observer.observe(el));
  } else {
    targets.forEach((el) => el.classList.add("is-visible"));
  }
}

function ensureNavAnnouncement() {
  const navWraps = document.querySelectorAll(".nav-wrap");
  navWraps.forEach((wrap) => {
    if (wrap.querySelector(".nav-announcement")) return;
    const bar = document.createElement("div");
    bar.className = "nav-announcement";
    bar.setAttribute("role", "status");
    bar.setAttribute("aria-live", "polite");
    wrap.appendChild(bar);
  });
}

function setNavAnnouncement(message) {
  document.querySelectorAll(".nav-announcement").forEach((bar) => {
    const text = (message || "").trim();
    if (!text) {
      bar.textContent = "";
      bar.classList.remove("show");
      document.body.classList.remove("announcement-active");
      syncMapAnnouncementOffset();
      return;
    }
    bar.textContent = text;
    bar.classList.add("show");
    document.body.classList.add("announcement-active");
    syncMapAnnouncementOffset();
  });
}

function syncMapAnnouncementOffset() {
  if (!document.body.classList.contains("map-page")) return;
  const bar = document.querySelector(".nav-announcement");
  const isHidden = document.body.classList.contains("nav-hidden");
  if (!bar || isHidden || !bar.classList.contains("show")) {
    document.body.style.setProperty("--map-announce-offset", "0px");
    return;
  }
  const offset = Math.max(0, bar.offsetHeight - 6);
  document.body.style.setProperty("--map-announce-offset", `${offset}px`);
}

async function fetchAnnouncement() {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from("announcements")
      .select("message")
      .eq("id", 1)
      .maybeSingle();
    if (error) return "";
    return data?.message || "";
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/announcements?id=eq.1&select=message`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return "";
    const rows = await res.json();
    return rows?.[0]?.message || "";
  } catch (err) {
    return "";
  }
}

async function upsertAnnouncement(message) {
  const client = getSupabaseClient();
  if (!client) return { error: new Error("Supabase not available.") };
  return client
    .from("announcements")
    .upsert({ id: 1, message }, { onConflict: "id" });
}

async function initAnnouncementBar() {
  ensureNavAnnouncement();
  const message = await fetchAnnouncement();
  setNavAnnouncement(message);
}

async function fetchBuilderAreas() {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from("builder_areas")
      .select("event_area,event_warp,event_image,focus_areas")
      .eq("id", 1)
      .maybeSingle();
    if (error) return null;
    return data || null;
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/builder_areas?id=eq.1&select=event_area,event_warp,event_image,focus_areas`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] || null;
  } catch (err) {
    return null;
  }
}

function normalizeFocusAreas(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      area: String(item?.area || "").trim(),
      warp: String(item?.warp || "").trim(),
      image: String(item?.image || "").trim()
    }))
    .filter((item) => item.area || item.warp || item.image);
}

async function initBuilderAreas() {
  const eventTitle = document.getElementById("eventTitle");
  const eventCommand = document.getElementById("eventCommand");
  const eventImage = document.getElementById("eventImage");
  const focusList = document.getElementById("focusList");
  if (!eventTitle && !eventCommand && !eventImage && !focusList) return;

  const data = await fetchBuilderAreas();
  if (!data) return;

  if (eventTitle && data.event_area) {
    eventTitle.textContent = data.event_area;
  }
  if (eventCommand && data.event_warp) {
    const code = eventCommand.querySelector("code");
    if (code) {
      code.textContent = data.event_warp;
    } else {
      eventCommand.textContent = data.event_warp;
    }
  }
  if (eventImage && data.event_image) {
    eventImage.src = data.event_image;
    eventImage.alt = data.event_area || "Current event highlight";
  }

  const focusAreas = normalizeFocusAreas(data.focus_areas);
  if (focusList && focusAreas.length) {
    focusList.innerHTML = "";
    focusAreas.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "panel-focus-item";
      if (item.area) btn.setAttribute("data-area", item.area);
      if (item.image) btn.setAttribute("data-image", item.image);

      const name = document.createElement("span");
      name.textContent = item.area || "Focus area";
      const warp = document.createElement("code");
      warp.textContent = item.warp || "";

      btn.appendChild(name);
      btn.appendChild(warp);
      focusList.appendChild(btn);
    });
  }
}

function getDiscordNameFromSession(session) {
  const meta = session?.user?.user_metadata || {};
  return meta.full_name
    || meta.name
    || meta.preferred_username
    || meta.global_name
    || meta.custom_claims?.global_name
    || meta.username
    || session?.user?.email
    || "Builder";
}

function getMcAccountFromSession(session) {
  const meta = session?.user?.user_metadata || {};
  return meta.mc_username || meta.minecraft_username || meta.mc || "";
}

async function initBuilderProfile() {
  const nameEl = document.getElementById("builderWelcomeName");
  const roleEl = document.getElementById("builderRole");
  const mcEl = document.getElementById("builderMcAccount");
  const gate = document.getElementById("builderGate");
  const gateTitle = document.getElementById("builderGateTitle");
  const gateMessage = document.getElementById("builderGateMessage");
  const gateAction = document.getElementById("builderGateAction");
  const gateAlt = document.getElementById("builderGateAlt");
  if (!nameEl && !roleEl && !mcEl) return;

  const client = getSupabaseClient();
  if (!client) return;

  const { data } = await client.auth.getSession();
  const session = data.session;
  if (!session) return;

  if (nameEl) nameEl.textContent = getDiscordNameFromSession(session);

  const mc = getMcAccountFromSession(session);
  if (mcEl && mc) {
    mcEl.textContent = mc;
  }

  if (roleEl) {
    roleEl.textContent = "Builder";
    try {
      let data = null;
      let error = null;
      const accessToken = session?.access_token || "";
      const fnUrl = `${SUPABASE_URL}/functions/v1/discord-guild-role`;

      if (accessToken) {
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY
          },
          body: JSON.stringify({})
        });
        if (res.ok) {
          data = await res.json();
        } else {
          error = new Error(`Function failed (${res.status})`);
        }
      } else {
        error = new Error("Missing session access token");
      }

      if (!error && data?.role) {
        const displayRole = data.is_engineer ? `${data.role} (Engineer)` : data.role;
        roleEl.textContent = displayRole;

        if (data.in_guild === false && gate) {
          if (gateTitle) gateTitle.textContent = "Join the Discord server";
          if (gateMessage) gateMessage.textContent = "You must be in the BTE Canada Discord server to access the builder panel.";
          if (gateAction) {
            gateAction.textContent = "Join Discord";
            gateAction.setAttribute("href", "https://discord.gg/pnPSvpfhAs");
          }
          if (gateAlt) gateAlt.textContent = "Back Home";
          gate.classList.add("show");
          gate.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        } else if (String(data.role).toLowerCase() === "trial builder" && gate) {
          if (gateTitle) gateTitle.textContent = "Complete your trial build";
          if (gateMessage) gateMessage.textContent = "Trial builders must visit the Build page and complete the trial process before accessing the builder panel.";
          if (gateAction) {
            gateAction.textContent = "Go to Build page";
            gateAction.setAttribute("href", "build.html");
          }
          if (gateAlt) gateAlt.textContent = "Back Home";
          gate.classList.add("show");
          gate.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        }
      }
    } catch (_err) {
      // keep default role
    }
  }
}
function initAdminAnnouncement() {
  const input = document.getElementById("announcementInput");
  const saveBtn = document.getElementById("announcementSave");
  const clearBtn = document.getElementById("announcementClear");
  const status = document.getElementById("announcementStatus");
  if (!input || !saveBtn || !clearBtn) return;

  fetchAnnouncement().then((message) => {
    if (message) input.value = message;
  });

  saveBtn.addEventListener("click", async () => {
    const message = input.value.trim();
    if (status) status.textContent = "Saving...";
    const { error } = await upsertAnnouncement(message);
    if (error) {
      if (status) status.textContent = `Save failed: ${error.message}`;
      return;
    }
    if (status) status.textContent = "Announcement updated.";
    setNavAnnouncement(message);
  });

  clearBtn.addEventListener("click", async () => {
    input.value = "";
    if (status) status.textContent = "Clearing...";
    const { error } = await upsertAnnouncement("");
    if (error) {
      if (status) status.textContent = `Clear failed: ${error.message}`;
      return;
    }
    if (status) status.textContent = "Announcement cleared.";
    setNavAnnouncement("");
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
  syncMapAnnouncementOffset();
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
  initStaffGrid();
  initDocsGate();
  initLightboxZoom();
  initSettingsMenu();
  initAnnouncementBar();
  initAdminAnnouncement();
  initBuilderAreas();
  initBuilderProfile();
  initSettingsProfile();
  initAdminLink();
  initLogoutButton();
  initStatCounters();
  initScrollReveal();
});

async function fetchStaffMembers() {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from("staff_members")
      .select("mc_username,discord_id,discord_username,official_title,role,show_on_front,avatar_url")
      .eq("show_on_front", true)
      .order("mc_username", { ascending: true });
    if (error) return [];
    return data || [];
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/staff_members?select=mc_username,discord_id,discord_username,official_title,role,show_on_front,avatar_url&show_on_front=eq.true`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

function getDiscordFallbackAvatar(discordId) {
  const idNum = Number(discordId);
  if (!Number.isFinite(idNum)) return "https://cdn.discordapp.com/embed/avatars/0.png";
  const index = Math.abs(idNum) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

async function initStaffGrid() {
  const carousel = document.getElementById("staffCarousel");
  if (!carousel) return;

  const rows = await fetchStaffMembers();
  if (!rows.length) {
    carousel.innerHTML = `<p class="section-text">No staff listed yet.</p>`;
    return;
  }

  const roleRank = {
    admin: 3,
    developer: 2,
    staff: 1,
    none: 0
  };
  rows.sort((a, b) => {
    const rankA = roleRank[(a.role || "none").toLowerCase()] ?? 0;
    const rankB = roleRank[(b.role || "none").toLowerCase()] ?? 0;
    if (rankA !== rankB) return rankB - rankA;
    return (a.mc_username || "").localeCompare(b.mc_username || "");
  });

  carousel.innerHTML = "";
  rows.forEach((row) => {
    const card = document.createElement("div");
    card.className = "staff-card";
    const avatar = row.avatar_url || getDiscordFallbackAvatar(row.discord_id);
    const handle = row.discord_username || row.discord_id || "";
    const title = row.official_title || row.role || "Staff";
    card.innerHTML = `
      <img src="${avatar}" alt="${escapeHtml(row.mc_username || "Staff")}" />
      <h4>${escapeHtml(row.mc_username || "Staff")}</h4>
      <p class="staff-discord"><code>${escapeHtml(handle)}</code></p>
      <p>${escapeHtml(title)}</p>
    `;
    carousel.appendChild(card);
  });
}

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

