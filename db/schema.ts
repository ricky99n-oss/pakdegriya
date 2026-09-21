import { mysqlTable, varchar, text, int, timestamp, boolean, mysqlEnum, bigint, double } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. TABEL AUTENTIKASI & PENGGUNA
// ==========================================
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["superadmin", "admin", "member"]).default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

// ==========================================
// 2. TABEL PROPERTI (MARKETPLACE)
// ==========================================
export const properties = mysqlTable("properties", {
  id: varchar("id", { length: 255 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), 
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"), 
  publicSummary: text("public_summary"), 
  price: bigint("price", { mode: "number" }).notNull(), 
  transactionType: mysqlEnum("transaction_type", ["jual", "sewa_bulan", "sewa_tahun"]).notNull(),
  propertyType: mysqlEnum("property_type", ["rumah", "tanah", "villa", "ruko", "apartemen"]).notNull(),
  generalLocation: varchar("general_location", { length: 255 }).notNull(), 
  preciseAddress: text("precise_address"), 
  
  // TAMBAHAN SPESIFIKASI PROPERTI
  landArea: double("land_area").default(0),
  buildingArea: double("building_area").default(0),
  bedrooms: int("bedrooms").default(0),
  bathrooms: int("bathrooms").default(0),
  
  publishStatus: mysqlEnum("publish_status", ["draft", "published", "archived"]).default("draft").notNull(),
  availabilityStatus: mysqlEnum("availability_status", ["available", "reserved", "sold", "rented", "withdrawn"]).default("available").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ==========================================
// 3. TABEL VIRTUAL TOUR (FONDASI)
// ==========================================
export const tours = mysqlTable("tours", {
  id: varchar("id", { length: 255 }).primaryKey(),
  propertyId: varchar("property_id", { length: 255 }).notNull().references(() => properties.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  hasAudio: boolean("has_audio").default(false),
});

// ==========================================
// 4. TABEL MEDIA PROPERTI
// ==========================================
export const propertyMedia = mysqlTable("property_media", {
  id: varchar("id", { length: 255 }).primaryKey(),
  propertyId: varchar("property_id", { length: 255 }).notNull().references(() => properties.id, { onDelete: "cascade" }),
  fileType: mysqlEnum("file_type", ["cover_public", "gallery_private", "floorplan_private", "panorama_private", "audio_private", "intro_planet_public"]).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(), 
  mimeType: varchar("mime_type", { length: 100 }).notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});

// ==========================================
// 5. RELASI (GABUNGAN)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  tour: one(tours, {
    fields: [properties.id],
    references: [tours.propertyId],
  }),
  media: many(propertyMedia), 
}));

// ==========================================
// 6. TABEL SCENE & HOTSPOT (VIRTUAL TOUR)
// ==========================================
export const scenes = mysqlTable("scenes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  propertyId: varchar("property_id", { length: 255 }).notNull().references(() => properties.id, { onDelete: "cascade" }),
  mediaId: varchar("media_id", { length: 255 }).notNull().references(() => propertyMedia.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  isFirstScene: boolean("is_first_scene").default(false), 
  initialPitch: double("initial_pitch").default(0), 
  initialYaw: double("initial_yaw").default(0), 
  
  audioMediaId: varchar("audio_media_id", { length: 255 }),
  autoRotateSpeed: double("auto_rotate_speed").default(2),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const hotspots = mysqlTable("hotspots", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sceneId: varchar("scene_id", { length: 255 }).notNull().references(() => scenes.id, { onDelete: "cascade" }),
  targetSceneId: varchar("target_scene_id", { length: 255 }), 
  pitch: double("pitch").notNull(),
  yaw: double("yaw").notNull(),
  label: varchar("label", { length: 255 }),
});