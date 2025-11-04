# FidoCool - Plataforma de Gestión Veterinaria

## Descripción General

FidoCool es una plataforma SaaS para veterinarios que permite gestionar clientes (dueños de mascotas), mascotas, eventos médicos y programar visitas futuras. El sistema incluye autenticación completa usando Replit Auth y almacenamiento persistente en PostgreSQL.

## Características Implementadas

### Autenticación
- **Replit Auth**: Sistema de autenticación completo con soporte para Google, GitHub, X, Apple y email/password
- Cada veterinario tiene su propio panel personalizado
- Las sesiones se almacenan en PostgreSQL para mayor seguridad
- Tokens de refresh automático para mantener sesiones activas

### Gestión de Clientes
- CRUD completo de clientes (dueños de mascotas)
- Campos: nombre, teléfono, correo electrónico
- Asociados automáticamente al veterinario autenticado
- Búsqueda y filtrado de clientes

### Gestión de Mascotas
- CRUD completo de mascotas asociadas a clientes
- Campos: nombre, especie, raza, edad, notas
- Relación con el dueño (cliente)
- Visualización en tarjetas con información detallada

### Gestión de Eventos
- Registro de visitas pasadas
- Programación de visitas futuras
- Tipos de eventos: consulta, vacunación, cirugía, revisión, urgencia
- Filtros por tipo de evento (pasados vs próximos)
- Vista de calendario con fecha y hora

### Dashboard
- Métricas en tiempo real:
  - Total de clientes registrados
  - Total de mascotas
  - Número de eventos próximos
- Lista de próximos eventos ordenados por fecha
- Acciones rápidas para agregar clientes, mascotas y eventos

## Arquitectura Técnica

### Frontend
- **React** con TypeScript
- **Wouter** para routing
- **TanStack Query** para gestión de estado y caché
- **Shadcn UI** + **Tailwind CSS** para componentes y estilos
- **Sidebar persistente** con navegación
- **Tema claro/oscuro** con persistencia en localStorage

### Backend
- **Express.js** con TypeScript
- **PostgreSQL** (Neon-backed) para almacenamiento persistente
- **Drizzle ORM** para gestión de base de datos
- **Passport.js** + **OpenID Connect** para autenticación
- **Sesiones en PostgreSQL** con `connect-pg-simple`

### Base de Datos

#### Tablas

**sessions** (requerida por Replit Auth)
- sid: identificador de sesión
- sess: datos de sesión en JSON
- expire: fecha de expiración

**users** (veterinarios)
- id: UUID generado automáticamente
- email: correo electrónico único
- firstName, lastName: nombre del veterinario
- profileImageUrl: foto de perfil de Replit
- createdAt, updatedAt: timestamps

**clientes** (dueños de mascotas)
- id: integer auto-incrementado
- veterinarioId: referencia al veterinario (foreign key)
- nombre: nombre completo del cliente
- telefono: número de contacto
- email: correo electrónico
- createdAt: timestamp

**mascotas**
- id: integer auto-incrementado
- clienteId: referencia al cliente (foreign key)
- nombre: nombre de la mascota
- especie: perro, gato, ave, roedor, reptil, otro
- raza: raza de la mascota (opcional)
- edad: edad en formato texto
- notas: observaciones médicas
- createdAt: timestamp

**eventos**
- id: integer auto-incrementado
- mascotaId: referencia a la mascota (foreign key)
- tipo: consulta, vacunación, cirugía, revisión, urgencia, otro
- fecha: fecha y hora del evento
- descripcion: detalles del evento
- createdAt: timestamp

## API Endpoints

### Autenticación
- `GET /api/login` - Iniciar sesión con Replit Auth
- `GET /api/logout` - Cerrar sesión
- `GET /api/callback` - Callback de OAuth
- `GET /api/auth/user` - Obtener usuario autenticado

### Estadísticas
- `GET /api/stats` - Métricas del dashboard (clientes, mascotas, eventos próximos)

### Clientes
- `GET /api/clientes` - Listar todos los clientes del veterinario
- `GET /api/clientes/:id` - Obtener un cliente específico
- `POST /api/clientes` - Crear nuevo cliente
- `PATCH /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Mascotas
- `GET /api/mascotas` - Listar todas las mascotas del veterinario
- `GET /api/mascotas/:id` - Obtener una mascota específica
- `POST /api/mascotas` - Crear nueva mascota
- `PATCH /api/mascotas/:id` - Actualizar mascota
- `DELETE /api/mascotas/:id` - Eliminar mascota

### Eventos
- `GET /api/eventos` - Listar todos los eventos
- `GET /api/eventos/upcoming` - Listar eventos próximos
- `POST /api/eventos` - Crear nuevo evento
- `DELETE /api/eventos/:id` - Eliminar evento

## Seguridad

- Todos los endpoints (excepto `/api/login` y `/api/callback`) requieren autenticación
- Los datos están aislados por veterinario - cada uno solo ve sus propios registros
- Las sesiones usan cookies HTTP-only y secure
- Refresh tokens automático para mantener sesiones sin interrupciones
- Validación de datos con Zod en el backend

## Variables de Entorno

Las siguientes variables están pre-configuradas por Replit:

- `DATABASE_URL` - URL de conexión a PostgreSQL
- `SESSION_SECRET` - Secret para firmar sesiones
- `REPL_ID` - ID del Repl (client ID para OAuth)
- `ISSUER_URL` - URL del proveedor OpenID (Replit)

## Comandos Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run start        # Inicia servidor de producción
npm run check        # Verifica tipos de TypeScript
npm run db:push      # Sincroniza esquema con la base de datos
```

## Próximas Características (Fase 2)

1. Portal del cliente para que dueños accedan a su historial
2. Sistema de notificaciones por email para recordatorios
3. Historial médico detallado con diagnósticos y tratamientos
4. Exportación de datos e informes en PDF
5. Calendario integrado con vista mensual/semanal
6. Gestión de vacunas con recordatorios automáticos
7. Generación de recetas médicas

## Estructura de Archivos

```
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilidades
│   │   └── App.tsx         # Componente principal
│   └── index.html
├── server/                  # Backend Express
│   ├── index.ts            # Punto de entrada
│   ├── routes.ts           # Definición de rutas
│   ├── storage.ts          # Capa de acceso a datos
│   ├── replitAuth.ts       # Configuración de autenticación
│   ├── db.ts               # Conexión a PostgreSQL
│   └── vite.ts             # Servidor Vite
├── shared/                  # Código compartido
│   └── schema.ts           # Esquema de base de datos y tipos
└── design_guidelines.md    # Guías de diseño UI/UX
```

## Notas de Desarrollo

- El sistema utiliza un diseño "design-first" con colores profesionales en azul/teal
- Los componentes Shadcn UI están personalizados para el tema veterinario
- El modo oscuro está completamente implementado
- Todos los elementos interactivos tienen `data-testid` para testing
- La navegación usa wouter en lugar de React Router
- El almacenamiento en PostgreSQL es obligatorio (no in-memory)
