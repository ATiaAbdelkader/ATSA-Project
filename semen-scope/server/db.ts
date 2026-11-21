import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { analysisRecords, InsertAnalysisRecord, InsertUser, labSettings, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listAnalysisRecords(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analysisRecords).where(eq(analysisRecords.ownerId, ownerId)).orderBy(desc(analysisRecords.createdAt)).limit(100);
}

export async function saveAnalysisRecord(record: InsertAnalysisRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Please try again shortly.");
  await db.insert(analysisRecords).values(record);
}

export async function getLabSettings(ownerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(labSettings).where(eq(labSettings.ownerId, ownerId)).limit(1);
  return result[0] ?? null;
}

export async function saveLabSettings(ownerId: number, settingsJson: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. Please try again shortly.");
  await db.insert(labSettings).values({ ownerId, settingsJson }).onDuplicateKeyUpdate({ set: { settingsJson } });
}
