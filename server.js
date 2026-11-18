import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { pickWishes } from "./wishes.js";
import { describeDoors } from "./dates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data", "calendars.json");
const PORT = Number(process.env.PORT) || 3000;
const DESIGNS = new Set(["festive", "beige"]);

function nowDate() {
  if (process.env.ADVENT_NOW) return new Date(process.env.ADVENT_NOW);
  return new Date();
}

function adventYear(date) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      year: "numeric"
    }).format(date)
  );
}

async function readDb() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { calendars: {} };
    throw error;
  }
}

let writeChain = Promise.resolve();

function updateDb(mutator) {
  const run = writeChain.then(async () => {
    const db = await readDb();
    const result = await mutator(db);
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
    return result;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store"
  });
  res.end(payload);
}

function publicCalendar(calendar) {
  return {
    id: calendar.id,
    recipientName: calendar.recipientName,
    fromName: calendar.fromName,
    design: calendar.design,
    year: calendar.year
  };
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

function cleanName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 20_000) {
      const error = new Error("Body too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON");
    error.status = 400;
    throw error;
  }
}

function calendarSnapshot(calendar) {
  return {
    ...publicCalendar(calendar),
    ...describeDoors(calendar.year, nowDate())
  };
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean);

  if (req.method === "GET" && url.pathname === "/api/today") {
    const date = nowDate();
    send(res, 200, { year: adventYear(date), ...describeDoors(adventYear(date), date) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/calendars") {
    const body = await readBody(req);
    const recipientName = cleanName(body.recipientName);
    const fromName = cleanName(body.fromName);
    const design = String(body.design ?? "");
    if (!recipientName || !fromName || !DESIGNS.has(design)) {
      send(res, 400, { error: "Add both names and choose a design." });
      return;
    }
    const date = nowDate();
    const calendar = {
      id: crypto.randomBytes(9).toString("base64url"),
      recipientName,
      fromName,
      design,
      year: adventYear(date),
      wishes: pickWishes(),
      progress: {},
      createdAt: date.toISOString()
    };
    await updateDb((db) => {
      db.calendars[calendar.id] = calendar;
    });
    send(res, 201, publicCalendar(calendar));
    return;
  }

  if (parts[0] === "api" && parts[1] === "calendars" && parts[2]) {
    const id = parts[2];
    const db = await readDb();
    const calendar = db.calendars[id];
    if (!calendar) {
      send(res, 404, { error: "This calendar link doesn't exist." });
      return;
    }

    if (req.method === "GET" && parts.length === 3) {
      send(res, 200, calendarSnapshot(calendar));
      return;
    }

    if (req.method === "POST" && parts[3] === "visit") {
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      if (!validEmail(email)) {
        send(res, 400, { error: "Enter a valid email address." });
        return;
      }
      const opened = calendar.progress[email] ?? [];
      send(res, 200, {
        ...calendarSnapshot(calendar),
        email,
        openedDays: opened
      });
      return;
    }

    if (req.method === "POST" && parts[3] === "open") {
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const day = Number(body.day);
      if (!validEmail(email)) {
        send(res, 400, { error: "Enter a valid email address." });
        return;
      }
      if (!Number.isInteger(day) || day < 1 || day > 24) {
        send(res, 400, { error: "That door doesn't exist." });
        return;
      }
      const phase = describeDoors(calendar.year, nowDate()).doors[day - 1].phase;
      const already = (calendar.progress[email] ?? []).includes(day);
      if (phase === "future" && !already && !body.confirmEarly) {
        send(res, 409, { error: "early", day, phase });
        return;
      }
      const saved = await updateDb((db) => {
        const current = db.calendars[id];
        const opened = new Set(current.progress[email] ?? []);
        opened.add(day);
        current.progress[email] = [...opened].sort((a, b) => a - b);
        return current.progress[email];
      });
      send(res, 200, {
        day,
        phase,
        wish: calendar.wishes[day - 1],
        fromName: calendar.fromName,
        openedDays: saved
      });
      return;
    }
  }

  send(res, 404, { error: "Not found" });
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

async function serveStatic(res, pathname) {
  const relative = pathname === "/" || pathname.startsWith("/c/") ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, relative));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, { error: "Forbidden" });
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  } catch {
    send(res, 404, { error: "Not found" });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, { error: "Method not allowed" });
      return;
    }
    await serveStatic(res, url.pathname);
  } catch (error) {
    send(res, error.status || 500, { error: error.status ? error.message : "Something went wrong." });
  }
});

server.listen(PORT, () => {
  console.log(`Advent calendar running at http://localhost:${PORT}`);
});
