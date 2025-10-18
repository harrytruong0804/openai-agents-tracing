# OpenAI Agents Tracing

A comprehensive, self-hosted tracing and analytics platform for AI agents with real-time monitoring, cost tracking, and usage analytics.

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="docs/traces-page.png" alt="Traces Page" />
      <p align="center"><b>Traces Dashboard</b></p>
    </td>
    <td width="50%">
      <img src="docs/trace-detail-page.png" alt="Trace Detail" />
      <p align="center"><b>Trace Details</b></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/costs-usages-page.png" alt="Costs & Usage" />
      <p align="center"><b>Costs & Usage Analytics</b></p>
    </td>
    <td width="50%">
      <img src="docs/setup-page.png" alt="Setup Page" />
      <p align="center"><b>Integration Setup</b></p>
    </td>
  </tr>
</table>

## Why This Over OpenAI's Official Tracing?

**Data Privacy & Security**
- OpenAI stores all your traces, prompts, and business logic on their servers
- Compliance issues with GDPR, HIPAA, SOC 2 when data leaves your infrastructure
- **Solution**: Self-host everything. All data stays in your MongoDB instance.

**No Data Export**
- Can't export tracing data from OpenAI
- No data portability or backups
- Can't run custom analytics
- **Solution**: Export to CSV, integrate with BI tools, maintain complete backups.

**Limited Filtering**
- OpenAI offers minimal filtering capabilities
- Can't filter by custom metadata, complex date ranges, or workflow parameters
- **Solution**: Advanced filtering by any field, metadata, date ranges, execution time, regex search.

**Open Source vs Closed**
- OpenAI's platform is closed source, no customization
- **Solution**: 100% open source. Modify, extend, white-label for your needs.  

## Features

- Advanced trace monitoring with detailed span information and workflow tracking
- Cost analytics with interactive charts and time-series analysis
- API key management with expiration and usage tracking
- Role-based access control (Admin/Read-only)
- Export data to CSV
- Advanced filtering by workflow, metadata, date ranges, and custom fields
- Dark/light theme support
- Self-hosted deployment with Docker

## Supported Models & SDKs

### AI Providers

Works with all models supported by [Vercel AI SDK](https://sdk.vercel.ai/providers):

- OpenAI (GPT-4, GPT-4 Turbo, GPT-4o, GPT-3.5 Turbo, o1, o3-mini)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
- Google (Gemini 2.0 Flash, Gemini 1.5 Pro)
- And 40+ more providers

### SDK Integration

- ✅ AI SDK (`@ai-sdk/*`) - Full support
- ⬜ Direct OpenAI SDK - Coming soon

### Language Support

- ✅ TypeScript
- ⬜ Python - Coming soon

**Note**: Currently requires [Vercel AI SDK](https://sdk.vercel.ai) for tracing.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (self-hosted or cloud)
- **Monorepo**: Turborepo with pnpm

## Self-Hosted Deployment

All your tracing data stays in your infrastructure. Deploy with Docker Compose, Kubernetes, or on any VPS/cloud provider.

## Quick Start

### Prerequisites

Before deploying, you'll need:

1. **MongoDB Database** - You must provide your own MongoDB instance
   - [MongoDB Atlas](https://www.mongodb.com/atlas) (Free tier available)
   - Self-hosted MongoDB
   - [MongoDB Cloud](https://cloud.mongodb.com/)
   - Any MongoDB-compatible database

2. **Docker & Docker Compose** (for containerized deployment)

### Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd openai-tracing

# 2. Create environment file from template
cp .env.example .env

# 3. Edit .env and add your MongoDB connection string
# REQUIRED: Set your MongoDB URI
nano .env

# Example .env:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/traces
# JWT_SECRET=your_random_secret_key_min_32_chars
# VITE_API_URL=http://localhost:3001
```

**Important**: You must set a valid `MONGODB_URI` in your `.env` file before starting the application.

```bash
# 4. Build and start services
docker-compose up -d

# 5. View logs
docker-compose logs -f
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

### MongoDB Connection Examples

```bash
# MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/traces

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/traces

# MongoDB with auth
MONGODB_URI=mongodb://<username>:<password>@localhost:27017/traces

# Docker host (when API is in Docker, MongoDB on host)
MONGODB_URI=mongodb://host.docker.internal:27017/traces
```

### Local Development

#### Prerequisites
- Node.js >= 18
- pnpm >= 9.1.0
- MongoDB instance (local or cloud)

#### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create environment files
cp .env.example apps/api/.env
cp .env.example apps/client/.env

# 3. Update MongoDB connection string in apps/api/.env
# MONGODB_URI=mongodb://localhost:27017/traces  (for local MongoDB)
# or
# MONGODB_URI=mongodb+srv://...  (for MongoDB Atlas)

# 4. Start development mode (all services)
pnpm dev

# Or run services individually
cd apps/api && pnpm dev
cd apps/client && pnpm dev
```

**Note**: Make sure your MongoDB instance is accessible before starting the API.

## Initial Setup

1. Visit http://localhost:3000
2. You'll be redirected to `/initial-setup`
3. Create your first admin account
4. Login and start using the platform

## API Key Usage

Generate an API key from the dashboard and use it to send trace data:

```typescript
const response = await fetch('http://localhost:3001/traces/event', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ak_<your_api_key>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: [
      // Your trace and span data
    ]
  })
});
```

## Seed Sample Data

To generate sample data for testing:

```bash
cd apps/api

# Generate 365 days of data (default)
pnpm seed

# Custom configuration
SEED_DAYS=90 SEED_TRACES_PER_DAY=20 SEED_SPANS_PER_TRACE=8 pnpm seed
```

## Build for Production

```bash
# Build all apps
pnpm build

# Run API in production
cd apps/api && pnpm start

# Serve client (use nginx or similar)
cd apps/client && pnpm preview
```

## Environment Variables

### Root .env (for Docker)
```env
# Required: Your MongoDB connection string
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/traces

# Required: JWT secret for authentication (min 32 characters recommended)
JWT_SECRET=your_random_secret_key_change_this

# Optional: API URL for frontend (default: http://localhost:3001)
VITE_API_URL=http://localhost:3001

# Optional: API port (default: 3001)
PORT=3001
```

### API (apps/api/.env) - For local development
```env
MONGODB_URI=mongodb://localhost:27017/traces
JWT_SECRET=your_secret_key
PORT=3001
```

### Client (apps/client/.env) - For local development
```env
VITE_API_URL=http://localhost:3001
```

### MongoDB Setup Guide

**Option 1: MongoDB Atlas (Recommended for production)**
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Add database user
4. Whitelist IP addresses (or allow all for testing: 0.0.0.0/0)
5. Get connection string and add to `.env`

**Option 2: Local MongoDB**
```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
# or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:8.0

# Connection string
MONGODB_URI=mongodb://localhost:27017/traces
```

**Option 3: Other MongoDB Providers**
- [MongoDB Cloud](https://cloud.mongodb.com/)
- [DigitalOcean Managed MongoDB](https://www.digitalocean.com/products/managed-databases-mongodb)
- Self-hosted MongoDB server

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f api
docker-compose logs -f client

# Rebuild after code changes
docker-compose up -d --build

# Remove all data and start fresh
docker-compose down -v
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT - See [LICENSE](LICENSE) file for details
