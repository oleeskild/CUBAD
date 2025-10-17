<div align="center">
  <img src="app/icon.svg" width="128" height="128" alt="Cubad Logo">
  <h1>Cubad</h1>
  <p><strong>Cosmos UI But Actually Decent</strong></p>
  <p>A modern, fast, and intuitive web-based UI for Azure Cosmos DB</p>
</div>

---

## What is Cubad?

Cubad is a developer-friendly UI for Azure Cosmos DB that doesn't suck. It provides:

- 🔍 **Fast Search** - Command palette (⌘K) for instant navigation
- 📝 **Query Editor** - Monaco-powered SQL editor with autocomplete
- 🤖 **AI Assistant** - Natural language to SQL query generation
- ⌨️ **Vim Navigation** - Keyboard shortcuts for everything (h/j/k/l)
- 🎨 **Modern UI** - Clean interface with dark mode
- 🔒 **Read-only Safe** - Uses read-only keys by default
- 📊 **Query History** - Automatic tracking of all executed queries with performance metrics
- 🔧 **Regex Filtering** - Filter display names in Settings using regex patterns

## Quick Start

### Prerequisites

- Node.js 18+
- Azure CLI
- Access to Azure subscription with Cosmos DB accounts

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cubad

# Install dependencies
npm install

# Authenticate with Azure
az login

# (Optional) Set your subscription ID in .env.local
# Copy the example file and add your subscription ID
cp .env.local.example .env.local
# Edit .env.local and set AZURE_SUBSCRIPTION_ID=your-subscription-id-here

# Run the development server
npm run dev
```

Open [http://localhost:9090](http://localhost:9090) and you're ready to go!

### First Time Setup

1. **Build Search Index** - Click the button on the welcome screen to index your databases
2. **Configure AI (Optional)** - Set up your AI provider in Settings for natural language queries
3. **Start Querying** - Use ⌘K to search or select from the sidebar

## Key Features

### Command Palette (⌘K)
Instant search across all your accounts, databases, and containers.

### Smart Autocomplete
Query editor suggests document properties from your actual data - no more guessing field names.

### AI Query Assistant
Describe what you want in plain English, get a ready-to-run SQL query. Optionally add a GDPR-safe (all values will be redacted, only structure and property names are kept) document schema for better results.

### Vim-style Navigation
- `h`/`l` - Navigate between panels
- `j`/`k` - Navigate items in lists
- `⌘↵` - Execute query

## Security

- **Read-only by default** - Uses read-only keys for all operations
- **GDPR-compliant** - AI features sanitize all values from documents
- **No secrets stored** - Uses Azure CLI authentication

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco (VS Code)
- **Database**: IndexedDB (for local caching)
- **Auth**: Azure DefaultAzureCredential

## Troubleshooting

### Authentication Error
```bash
az login
az account show
az account set --subscription <subscription-id>
```

### No Accounts Listed
Make sure you're on the correct subscription and have Cosmos DB accounts.

### Search Not Working
Build the search index from the welcome screen or Settings.

## License

ISC
