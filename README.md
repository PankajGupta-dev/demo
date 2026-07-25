# OpsForge Demo Checkout

Production-quality e-commerce checkout microservice built for OpsForge deployment, observability, failure injection, and automated recovery demonstrations agentic flow.

## Stack & Architecture

- **Runtime**: Node.js & Express
- **Database**: PostgreSQL (Orders, Order Items, Product Catalog, Inventory)
- **Cache & Locks**: Redis (Catalog Caching, Checkout Sessions, Distributed Lock Management)
- **Logging**: Pino structured JSON logging with custom HTTP middleware
- **Containerization**: Docker multi-stage build & Docker Compose orchestration

## API Specification

### Health & Observability
- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe (checks PostgreSQL & Redis connectivity)

### Catalog API
- `GET /api/products` - List available catalog items (cached in Redis)
- `GET /api/products/:id` - Fetch product by ID

### Checkout API
- `POST /api/checkout/sessions` - Initiate checkout session with stock validation
- `GET /api/checkout/sessions/:sessionId` - Retrieve active checkout session
- `POST /api/checkout/sessions/:sessionId/process` - Complete transaction with ACID DB updates and inventory deduction

### Order API
- `GET /api/orders/:id` - Retrieve order details by ID
- `GET /api/orders/customer/:customerId` - List customer order history

## Running Locally

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose (optional for containerized run)

### Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Direct Run
Ensure PostgreSQL and Redis services are running locally, then:
```bash
npm install
npm start
```

### Containerized Run
```bash
docker compose up --build
```
