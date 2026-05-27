# GoBill — Restaurant Billing Software

A full-stack restaurant billing & inventory management system built with **React + Vite**, **.NET 8 Web API**, and **SQL Server / SQLite**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Tailwind CSS |
| Backend | .NET 8 Web API, Entity Framework Core |
| Database | SQL Server (prod) / SQLite (dev) |
| Auth | JWT Bearer Tokens |
| PDF | jsPDF (client-side invoice generation) |
| State | React Context + localStorage cache |

---

## Project Structure

```
billflow/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── context/      # Auth & App context
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # PDF generator, helpers
│   └── package.json
├── backend/           # .NET 8 Web API
│   ├── Controllers/   # API endpoints
│   ├── Models/        # EF Core entities
│   ├── Data/          # DbContext + seeder
│   ├── Services/      # Business logic
│   ├── DTOs/          # Request/response models
│   └── BillFlow.API.csproj
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- .NET 8 SDK
- SQL Server OR SQLite (default for dev)

### 1. Backend Setup

```bash
cd backend

# Restore packages
dotnet restore

# Apply migrations (creates SQLite DB by default)
dotnet ef database update

# Run API (http://localhost:5000)
dotnet run
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

### 3. Open in browser
Navigate to `http://localhost:5173`

**Default credentials:**
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin@123 |
| Cashier | cashier | Cashier@123 |

---

## Environment Variables

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=billflow.db"
  },
  "Jwt": {
    "Key": "your-super-secret-key-min-32-chars",
    "Issuer": "BillFlow",
    "Audience": "BillFlowUsers",
    "ExpiryHours": 8
  }
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/products | List products |
| POST | /api/products | Add product |
| PUT | /api/products/{id} | Update product |
| DELETE | /api/products/{id} | Delete product |
| GET | /api/invoices | List invoices |
| POST | /api/invoices | Create invoice |
| PUT | /api/invoices/{id}/status | Update status |
| GET | /api/customers | List customers |
| POST | /api/customers | Add customer |
| GET | /api/dashboard/stats | Dashboard KPIs |

---

## Features

- JWT Authentication (Admin / Cashier roles)
- 30+ pre-loaded restaurant menu items
- Inventory management with low-stock alerts
- Invoice creation with GST calculation
- PDF invoice download (jsPDF)
- Customer management
- Dashboard with KPIs & charts
- Sales reports by category
- Data persists in SQL database
- Responsive design (Tailwind CSS)

---

## Production Deployment

### Frontend
```bash
cd frontend
npm run build
# dist/ folder → deploy to Vercel / Netlify / Nginx
```

### Backend
```bash
cd backend
dotnet publish -c Release -o ./publish
# publish/ folder → deploy to Azure App Service / VPS
```

For production, switch to SQL Server in `appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=BillFlow;User Id=sa;Password=your-password;"
  }
}
```
