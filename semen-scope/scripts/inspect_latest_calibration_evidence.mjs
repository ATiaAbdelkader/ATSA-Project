import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is unavailable for read-only calibration evidence inspection.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.query("SELECT id, sampleName, source, createdAt, videoMetadataJson FROM analysis_records ORDER BY id DESC LIMIT 3");
const [settingsRows] = await connection.query("SELECT ownerId, updatedAt, settingsJson FROM lab_settings ORDER BY updatedAt DESC LIMIT 3");
await connection.end();

const result = rows.map(row => {
  let metadata = {};
  try { metadata = JSON.parse(row.videoMetadataJson); } catch { metadata = { parseError: true }; }
  return {
    id: row.id,
    sampleName: row.sampleName,
    source: row.source,
    createdAt: row.createdAt,
    calibrationEvidence: metadata.calibrationEvidence ?? null,
  };
});

const settings = settingsRows.map(row => {
  let payload = {};
  try { payload = JSON.parse(row.settingsJson); } catch { payload = { parseError: true }; }
  return {
    ownerId: row.ownerId,
    updatedAt: row.updatedAt,
    calibrationEvidence: payload.calibrationEvidence ?? null,
    micronsPerPixel: payload.calibration?.micronsPerPixel ?? null,
  };
});

console.log(JSON.stringify({ analysisRecords: result, labSettings: settings }, null, 2));
