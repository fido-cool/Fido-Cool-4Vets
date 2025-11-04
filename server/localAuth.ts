import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express } from "express";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema, type User } from "@shared/schema";
import { fromError } from "zod-validation-error";
import bcrypt from "bcryptjs";

// Función para hashear passwords usando bcrypt (10 rounds)
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function setupLocalAuth(app: Express) {
  // Configurar LocalStrategy para login
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }

          const isValid = await verifyPassword(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }

          // Retornar el usuario sin el passwordHash
          const { passwordHash, ...userWithoutPassword } = user;
          return done(null, { ...userWithoutPassword, id: user.id });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Endpoint de registro
  app.post("/api/register", async (req, res) => {
    try {
      const validationResult = registerUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ 
          message: validationError.toString() 
        });
      }

      const { email, password, firstName, lastName } = validationResult.data;

      // Verificar si el usuario ya existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Ya existe un usuario con este email" 
        });
      }

      // Crear nuevo usuario
      const passwordHash = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
      });

      // Auto-login después del registro
      req.login({ id: newUser.id, email: newUser.email }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error al iniciar sesión" });
        }
        
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error("Error en registro:", error);
      res.status(500).json({ message: "Error al crear usuario" });
    }
  });

  // Endpoint de login
  app.post("/api/auth/login", (req, res, next) => {
    const validationResult = loginUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const validationError = fromError(validationResult.error);
      return res.status(400).json({ 
        message: validationError.toString() 
      });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Error al autenticar" });
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Email o contraseña incorrectos" 
        });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error al iniciar sesión" });
        }
        
        res.json({ user });
      });
    })(req, res, next);
  });

  // Endpoint de logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Sesión cerrada correctamente" });
    });
  });
}
