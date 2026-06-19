"use strict";

const fs = require("fs");
const path = require("path");

const DAY_MS = 24 * 60 * 60 * 1000;
const URGENCY_ORDER = ["critical", "high", "standard"];

function parseDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    throw new Error(`${label} must use YYYY-MM-DD format (received ${JSON.stringify(value)})`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a valid calendar date: ${value}`);
  }
  return date;
}

function daysBetween(earlier, later) {
  return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
}

function classifyUrgency({ ageDays, daysUntilConcert, missingVerification }, thresholdDays) {
  if (missingVerification || ageDays > thresholdDays * 2 || daysUntilConcert <= 14) return "critical";
  if (ageDays > thresholdDays + 7 || daysUntilConcert <= 30) return "high";
  return "standard";
}

function findStaleEvents(events, options) {
  const asOf = parseDate(options.asOf, "--as-of");
  const from = parseDate(options.from, "--from");
  const through = parseDate(options.through, "--through");
  if (from > through) throw new Error("--from cannot be after --through");
  if (!Number.isInteger(options.thresholdDays) || options.thresholdDays < 0) {
    throw new Error("--threshold-days must be a non-negative integer");
  }

  return events
    .filter(event => event.status === "confirmed")
    .filter(event => {
      const concertDate = parseDate(event.concertDate, `${event.id}.concertDate`);
      return concertDate >= asOf && concertDate >= from && concertDate <= through;
    })
    .map(event => {
      const concertDate = parseDate(event.concertDate, `${event.id}.concertDate`);
      const missingVerification = !event.verifiedAt;
      const verifiedDate = missingVerification ? null : parseDate(event.verifiedAt, `${event.id}.verifiedAt`);
      const ageDays = verifiedDate ? daysBetween(verifiedDate, asOf) : null;
      const isStale = missingVerification || ageDays > options.thresholdDays;
      if (!isStale) return null;
      const daysUntilConcert = daysBetween(asOf, concertDate);
      return {
        id: event.id,
        artist: event.artist,
        concertDate: event.concertDate,
        venue: event.venue,
        verifiedAt: event.verifiedAt || null,
        ageDays,
        daysUntilConcert,
        urgency: classifyUrgency({ ageDays, daysUntilConcert, missingVerification }, options.thresholdDays),
        sources: Array.isArray(event.sources) ? event.sources : []
      };
    })
    .filter(Boolean)
    .sort((a, b) => URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency)
      || a.concertDate.localeCompare(b.concertDate)
      || a.artist.localeCompare(b.artist));
}

function buildReport(events, options) {
  const stale = findStaleEvents(events, options);
  const groups = Object.fromEntries(URGENCY_ORDER.map(urgency => [
    urgency,
    stale.filter(event => event.urgency === urgency)
  ]));
  return {
    generatedAt: options.asOf,
    criteria: {
      status: "confirmed",
      futureOnly: true,
      staleWhen: `verifiedAt is missing or older than ${options.thresholdDays} days`,
      thresholdDays: options.thresholdDays,
      from: options.from,
      through: options.through
    },
    summary: {
      targets: stale.length,
      ...Object.fromEntries(URGENCY_ORDER.map(urgency => [urgency, groups[urgency].length]))
    },
    groups,
    targets: stale
  };
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderMarkdown(report) {
  const lines = [
    "# Stale verification report",
    "",
    `Generated for **${report.generatedAt}**. Includes future confirmed concerts from **${report.criteria.from}** through **${report.criteria.through}** whose verification is more than **${report.criteria.thresholdDays} days** old (or missing).`,
    "",
    `**${report.summary.targets} refresh target(s):** ${report.summary.critical} critical, ${report.summary.high} high, ${report.summary.standard} standard.`,
    ""
  ];

  const labels = { critical: "Critical", high: "High", standard: "Standard" };
  for (const urgency of URGENCY_ORDER) {
    lines.push(`## ${labels[urgency]} (${report.groups[urgency].length})`, "");
    if (!report.groups[urgency].length) {
      lines.push("No events.", "");
      continue;
    }
    lines.push("| Concert | Event | Last verified | Age | Sources |", "|---|---|---:|---:|---|");
    for (const event of report.groups[urgency]) {
      const sources = event.sources.map((source, index) => `[${index + 1}](${source})`).join(" · ") || "Missing";
      lines.push(`| ${event.concertDate} (${event.daysUntilConcert}d) | ${escapeCell(event.artist)} — ${escapeCell(event.venue)} \`${event.id}\` | ${event.verifiedAt || "Missing"} | ${event.ageDays == null ? "—" : `${event.ageDays}d`} | ${sources} |`);
    }
    lines.push("");
  }
  lines.push("## Refresh-pass contract", "", "Process only the IDs in `refresh-targets.json`. After checking every listed official source, reconfirm an unchanged event (or update/reject it) so `verifiedAt` records the pass.", "");
  return `${lines.join("\n")}\n`;
}

function parseArgs(argv, today = new Date().toISOString().slice(0, 10)) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (!name.startsWith("--")) throw new Error(`Unexpected argument: ${name}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
    values[name] = value;
    index += 1;
  }
  const year = (values["--as-of"] || today).slice(0, 4);
  return {
    asOf: values["--as-of"] || today,
    thresholdDays: Number(values["--threshold-days"] || 7),
    from: values["--from"] || `${year}-07-01`,
    through: values["--through"] || `${year}-10-31`,
    input: values["--input"] || path.join(__dirname, "..", "calendar", "data", "events.json"),
    outputDir: values["--output-dir"] || path.join(__dirname, "..", "reports", "stale-verification")
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const events = JSON.parse(fs.readFileSync(path.resolve(options.input), "utf8"));
  const report = buildReport(events, options);
  const outputDir = path.resolve(options.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "stale-verification.md"), renderMarkdown(report), "utf8");
  fs.writeFileSync(path.join(outputDir, "refresh-targets.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${report.summary.targets} target(s) to ${outputDir}`);
}

if (require.main === module) main();

module.exports = { buildReport, classifyUrgency, findStaleEvents, parseArgs, renderMarkdown };
