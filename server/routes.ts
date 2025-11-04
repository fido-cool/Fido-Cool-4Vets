import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertClienteSchema,
  insertMascotaSchema,
  insertEventoSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Statistics endpoint
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = req.user.claims.sub;
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
      const veterinarioId = req.user.claims.sub;
      const clientes = await storage.getClientes(veterinarioId);
      res.json(clientes);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      res.status(500).json({ message: "Failed to fetch clientes" });
    }
  });

  app.get("/api/clientes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = req.user.claims.sub;
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

  app.post("/api/clientes", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = req.user.claims.sub;
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

  app.patch("/api/clientes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = req.user.claims.sub;
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
      const veterinarioId = req.user.claims.sub;
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
      const veterinarioId = req.user.claims.sub;
      const mascotas = await storage.getMascotas(veterinarioId);
      res.json(mascotas);
    } catch (error) {
      console.error("Error fetching mascotas:", error);
      res.status(500).json({ message: "Failed to fetch mascotas" });
    }
  });

  app.get("/api/mascotas/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = req.user.claims.sub;
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
      const data = insertMascotaSchema.parse(req.body);
      const mascota = await storage.createMascota(data);
      res.json(mascota);
    } catch (error: any) {
      console.error("Error creating mascota:", error);
      res.status(400).json({ message: error.message || "Failed to create mascota" });
    }
  });

  app.patch("/api/mascotas/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = req.user.claims.sub;
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
      const veterinarioId = req.user.claims.sub;
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
      const veterinarioId = req.user.claims.sub;
      const eventos = await storage.getEventos(veterinarioId);
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      res.status(500).json({ message: "Failed to fetch eventos" });
    }
  });

  app.get("/api/eventos/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = req.user.claims.sub;
      const eventos = await storage.getUpcomingEventos(veterinarioId);
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching upcoming eventos:", error);
      res.status(500).json({ message: "Failed to fetch upcoming eventos" });
    }
  });

  app.post("/api/eventos", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertEventoSchema.parse(req.body);
      const evento = await storage.createEvento(data);
      res.json(evento);
    } catch (error: any) {
      console.error("Error creating evento:", error);
      res.status(400).json({ message: error.message || "Failed to create evento" });
    }
  });

  app.delete("/api/eventos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const veterinarioId = req.user.claims.sub;
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

  const httpServer = createServer(app);

  return httpServer;
}
