import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
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

// User storage table for veterinarians
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Schema for registering new users
export const registerUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
});

export type RegisterUser = z.infer<typeof registerUserSchema>;

// Schema for login
export const loginUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginUser = z.infer<typeof loginUserSchema>;

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

export const insertClienteSchema = createInsertSchema(clientes).omit({
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
  fechaNacimiento: timestamp("fecha_nacimiento"),
  edad: varchar("edad", { length: 50 }),
  fotoUrl: varchar("foto_url"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMascotaSchema = createInsertSchema(mascotas).omit({
  id: true,
  createdAt: true,
  edad: true,
  fotoUrl: true,
  notas: true,
});

export type InsertMascota = z.infer<typeof insertMascotaSchema>;
export type Mascota = typeof mascotas.$inferSelect;

// Schema for creating a client with optional pets and optional first visit
export const insertClienteWithMascotasSchema = z.object({
  cliente: z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    email: z.string().email("Email inválido"),
  }),
  mascotas: z.array(
    z.object({
      nombre: z.string().min(1, "El nombre es requerido"),
      especie: z.string().min(1, "La especie es requerida"),
      raza: z.string().optional(),
      fechaNacimiento: z.string().optional(),
    })
  ).optional(),
  primeraVisita: z.object({
    mascotaIndices: z.array(z.number()).min(1, "Debes seleccionar al menos una mascota para la visita"),
    tipos: z.array(z.string()).min(1, "Debes seleccionar al menos un servicio para la visita"),
    fecha: z.string().min(1, "La fecha de la visita es requerida"),
    hora: z.string().optional(),
    descripcion: z.string().optional(),
  }).optional(),
});

export type InsertClienteWithMascotas = z.infer<typeof insertClienteWithMascotasSchema>;

// Estado de citas enum
export const estadoCitaEnum = pgEnum("estado_cita", [
  "programada",
  "automatica",
  "confirmada",
  "pendiente",
  "reprogramada",
  "cancelada",
  "no_asistio",
  "asistida",
  "sin_respuesta",
]);

// Eventos table
export const eventos = pgTable("eventos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  mascotaId: integer("mascota_id")
    .notNull()
    .references(() => mascotas.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 100 }).notNull(),
  fecha: timestamp("fecha").notNull(),
  descripcion: text("descripcion"),
  estado: estadoCitaEnum("estado").notNull().default("programada"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventoSchema = createInsertSchema(eventos)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    fecha: z.string().transform((str) => new Date(str)),
  });

export type InsertEvento = z.infer<typeof insertEventoSchema>;
export type Evento = typeof eventos.$inferSelect;

// Schema for creating multiple events (one per pet x service combination)
export const insertMultipleEventosSchema = z.object({
  mascotaIds: z.array(z.number()).min(1, "Debes seleccionar al menos una mascota"),
  tipos: z.array(z.string()).min(1, "Debes seleccionar al menos un tipo de servicio"),
  fecha: z.string(),
  descripcion: z.string().optional(),
  estado: z.string().optional(),
});

export type InsertMultipleEventos = z.infer<typeof insertMultipleEventosSchema>;

// Service types with associated colors
export const serviceTypes = {
  bano: { label: "Baño", color: "#8b5cf6" }, // purple
  bano_corte: { label: "Baño y Corte", color: "#a855f7" }, // lighter purple
  chequeo: { label: "Chequeo Médico", color: "#3b82f6" }, // blue
  vacunacion: { label: "Vacunación", color: "#10b981" }, // green
  cirugia: { label: "Cirugía", color: "#ef4444" }, // red
  otro: { label: "Otro", color: "#6b7280" }, // gray
} as const;

export type ServiceType = keyof typeof serviceTypes;

// Estados de citas con etiquetas
export const estadosCita = {
  programada: { label: "Programada" },
  automatica: { label: "Automática" },
  confirmada: { label: "Confirmada" },
  pendiente: { label: "Pendiente" },
  reprogramada: { label: "Reprogramada" },
  cancelada: { label: "Cancelada" },
  no_asistio: { label: "No Asistió" },
  asistida: { label: "Asistida" },
  sin_respuesta: { label: "Sin Respuesta" },
} as const;

export type EstadoCita = keyof typeof estadosCita;

// Recordatorios enviados table (logs de envíos a n8n webhook)
export const recordatoriosEnviados = pgTable("recordatorios_enviados", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  veterinarioId: varchar("veterinario_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  notificacionId: varchar("notificacion_id", { length: 255 }).notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id, { onDelete: "set null" }),
  mascotaId: integer("mascota_id").references(() => mascotas.id, { onDelete: "set null" }),
  tipo: varchar("tipo", { length: 50 }).notNull(), // sin_visita | cita_proxima
  clienteNombre: varchar("cliente_nombre", { length: 255 }).notNull(),
  clienteEmail: varchar("cliente_email", { length: 255 }).notNull(),
  clienteTelefono: varchar("cliente_telefono", { length: 50 }).notNull(),
  mascotaNombre: varchar("mascota_nombre", { length: 255 }).notNull(),
  mensaje: text("mensaje").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // success | error
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const insertRecordatorioEnviadoSchema = createInsertSchema(recordatoriosEnviados).omit({
  id: true,
  sentAt: true,
});

export type InsertRecordatorioEnviado = z.infer<typeof insertRecordatorioEnviadoSchema>;
export type RecordatorioEnviado = typeof recordatoriosEnviados.$inferSelect;

// Schema for sending a reminder via n8n webhook
export const enviarRecordatorioSchema = z.object({
  notificacionId: z.string(),
  tipo: z.enum(["sin_visita", "cita_proxima"]),
  cliente: z.object({
    nombre: z.string(),
    email: z.string().email(),
    telefono: z.string(),
  }),
  mascota: z.object({
    nombre: z.string(),
  }),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
  testMode: z.boolean().optional().default(false),
});

export type EnviarRecordatorio = z.infer<typeof enviarRecordatorioSchema>;
