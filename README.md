# Prisma Nest Ecommerce Dashboard

A full-stack e-commerce management system built with **NestJS, Prisma, PostgreSQL, React, and TypeScript**.

The application provides a comprehensive dashboard for managing e-commerce operations, featuring secure authentication, Permission-Based Access Control (PBAC), role-specific access, and efficient API data management.

## 🚀 Tech Stack

### Backend

- **Framework:** NestJS
- **ORM:** Prisma
- **Database:** PostgreSQL (Aiven)
- **Authentication & Authorization:** Better Auth
- **Caching:** Redis

### Frontend

- **Library:** React
- **Language:** TypeScript
- **Data Fetching & State Management:** Redux Toolkit Query (RTK Query)
- **Routing:** React Router

## ✨ Key Features

### Authentication & Authorization

- Secure authentication with Better Auth
- Permission-Based Access Control (PBAC)
- Role-specific dashboard access
- Granular permission management

### E-commerce Management

- Product management
- Category management
- Order management
- Customer management
- Employee management
- Supplier management

### Administration

- User and session management
- Role request and approval workflow
- Permission-based navigation
- Redis-powered API caching

## 👥 User Roles

The application supports seven predefined user roles:

| Role              | Description                                         |
| ----------------- | --------------------------------------------------- |
| Super Admin       | Full system access and administrative control       |
| Admin             | Administrative access based on assigned permissions |
| Manager           | Management-level access                             |
| Sales             | Sales and order-related operations                  |
| Accountant        | Accounting-related operations                       |
| Inventory Manager | Inventory and product-related operations            |
| Viewer            | Read-only access to permitted resources             |

**Authorization is permission-driven rather than based solely on role names.** This allows access to individual features and operations to be controlled through granular permissions.

## 🏗️ Architecture

The application follows a decoupled frontend and backend architecture.

```text
┌──────────────────────────────────┐
│       Frontend                   │
│       React + TypeScript         │
│       React Router               │
│       RTK Query                  │
└────────────────┬─────────────────┘
                 │
                 │ HTTP Requests
                 ▼
┌──────────────────────────────────┐
│       Backend                    │
│       NestJS                     │
│       Better Auth                │
│       Prisma ORM                 │
└────────────────┬─────────────────┘
                 │
          ┌──────┴──────┐
          ▼             ▼
┌───────────────┐ ┌───────────────┐
│  PostgreSQL   │ │     Redis     │
│  (Aiven)      │ │    Cache      │
└───────────────┘ └───────────────┘
```

- **NestJS** handles API endpoints and business logic.
- **Better Auth** manages authentication and authorization.
- **Prisma** handles database access and queries.
- **PostgreSQL** stores application data.
- **Redis** improves API performance through caching.
- **React and RTK Query** power the frontend and API data management.

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- PostgreSQL
- Redis

### 1. Backend Setup

Clone the backend repository:

```bash
git clone https://gitlab.com/sudoCodeCloud/prisma-nest-ecommerce-api.git

cd prisma-nest-ecommerce-api
```

Install dependencies:

```bash
npm install
```

Create a `.env` file and configure the required environment variables, including your PostgreSQL connection string, Redis configuration, and authentication settings.

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate deploy
```

Start the development server:

```bash
npm run start:dev
```

### 2. Frontend Setup

Clone the frontend repository:

```bash
git clone https://gitlab.com/sudoCodeCloud/prisma-nest-ecommerce-dashboard.git

cd prisma-nest-ecommerce-dashboard
```

Install dependencies:

```bash
npm install
```

Configure the backend API URL in the frontend environment variables.

Start the development server:

```bash
npm run dev
```

## 🌐 Live Demo

**Live Application:**  
https://prisma-nest-ecommerce-dashboard.onrender.com/

## ☁️ Deployment

| Service            | Platform         |
| ------------------ | ---------------- |
| Backend API        | Render           |
| Frontend Dashboard | Render           |
| Database           | Aiven PostgreSQL |
| Cache              | Redis            |

## 🚧 Project Status

<escape>🚧</escape> **Actively Under Development**

New features, improvements, and optimizations are being added as the project evolves.

## 📄 License

This project is developed for learning, experimentation, and portfolio purposes.
