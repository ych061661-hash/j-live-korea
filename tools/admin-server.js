const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const EVENTS_FILE = process.env.JLIVE_EVENTS_FILE ? path.resolve(process.env.JLIVE_EVENTS_FILE) : path.join(ROOT, "calendar", "data", "events.json");
const ADMIN_DIR = path.join(__dirname, "admin");
const STATUSES = new Set(["pending", "confirmed", "cancelled", "rejected"]);

function readEvents() {
  return JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
}

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validateEvent(event, events = []) {
  const errors = [];
  const required = ["id", "artist", "concertDate", "time", "venue", "vendor", "vendorUrl"];
  for (const key of required) {
    if (!String(event[key] || "").trim()) errors.push(`${key} 값이 필요합니다.`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(event.id || "")) errors.push("id는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.concertDate || "")) errors.push("concertDate는 YYYY-MM-DD 형식이어야 합니다.");
  if (!STATUSES.has(event.status)) errors.push("지원하지 않는 상태입니다.");
  if (event.vendorUrl && !isUrl(event.vendorUrl)) errors.push("예매처 URL이 올바르지 않습니다.");
  if ((event.ticketDate && !event.ticketTime) || (!event.ticketDate && event.ticketTime)) errors.push("일반예매 날짜와 시각은 함께 입력해야 합니다.");
  if ((event.presaleDate && !event.presaleTime) || (!event.presaleDate && event.presaleTime)) errors.push("선예매 날짜와 시각은 함께 입력해야 합니다.");
  if (events.some(item => item.id !== event.id && item.artist === event.artist && item.concertDate === event.concertDate && item.venue === event.venue)) {
    errors.push("같은 아티스트·공연일·공연장의 일정이 이미 있습니다.");
  }

  if (event.status === "confirmed") {
    if (!String(event.youtubeChannel || "").trim()) errors.push("승인하려면 공식 YouTube 채널이 필요합니다.");
    if (!Array.isArray(event.sources) || event.sources.length === 0) errors.push("승인하려면 공식 출처가 1개 이상 필요합니다.");
    if (!event.verifiedAt) errors.push("승인하려면 마지막 검증일이 필요합니다.");
    if (!Array.isArray(event.songs) || event.songs.length !== 3) errors.push("승인하려면 대표곡이 정확히 3개 필요합니다.");
    for (const [index, song] of (event.songs || []).entries()) {
      if (!song?.[0] || !isUrl(song?.[2] || "") || !String(song?.[2] || "").includes("youtube.com/watch")) {
        errors.push(`대표곡 ${index + 1}은 곡명과 YouTube watch URL이 필요합니다.`);
      }
    }
    for (const source of event.sources || []) {
      if (!isUrl(source)) errors.push(`출처 URL이 올바르지 않습니다: ${source}`);
    }
  }
  if (event.status === "cancelled" && !String(event.cancellationReason || "").trim()) errors.push("취소 사유가 필요합니다.");
  return errors;
}

function normalizeEvent(input, previous = {}) {
  const text = key => String(input[key] ?? previous[key] ?? "").trim();
  const lines = value => Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
  const songs = Array.isArray(input.songs)
    ? input.songs.map(song => [String(song?.[0] || "").trim(), String(song?.[1] || "").trim(), String(song?.[2] || "").trim()]).filter(song => song[0] || song[2])
    : [];
  const event = {
    ...previous,
    id: text("id"),
    artist: text("artist"),
    genre: text("genre"),
    concertDate: text("concertDate"),
    time: text("time"),
    venue: text("venue"),
    presaleDate: text("presaleDate"),
    presaleTime: text("presaleTime"),
    ticketDate: text("ticketDate"),
    ticketTime: text("ticketTime"),
    vendor: text("vendor"),
    vendorUrl: text("vendorUrl"),
    youtubeChannel: text("youtubeChannel"),
    songs,
    sources: lines(input.sources),
    verifiedAt: text("verifiedAt"),
    status: text("status") || "pending",
    updatedAt: new Date().toISOString()
  };
  const price = input.price === "" || input.price == null ? null : Number(input.price);
  if (Number.isFinite(price)) event.price = price;
  else delete event.price;
  const currency = text("priceCurrency");
  if (currency) event.priceCurrency = currency;
  else delete event.priceCurrency;
  const cancellationReason = text("cancellationReason");
  if (cancellationReason) event.cancellationReason = cancellationReason;
  else delete event.cancellationReason;
  if (!event.createdAt) event.createdAt = new Date().toISOString();
  return event;
}

function writeEvents(events) {
  const temp = `${EVENTS_FILE}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(events, null, 2)}\n`, "utf8");
  fs.renameSync(temp, EVENTS_FILE);
}

function regenerate() {
  if (process.env.JLIVE_SKIP_GENERATE === "1") return;
  const result = spawnSync(process.execPath, [path.join(ROOT, "tools", "generate-seo-pages.js")], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "SEO 페이지 생성 실패");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("요청 본문이 너무 큽니다."));
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("JSON 형식이 올바르지 않습니다.")); }
    });
    req.on("error", reject);
  });
}

function serveFile(res, file, type) {
  if (!fs.existsSync(file)) return sendJson(res, 404, { error: "파일을 찾을 수 없습니다." });
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}

async function handle(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  try {
    if (req.method === "GET" && url.pathname === "/api/events") return sendJson(res, 200, { events: readEvents() });
    if (req.method === "POST" && url.pathname === "/api/events") {
      const events = readEvents();
      const input = await readBody(req);
      if (events.some(item => item.id === input.id)) return sendJson(res, 409, { errors: ["같은 id의 일정이 이미 있습니다."] });
      const event = normalizeEvent(input);
      const errors = validateEvent(event, events);
      if (errors.length) return sendJson(res, 422, { errors });
      events.push(event);
      writeEvents(events);
      if (event.status !== "pending") regenerate();
      return sendJson(res, 201, { event });
    }
    const match = url.pathname.match(/^\/api\/events\/([^/]+)$/);
    if (req.method === "PUT" && match) {
      const events = readEvents();
      const index = events.findIndex(item => item.id === decodeURIComponent(match[1]));
      if (index < 0) return sendJson(res, 404, { errors: ["일정을 찾을 수 없습니다."] });
      const event = normalizeEvent(await readBody(req), events[index]);
      if (event.id !== events[index].id) return sendJson(res, 422, { errors: ["기존 일정의 id는 변경할 수 없습니다."] });
      const errors = validateEvent(event, events);
      if (errors.length) return sendJson(res, 422, { errors });
      events[index] = event;
      writeEvents(events);
      if (event.status !== "pending") regenerate();
      return sendJson(res, 200, { event });
    }
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) return serveFile(res, path.join(ADMIN_DIR, "index.html"), "text/html; charset=utf-8");
    if (req.method === "GET" && url.pathname === "/admin.js") return serveFile(res, path.join(ADMIN_DIR, "admin.js"), "text/javascript; charset=utf-8");
    if (req.method === "GET" && url.pathname === "/admin.css") return serveFile(res, path.join(ADMIN_DIR, "admin.css"), "text/css; charset=utf-8");
    return sendJson(res, 404, { error: "경로를 찾을 수 없습니다." });
  } catch (error) {
    return sendJson(res, 500, { errors: [error.message] });
  }
}

function start(port = Number(process.env.PORT) || 4173) {
  const server = http.createServer(handle);
  server.listen(port, "127.0.0.1", () => console.log(`J-LIVE admin: http://127.0.0.1:${server.address().port}`));
  return server;
}

if (require.main === module) start();

module.exports = { normalizeEvent, validateEvent, start };
