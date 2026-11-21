import { int, mediumtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const analysisRecords = mysqlTable("analysis_records", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  sampleName: varchar("sampleName", { length: 160 }).notNull(),
  species: varchar("species", { length: 80 }).notNull(),
  source: mysqlEnum("source", ["reference", "upload", "camera"]).notNull(),
  videoFileName: varchar("videoFileName", { length: 255 }).notNull(),
  videoUrl: text("videoUrl"),
  videoMetadataJson: text("videoMetadataJson").notNull(),
  calibrationJson: text("calibrationJson").notNull(),
  thresholdsJson: text("thresholdsJson").notNull(),
  metricsJson: text("metricsJson").notNull(),
  tracksJson: mediumtext("tracksJson").notNull(),
  qualityFlagsJson: text("qualityFlagsJson").notNull(),
  status: mysqlEnum("status", ["complete", "review_required"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const labSettings = mysqlTable("lab_settings", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().unique(),
  settingsJson: text("settingsJson").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AnalysisRecord = typeof analysisRecords.$inferSelect;
export type InsertAnalysisRecord = typeof analysisRecords.$inferInsert;
