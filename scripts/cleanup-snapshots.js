const fs = require("node:fs/promises");
const path = require("node:path");

const SNAPSHOT_DIR = path.resolve(process.env.SNAPSHOT_DIR || "./snapshots");
const RETENTION_DAYS = Number(process.env.SNAPSHOT_RETENTION_DAYS) || 30;
const MAX_AGE_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

async function cleanupSnapshots(now = Date.now()) {
  let entries;
  try {
    entries = await fs.readdir(SNAPSHOT_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("Snapshot directory does not exist; nothing to clean.");
      return [];
    }
    throw error;
  }

  const removed = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".csv")) continue;
    const fullPath = path.join(SNAPSHOT_DIR, entry.name);
    const stats = await fs.stat(fullPath);
    if (now - stats.mtimeMs > MAX_AGE_MS) {
      await fs.unlink(fullPath);
      removed.push(entry.name);
    }
  }
  console.log(`Cleanup complete. Removed ${removed.length} CSV snapshot(s).`);
  return removed;
}

if (require.main === module) {
  cleanupSnapshots().catch((error) => {
    console.error("Snapshot cleanup failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { cleanupSnapshots };
