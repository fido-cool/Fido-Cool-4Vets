import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { setupLocalAuth } from "./localAuth";
import type { RequestHandler } from "express";
import {
  insertClienteSchema,
  insertClienteWithMascotasSchema,
  insertMascotaSchema,
  insertEventoSchema,
  insertMultipleEventosSchema,
  enviarRecordatorioSchema,
  type InsertMascota,
  type InsertEvento,
} from "@shared/schema";

// Helper para obtener el ID del usuario autenticado (funciona con Replit Auth y local auth)
function getUserId(req: any): string | null {
  if (!req.user) return null;
  // Replit Auth usa req.user.claims.sub
  if (req.user.claims && req.user.claims.sub) {
    return req.user.claims.sub;
  }
  // Local auth usa req.user.id directamente
  if (req.user.id) {
    return req.user.id;
  }
  return null;
}

// Middleware de autenticación que funciona con ambos sistemas
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup both authentication systems
  await setupAuth(app);
  setupLocalAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // No enviar passwordHash al cliente
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Statistics endpoint
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const stats = await storage.getStats(veterinarioId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Cliente routes
  app.get("/api/clientes", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const clientes = await storage.getClientes(veterinarioId);
      res.json(clientes);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      res.status(500).json({ message: "Failed to fetch clientes" });
    }
  });

  app.get("/api/clientes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const cliente = await storage.getCliente(id, veterinarioId);
      if (!cliente) {
        return res.status(404).json({ message: "Cliente not found" });
      }
      res.json(cliente);
    } catch (error) {
      console.error("Error fetching cliente:", error);
      res.status(500).json({ message: "Failed to fetch cliente" });
    }
  });

  app.get("/api/clientes/:id/details", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const details = await storage.getClienteWithDetails(id, veterinarioId);
      if (!details) {
        return res.status(404).json({ message: "Cliente not found" });
      }
      res.json(details);
    } catch (error) {
      console.error("Error fetching cliente details:", error);
      res.status(500).json({ message: "Failed to fetch cliente details" });
    }
  });

  app.post("/api/clientes", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const data = insertClienteSchema.parse({
        ...req.body,
        veterinarioId,
      });
      const cliente = await storage.createCliente(data);
      res.json(cliente);
    } catch (error: any) {
      console.error("Error creating cliente:", error);
      res.status(400).json({ message: error.message || "Failed to create cliente" });
    }
  });

  app.post("/api/clientes/with-mascotas", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const data = insertClienteWithMascotasSchema.parse(req.body);
      
      // Check if primera visita data is provided
      if (data.primeraVisita && data.primeraVisita.mascotaIndices.length > 0 && data.primeraVisita.tipos.length > 0) {
        // Parse and construct fecha with optional time
        const fecha = new Date(data.primeraVisita.fecha);
        if (data.primeraVisita.hora) {
          const [hours, minutes] = data.primeraVisita.hora.split(':');
          fecha.setHours(parseInt(hours), parseInt(minutes));
        } else {
          fecha.setHours(9, 0); // Default to 9:00 AM
        }
        
        const result = await storage.createClienteWithMascotasYEventos(
          veterinarioId,
          data.cliente,
          data.mascotas,
          {
            mascotaIndices: data.primeraVisita.mascotaIndices,
            tipos: data.primeraVisita.tipos,
            fecha,
            descripcion: data.primeraVisita.descripcion || "",
          }
        );
        
        return res.json(result);
      } else {
        // No primera visita, use the original function
        const result = await storage.createClienteWithMascotas(
          veterinarioId,
          data.cliente,
          data.mascotas
        );
        
        return res.json({ ...result, eventos: [] });
      }
    } catch (error: any) {
      console.error("Error creating cliente with mascotas:", error);
      res.status(400).json({ message: error.message || "Failed to create cliente with mascotas" });
    }
  });

  app.patch("/api/clientes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const cliente = await storage.updateCliente(id, veterinarioId, req.body);
      if (!cliente) {
        return res.status(404).json({ message: "Cliente not found" });
      }
      res.json(cliente);
    } catch (error) {
      console.error("Error updating cliente:", error);
      res.status(400).json({ message: "Failed to update cliente" });
    }
  });

  app.delete("/api/clientes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCliente(id, veterinarioId);
      if (!deleted) {
        return res.status(404).json({ message: "Cliente not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cliente:", error);
      res.status(500).json({ message: "Failed to delete cliente" });
    }
  });

  // Mascota routes
  app.get("/api/mascotas", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const mascotas = await storage.getMascotas(veterinarioId);
      res.json(mascotas);
    } catch (error) {
      console.error("Error fetching mascotas:", error);
      res.status(500).json({ message: "Failed to fetch mascotas" });
    }
  });

  app.get("/api/mascotas/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const mascota = await storage.getMascota(id, veterinarioId);
      if (!mascota) {
        return res.status(404).json({ message: "Mascota not found" });
      }
      res.json(mascota);
    } catch (error) {
      console.error("Error fetching mascota:", error);
      res.status(500).json({ message: "Failed to fetch mascota" });
    }
  });

  app.post("/api/mascotas", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("📝 Creating mascota with data:", JSON.stringify(req.body, null, 2));
      const data = insertMascotaSchema.parse(req.body) as InsertMascota;
      console.log("✅ Parsed data:", JSON.stringify(data, null, 2));
      
      const cliente = await storage.getCliente(data.clienteId, veterinarioId);
      if (!cliente) {
        return res.status(403).json({ message: "El cliente no pertenece a este veterinario" });
      }
      
      const mascota = await storage.createMascota(data);
      console.log("🐾 Created mascota:", JSON.stringify(mascota, null, 2));
      res.json(mascota);
    } catch (error: any) {
      console.error("❌ Error creating mascota:", error);
      res.status(400).json({ message: error.message || "Failed to create mascota" });
    }
  });

  app.patch("/api/mascotas/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const mascota = await storage.updateMascota(id, veterinarioId, req.body);
      if (!mascota) {
        return res.status(404).json({ message: "Mascota not found" });
      }
      res.json(mascota);
    } catch (error) {
      console.error("Error updating mascota:", error);
      res.status(400).json({ message: "Failed to update mascota" });
    }
  });

  app.delete("/api/mascotas/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMascota(id, veterinarioId);
      if (!deleted) {
        return res.status(404).json({ message: "Mascota not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting mascota:", error);
      res.status(500).json({ message: "Failed to delete mascota" });
    }
  });

  // Evento routes
  app.get("/api/eventos", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const eventos = await storage.getEventos(veterinarioId);
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      res.status(500).json({ message: "Failed to fetch eventos" });
    }
  });

  app.get("/api/eventos/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const eventos = await storage.getUpcomingEventos(veterinarioId);
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching upcoming eventos:", error);
      res.status(500).json({ message: "Failed to fetch upcoming eventos" });
    }
  });

  app.post("/api/eventos", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const data = insertMultipleEventosSchema.parse(req.body);
      
      // Verify all pets belong to this veterinarian
      for (const mascotaId of data.mascotaIds) {
        const mascota = await storage.getMascota(mascotaId, veterinarioId);
        if (!mascota) {
          return res.status(403).json({ 
            message: `La mascota con ID ${mascotaId} no pertenece a este veterinario` 
          });
        }
      }
      
      // Create all events (one per pet x service combination)
      const fecha = new Date(data.fecha);
      const eventos = await storage.createMultipleEventos(
        data.mascotaIds,
        data.tipos,
        fecha,
        data.descripcion
      );
      
      res.json({ 
        count: eventos.length,
        eventos 
      });
    } catch (error: any) {
      console.error("Error creating eventos:", error);
      res.status(400).json({ message: error.message || "Failed to create eventos" });
    }
  });

  app.put("/api/eventos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const data = insertEventoSchema.partial().parse(req.body);
      
      // If mascotaId is being updated, verify it belongs to this veterinarian
      if (data.mascotaId) {
        const mascota = await storage.getMascota(data.mascotaId, veterinarioId);
        if (!mascota) {
          return res.status(403).json({ 
            message: "La mascota no pertenece a este veterinario" 
          });
        }
      }
      
      const updated = await storage.updateEvento(id, veterinarioId, data);
      if (!updated) {
        return res.status(404).json({ message: "Evento not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating evento:", error);
      res.status(400).json({ message: error.message || "Failed to update evento" });
    }
  });

  app.delete("/api/eventos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEvento(id, veterinarioId);
      if (!deleted) {
        return res.status(404).json({ message: "Evento not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting evento:", error);
      res.status(500).json({ message: "Failed to delete evento" });
    }
  });

  // Notificaciones routes
  app.post("/api/notificaciones/enviar-recordatorio", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = getUserId(req);
      if (!veterinarioId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate request body
      const data = enviarRecordatorioSchema.parse(req.body);

      // Get webhook URL based on test mode
      const productionUrl = process.env.FIDO_N8N_WEBHOOK_URL || "https://fidon8n.fido.cool/webhook/fido-mail";
      const testUrl = "https://fidon8n.fido.cool/webhook-test/fido-mail";
      const webhookUrl = data.testMode ? testUrl : productionUrl;

      // Prepare payload for n8n webhook
      const webhookPayload = {
        notificationId: data.notificacionId,
        tipo: data.tipo,
        veterinarioId,
        cliente: {
          nombre: data.cliente.nombre,
          email: data.cliente.email,
          telefono: data.cliente.telefono,
        },
        mascota: {
          nombre: data.mascota.nombre,
        },
        mensaje: data.mensaje,
        channel: "email",
        origin: "Notificaciones",
      };

      let webhookStatus = "success";
      let webhookError = null;

      // Call n8n webhook
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          webhookStatus = "error";
          webhookError = `Webhook returned ${response.status}: ${response.statusText}`;
          console.error("Webhook error:", webhookError);
        }
      } catch (error: any) {
        webhookStatus = "error";
        webhookError = error.message || "Failed to call webhook";
        console.error("Error calling n8n webhook:", error);
      }

      // Log the recordatorio to database
      try {
        await storage.createRecordatorioEnviado({
          veterinarioId,
          notificacionId: data.notificacionId,
          clienteId: null, // Could be enhanced to include actual cliente ID
          mascotaId: null, // Could be enhanced to include actual mascota ID
          tipo: data.tipo,
          clienteNombre: data.cliente.nombre,
          clienteEmail: data.cliente.email,
          clienteTelefono: data.cliente.telefono,
          mascotaNombre: data.mascota.nombre,
          mensaje: data.mensaje,
          status: webhookStatus,
          errorMessage: webhookError,
        });
      } catch (dbError) {
        console.error("Error logging recordatorio:", dbError);
        // Even if logging fails, we should return webhook status
      }

      // Return response based on webhook status
      if (webhookStatus === "error") {
        return res.status(502).json({ 
          message: "Error al enviar recordatorio", 
          error: webhookError 
        });
      }

      res.json({ 
        success: true, 
        message: "Recordatorio enviado exitosamente" 
      });
    } catch (error: any) {
      console.error("Error processing recordatorio:", error);
      res.status(400).json({ 
        message: error.message || "Failed to process recordatorio" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
