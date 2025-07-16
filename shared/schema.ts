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
  
  // Stripe subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"), // active, inactive, trialing, past_due, canceled
  subscriptionPlan: varchar("subscription_plan"), // trial, daily, weekly, monthly
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialUsed: boolean("trial_used").default(false),
  
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
  creativeStyle: varchar("creative_style").default("classic"), // classic, colorful, rainbow, sunset, ocean
  
  // Advanced text options
  includeText: boolean("include_text").default(false),
  textContent: text("text_content"),
  textPosition: varchar("text_position").default("bottom"), // top, center, bottom
  textAlign: varchar("text_align").default("center"), // left, center, right
  textSize: integer("text_size").default(24), // Font size in pixels
  textColor: varchar("text_color").default("#000000"),
  textOpacity: integer("text_opacity").default(100), // 0-100
  textFont: varchar("text_font").default("Arial"), // Arial, Helvetica, Times, Georgia, Verdana, etc.
  textShadow: boolean("text_shadow").default(false),
  textBold: boolean("text_bold").default(false),
  textItalic: boolean("text_italic").default(false),
  
  // Creative card options
  cardTemplate: varchar("card_template").default("none"), // none, instagram-post, instagram-story, etc.
  cardStyle: varchar("card_style").default("gradient1"), // gradient1, gradient2, neon, etc.
  customBackgroundImage: text("custom_background_image"), // Base64 encoded image data
  margin: integer("margin").default(150), // Margin in pixels for QR positioning
  
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
  creativeStyle: true,
  includeText: true,
  textContent: true,
  textPosition: true,
  textAlign: true,
  textSize: true,
  textColor: true,
  textOpacity: true,
  textFont: true,
  textShadow: true,
  textBold: true,
  textItalic: true,
  cardTemplate: true,
  cardStyle: true,
  customBackgroundImage: true,
  errorCorrection: true,
  qrDataUrl: true,
  margin: true,
}).extend({
  creativeStyle: z.enum([
    "classic",
    "vibrant_rainbow",
    "neon_cyber", 
    "electric_blue",
    "sunset_fire",
    "forest_nature",
    "ocean_waves",
    "multicolor_blocks",
    "purple_galaxy",
    "golden_sunset",
    "mint_fresh",
    "coral_reef",
    "volcano_red",
    "autumn_leaves",
    "monochrome_red",
    "pastel_dream",
    // TODOS los estilos creativos del frontend
    "cosmic_purple",
    "laser_green",
    "neon_pink",
    "electric_yellow",
    "deep_ocean",
    "royal_blue",
    "emerald_shine",
    "crimson_wave",
    "cyber_orange",
    "mystic_violet",
    "arctic_blue",
    "jade_matrix",
    "ruby_fire",
    "sapphire_glow",
    "bronze_metal",
    "silver_chrome",
    "magenta_burst",
    "teal_storm",
    "amber_lightning",
    "indigo_depth",
    "lime_electric",
    "rose_gold",
    "steel_blue",
    "neon_turquoise",
    "plasma_red",
    "galaxy_green",
    "cyber_magenta",
    "electric_teal",
    "laser_blue",
    "neon_lime",
    "digital_purple",
    "chrome_yellow",
    "matrix_green",
    "fire_orange",
    "ice_blue",
    "toxic_green"
  ]).default("classic"),
  cardStyle: z.enum([
    "none",
    "modern_gradient",
    "neon_waves",
    "geometric",
    "organic_flow",
    "minimalist",
    "abstract_art",
    "corporate",
    "creative_burst",
    "elegant_lines",
    "vibrant_blocks",
    "scan_me_default",
    "custom_image",
    // Nuevos estilos de tarjeta
    "neon_glow",
    "sunset_card",
    "forest_green",
    "ocean_blue",
    "purple_haze",
    "golden_hour",
    "coral_reef",
    "mint_chocolate",
    "volcanic_red",
    "arctic_ice",
    "cyber_punk",
    "royal_purple",
    "emerald_city",
    "fire_storm",
    "midnight_blue",
    "rose_gold",
    "electric_lime",
    "cosmic_purple",
    "tropical_sunset",
    "deep_space",
    "rainbow_burst",
    "silver_chrome",
    "aqua_marine",
    "magenta_dream",
    "jade_forest",
    "copper_bronze",
    "neon_night",
    "pearl_white",
    "galaxy_swirl"
  ]).default("none"),
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
