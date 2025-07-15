import { pgTable, text, serial, timestamp, varchar, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sessions table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR Codes table with advanced customization options
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }),
  url: text("url").notNull(),
  data: text("data").notNull(),
  type: varchar("type").notNull().default("url"),
  scanCount: integer("scan_count").default(0),
  
  // Customization options
  backgroundColor: varchar("background_color").default("#ffffff"),
  foregroundColor: varchar("foreground_color").default("#000000"),
  style: varchar("style").default("square"), // square, rounded, circle, dots
  size: varchar("size").default("medium"), // small, medium, large
  pattern: varchar("pattern").default("standard"), // standard, dots, rounded, heart
  frame: varchar("frame").default("none"), // none, simple, decorative, floral
  gradient: varchar("gradient").default("none"), // none, blue, purple, green, sunset
  border: varchar("border").default("none"), // none, thin, thick, double
  logo: varchar("logo").default("none"), // none, replit, custom
  
  // Advanced options
  includeText: boolean("include_text").default(false),
  textContent: text("text_content"),
  errorCorrection: varchar("error_correction").default("M"), // L, M, Q, H
  
  // QR Code data
  qrDataUrl: text("qr_data_url").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR Scans table for tracking statistics
export const qrScans = pgTable("qr_scans", {
  id: serial("id").primaryKey(),
  qrCodeId: integer("qr_code_id").references(() => qrCodes.id, { onDelete: "cascade" }),
  scannedAt: timestamp("scanned_at").defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  defaultBackgroundColor: varchar("default_background_color").default("#ffffff"),
  defaultForegroundColor: varchar("default_foreground_color").default("#000000"),
  defaultStyle: varchar("default_style").default("square"),
  defaultSize: varchar("default_size").default("medium"),
  defaultPattern: varchar("default_pattern").default("standard"),
  defaultFrame: varchar("default_frame").default("none"),
  theme: varchar("theme").default("light"), // light, dark
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firstName: true,
  lastName: true,
});

export const insertQRCodeSchema = createInsertSchema(qrCodes).pick({
  title: true,
  url: true,
  data: true,
  type: true,
  backgroundColor: true,
  foregroundColor: true,
  style: true,
  size: true,
  pattern: true,
  frame: true,
  gradient: true,
  border: true,
  logo: true,
  includeText: true,
  textContent: true,
  errorCorrection: true,
  qrDataUrl: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  defaultBackgroundColor: true,
  defaultForegroundColor: true,
  defaultStyle: true,
  defaultSize: true,
  defaultPattern: true,
  defaultFrame: true,
  theme: true,
});

export const updateUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  defaultBackgroundColor: true,
  defaultForegroundColor: true,
  defaultStyle: true,
  defaultSize: true,
  defaultPattern: true,
  defaultFrame: true,
  theme: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQRCode = z.infer<typeof insertQRCodeSchema>;
export type QRCode = typeof qrCodes.$inferSelect;
export type QRScan = typeof qrScans.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
