# FidoCool - Plataforma de Gestión Veterinaria

## Overview
FidoCool is a SaaS platform designed for veterinarians to streamline the management of clients (pet owners), pets, medical events, and future appointment scheduling. The platform features a dual authentication system (Replit Auth OAuth and native email/password) and uses PostgreSQL for persistent data storage. The core purpose is to provide a comprehensive, intuitive, and secure system that enhances efficiency in veterinary practices.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The platform adopts a "design-first" approach with a professional color scheme focusing on blue and teal. It utilizes Shadcn UI components customized for a veterinary theme, ensuring a consistent and modern aesthetic. A dark mode is fully implemented, with user preferences for themes persisted in local storage. All interactive elements include `data-testid` for robust testing.

### Technical Implementations
**Frontend:** Developed with React and TypeScript, using Wouter for routing and TanStack Query for state management and caching. Shadcn UI and Tailwind CSS are used for components and styling. A persistent sidebar facilitates navigation.
**Backend:** Built with Express.js and TypeScript. It uses Drizzle ORM for PostgreSQL database interactions and Passport.js with OpenID Connect for authentication, including Replit Auth and local email/password. Sessions are stored securely in PostgreSQL using `connect-pg-simple`.
**Database Schema:** The PostgreSQL database includes tables for `sessions`, `users` (veterinarians), `clientes` (pet owners), `mascotas` (pets), `eventos` (appointments/medical events), and `recordatorios_enviados` (notification logs).

### Feature Specifications
*   **Dual Authentication:** Supports Replit Auth (OAuth for Google, GitHub, X, Apple) and native email/password with bcrypt hashing for security.
*   **Client Management:** Full CRUD operations for clients, including optional registration of multiple pets and initial visits during client creation. Supports bulk event creation for N pets and M services in a single atomic transaction.
*   **Pet Management:** Full CRUD for pets, linked to clients, with details like species, breed, and birth date.
*   **Event Management & Calendar:** Advanced appointment scheduling with multiple pet and service selection, enabling N×M event creation. Events are color-coded by type (e.g., General Consultation, Vaccination, Surgery) for easy identification on a visual calendar with weekly, monthly, and daily views.
*   **Dashboard:** Provides real-time metrics on clients, pets, and upcoming events, with customizable time period filters (Today, This Week, This Month, This Year).
*   **Smart Notifications:** Automated alerts for inactive clients or upcoming appointments. Includes a customizable message editor integrated with an n8n webhook for sending reminders and logging delivery status.
*   **Reactivation Campaigns:** Identifies inactive clients and facilitates bulk messaging with personalized templates.
*   **Virtual Assistant "Fido":** A floating widget providing contextual suggestions, quick actions, and notifications, animated with Framer Motion.

### System Design Choices
*   **Security:** Authentication is required for most endpoints. Data is isolated per veterinarian. Sessions use HTTP-only, secure cookies, and automatic refresh tokens. Data validation is performed using Zod on the backend.
*   **Atomic Transactions:** Critical operations like client, pet, and event creation are handled within atomic transactions to ensure data consistency.
*   **Service Types:** Predefined service types with distinct color codes are used for visual clarity in the calendar and event listings.

## External Dependencies
*   **PostgreSQL:** Primary database for persistent storage (Neon-backed).
*   **Replit Auth:** Used for OAuth-based authentication (Google, GitHub, X, Apple).
*   **Passport.js & OpenID Connect:** Authentication middleware.
*   **Drizzle ORM:** Used for database interactions.
*   **n8n Webhook:** Integrated for sending automated email reminders. Configurable via `FIDO_N8N_WEBHOOK_URL`.