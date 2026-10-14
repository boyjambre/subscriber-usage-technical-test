const cron = require("node-cron");
const fs = require("node:fs/promises");
const path = require("node:path");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const SNAPSHOT_DIR = path.resolve(process.env.SNAPSHOT_DIR || "./snapshots");
const TIMEZONE = process.env.SNAPSHOT_TIMEZONE || "Asia/Jakarta";

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(records) {
  const headers = ["id", "subscriberId", "callMinutes", "smsCount", "dataUsageMB", "timestamp"];
  return [
    headers.join(","),
    ...records.map((record) => headers.map((header) => csvEscape(record[header])).join(","))
  ].join("\r\n") + "\r\n";
}

function timestampForFilename(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}`;
}

async function createSnapshot() {
  const response = await fetch(`${API_BASE_URL}/api/usage`);
  if (!response.ok) throw new Error(`Usage API returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("Usage API response did not contain a data array");
  }

  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
  const filename = `subscriber-usage_${timestampForFilename()}.csv`;
  const destination = path.join(SNAPSHOT_DIR, filename);
  await fs.writeFile(destination, toCsv(payload.data), { encoding: "utf8", flag: "wx" });
  console.log(`Snapshot saved: ${destination} (${payload.data.length} records)`);
  return destination;
}

if (require.main === module) {
  if (process.argv.includes("--once")) {
    createSnapshot().catch((error) => {
      console.error("Snapshot failed:", error.message);
      process.exitCode = 1;
    });
  } else {
    // 08:00, 12:00, and 15:00 
    cron.schedule("0 8,12,15 * * *", () => {
      createSnapshot().catch((error) => console.error("Scheduled snapshot failed:", error.message));
    }, { timezone: TIMEZONE });
    console.log(`Snapshot scheduler active: 08:00, 12:00, 15:00 (${TIMEZONE})`);
  }
}

module.exports = { toCsv, timestampForFilename, createSnapshot };
