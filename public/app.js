const app = document.querySelector("#app");

/* ============================================
   EDIT MAIN PAGE TEXTS HERE
   ============================================ */
const PAGE_COPY = {
  eyebrow: "A small December gift",
  title: "A little Christmas magic made for someone special.",
  intro:
    "Choose a design, add your names, and share 24 wishes for December with those you care about.",
  recipientLabel: "For:",
  senderLabel: "From:",
  designsLabel: "Design",
  previewButton: "Preview calendar",
  backButton: "Back",
  designs: [
    {
      id: "festive",
      name: "Christmas Magic",
      copy: "A cozy cabin fireplace, with advent spots on stockings, walls, and books."
    },
    {
      id: "elegant",
      name: "Winter Elegance",
      copy: "A decorated snowy house, with glowing windows for each December day."
    }
  ]
};
/* ============================================ */

const DESIGNS = PAGE_COPY.designs;

const DESIGN_ART = {
  festive: "/designs/festive.jpg",
  festiveOpen: "/designs/festive-open.jpg",
  elegant: "/designs/elegant.jpg",
  elegantOpen: "/designs/elegant-open.jpg",
  beige: "/designs/elegant.jpg",
  main: "/designs/main-bg.jpg"
};

const OPEN_ART = {
  elegant: {
    closed: DESIGN_ART.elegant,
    open: DESIGN_ART.elegantOpen,
    widthMul: 2.35,
    heightMul: 1.55,
    yNudge: 0.08
  },
  festive: {
    closed: DESIGN_ART.festive,
    open: DESIGN_ART.festiveOpen,
    widthMul: 1.35,
    heightMul: 1.35,
    yNudge: 0.02,
    byDay: {
      1: { widthMul: 1.12, heightMul: 1.08 },
      2: { widthMul: 1.12, heightMul: 1.08 },
      3: { widthMul: 1.12, heightMul: 1.08 },
      4: { widthMul: 1.12, heightMul: 1.08 },
      5: { widthMul: 1.18, heightMul: 1.22 },
      6: { widthMul: 1.18, heightMul: 1.22 },
      7: { widthMul: 1.18, heightMul: 1.22 },
      8: { widthMul: 1.18, heightMul: 1.22 },
      9: { widthMul: 1.18, heightMul: 1.22 },
      10: { widthMul: 1.18, heightMul: 1.22 },
      11: { widthMul: 1.18, heightMul: 1.22 },
      12: { widthMul: 1.18, heightMul: 1.22 },
      13: { widthMul: 1.18, heightMul: 1.22 },
      14: { widthMul: 1.18, heightMul: 1.22 },
      15: { widthMul: 1.18, heightMul: 1.22 },
      16: { widthMul: 1.18, heightMul: 1.22 },
      17: { widthMul: 1.18, heightMul: 1.22 },
      18: { widthMul: 1.18, heightMul: 1.22 },
      19: { widthMul: 1.18, heightMul: 1.22 },
      20: { widthMul: 1.18, heightMul: 1.22 },
      21: { widthMul: 1.18, heightMul: 1.22 },
      22: { widthMul: 1.18, heightMul: 1.22 },
      23: { widthMul: 1.18, heightMul: 1.22 },
      24: { widthMul: 1.55, heightMul: 1.35, yNudge: -0.05 }
    }
  }
};

const imageCache = new Map();
const composeCache = new Map();

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

async function composeOpenedScene(design, openedDays) {
  const spec = OPEN_ART[design];
  if (!spec || !openedDays?.length) return null;
  const map = HOTSPOTS[design];
  if (!map) return null;

  const key = `${design}:${[...openedDays].sort((a, b) => a - b).join(",")}`;
  if (composeCache.has(key)) return composeCache.get(key);

  const [closed, open] = await Promise.all([loadImage(spec.closed), loadImage(spec.open)]);
  const canvas = document.createElement("canvas");
  canvas.width = closed.naturalWidth || closed.width;
  canvas.height = closed.naturalHeight || closed.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(closed, 0, 0, canvas.width, canvas.height);

  for (const day of openedDays) {
    const box = map[day];
    if (!box) continue;
    const daySpec = (spec.byDay && spec.byDay[day]) || {};
    const widthMul = daySpec.widthMul ?? spec.widthMul ?? 1.2;
    const heightMul = daySpec.heightMul ?? spec.heightMul ?? 1.2;
    const yNudge = daySpec.yNudge ?? spec.yNudge ?? 0;
    const gw = (box.w / 100) * canvas.width;
    const gh = (box.h / 100) * canvas.height;
    const cx = (box.left / 100) * canvas.width + gw / 2;
    const cy = (box.top / 100) * canvas.height + gh / 2;
    const w = gw * widthMul;
    const h = gh * heightMul;
    const x = cx - w / 2;
    const y = cy - h / 2 - gh * yNudge;
    ctx.drawImage(open, x, y, w, h, x, y, w, h);
  }
  const url = canvas.toDataURL("image/jpeg", 0.92);
  composeCache.set(key, url);
  return url;
}

async function applyOpenedSceneArt() {
  const img = document.querySelector(".scene-art[data-compose]");
  if (!img) return;
  const design = img.dataset.compose;
  const opened = (img.dataset.opened || "")
    .split(",")
    .map(Number)
    .filter((n) => n >= 1 && n <= 24);
  const baseSrc = DESIGN_ART[design] || img.getAttribute("src");
  if (!opened.length) {
    img.src = baseSrc;
    return;
  }
  try {
    const url = await composeOpenedScene(design, opened);
    if (url) img.src = url;
  } catch {
    img.src = baseSrc;
  }
}

/** Percent boxes: { left, top, w, h } — aligned to numbered objects on each design image. */
const HOTSPOTS = {
  festive: {
    1: { left: 61.9, top: 35.8, w: 7.2, h: 16.5 },
    2: { left: 70.4, top: 35.2, w: 7.2, h: 16.5 },
    3: { left: 78.9, top: 34.8, w: 7.2, h: 16.5 },
    4: { left: 86.9, top: 34.8, w: 7.2, h: 16.5 },
    5: { left: 25.3, top: 18.6, w: 7.4, h: 8.8 },
    6: { left: 33.8, top: 19.1, w: 7.4, h: 8.8 },
    7: { left: 42.3, top: 20.1, w: 7.4, h: 8.8 },
    8: { left: 25.8, top: 31.1, w: 7.4, h: 8.8 },
    9: { left: 33.8, top: 32.1, w: 7.4, h: 8.8 },
    10: { left: 42.3, top: 32.6, w: 7.4, h: 8.8 },
    11: { left: 50.9, top: 20.9, w: 7.2, h: 9.2 },
    12: { left: 70.9, top: 15.4, w: 8.2, h: 9.2 },
    13: { left: 50.9, top: 33.9, w: 7.2, h: 9.2 },
    14: { left: 88.8, top: 15.4, w: 7.5, h: 9.2 },
    15: { left: 29.0, top: 78.0, w: 9.0, h: 11.0 },
    16: { left: 50.9, top: 46.9, w: 7.2, h: 9.2 },
    17: { left: 25.5, top: 44.6, w: 6.0, h: 7.8 },
    18: { left: 32.0, top: 44.6, w: 6.0, h: 7.8 },
    19: { left: 38.5, top: 44.6, w: 6.0, h: 7.8 },
    20: { left: 45.0, top: 44.6, w: 6.0, h: 7.8 },
    21: { left: 49.5, top: 69.5, w: 8.0, h: 10.0 },
    22: { left: 58.4, top: 70.2, w: 8.2, h: 10.5 },
    23: { left: 66.4, top: 72.8, w: 8.2, h: 10.5 },
    24: { left: 43.0, top: 75.5, w: 10.0, h: 11.0 }
  },
  elegant: {
    /* Pixel-fitted to each window's glowing glass pane */
    1: { left: 24.2, top: 40.8, w: 5.2, h: 6.4 },
    2: { left: 33.2, top: 41.2, w: 4.8, h: 6.4 },
    3: { left: 41.4, top: 41.2, w: 4.6, h: 6.4 },
    4: { left: 57.2, top: 41.6, w: 4.4, h: 6.4 },
    5: { left: 64.5, top: 42.0, w: 4.6, h: 6.4 },
    6: { left: 72.3, top: 42.4, w: 4.2, h: 6.4 },
    7: { left: 24.6, top: 53.8, w: 5.0, h: 6.4 },
    8: { left: 33.0, top: 54.0, w: 5.2, h: 6.4 },
    9: { left: 41.6, top: 54.4, w: 4.8, h: 6.4 },
    10: { left: 57.2, top: 54.6, w: 4.6, h: 6.4 },
    11: { left: 64.8, top: 54.8, w: 4.4, h: 6.4 },
    12: { left: 72.3, top: 55.0, w: 4.4, h: 6.4 },
    13: { left: 24.4, top: 67.6, w: 5.2, h: 6.4 },
    14: { left: 33.4, top: 67.6, w: 4.8, h: 6.4 },
    15: { left: 41.6, top: 67.6, w: 4.4, h: 6.4 },
    16: { left: 57.4, top: 67.8, w: 4.2, h: 6.4 },
    17: { left: 64.8, top: 67.8, w: 4.4, h: 6.4 },
    18: { left: 72.3, top: 67.8, w: 4.4, h: 6.4 },
    19: { left: 25.0, top: 81.6, w: 4.8, h: 6.2 },
    20: { left: 33.4, top: 81.6, w: 4.8, h: 6.2 },
    21: { left: 41.6, top: 81.6, w: 4.4, h: 6.2 },
    22: { left: 57.4, top: 81.4, w: 4.2, h: 6.2 },
    23: { left: 64.9, top: 81.4, w: 4.4, h: 6.2 },
    24: { left: 72.3, top: 81.4, w: 4.4, h: 6.2 }
  }
};

function possessiveName(name) {
  const value = String(name ?? "").trim() || "Name";
  return /s$/i.test(value) ? `${value}'` : `${value}'s`;
}

function designPreviewHtml(designId) {
  const src = DESIGN_ART[designId] || DESIGN_ART.festive;
  return `<span class="mini-calendar mini-photo" aria-hidden="true">
      <img class="mini-photo-img" src="${src}" alt="" />
    </span>`;
}

function doorLabel(door, opened) {
  if (opened) return "Opened";
  if (door.phase === "today") return "Today";
  if (door.phase === "past") return "Open";
  return "Closed";
}

function hotspotElement(door, openedDays, interactive, design) {
  const opened = openedDays.includes(door.day);
  const map = HOTSPOTS[design] || HOTSPOTS.elegant;
  const box = map[door.day] || { left: 50, top: 50, w: 6, h: 8 };
  const shape =
    design === "elegant"
      ? "is-window"
      : door.day <= 4
        ? "is-sock"
        : door.day === 24
          ? "is-book"
          : door.day >= 21
            ? "is-gift"
            : "is-plaque";
  const classes = [
    "hotspot",
    shape,
    opened ? "is-open" : "",
    door.phase === "today" ? "is-today" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const label = doorLabel(door, opened);
  const style = `left:${box.left}%;top:${box.top}%;width:${box.w}%;height:${box.h}%`;
  const inner = `<span class="num">${door.day}</span><span class="state">${label}</span>`;
  if (!interactive) {
    return `<div class="${classes}" style="${style}" data-day="${door.day}">${inner}</div>`;
  }
  return `<button class="${classes}" style="${style}" type="button" data-day="${door.day}" aria-label="Day ${door.day}, ${label}">${inner}</button>`;
}

function calendarSceneHtml(design, doors, openedDays, interactive, recipientName, fromName) {
  const art = DESIGN_ART[design] || DESIGN_ART.festive;
  const key = HOTSPOTS[design] ? design : "elegant";
  const spots = doors
    .map((door) => hotspotElement(door, openedDays, interactive, key))
    .join("");
  const compose =
    OPEN_ART[key] && openedDays.length
      ? ` data-compose="${key}" data-opened="${openedDays.join(",")}"`
      : OPEN_ART[key]
        ? ` data-compose="${key}" data-opened=""`
        : "";

  return `<section class="scene-frame image-scene image-${key}" aria-label="Advent calendar scene">
      <div class="scene-art-wrap">
        <img class="scene-art" src="${art}" alt=""${compose} />
        <div class="scene-title-overlay">
          <h2>${esc(possessiveName(recipientName))} Advent Calendar</h2>
        </div>
        <p class="scene-from-footer">with love from ${esc(fromName)}</p>
        <div class="hotspot-layer">${spots}</div>
      </div>
    </section>`;
}

function calendarHeadingHtml({ note, eyebrow }) {
  return `<header class="calendar-head calendar-head-slim">
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
      <p class="note">${esc(note)}</p>
    </header>`;
}

const state = {
  recipientName: "",
  fromName: "",
  design: "festive",
  preview: null,
  link: "",
  busy: false,
  error: "",
  calendar: null,
  email: "",
  openedDays: [],
  wish: null,
  confirmDay: null,
  copied: false
};

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function calendarId() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "c" && parts[1]) return decodeURIComponent(parts[1]);
  return "";
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 409) {
    throw new Error(data.error || "Something went wrong.");
  }
  return { status: response.status, data };
}

function applyDesign(design) {
  if (design) document.body.dataset.design = design;
  else delete document.body.dataset.design;
}

function sceneHtml(day) {
  const kind = day % 3;
  if (kind === 0) return `<div class="glow-orb"></div>`;
  const bits = Array.from({ length: 14 }, (_, index) => {
    const left = (index * 7 + day * 3) % 100;
    const delay = (index % 7) * 0.35;
    const size = 4 + (index % 4) * 2;
    const duration = 4 + (index % 5);
    const cls = kind === 1 ? "flake" : "spark";
    return `<i class="${cls}" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size}px"></i>`;
  }).join("");
  return bits;
}

function statusLine(calendar) {
  if (calendar.today) return `Day ${calendar.today} is today's. It glows a little brighter.`;
  const future = calendar.doors.every((door) => door.phase === "future");
  if (future) return "Nothing is lit yet. Each day warms up on its December date.";
  return "December has passed, so no day is singled out. Every one can still be opened.";
}

function render() {
  const id = calendarId();
  const design = id
    ? state.calendar?.design
    : state.link
      ? ""
      : state.preview
        ? state.design
        : "";
  applyDesign(design);
  app.innerHTML = id ? recipientHtml() : creatorHtml();
  document.querySelector("#keep-closed, #close-wish")?.focus();
  applyOpenedSceneArt();
}

function creatorHtml() {
  if (state.link) return linkHtml();
  if (state.preview) return previewHtml();
  return `<div class="create-page">
      <div class="create-hero" aria-hidden="true">
        <img class="create-hero-img" src="${DESIGN_ART.main}" alt="" />
        <div class="create-hero-shade"></div>
      </div>
      <header class="create-head">
        <p class="eyebrow">${esc(PAGE_COPY.eyebrow)}</p>
        <h1>${esc(PAGE_COPY.title)}</h1>
        <p class="lede">${esc(PAGE_COPY.intro)}</p>
      </header>
      <form class="panel create-panel" id="create-form">
        <div class="fields">
          <label>${esc(PAGE_COPY.recipientLabel)}
            <input name="recipientName" type="text" maxlength="40" required value="${esc(state.recipientName)}" autocomplete="off" />
          </label>
          <label>${esc(PAGE_COPY.senderLabel)}
            <input name="fromName" type="text" maxlength="40" required value="${esc(state.fromName)}" autocomplete="off" />
          </label>
        </div>
        <div class="designs">
          <span class="designs-label">${esc(PAGE_COPY.designsLabel)}</span>
          <div class="design-grid" role="group" aria-label="Calendar design">
            ${DESIGNS.map((design) => {
              const selected = state.design === design.id;
              return `<button type="button" class="design-card ${selected ? "is-selected" : ""}" data-design="${design.id}" aria-pressed="${selected}">
                ${designPreviewHtml(design.id)}
                <strong>${design.name}</strong>
                <span class="design-copy">${design.copy}</span>
                ${selected ? `<span class="selected-label">Selected</span>` : ""}
              </button>`;
            }).join("")}
          </div>
        </div>
        ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
        <div class="actions">
          <button class="btn" type="submit">${esc(PAGE_COPY.previewButton)}</button>
        </div>
      </form>
    </div>`;
}

function previewHtml() {
  return `<div class="preview-page">
    ${calendarHeadingHtml({
      eyebrow: "Preview",
      note: statusLine(state.preview)
    })}
    ${calendarSceneHtml(state.design, state.preview.doors, [], false, state.recipientName, state.fromName)}
    <div class="actions">
      <button class="btn" id="create-link" type="button" ${state.busy ? "disabled" : ""}>Create link</button>
      <button class="btn secondary" id="back" type="button">${esc(PAGE_COPY.backButton)}</button>
    </div>
    ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
    <p class="fine">The link is the gift. Copy it into a message, an email, or a chat. Wishes are chosen once and stay on these days.</p>
  </div>`;
}

function linkHtml() {
  return `<div class="share-page">
      <header class="share-head">
        <p class="eyebrow">Ready to send</p>
        <h1>${esc(possessiveName(state.recipientName))} calendar is ready</h1>
        <p class="lede">Copy the link and send it your way. ${esc(state.recipientName)} opens it, adds an email, and the days stay remembered here.</p>
      </header>
      <div class="panel share-card">
        <p class="share-label">Their unique link</p>
        <div class="link-row">
          <input id="share-link" type="text" readonly value="${esc(state.link)}" aria-label="Share link" />
          <button class="btn" id="copy" type="button">${state.copied ? "Copied" : "Copy link"}</button>
        </div>
        <div class="actions share-actions">
          <a class="btn" href="${esc(state.link)}">Open their calendar</a>
          <button class="btn secondary" id="another" type="button">Make another</button>
        </div>
        <p class="fine">Days follow Central European time. Nothing is emailed from here.</p>
      </div>
      <p class="page-from-footer">with love from ${esc(state.fromName)}</p>
    </div>`;
}

function recipientHtml() {
  if (!state.calendar) {
    return `<header><h1>Opening…</h1>${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}</header>`;
  }
  if (!state.email) return emailGateHtml();
  return `${calendarHeadingHtml({
      note: statusLine(state.calendar)
    })}
    ${calendarSceneHtml(
      state.calendar.design,
      state.calendar.doors,
      state.openedDays,
      true,
      state.calendar.recipientName,
      state.calendar.fromName
    )}
    <p class="fine">Opened days are saved for ${esc(state.email)}. Days follow Central European time.</p>
    ${state.confirmDay ? confirmHtml(state.confirmDay) : ""}
    ${state.wish ? wishHtml(state.wish) : ""}`;
}

function emailGateHtml() {
  const calendar = state.calendar;
  return `<div class="gate-page">
      <header class="gate-head">
        <p class="eyebrow">A calendar for ${esc(calendar.recipientName)}</p>
        <h1>${esc(possessiveName(calendar.recipientName))} Advent Calendar</h1>
        <p class="lede">Add your email so opened days are remembered on this calendar. There is no password, and nothing is sent to you.</p>
      </header>
      <form class="panel gate-card" id="email-form">
        <label>Your email
          <input name="email" type="email" required autocomplete="email" placeholder="you@example.com" />
        </label>
        ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
        <div class="actions">
          <button class="btn" type="submit" ${state.busy ? "disabled" : ""}>Show my calendar</button>
        </div>
      </form>
      <p class="page-from-footer">with love from ${esc(calendar.fromName)}</p>
    </div>`;
}

function confirmHtml(day) {
  return `<div class="overlay" id="confirm">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">Open day ${day} early?</h2>
        <p>This day is waiting for its own date. You can look now, or leave it closed.</p>
        <div class="actions">
          <button class="btn" id="keep-closed" type="button">Leave it closed</button>
          <button class="btn secondary" id="open-anyway" type="button">Open anyway</button>
        </div>
      </div>
    </div>`;
}

function wishHtml(wish) {
  return `<div class="overlay" id="wish">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="wish-title">
        <div class="scene" aria-hidden="true">${sceneHtml(wish.day)}</div>
        <p class="eyebrow">Day ${wish.day}</p>
        <p class="wish" id="wish-title">${esc(wish.wish)}</p>
        <div class="actions"><button class="btn" id="close-wish" type="button">Close</button></div>
      </div>
    </div>`;
}

async function loadRecipient() {
  const id = calendarId();
  state.error = "";
  try {
    const { data } = await api(`/api/calendars/${id}`);
    state.calendar = data;
    const saved = localStorage.getItem(`advent-email:${id}`);
    if (saved) await enterEmail(saved);
  } catch (error) {
    state.error = error.message;
  }
  render();
}

async function enterEmail(email) {
  const id = calendarId();
  state.busy = true;
  state.error = "";
  render();
  try {
    const { data } = await api(`/api/calendars/${id}/visit`, {
      method: "POST",
      body: JSON.stringify({ email })
    });
    state.email = data.email;
    state.openedDays = data.openedDays;
    state.calendar = data;
    localStorage.setItem(`advent-email:${id}`, data.email);
  } catch (error) {
    state.email = "";
    state.error = error.message;
  } finally {
    state.busy = false;
    render();
  }
}

async function openDoor(day, confirmEarly) {
  const id = calendarId();
  try {
    const { status, data } = await api(`/api/calendars/${id}/open`, {
      method: "POST",
      body: JSON.stringify({ email: state.email, day, confirmEarly })
    });
    if (status === 409) {
      state.confirmDay = day;
      render();
      return;
    }
    state.confirmDay = null;
    state.openedDays = data.openedDays;
    state.wish = data;
  } catch (error) {
    state.error = error.message;
  }
  render();
}

document.body.addEventListener("click", async (event) => {
  const el = event.target instanceof Element ? event.target : event.target.parentElement;
  if (!el) return;

  const design = el.closest("button[data-design]");
  if (design) {
    const form = document.querySelector("#create-form");
    if (form) {
      const formData = new FormData(form);
      state.recipientName = String(formData.get("recipientName") || "");
      state.fromName = String(formData.get("fromName") || "");
    }
    state.design = design.dataset.design;
    render();
    return;
  }
  if (el.closest("#back")) {
    state.preview = null;
    render();
    return;
  }
  if (el.closest("#another")) {
    state.link = "";
    state.preview = null;
    state.copied = false;
    render();
    return;
  }
  if (el.closest("#create-link")) {
    state.busy = true;
    state.error = "";
    render();
    try {
      const { data } = await api("/api/calendars", {
        method: "POST",
        body: JSON.stringify({
          recipientName: state.recipientName,
          fromName: state.fromName,
          design: state.design
        })
      });
      state.link = `${location.origin}/c/${data.id}`;
    } catch (error) {
      state.error = error.message;
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (el.closest("#copy")) {
    const input = document.querySelector("#share-link");
    input.select();
    try {
      await navigator.clipboard.writeText(state.link);
    } catch {
      document.execCommand("copy");
    }
    state.copied = true;
    render();
    return;
  }
  const door = el.closest("button.hotspot[data-day], button[data-day]");
  if (door) {
    openDoor(Number(door.dataset.day), false);
    return;
  }
  if (el.closest("#keep-closed")) {
    state.confirmDay = null;
    render();
    return;
  }
  if (el.closest("#open-anyway")) {
    openDoor(state.confirmDay, true);
    return;
  }
  if (el.closest("#close-wish") || el.id === "wish") {
    state.wish = null;
    render();
  }
});

document.body.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === "create-form") {
    const formData = new FormData(form);
    state.recipientName = String(formData.get("recipientName") || "").trim();
    state.fromName = String(formData.get("fromName") || "").trim();
    if (!state.recipientName || !state.fromName) {
      state.error = "Add both names.";
      render();
      return;
    }
    state.error = "";
    const { data } = await api("/api/today");
    state.preview = data;
    render();
  }
  if (form.id === "email-form") {
    enterEmail(new FormData(form).get("email"));
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (state.wish) state.wish = null;
  else if (state.confirmDay) state.confirmDay = null;
  else return;
  render();
});

if (calendarId()) loadRecipient();
else render();
