import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table for veterinarians (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Clientes (dueños de mascotas) table
export const clientes = pgTable("clientes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  veterinarioId: varchar("veterinario_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  telefono: varchar("telefono", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

const baseInsertClienteSchema = createInsertSchema(clientes);
export const insertClienteSchema = baseInsertClienteSchema.omit({
  id: true,
  createdAt: true,
});

export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;

// Mascotas table
export const mascotas = pgTable("mascotas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  especie: varchar("especie", { length: 100 }).notNull(),
  raza: varchar("raza", { length: 255 }),
  edad: varchar("edad", { length: 50 }),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

const baseInsertMascotaSchema = createInsertSchema(mascotas);
export const insertMascotaSchema = baseInsertMascotaSchema.omit({
  id: true,
  createdAt: true,
});

export type InsertMascota = z.infer<typeof insertMascotaSchema>;
export type Mascota = typeof mascotas.$inferSelect;

// Eventos table
export const eventos = pgTable("eventos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  mascotaId: integer("mascota_id")
    .notNull()
    .references(() => mascotas.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 100 }).notNull(),
  fecha: timestamp("fecha").notNull(),
  descripcion: text("descripcion"),
  createdAt: timestamp("created_at").defaultNow(),
});

const baseInsertEventoSchema = createInsertSchema(eventos);
export const insertEventoSchema = baseInsertEventoSchema.omit({
  id: true,
  createdAt: true,
});

export type InsertEvento = z.infer<typeof insertEventoSchema>;
export type Evento = typeof eventos.$inferSelect;
