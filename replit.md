# FidoCool - Plataforma de Gestión Veterinaria

## Descripción General

FidoCool es una plataforma SaaS para veterinarios que permite gestionar clientes (dueños de mascotas), mascotas, eventos médicos y programar visitas futuras. El sistema incluye autenticación dual (Replit Auth OAuth y email/password nativo) y almacenamiento persistente en PostgreSQL.

## Características Implementadas

### Autenticación
- **Sistema Dual de Autenticación**:
  - **Replit Auth (OAuth)**: Soporte para Google, GitHub, X, Apple
  - **Email/Password Nativo**: Registro y login con credenciales propias
- **Seguridad de Passwords**: Hash con bcrypt (10 salt rounds)
- Cada veterinario tiene su propio panel personalizado
- Las sesiones se almacenan en PostgreSQL para mayor seguridad
- Tokens de refresh automático para mantener sesiones activas
- Protección de rutas: redirección automática a /login si no está autenticado
- Páginas de Login y Registro con validación completa

### Gestión de Clientes
- CRUD completo de clientes (dueños de mascotas)
- Campos: nombre, teléfono, correo electrónico
- **Registro de mascotas al crear cliente (opcional)**:
  - Opción para agregar una o más mascotas directamente al crear el cliente
  - Por cada mascota: nombre, especie (perro, gato, ave, roedor, reptil, otro), raza (opcional), fecha de nacimiento (opcional)
  - Botón para agregar múltiples mascotas
  - Validación automática de campos requeridos
- Asociados automáticamente al veterinario autenticado
- Búsqueda y filtrado de clientes

### Gestión de Mascotas
- CRUD completo de mascotas asociadas a clientes
- Campos: nombre, especie, raza, fecha de nacimiento, edad, notas, foto (placeholder)
- Relación con el dueño (cliente)
- Visualización en tarjetas con información detallada
- **Registro masivo**: Posibilidad de crear múltiples mascotas al registrar un cliente

### Gestión de Eventos
- **Agenda de Citas Mejorada**:
  - Flujo de reserva: primero seleccionar dueño, luego mascota (filtrada por dueño)
  - Campos separados de fecha y hora (hora opcional, default 9:00 AM)
  - Nuevos tipos de servicio:
    - **Servicios de Estética**: Baño, Baño y Corte
    - **Servicios Médicos**: Chequeo Médico, Vacunación, Cirugía, Otro
- Registro de visitas pasadas
- Programación de visitas futuras
- Tipos de eventos con colores distintivos:
  - Consulta General (azul) - Vacunación (verde)
  - Baño y Estética (púrpura) - Cirugía (rojo)
  - Revisión (naranja) - Desparasitación (teal)
  - Urgencia (rojo oscuro) - Otro (gris)
- Guardado automático en backend con relaciones completas (mascota → cliente)
- Actualización en tiempo real del calendario y estadísticas

### Calendario Visual
- Vista de calendario estilo Google Calendar/Outlook
- Vistas semanal, mensual y diaria
- Eventos diferenciados por color según tipo de servicio
- Información completa: nombre cliente, mascota, tipo de servicio
- Integración con sistema de citas y eventos
- Botón "+ Nueva Cita" para crear eventos rápidamente

### Dashboard
- Métricas en tiempo real:
  - Total de clientes registrados
  - Total de mascotas
  - Número de eventos próximos
- **Filtro de Período de Tiempo** para próximos eventos:
  - Hoy: Eventos del mismo día
  - Esta Semana: Eventos desde hoy hasta 7 días después (predeterminado)
  - Este Mes: Eventos desde hoy hasta 30 días después
  - Este Año: Eventos desde hoy hasta 365 días después
- Lista de próximos eventos ordenados por fecha con filtros personalizables
- Acciones rápidas para agregar clientes con sus mascotas y agendar eventos

### Notificaciones Inteligentes
- Sistema de alertas automatizadas generadas por Fido
- Detección de clientes sin visitas recientes (>21 días)
- Recordatorios de vacunas próximas (≤7 días)
- Clasificación por prioridad (alta, media, baja)
- Información completa del cliente y mascota
- Opciones:
  - Marcar como resuelto
  - Enviar recordatorio (simulado)
- Panel visual con badges de prioridad

### Campañas de Reactivación
- Detección automática de clientes inactivos (>30 días)
- Lista interactiva con checkboxes para selección múltiple
- Información detallada:
  - Días de inactividad
  - Fecha de última visita
  - Datos de contacto completos
- Plantilla de mensaje sugerida por Fido
- Editor de mensaje personalizado con variables [nombre] y [mascota]
- Función "Seleccionar todos"
- Envío simulado de mensajes masivos
- Contador visual de destinatarios seleccionados

### Asistente Virtual "Fido"
- Widget flotante inteligente en esquina inferior derecha
- Avatar animado del perrito Fido
- Sugerencias contextuales basadas en datos:
  - Número de citas del día
  - Recordatorios de confirmación de asistencia
  - Alerta de clientes inactivos
  - Guía para primeros pasos
- Badge de notificaciones pendientes
- Acciones rápidas para navegar a secciones relevantes
- Animaciones suaves con Framer Motion
- Dismissable por sugerencia individual

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
- passwordHash: hash bcrypt de la contraseña (nullable - solo para auth local)
- firstName, lastName: nombre del veterinario
- profileImageUrl: foto de perfil (nullable)
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
- fechaNacimiento: fecha de nacimiento de la mascota (opcional)
- edad: edad en formato texto
- fotoUrl: URL de foto de la mascota (opcional)
- notas: observaciones médicas
- createdAt: timestamp

**eventos**
- id: integer auto-incrementado
- mascotaId: referencia a la mascota (foreign key)
- tipo: consulta, vacunacion, bano, cirugia, revision, desparasitacion, urgencia, otro
- fecha: fecha y hora del evento
- descripcion: detalles del evento
- createdAt: timestamp

### Tipos de Servicio con Colores
El sistema incluye tipos de servicio predefinidos con colores asociados:
- Consulta General (#3b82f6 - azul)
- Vacunación (#10b981 - verde)
- Baño y Estética (#8b5cf6 - púrpura)
- Cirugía (#ef4444 - rojo)
- Revisión (#f59e0b - naranja)
- Desparasitación (#14b8a6 - teal)
- Urgencia (#dc2626 - rojo oscuro)
- Otro (#6b7280 - gris)

## API Endpoints

### Autenticación
- `POST /api/register` - Registro de nuevo usuario con email/password
- `POST /api/auth/login` - Iniciar sesión con email/password
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/login` - Iniciar sesión con Replit Auth (OAuth)
- `GET /api/callback` - Callback de OAuth
- `GET /api/auth/user` - Obtener usuario autenticado

### Estadísticas
- `GET /api/stats` - Métricas del dashboard (clientes, mascotas, eventos próximos)

### Clientes
- `GET /api/clientes` - Listar todos los clientes del veterinario
- `GET /api/clientes/:id` - Obtener un cliente específico
- `POST /api/clientes` - Crear nuevo cliente
- `POST /api/clientes/with-mascotas` - Crear cliente con mascotas (opcional)
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

- Todos los endpoints (excepto `/api/login`, `/api/register`, `/api/auth/login` y `/api/callback`) requieren autenticación
- Los datos están aislados por veterinario - cada uno solo ve sus propios registros
- Las sesiones usan cookies HTTP-only y secure
- Refresh tokens automático para mantener sesiones sin interrupciones
- Validación de datos con Zod en el backend
- Passwords hasheados con bcrypt (10 salt rounds) antes de almacenar

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
│   ├── localAuth.ts        # Autenticación local con email/password
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
