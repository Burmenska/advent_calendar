const app = document.querySelector("#app");
const DESIGNS = [
  {
    id: "festive",
    name: "Festive",
    copy: "Red evening, gold light, a little wooden door.",
    colors: ["#9c2f2f", "#1d1412", "#f0c36a"]
  },
  {
    id: "beige",
    name: "Beige fashion",
    copy: "Stone, ivory, and a quiet editorial grid.",
    colors: ["#fbf7f2", "#b08968", "#221e1a"]
  }
];

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

function doorLabel(door, opened) {
  if (opened) return "Opened";
  if (door.phase === "today") return "Today";
  if (door.phase === "past") return "Open";
  return "Sealed";
}

function doorsHtml(doors, openedDays, interactive) {
  return doors
    .map((door) => {
      const opened = openedDays.includes(door.day);
      const classes = [
        "door",
        opened ? "is-open" : "",
        door.phase === "today" ? "is-today" : ""
      ]
        .filter(Boolean)
        .join(" ");
      const label = doorLabel(door, opened);
      if (!interactive) {
        return `<div class="${classes}"><span class="num">${door.day}</span><span class="knob"></span><span class="state">${label}</span></div>`;
      }
      return `<button class="${classes}" type="button" data-day="${door.day}" aria-label="Door ${door.day}, ${label}">
        <span class="num">${door.day}</span><span class="knob"></span><span class="state">${label}</span>
      </button>`;
    })
    .join("");
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
  if (calendar.today) return `Door ${calendar.today} is today's. It stays brighter than the others.`;
  const future = calendar.doors.every((door) => door.phase === "future");
  if (future) return "Nothing is highlighted yet. Each door lights up on its December day.";
  return "December has passed, so no door is singled out. Every one can still be opened.";
}

function render() {
  const id = calendarId();
  applyDesign(id ? state.calendar?.design : state.preview ? state.design : "");
  app.innerHTML = id ? recipientHtml() : creatorHtml();
  document.querySelector("#keep-closed, #close-wish")?.focus();
}

function creatorHtml() {
  if (state.link) return linkHtml();
  if (state.preview) return previewHtml();
  return `<header>
      <p class="eyebrow">A small December gift</p>
      <h1>Make a calendar for someone.</h1>
      <p class="lede">Add their name, your name, and a design. They get one link. Each door hides a warm wish, and today's door stands out between 1 and 24 December.</p>
    </header>
    <form class="panel" id="create-form">
      <div class="fields">
        <label>Their name
          <input name="recipientName" type="text" maxlength="40" required value="${esc(state.recipientName)}" autocomplete="off" />
        </label>
        <label>From whom
          <input name="fromName" type="text" maxlength="40" required value="${esc(state.fromName)}" autocomplete="off" />
        </label>
      </div>
      <div class="designs">
        <span>Design</span>
        <div class="design-grid">
          ${DESIGNS.map((design) => `<button type="button" class="design-card ${state.design === design.id ? "is-selected" : ""}" data-design="${design.id}">
              <span class="swatch">${design.colors.map((color) => `<i style="background:${color}"></i>`).join("")}</span>
              <strong>${design.name}</strong>
              <span>${design.copy}</span>
            </button>`).join("")}
        </div>
      </div>
      ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
      <div class="actions">
        <button class="btn" type="submit">Preview calendar</button>
      </div>
    </form>`;
}

function previewHtml() {
  const doors = state.preview.doors;
  return `<header class="calendar-head">
      <div>
        <p class="eyebrow">Preview for ${esc(state.recipientName)}</p>
        <h1>${esc(state.recipientName)}</h1>
        <p class="lede">From ${esc(state.fromName)}</p>
      </div>
      <p class="note">${esc(statusLine(state.preview))}</p>
    </header>
    <div class="grid">${doorsHtml(doors, [], false)}</div>
    <div class="actions">
      <button class="btn" id="create-link" type="button" ${state.busy ? "disabled" : ""}>Create link</button>
      <button class="btn secondary" id="back" type="button">Edit details</button>
    </div>
    ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
    <p class="fine">The link is the gift. Copy it into a message, an email, or a chat. Wishes are chosen once and stay on these doors.</p>`;
}

function linkHtml() {
  return `<header>
      <p class="eyebrow">Ready to send</p>
      <h1>Their calendar has a link.</h1>
      <p class="lede">Send it however you like. ${esc(state.recipientName)} enters an email on the page so opened doors are remembered on this calendar. Nothing is emailed from here.</p>
    </header>
    <div class="panel">
      <label>Unique link
        <div class="link-row">
          <input id="share-link" type="text" readonly value="${esc(state.link)}" />
          <button class="btn" id="copy" type="button">${state.copied ? "Copied" : "Copy link"}</button>
        </div>
      </label>
      <p class="fine">Days follow Central European time. Between 1 and 24 December, that day's door is brighter. After the 24th the calendar stays open, without a highlighted door.</p>
      <div class="actions">
        <a class="btn" href="${esc(state.link)}">Open their calendar</a>
        <button class="btn secondary" id="another" type="button">Make another</button>
      </div>
    </div>`;
}

function recipientHtml() {
  if (!state.calendar) {
    return `<header><h1>Opening…</h1>${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}</header>`;
  }
  if (!state.email) return emailGateHtml();
  return `<header class="calendar-head">
      <div>
        <p class="eyebrow">For ${esc(state.calendar.recipientName)}</p>
        <h1>${esc(state.calendar.recipientName)}</h1>
        <p class="lede">From ${esc(state.calendar.fromName)}</p>
      </div>
      <p class="note">${esc(statusLine(state.calendar))}</p>
    </header>
    <div class="grid">${doorsHtml(state.calendar.doors, state.openedDays, true)}</div>
    <p class="fine">Opened doors are saved for ${esc(state.email)}. Days follow Central European time.</p>
    ${state.confirmDay ? confirmHtml(state.confirmDay) : ""}
    ${state.wish ? wishHtml(state.wish) : ""}`;
}

function emailGateHtml() {
  const calendar = state.calendar;
  return `<header>
      <p class="eyebrow">A calendar for ${esc(calendar.recipientName)}</p>
      <h1>${esc(calendar.recipientName)}</h1>
      <p class="lede">From ${esc(calendar.fromName)}. Add your email before the doors open. It is how this calendar remembers which ones you have already opened. There is no password, and nothing is sent to you.</p>
    </header>
    <form class="panel" id="email-form">
      <label>Your email
        <input name="email" type="email" required autocomplete="email" placeholder="you@example.com" />
      </label>
      ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
      <div class="actions">
        <button class="btn" type="submit" ${state.busy ? "disabled" : ""}>Show my calendar</button>
      </div>
    </form>`;
}

function confirmHtml(day) {
  return `<div class="overlay" id="confirm">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">Open ${day} December early?</h2>
        <p>This door is waiting for its own day. You can look now, or leave it closed.</p>
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
        <p class="eyebrow">Door ${wish.day}</p>
        <p class="wish" id="wish-title">${esc(wish.wish)}</p>
        <p class="from-line">From ${esc(wish.fromName)}</p>
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
  const design = event.target.closest("button[data-design]");
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
  if (event.target.id === "back") {
    state.preview = null;
    render();
  }
  if (event.target.id === "another") {
    state.link = "";
    state.preview = null;
    state.copied = false;
    render();
  }
  if (event.target.id === "create-link") {
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
  }
  if (event.target.id === "copy") {
    const input = document.querySelector("#share-link");
    input.select();
    try {
      await navigator.clipboard.writeText(state.link);
    } catch {
      document.execCommand("copy");
    }
    state.copied = true;
    render();
  }
  const door = event.target.closest("[data-day]");
  if (door) openDoor(Number(door.dataset.day), false);
  if (event.target.id === "keep-closed") {
    state.confirmDay = null;
    render();
  }
  if (event.target.id === "open-anyway") openDoor(state.confirmDay, true);
  if (event.target.id === "close-wish" || event.target.id === "wish") {
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
