# Cubad - Azure Cosmos DB UI

A modern, fast, and intuitive web-based UI for Azure Cosmos DB.

## Features (Phase 1)

- 🔐 Azure authentication via Azure CLI (DefaultAzureCredential)
- 📋 List all Cosmos DB accounts in your subscription
- 🔒 Read-only mode by default (safe to use)
- 🎨 Modern UI with Tailwind CSS
- 🌙 Dark mode support

## Getting Started

### Prerequisites

- Node.js 18+
- Azure CLI installed and authenticated
- Access to Azure subscription with Cosmos DB accounts

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Authenticate with Azure CLI:

```bash
az login
```

3. (Optional) Set your Azure subscription ID:

```bash
cp .env.local.example .env.local
# Edit .env.local and add your AZURE_SUBSCRIPTION_ID
```

If you don't set `AZURE_SUBSCRIPTION_ID`, the app will try to use your default subscription.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:9090](http://localhost:9090) in your browser.

## Architecture

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Azure DefaultAzureCredential (Azure CLI, Managed Identity, etc.)
- **Azure SDKs**:
  - `@azure/identity` - Authentication
  - `@azure/arm-cosmosdb` - Account management
  - `@azure/cosmos` - Data operations (coming in Phase 3)

## Project Structure

```
cubad/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── accounts/      # List Cosmos DB accounts
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── AccountList.tsx    # Account list component
├── lib/                   # Utility libraries
│   └── azure/            # Azure services
│       ├── auth.ts       # Authentication
│       └── management.ts # Account management
├── types/                # TypeScript types
│   └── cosmos.ts         # Cosmos DB types
└── PLANNING.md           # Full project plan
```

## Security

- **Read-only by default**: The app uses read-only keys for all Cosmos DB operations
- **No write access**: Phase 1 only lists accounts and will query data (Phase 3)
- **Write operations**: Will be opt-in only in later phases with explicit user confirmation

## Development

```bash
# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Roadmap

- ✅ **Phase 1**: Core infrastructure and account listing (Complete)
- 🔄 **Phase 2**: Command palette (cmd+k) and navigation
- 📝 **Phase 3**: Query editor with Monaco
- 🤖 **Phase 4**: AI-assisted query writing
- ⚡ **Phase 5**: Advanced features and optimizations
- 🚀 **Phase 6**: Deployment and documentation

See [PLANNING.md](./PLANNING.md) for the complete project plan.

## Troubleshooting

### Authentication Error

If you see authentication errors:

1. Make sure you're logged in: `az login`
2. Check your subscription: `az account show`
3. Set the correct subscription: `az account set --subscription <subscription-id>`

### No Accounts Found

If no accounts are listed:

1. Verify you have Cosmos DB accounts in your subscription
2. Check that you have read permissions on the subscription
3. Try setting `AZURE_SUBSCRIPTION_ID` explicitly in `.env.local`

## License

ISC
