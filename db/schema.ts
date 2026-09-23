import { 
  pgTable, 
  varchar, 
  text, 
  integer, 
  timestamp, 
  boolean, 
  pgEnum, 
  doublePrecision, 
  uuid 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 0. DEKLARASI TIPE ENUM GLOBAL (Khusus Postgres)
// ==========================================
export const roleEnum = pgEnum("role", ["superadmin", "admin", "member"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["jual", "sewa_bulan", "sewa_tahun"]);
export const propertyTypeEnum = pgEnum("property_type", ["rumah", "tanah", "villa", "ruko", "apartemen"]);
export const publishStatusEnum = pgEnum("publish_status", ["draft", "published", "archived"]);
export const availabilityStatusEnum = pgEnum("availability_status", ["available", "reserved", "sold", "rented", "withdrawn"]);
export const tourStatusEnum = pgEnum("tour_status", ["draft", "published"]);
export const fileTypeEnum = pgEnum("file_type", ["cover_public", "gallery_private", "floorplan_private", "panorama_private", "audio_private", "intro_planet_public"]);

// ==========================================
// 1. TABEL AUTENTIKASI & PENGGUNA
// ==========================================
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  role: roleEnum("role").default("member").notNull(),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: 'date' }).notNull(),
});

// ==========================================
// 2. TABEL PROPERTI (MARKETPLACE)
// ==========================================
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey(), // Ganti varchar ke UUID Postgres
  code: varchar("code", { length: 50 }).notNull().unique(), 
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"), 
  publicSummary: text("public_summary"), 
  // Postgres tidak punya "bigint mode: number" bawaan, kita gunakan doublePrecision/numeric untuk harga
  price: doublePrecision("price").notNull(), 
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  generalLocation: varchar("general_location", { length: 255 }).notNull(), 
  preciseAddress: text("precise_address"), 
  
  // TAMBAHAN SPESIFIKASI PROPERTI
  landArea: doublePrecision("land_area").default(0),
  buildingArea: doublePrecision("building_area").default(0),
  bedrooms: integer("bedrooms").default(0),
  bathrooms: integer("bathrooms").default(0),
  
  publishStatus: publishStatusEnum("publish_status").default("draft").notNull(),
  availabilityStatus: availabilityStatusEnum("availability_status").default("available").notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow(),
});

// ==========================================
// 3. TABEL VIRTUAL TOUR (FONDASI)
// ==========================================
export const tours = pgTable("tours", {
  id: uuid("id").primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  status: tourStatusEnum("status").default("draft").notNull(),
  hasAudio: boolean("has_audio").default(false),
});

// ==========================================
// 4. TABEL MEDIA PROPERTI
// ==========================================
export const propertyMedia = pgTable("property_media", {
  id: uuid("id").primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  fileType: fileTypeEnum("file_type").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(), 
  mimeType: varchar("mime_type", { length: 100 }).notNull(), 
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
});

// ==========================================
// 5. TABEL SCENE & HOTSPOT (VIRTUAL TOUR)
// ==========================================
export const scenes = pgTable("scenes", {
  id: uuid("id").primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  mediaId: uuid("media_id").notNull().references(() => propertyMedia.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  isFirstScene: boolean("is_first_scene").default(false), 
  initialPitch: doublePrecision("initial_pitch").default(0), 
  initialYaw: doublePrecision("initial_yaw").default(0), 
  
  // Audio id tetap pakai varchar jika ambil dari Supabase URL, atau uuid jika relasi lokal
  audioMediaId: varchar("audio_media_id", { length: 255 }),
  autoRotateSpeed: doublePrecision("auto_rotate_speed").default(2),
  
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
});

export const hotspots = pgTable("hotspots", {
  id: uuid("id").primaryKey(),
  sceneId: uuid("scene_id").notNull().references(() => scenes.id, { onDelete: "cascade" }),
  targetSceneId: uuid("target_scene_id"), 
  pitch: doublePrecision("pitch").notNull(),
  yaw: doublePrecision("yaw").notNull(),
  label: varchar("label", { length: 255 }),
});

// ==========================================
// 6. RELASI (GABUNGAN Drizzle Relations)
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