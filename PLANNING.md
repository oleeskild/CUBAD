# Azure Cosmos DB UI - Project Planning Document

## Overview
A modern, fast, and intuitive web-based UI for Azure Cosmos DB that addresses the limitations of the official Azure Portal experience. The focus is on speed, search-first interactions, and developer productivity.

## Project Goals
1. Fast search across multiple Cosmos DB accounts (cmd+k interface)
2. Easy navigation between accounts, databases, and containers
3. Intuitive query editor with syntax highlighting
4. AI-assisted query writing supporting multiple providers
5. Better UX than Azure Portal with focus on developer workflow

---

## Technology Stack

### Frontend
**Framework:** Next.js 15 (App Router) with TypeScript
- **Why:**
  - Built-in API routes for backend logic
  - Excellent TypeScript support
  - Server components for performance
  - Easy deployment to Vercel/Azure
  - Great developer experience

**UI Library:** Radix UI + Tailwind CSS
- **Why:**
  - Unstyled, accessible components (Radix)
  - Rapid styling with Tailwind
  - Professional look without heavy frameworks
  - Great for command palette (cmdk component)

**Key Frontend Libraries:**
- `cmdk` - Command palette (cmd+k interface)
- `@monaco-editor/react` - Query editor with IntelliSense
- `@tanstack/react-query` - Data fetching and caching
- `zustand` - Lightweight state management
- `react-hot-toast` - Notifications

### Backend (Next.js API Routes)
**Primary SDK:** `@azure/cosmos` (v4.5.1+)
- **Why:**
  - Official Microsoft SDK with full TypeScript support
  - Direct data plane access for queries
  - Good documentation and examples
  - Active maintenance

**Management SDK:** `@azure/arm-cosmosdb`
- **Why:**
  - List all Cosmos DB accounts in subscriptions
  - Get account metadata and connection strings
  - Resource group management

**Authentication:** `@azure/identity`
- **Why:**
  - Unified auth for Azure services
  - Supports DefaultAzureCredential (local dev + production)
  - Works with Azure CLI, managed identity, service principals

### AI Integration
**Multi-provider support through unified interface:**
1. **Anthropic Claude** - `@anthropic-ai/sdk`
2. **OpenRouter** - REST API (supports multiple models)
3. **Ollama** - REST API (local models)
4. **Azure OpenAI** - `@azure/openai`

**Strategy:** Abstract AI providers behind a common interface for query assistance

### Database/Storage
**Configuration Storage:** Local file-based initially (JSON)
- Stores: AI provider configs, saved queries, account favorites
- Future: Could move to local SQLite or user's preferred storage

---

## Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                 │
│  ┌──────────────────────────────────────────────┐  │
│  │  Command Palette (cmd+k)                     │  │
│  │  - Search accounts, dbs, containers          │  │
│  │  - Quick actions                             │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Query Editor (Monaco)                       │  │
│  │  - Syntax highlighting                       │  │
│  │  - AI assistance                             │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Results View                                 │  │
│  │  - JSON viewer with formatting               │  │
│  │  - Export options                            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│              Backend (Next.js API Routes)            │
│  ┌──────────────────────────────────────────────┐  │
│  │  /api/accounts - List Cosmos accounts        │  │
│  │  /api/databases - List databases             │  │
│  │  /api/containers - List containers           │  │
│  │  /api/query - Execute queries                │  │
│  │  /api/ai/assist - AI query assistance        │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                  Azure Services                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Azure Identity (Authentication)             │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Cosmos DB Management API                    │  │
│  │  - Account discovery                         │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Cosmos DB Data Plane                        │  │
│  │  - Queries, CRUD operations                  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Authentication Flow
1. User authenticates via Azure CLI locally (DefaultAzureCredential)
2. Backend uses same credential to access Cosmos DB accounts
3. For production: Use Managed Identity or Service Principal

### Data Flow
1. **Account Discovery:**
   - Frontend requests accounts → Backend calls Azure Resource Manager
   - Cache accounts list with react-query (5min TTL)

2. **Search:**
   - Command palette searches cached account/database/container list
   - Fuzzy search with prioritization (recently used > favorites > all)

3. **Query Execution:**
   - Frontend sends query + container info → Backend
   - Backend creates CosmosClient, executes query
   - Stream results back to frontend (for large result sets)

4. **AI Assistance:**
   - Frontend sends: schema context + user prompt → Backend
   - Backend routes to configured AI provider
   - Returns suggested query or explanation

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
**Goal:** Basic project setup and Azure connectivity

#### Tasks:
1. **Project Setup**
   - Initialize Next.js 15 project with TypeScript
   - Configure Tailwind CSS and Radix UI
   - Set up project structure (`/app`, `/components`, `/lib`, `/types`)

2. **Azure Authentication**
   - Install `@azure/identity` and `@azure/arm-cosmosdb`
   - Implement authentication service using DefaultAzureCredential
   - Test local Azure CLI authentication
   - **IMPORTANT:** Use read-only keys by default for Cosmos DB data operations
     - Fetch read-only keys via Management API for safety
     - No write operations in Phase 1 (query-only mode)
     - Write access can be added in later phases with explicit user opt-in

3. **API Route: List Accounts**
   - Create `/api/accounts/route.ts`
   - Use `@azure/arm-cosmosdb` to list all Cosmos DB accounts
   - Return account metadata (name, endpoint, resource group)
   - Fetch read-only keys for each account

4. **Basic Frontend**
   - Simple layout with sidebar for account list
   - Display accounts from API
   - Error handling and loading states

**Deliverable:** Web app that authenticates and lists your Cosmos DB accounts

---

### Phase 2: Navigation & Search (Week 2)
**Goal:** Implement command palette and hierarchical navigation

#### Tasks:
1. **Data Layer Enhancement**
   - API routes for databases: `/api/databases/[accountName]/route.ts`
   - API routes for containers: `/api/containers/[accountName]/[dbName]/route.ts`
   - Use `@azure/cosmos` SDK to fetch databases and containers

2. **Command Palette**
   - Install and configure `cmdk`
   - Implement keyboard shortcut (cmd+k / ctrl+k)
   - Build search index combining accounts, databases, containers
   - Fuzzy search implementation (Fuse.js or simple filter)

3. **Navigation State**
   - Zustand store for: current account, database, container
   - URL state sync (query params)
   - Breadcrumb navigation component

4. **UI Polish**
   - Account/database/container list views
   - Icons and visual hierarchy
   - Loading skeletons
   - Empty states

**Deliverable:** Fast navigation through Cosmos DB hierarchy via command palette

---

### Phase 3: Query Editor (Week 3)
**Goal:** Execute and display queries with great UX

#### Tasks:
1. **Query Editor Component**
   - Integrate Monaco Editor (`@monaco-editor/react`)
   - Configure SQL syntax highlighting
   - Add keyboard shortcuts (cmd+enter to execute)
   - Query history (local storage)

2. **Query Execution API**
   - API route: `/api/query/route.ts`
   - Accept: account, database, container, query string
   - Execute query using `@azure/cosmos` with read-only keys
   - Return: results, RU cost, execution time
   - Error handling with helpful messages
   - Validate queries are read-only (SELECT statements only)

3. **Results Display**
   - JSON tree viewer (react-json-view or custom)
   - Pagination for large result sets
   - Export options (JSON, CSV)
   - Display query metrics (RU cost, latency)

4. **Query Management**
   - Save favorite queries (local storage)
   - Query templates/snippets
   - Recent queries list

**Deliverable:** Functional query editor that's better than Azure Portal

---

### Phase 4: AI Query Assistant (Week 4)
**Goal:** Multi-provider AI assistance for query writing

#### Tasks:
1. **AI Provider Abstraction**
   - Create unified interface: `AIProvider`
   - Implement adapters for:
     - Anthropic Claude (`@anthropic-ai/sdk`)
     - OpenRouter (fetch API)
     - Ollama (fetch API)
     - Azure OpenAI (`@azure/openai`)

2. **Settings UI**
   - Settings page for AI configuration
   - Provider selection (dropdown)
   - API key inputs (encrypted local storage)
   - Test connection button

3. **Context Building**
   - Fetch container schema/sample documents
   - Build context prompt with:
     - Container structure
     - Sample data
     - Cosmos DB SQL syntax reference

4. **AI Assistant API**
   - API route: `/api/ai/assist/route.ts`
   - Accept: user prompt, container context, selected provider
   - Call AI provider with structured prompt
   - Return: suggested query + explanation

5. **Assistant UI**
   - Assistant panel in query editor
   - Natural language input
   - Display suggested queries
   - Insert query into editor button
   - Explain query feature

**Deliverable:** AI-powered query assistance with multiple provider options

---

### Phase 5: Advanced Features (Week 5-6)
**Goal:** Polish and productivity enhancements

#### Tasks:
1. **Performance Optimization**
   - Implement query result streaming for large datasets
   - Add request cancellation
   - Optimize re-renders with React.memo
   - Add service worker for offline capability

2. **Data Operations** (requires explicit user opt-in for write access)
   - View individual documents (read-only keys)
   - Settings option to enable write operations (uses primary keys)
   - Edit documents (with validation) - write mode only
   - Delete documents (with confirmation) - write mode only
   - Bulk operations - write mode only

3. **Advanced Query Features**
   - Query plan viewer
   - Index usage analysis
   - Query optimization suggestions
   - Parameterized queries

4. **Monitoring & Insights**
   - RU usage tracking
   - Query performance history
   - Slow query identification
   - Cost estimation

5. **Multi-Account Features**
   - Compare data across accounts
   - Cross-account search
   - Favorites and tags
   - Custom account grouping

6. **Export & Integration**
   - Export to various formats (JSON, CSV, Excel)
   - Generate code snippets (C#, Node.js, Python)
   - Share queries via URL
   - CLI integration

**Deliverable:** Production-ready tool with advanced features

---

### Phase 6: Deployment & Documentation (Week 7)
**Goal:** Make it easy to run and contribute

#### Tasks:
1. **Deployment Options**
   - Docker containerization
   - Deploy to Vercel (easiest)
   - Deploy to Azure Static Web Apps
   - Deploy to Azure Container Apps
   - Document all deployment methods

2. **Documentation**
   - README with setup instructions
   - Architecture documentation
   - API documentation
   - Contributing guide
   - Screenshots and demo video

3. **Testing**
   - Unit tests for critical paths
   - E2E tests with Playwright
   - Test with different Cosmos DB APIs
   - Load testing for query performance

4. **Security Hardening**
   - API rate limiting
   - Input validation and sanitization
   - Secure credential storage
   - CSP headers
   - Security audit

**Deliverable:** Deployable, documented, tested application

---

## Key Features Breakdown

### Command Palette (cmd+k)
**Search Capabilities:**
- Accounts: Search by name, resource group, region
- Databases: Search across all accounts
- Containers: Search by name, partition key
- Queries: Search saved queries
- Actions: Quick actions (new query, settings, etc.)

**Prioritization:**
1. Recently used items
2. Favorited items
3. Alphabetical

### Query Editor
**Features:**
- Syntax highlighting (Cosmos DB SQL)
- Auto-completion (keywords, functions)
- Multi-tab support
- Split view (multiple queries side-by-side)
- Keyboard shortcuts:
  - `cmd+enter`: Execute query
  - `cmd+s`: Save query
  - `cmd+shift+f`: Format query

### AI Assistant
**Capabilities:**
- Natural language to SQL query
- Query explanation (SQL to natural language)
- Query optimization suggestions
- Schema exploration help
- Error explanation and fixes

**Example Prompts:**
- "Show me all orders from last month"
- "Explain this query: SELECT * FROM c WHERE..."
- "How do I filter by nested property?"
- "Optimize this query for RU cost"

---

## Technology Decisions - Rationale

### Why Next.js over separate frontend/backend?
- Single deployment
- API routes co-located with pages
- No CORS issues
- Easier authentication flow
- Better developer experience

### Why @azure/cosmos SDK over REST API directly?
- Built-in retry logic
- Connection pooling
- Better error handling
- TypeScript types
- Less boilerplate

### Why local storage over database initially?
- Faster to implement
- No infrastructure needed
- Easy to export/import
- Can migrate later if needed

### Why Monaco Editor over simple textarea?
- Same editor as VS Code
- Excellent TypeScript support
- Built-in IntelliSense
- Syntax highlighting
- Configurable themes

---

## Development Workflow

### Local Development Setup
1. Install dependencies: `npm install`
2. Authenticate with Azure CLI: `az login`
3. Set environment variables (`.env.local`)
4. Run dev server: `npm run dev`

### Environment Variables
```env
# Azure (optional - uses DefaultAzureCredential if not set)
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=

# AI Providers (optional - configured in UI)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
OPENROUTER_API_KEY=
OLLAMA_ENDPOINT=http://localhost:11434
```

### Project Structure
```
cubad/
├── app/
│   ├── page.tsx                    # Main UI
│   ├── settings/page.tsx           # Settings page
│   ├── api/
│   │   ├── accounts/route.ts       # List accounts
│   │   ├── databases/[account]/route.ts
│   │   ├── containers/[account]/[db]/route.ts
│   │   ├── query/route.ts          # Execute queries
│   │   └── ai/
│   │       └── assist/route.ts     # AI assistance
│   └── layout.tsx
├── components/
│   ├── CommandPalette.tsx          # cmd+k interface
│   ├── QueryEditor.tsx             # Monaco editor wrapper
│   ├── ResultsView.tsx             # Query results display
│   ├── AIAssistant.tsx             # AI panel
│   └── ui/                         # Radix UI components
├── lib/
│   ├── azure/
│   │   ├── auth.ts                 # Azure authentication
│   │   ├── cosmos.ts               # Cosmos DB client
│   │   └── management.ts           # Account management
│   ├── ai/
│   │   ├── provider.ts             # AI provider interface
│   │   ├── anthropic.ts            # Claude provider
│   │   ├── openrouter.ts           # OpenRouter provider
│   │   ├── ollama.ts               # Ollama provider
│   │   └── azure-openai.ts         # Azure OpenAI provider
│   └── storage/
│       ├── queries.ts              # Saved queries
│       ├── settings.ts             # User settings
│       └── favorites.ts            # Favorites management
├── types/
│   ├── cosmos.ts                   # Cosmos DB types
│   └── ai.ts                       # AI types
├── hooks/
│   ├── useAccounts.ts              # React Query hooks
│   ├── useDatabases.ts
│   ├── useContainers.ts
│   └── useQuery.ts
└── store/
    └── navigation.ts               # Zustand store
```

---

## Success Metrics

### Performance Goals
- Account list loads in < 1 second
- Query execution latency: < 500ms overhead (beyond Cosmos latency)
- Command palette appears in < 100ms
- UI remains responsive with 10,000+ result rows

### UX Goals
- 90% of actions achievable via keyboard
- Search finds correct item in top 3 results
- AI suggestions accepted > 50% of time
- Users prefer this over Azure Portal (subjective)

---

## Future Enhancements (Post-MVP)

### Advanced Features
- Real-time query result updates (change feed)
- Collaborative features (share queries, comments)
- Query result visualization (charts, graphs)
- Schema migration tools
- Backup and restore UI
- Cost analytics dashboard
- Query scheduling/automation
- Cosmos DB emulator integration

### Integrations
- VS Code extension
- CLI tool
- Browser extension
- Desktop app (Tauri)
- Mobile companion app

### Multi-Database Support
- MongoDB API support
- Cassandra API support
- Gremlin (Graph) API support
- Table API support

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue:** Azure authentication complexity
- **Solution:** Use DefaultAzureCredential, document Azure CLI setup clearly

**Issue:** Large result sets causing browser to freeze
- **Solution:** Implement streaming, pagination, virtual scrolling

**Issue:** AI providers have different response formats
- **Solution:** Strong abstraction layer with adapters

**Issue:** Cosmos DB API rate limits
- **Solution:** Request queuing, retry logic, user feedback

**Issue:** Keeping multiple account connections alive
- **Solution:** Connection pooling, lazy initialization, TTL for clients

---

## Open Questions

1. **Multi-API Support:** Should we support MongoDB/Cassandra/Gremlin APIs in Phase 1, or stick to SQL API only?
   - **Recommendation:** SQL API only for MVP, add others in Phase 5

2. **Authentication:** Should we support service principal auth in addition to Azure CLI?
   - **Recommendation:** Yes, add in Phase 1 as optional

3. **Deployment:** Self-hosted vs hosted service?
   - **Recommendation:** Self-hosted initially, could offer hosted later

4. **Pricing/Licensing:** Open source? Commercial?
   - **Recommendation:** Open source (MIT), accept sponsorships

---

## Getting Started (Next Steps)

1. Review and approve this plan
2. Set up Next.js project structure
3. Implement Phase 1: Core Infrastructure
4. Weekly check-ins to review progress
5. Iterate based on feedback

---

## Summary

This project will create a modern, fast, developer-friendly UI for Azure Cosmos DB that addresses the pain points of the official Azure Portal. By focusing on keyboard-first navigation, fast search, and AI-assisted query writing, we'll dramatically improve the developer experience for working with Cosmos DB.

The tech stack (Next.js + TypeScript + Azure SDKs + Multi-AI support) provides a solid foundation that's both powerful and maintainable. The phased implementation plan allows for incremental progress with usable deliverables at each stage.

**Estimated Timeline:** 6-7 weeks for full MVP with all features
**Minimal Viable Product:** Phase 1-3 (3 weeks) - Basic UI with query capability
