import {
  users,
  clientes,
  mascotas,
  eventos,
  type User,
  type UpsertUser,
  type Cliente,
  type InsertCliente,
  type Mascota,
  type InsertMascota,
  type Evento,
  type InsertEvento,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Cliente operations
  getClientes(veterinarioId: string): Promise<Cliente[]>;
  getCliente(id: number, veterinarioId: string): Promise<Cliente | undefined>;
  getClienteWithDetails(id: number, veterinarioId: string): Promise<{
    cliente: Cliente;
    mascotas: Mascota[];
    eventos: Array<Evento & { mascota: { id: number; nombre: string } }>;
  } | undefined>;
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  createClienteWithMascotas(
    veterinarioId: string,
    clienteData: { nombre: string; telefono: string; email: string },
    mascotasData?: Array<{ nombre: string; especie: string; raza?: string; fechaNacimiento?: string }>
  ): Promise<{ cliente: Cliente; mascotas: Mascota[] }>;
  updateCliente(
    id: number,
    veterinarioId: string,
    data: Partial<InsertCliente>
  ): Promise<Cliente | undefined>;
  deleteCliente(id: number, veterinarioId: string): Promise<boolean>;

  // Mascota operations
  getMascotas(veterinarioId: string): Promise<(Mascota & { cliente: { nombre: string } })[]>;
  getMascotasByCliente(clienteId: number): Promise<Mascota[]>;
  getMascota(id: number, veterinarioId: string): Promise<Mascota | undefined>;
  createMascota(mascota: InsertMascota): Promise<Mascota>;
  updateMascota(
    id: number,
    veterinarioId: string,
    data: Partial<InsertMascota>
  ): Promise<Mascota | undefined>;
  deleteMascota(id: number, veterinarioId: string): Promise<boolean>;

  // Evento operations
  getEventos(veterinarioId: string): Promise<
    (Evento & { mascota: { id: number; nombre: string; cliente: { id: number; nombre: string; telefono: string; email: string } } })[]
  >;
  getEventosByMascota(mascotaId: number): Promise<Evento[]>;
  getUpcomingEventos(veterinarioId: string): Promise<
    (Evento & { mascota: { id: number; nombre: string; cliente: { id: number; nombre: string; telefono: string; email: string } } })[]
  >;
  createEvento(evento: InsertEvento): Promise<Evento>;
  deleteEvento(id: number, veterinarioId: string): Promise<boolean>;

  // Statistics
  getStats(veterinarioId: string): Promise<{
    totalClientes: number;
    totalMascotas: number;
    proximosEventos: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Cliente operations
  async getClientes(veterinarioId: string): Promise<Cliente[]> {
    return db
      .select()
      .from(clientes)
      .where(eq(clientes.veterinarioId, veterinarioId))
      .orderBy(desc(clientes.createdAt));
  }

  async getCliente(id: number, veterinarioId: string): Promise<Cliente | undefined> {
    const [cliente] = await db
      .select()
      .from(clientes)
      .where(and(eq(clientes.id, id), eq(clientes.veterinarioId, veterinarioId)));
    return cliente;
  }

  async getClienteWithDetails(id: number, veterinarioId: string): Promise<{
    cliente: Cliente;
    mascotas: Mascota[];
    eventos: Array<Evento & { mascota: { id: number; nombre: string } }>;
  } | undefined> {
    // Get the cliente
    const [cliente] = await db
      .select()
      .from(clientes)
      .where(and(eq(clientes.id, id), eq(clientes.veterinarioId, veterinarioId)));

    if (!cliente) {
      return undefined;
    }

    // Get all pets for this cliente
    const clienteMascotas = await db
      .select()
      .from(mascotas)
      .where(eq(mascotas.clienteId, id));

    // Get all events for these pets
    const mascotaIds = clienteMascotas.map(m => m.id);
    let clienteEventos: Array<Evento & { mascota: { id: number; nombre: string } }> = [];
    
    if (mascotaIds.length > 0) {
      const eventosRaw = await db
        .select({
          id: eventos.id,
          mascotaId: eventos.mascotaId,
          tipo: eventos.tipo,
          fecha: eventos.fecha,
          descripcion: eventos.descripcion,
          createdAt: eventos.createdAt,
          mascotaNombre: mascotas.nombre,
        })
        .from(eventos)
        .innerJoin(mascotas, eq(eventos.mascotaId, mascotas.id))
        .where(inArray(eventos.mascotaId, mascotaIds))
        .orderBy(desc(eventos.fecha));

      clienteEventos = eventosRaw.map(e => ({
        id: e.id,
        mascotaId: e.mascotaId,
        tipo: e.tipo,
        fecha: e.fecha,
        descripcion: e.descripcion,
        createdAt: e.createdAt,
        mascota: {
          id: e.mascotaId,
          nombre: e.mascotaNombre,
        },
      }));
    }

    return {
      cliente,
      mascotas: clienteMascotas,
      eventos: clienteEventos,
    };
  }

  async createCliente(cliente: InsertCliente): Promise<Cliente> {
    const [newCliente] = await db.insert(clientes).values(cliente).returning();
    return newCliente;
  }

  /**
   * Creates a new client with optional pets in an atomic transaction.
   * 
   * CRITICAL: This operation MUST remain transactional. If any pet insertion fails,
   * the entire operation (including the client) will be rolled back to prevent
   * orphaned client records without their associated pets.
   * 
   * @param veterinarioId - ID of the authenticated veterinarian
   * @param clienteData - Client information (name, phone, email)
   * @param mascotasData - Optional array of pets to create for this client
   * @returns Object containing the created client and array of created pets
   * @throws Error if any insertion fails (triggers transaction rollback)
   */
  async createClienteWithMascotas(
    veterinarioId: string,
    clienteData: { nombre: string; telefono: string; email: string },
    mascotasData?: Array<{ nombre: string; especie: string; raza?: string; fechaNacimiento?: string }>
  ): Promise<{ cliente: Cliente; mascotas: Mascota[] }> {
    return await db.transaction(async (tx) => {
      const [newCliente] = await tx
        .insert(clientes)
        .values({
          veterinarioId,
          nombre: clienteData.nombre,
          telefono: clienteData.telefono,
          email: clienteData.email,
        })
        .returning();

      const createdMascotas: Mascota[] = [];

      if (mascotasData && mascotasData.length > 0) {
        for (const mascotaData of mascotasData) {
          const [mascota] = await tx
            .insert(mascotas)
            .values({
              clienteId: newCliente.id,
              nombre: mascotaData.nombre,
              especie: mascotaData.especie,
              raza: mascotaData.raza || null,
              fechaNacimiento: mascotaData.fechaNacimiento ? new Date(mascotaData.fechaNacimiento) : null,
            })
            .returning();
          createdMascotas.push(mascota);
        }
      }

      return {
        cliente: newCliente,
        mascotas: createdMascotas,
      };
    });
  }

  /**
   * Creates a new client with optional pets and optional first visit events in an atomic transaction.
   * 
   * CRITICAL: This operation MUST remain transactional. If any insertion fails,
   * the entire operation will be rolled back.
   * 
   * @param veterinarioId - ID of the authenticated veterinarian
   * @param clienteData - Client information (name, phone, email)
   * @param mascotasData - Optional array of pets to create for this client
   * @param primeraVisita - Optional first visit data (pet indices, service types, date, description)
   * @returns Object containing the created client, pets, and events
   * @throws Error if any insertion fails (triggers transaction rollback)
   */
  async createClienteWithMascotasYEventos(
    veterinarioId: string,
    clienteData: { nombre: string; telefono: string; email: string },
    mascotasData?: Array<{ nombre: string; especie: string; raza?: string; fechaNacimiento?: string }>,
    primeraVisita?: {
      mascotaIndices: number[];
      tipos: string[];
      fecha: Date;
      descripcion: string;
    }
  ): Promise<{ cliente: Cliente; mascotas: Mascota[]; eventos: Evento[] }> {
    return await db.transaction(async (tx) => {
      // Create client
      const [newCliente] = await tx
        .insert(clientes)
        .values({
          veterinarioId,
          nombre: clienteData.nombre,
          telefono: clienteData.telefono,
          email: clienteData.email,
        })
        .returning();

      const createdMascotas: Mascota[] = [];

      // Create pets
      if (mascotasData && mascotasData.length > 0) {
        for (const mascotaData of mascotasData) {
          const [mascota] = await tx
            .insert(mascotas)
            .values({
              clienteId: newCliente.id,
              nombre: mascotaData.nombre,
              especie: mascotaData.especie,
              raza: mascotaData.raza || null,
              fechaNacimiento: mascotaData.fechaNacimiento ? new Date(mascotaData.fechaNacimiento) : null,
            })
            .returning();
          createdMascotas.push(mascota);
        }
      }

      const createdEventos: Evento[] = [];

      // Create events for selected pets and services
      if (primeraVisita && primeraVisita.mascotaIndices.length > 0 && primeraVisita.tipos.length > 0) {
        // Validate that all indices are within bounds
        const maxIndex = createdMascotas.length - 1;
        const invalidIndices = primeraVisita.mascotaIndices.filter(idx => idx < 0 || idx > maxIndex);
        
        if (invalidIndices.length > 0) {
          throw new Error(`Invalid mascota indices: ${invalidIndices.join(', ')}. Valid range is 0-${maxIndex}.`);
        }
        
        for (const mascotaIndex of primeraVisita.mascotaIndices) {
          const mascota = createdMascotas[mascotaIndex];
          
          for (const tipo of primeraVisita.tipos) {
            const [evento] = await tx
              .insert(eventos)
              .values({
                mascotaId: mascota.id,
                tipo,
                fecha: primeraVisita.fecha,
                descripcion: primeraVisita.descripcion,
              })
              .returning();
            createdEventos.push(evento);
          }
        }
      }

      return {
        cliente: newCliente,
        mascotas: createdMascotas,
        eventos: createdEventos,
      };
    });
  }

  async updateCliente(
    id: number,
    veterinarioId: string,
    data: Partial<InsertCliente>
  ): Promise<Cliente | undefined> {
    const [updated] = await db
      .update(clientes)
      .set(data)
      .where(and(eq(clientes.id, id), eq(clientes.veterinarioId, veterinarioId)))
      .returning();
    return updated;
  }

  async deleteCliente(id: number, veterinarioId: string): Promise<boolean> {
    const result = await db
      .delete(clientes)
      .where(and(eq(clientes.id, id), eq(clientes.veterinarioId, veterinarioId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Mascota operations
  async getMascotas(veterinarioId: string): Promise<(Mascota & { cliente: { nombre: string } })[]> {
    const result = await db
      .select({
        id: mascotas.id,
        clienteId: mascotas.clienteId,
        nombre: mascotas.nombre,
        especie: mascotas.especie,
        raza: mascotas.raza,
        fechaNacimiento: mascotas.fechaNacimiento,
        edad: mascotas.edad,
        fotoUrl: mascotas.fotoUrl,
        notas: mascotas.notas,
        createdAt: mascotas.createdAt,
        cliente: {
          nombre: clientes.nombre,
        },
      })
      .from(mascotas)
      .innerJoin(clientes, eq(mascotas.clienteId, clientes.id))
      .where(eq(clientes.veterinarioId, veterinarioId))
      .orderBy(desc(mascotas.createdAt));
    
    return result.map(row => ({
      ...row,
      cliente: { nombre: row.cliente.nombre },
    }));
  }

  async getMascotasByCliente(clienteId: number): Promise<Mascota[]> {
    return db
      .select()
      .from(mascotas)
      .where(eq(mascotas.clienteId, clienteId))
      .orderBy(asc(mascotas.nombre));
  }

  async getMascota(id: number, veterinarioId: string): Promise<Mascota | undefined> {
    const [mascota] = await db
      .select({
        id: mascotas.id,
        clienteId: mascotas.clienteId,
        nombre: mascotas.nombre,
        especie: mascotas.especie,
        raza: mascotas.raza,
        fechaNacimiento: mascotas.fechaNacimiento,
        edad: mascotas.edad,
        fotoUrl: mascotas.fotoUrl,
        notas: mascotas.notas,
        createdAt: mascotas.createdAt,
      })
      .from(mascotas)
      .innerJoin(clientes, eq(mascotas.clienteId, clientes.id))
      .where(and(eq(mascotas.id, id), eq(clientes.veterinarioId, veterinarioId)));
    return mascota;
  }

  async createMascota(mascota: InsertMascota): Promise<Mascota> {
    const [newMascota] = await db.insert(mascotas).values(mascota).returning();
    return newMascota;
  }

  async updateMascota(
    id: number,
    veterinarioId: string,
    data: Partial<InsertMascota>
  ): Promise<Mascota | undefined> {
    const [updated] = await db
      .update(mascotas)
      .set(data)
      .from(clientes)
      .where(
        and(
          eq(mascotas.id, id),
          eq(mascotas.clienteId, clientes.id),
          eq(clientes.veterinarioId, veterinarioId)
        )
      )
      .returning({
        id: mascotas.id,
        clienteId: mascotas.clienteId,
        nombre: mascotas.nombre,
        especie: mascotas.especie,
        raza: mascotas.raza,
        edad: mascotas.edad,
        notas: mascotas.notas,
        createdAt: mascotas.createdAt,
      });
    return updated;
  }

  async deleteMascota(id: number, veterinarioId: string): Promise<boolean> {
    const result = await db
      .delete(mascotas)
      .where(
        and(
          eq(mascotas.id, id),
          eq(
            mascotas.clienteId,
            db
              .select({ id: clientes.id })
              .from(clientes)
              .where(eq(clientes.veterinarioId, veterinarioId))
              .limit(1) as any
          )
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Evento operations
  async getEventos(
    veterinarioId: string
  ): Promise<(Evento & { mascota: { id: number; nombre: string; cliente: { id: number; nombre: string; telefono: string; email: string } } })[]> {
    const result = await db
      .select({
        id: eventos.id,
        mascotaId: eventos.mascotaId,
        tipo: eventos.tipo,
        fecha: eventos.fecha,
        descripcion: eventos.descripcion,
        createdAt: eventos.createdAt,
        mascotaIdVal: mascotas.id,
        mascotaNombre: mascotas.nombre,
        clienteId: clientes.id,
        clienteNombre: clientes.nombre,
        clienteTelefono: clientes.telefono,
        clienteEmail: clientes.email,
      })
      .from(eventos)
      .innerJoin(mascotas, eq(eventos.mascotaId, mascotas.id))
      .innerJoin(clientes, eq(mascotas.clienteId, clientes.id))
      .where(eq(clientes.veterinarioId, veterinarioId))
      .orderBy(desc(eventos.fecha));
    
    return result.map(row => ({
      id: row.id,
      mascotaId: row.mascotaId,
      tipo: row.tipo,
      fecha: row.fecha,
      descripcion: row.descripcion,
      createdAt: row.createdAt,
      mascota: {
        id: row.mascotaIdVal,
        nombre: row.mascotaNombre,
        cliente: {
          id: row.clienteId,
          nombre: row.clienteNombre,
          telefono: row.clienteTelefono,
          email: row.clienteEmail,
        },
      },
    }));
  }

  async getEventosByMascota(mascotaId: number): Promise<Evento[]> {
    return db
      .select()
      .from(eventos)
      .where(eq(eventos.mascotaId, mascotaId))
      .orderBy(desc(eventos.fecha));
  }

  async getUpcomingEventos(
    veterinarioId: string
  ): Promise<(Evento & { mascota: { id: number; nombre: string; cliente: { id: number; nombre: string; telefono: string; email: string } } })[]> {
    const now = new Date();
    const result = await db
      .select({
        id: eventos.id,
        mascotaId: eventos.mascotaId,
        tipo: eventos.tipo,
        fecha: eventos.fecha,
        descripcion: eventos.descripcion,
        createdAt: eventos.createdAt,
        mascotaIdVal: mascotas.id,
        mascotaNombre: mascotas.nombre,
        clienteId: clientes.id,
        clienteNombre: clientes.nombre,
        clienteTelefono: clientes.telefono,
        clienteEmail: clientes.email,
      })
      .from(eventos)
      .innerJoin(mascotas, eq(eventos.mascotaId, mascotas.id))
      .innerJoin(clientes, eq(mascotas.clienteId, clientes.id))
      .where(and(eq(clientes.veterinarioId, veterinarioId), gte(eventos.fecha, now)))
      .orderBy(asc(eventos.fecha));
    
    return result.map(row => ({
      id: row.id,
      mascotaId: row.mascotaId,
      tipo: row.tipo,
      fecha: row.fecha,
      descripcion: row.descripcion,
      createdAt: row.createdAt,
      mascota: {
        id: row.mascotaIdVal,
        nombre: row.mascotaNombre,
        cliente: {
          id: row.clienteId,
          nombre: row.clienteNombre,
          telefono: row.clienteTelefono,
          email: row.clienteEmail,
        },
      },
    }));
  }

  async createEvento(evento: InsertEvento): Promise<Evento> {
    const [newEvento] = await db.insert(eventos).values(evento).returning();
    return newEvento;
  }

  /**
   * Creates multiple events in an atomic transaction (one per pet x service combination).
   * 
   * CRITICAL: This operation MUST remain transactional. If any event insertion fails,
   * the entire operation will be rolled back to prevent partial event creation.
   * 
   * @param mascotaIds - Array of pet IDs
   * @param tipos - Array of service types
   * @param fecha - Event date/time
   * @param descripcion - Optional description
   * @returns Array of created events
   * @throws Error if any insertion fails (triggers transaction rollback)
   */
  async createMultipleEventos(
    mascotaIds: number[],
    tipos: string[],
    fecha: Date,
    descripcion?: string
  ): Promise<Evento[]> {
    return await db.transaction(async (tx) => {
      const createdEventos: Evento[] = [];
      
      for (const mascotaId of mascotaIds) {
        for (const tipo of tipos) {
          const [evento] = await tx
            .insert(eventos)
            .values({
              mascotaId,
              tipo,
              fecha,
              descripcion: descripcion || "Cita programada",
            })
            .returning();
          createdEventos.push(evento);
        }
      }
      
      return createdEventos;
    });
  }

  async deleteEvento(id: number, veterinarioId: string): Promise<boolean> {
    const result = await db
      .delete(eventos)
      .where(
        and(
          eq(eventos.id, id),
          eq(
            eventos.mascotaId,
            db
              .select({ id: mascotas.id })
              .from(mascotas)
              .innerJoin(clientes, eq(mascotas.clienteId, clientes.id))
              .where(eq(clientes.veterinarioId, veterinarioId))
              .limit(1) as any
          )
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Statistics
  async getStats(veterinarioId: string): Promise<{
    totalClientes: number;
    totalMascotas: number;
    proximosEventos: number;
  }> {
    const clientesData = await this.getClientes(veterinarioId);
    const mascotasData = await this.getMascotas(veterinarioId);
    const eventosData = await this.getUpcomingEventos(veterinarioId);

    return {
      totalClientes: clientesData.length,
      totalMascotas: mascotasData.length,
      proximosEventos: eventosData.length,
    };
  }
}

export const storage = new DatabaseStorage();
