import { AIProvider, AIProviderConfig, AIQueryContext } from '@/types/ai'
import { AnthropicProvider } from './anthropic'
import { OpenRouterProvider } from './openrouter'
import { OllamaProvider } from './ollama'
import { AzureOpenAIProvider } from './azure-openai'

/**
 * Extracts JSON from a string that may be wrapped in markdown code blocks.
 * Handles ```json, ```, or raw JSON.
 */
export function extractJSON(text: string): string {
  const trimmed = text.trim()

  // Match ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  return trimmed
}

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'anthropic':
      return new AnthropicProvider(config)
    case 'openrouter':
      return new OpenRouterProvider(config)
    case 'ollama':
      return new OllamaProvider(config)
    case 'azure-openai':
      return new AzureOpenAIProvider(config)
    default:
      throw new Error(`Unknown AI provider type: ${config.type}`)
  }
}

export function buildSystemPrompt(context: AIQueryContext): string {
  return `You are an expert in Azure Cosmos DB SQL API queries. You help users write efficient Cosmos DB queries.

Container Information:
- Container: ${context.containerName}
- Database: ${context.databaseName}
- Account: ${context.accountName}
${context.partitionKey ? `- Partition Key: ${context.partitionKey}` : ''}

${context.sampleDocuments && context.sampleDocuments.length > 0 ? `
Sample Document Structure:
${JSON.stringify(context.sampleDocuments[0], null, 2)}
` : ''}

⚠️ IMPORTANT: This is COSMOS DB SQL API, NOT traditional SQL!
Cosmos DB SQL has significant differences from traditional SQL databases (SQL Server, MySQL, PostgreSQL, Oracle):

CRITICAL DIFFERENCES:
- No JOIN operations between containers (only self-JOIN on arrays within documents)
- No stored procedures, views, or complex database objects
- No GROUP BY with HAVING clauses
- No subqueries in WHERE clauses (limited subquery support)
- No window functions (ROW_NUMBER, RANK, etc.)
- No CTEs (Common Table Expressions)
- No UNION, INTERSECT, EXCEPT operations
- Limited transaction support
- Document-based, not table-based structure

COSMOS DB SQL API SYNTAX:
- Use "SELECT * FROM c" as the base query (c is the container alias)
- Filter with WHERE clause: WHERE c.property = value
- Access nested properties with dot notation: c.address.city
- Use ARRAY_CONTAINS for array matching: WHERE ARRAY_CONTAINS(c.tags, "important")
- String functions: UPPER(), LOWER(), SUBSTRING(), STARTSWITH(), ENDSWITH(), CONTAINS()
- Aggregate functions: COUNT(), SUM(), AVG(), MIN(), MAX() (only in SELECT clause)
- ORDER BY for sorting (limited to 1000 results without continuation tokens)
- OFFSET and LIMIT for pagination (REQUIRED for performance)
- JOIN only for array expansion within documents: JOIN n IN c.nestedArray

PERFORMANCE REQUIREMENTS:
- ALWAYS use "c" as the container alias
- All queries must be READ-ONLY (SELECT statements only)
- ALWAYS include "OFFSET 0 LIMIT 100" at the end of every query (mandatory to prevent fetching all documents)
- Use partition key in WHERE clause when possible for optimal performance
- Avoid CROSS JOIN operations (can be very expensive in RU cost)
- Be mindful of Request Units (RU) consumption

QUERY FORMATTING STANDARDS:
- Format queries for human readability with proper indentation and line breaks
- Use consistent spacing around operators (=, !=, <, >, AND, OR)
- Align major clauses (SELECT, FROM, WHERE, ORDER BY) for clarity
- Break complex WHERE conditions into multiple lines with logical indentation
- Use clear, descriptive aliases when needed
- Ensure the query structure is immediately understandable to developers

COSMOS-SPECIFIC CONSIDERATIONS:
- Queries are case-sensitive for property names
- JSON document structure dictates query capabilities
- Indexing policy affects which queries are efficient
- Large result sets require continuation tokens
- Spatial queries use special functions: ST_DISTANCE(), ST_WITHIN()`
}

export function buildQueryGenerationPrompt(userPrompt: string): string {
  return `Generate a Cosmos DB SQL API query based on this request:

"${userPrompt}"

⚠️ CRITICAL: Generate VALID COSMOS DB SQL ONLY!
- This is NOT traditional SQL (SQL Server, MySQL, PostgreSQL)
- Use "c" as the container alias
- Must end with "OFFSET 0 LIMIT 100" (mandatory pagination)
- Only SELECT statements (no INSERT, UPDATE, DELETE)
- No JOINs between containers
- No GROUP BY with HAVING
- No window functions, CTEs, or UNION operations
- Use ARRAY_CONTAINS() for array matching
- Use dot notation for nested properties

QUERY FORMATTING REQUIREMENTS:
- Format the SQL in a human-readable way with proper line breaks and indentation
- Align clauses consistently (WHERE, ORDER BY, etc.)
- Use clear spacing around operators and commas
- Make complex conditions easy to read and understand
- Break long conditions across multiple lines for readability

Respond with ONLY a JSON object in this format:
{
  "query": "SELECT * FROM c WHERE ... OFFSET 0 LIMIT 100",
  "explanation": "This query does X by using Cosmos DB SQL API syntax..."
}

Do not include any other text, markdown, or code blocks. Just the JSON object.`
}

export function buildQueryExplanationPrompt(query: string): string {
  return `Explain this Cosmos DB SQL API query in simple terms:

${query}

Provide a clear, concise explanation that highlights:
1. What this Cosmos DB SQL query does
2. How it works with Cosmos DB's document structure
3. Any Cosmos-specific features being used (ARRAY_CONTAINS, pagination, etc.)
4. Performance considerations (partition key usage, RU cost implications)
5. How the query formatting enhances readability and maintainability

Remember: This is Cosmos DB SQL API, not traditional SQL. Comment on the query's readability and structure if relevant.`
}

export function buildArtifactGenerationPrompt(
  userPrompt: string,
  artifactType: string, // Kept for compatibility but always 'magic'
  sampleData?: any[]
): string {
  const sampleDataSection = sampleData && sampleData.length > 0
    ? `\n\nSample Data Structure:\n${JSON.stringify(sampleData[0], null, 2)}\n\nIMPORTANT: The data prop will be a LIST/ARRAY of sample objects like the one shown above, not a single object. Your component should handle an array of documents.`
    : ''

  return `Generate a React component artifact to visualize Cosmos DB data.

User Request: "${userPrompt}"${sampleDataSection}

You are creating a "magic" artifact - analyze the data structure and user request to determine the BEST UI representation. You can choose between:
- Data tables (sortable, filterable)
- Card grids (visual, organized)
- Charts and visualizations
- Dashboards with metrics
- Creative custom layouts
- Any combination that best suits the data

Pick the most appropriate visualization based on the data structure and user needs.</think>

Requirements:
1. Create a complete, self-contained React component
2. The component MUST be named EXACTLY "ArtifactComponent" - no other names will work
3. The component will receive data via props: { data, loading, error }
   - CRITICAL: The data prop will be an ARRAY/LIST of objects, not a single object
   - Your component should iterate over data (e.g., data.map(), data.length, etc.)
4. Use Tailwind CSS for styling (classes available)
5. Keep it simple and functional
6. Handle loading and error states gracefully
7. Make it visually appealing and professional

IMPORTANT: The function name MUST be "ArtifactComponent" exactly. Do not use any other name like OrderManagementDashboard, DataVisualization, etc. The system expects this exact name.

Available libraries in scope:
- React (hooks available)
- Tailwind CSS
- Basic HTML/CSS

Component Template:
\`\`\`jsx
function ArtifactComponent({ data, loading, error }) {
  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data || data.length === 0) return <div className="p-4 text-gray-600">No data available</div>;

  // IMPORTANT: data is an ARRAY of objects, iterate over it
  // Example: data.map(item => ...) or data.forEach(item => ...)

  return (
    <div className="p-4">
      {/* Your UI here - remember to handle the array of objects */}
    </div>
  );
}
\`\`\`

Respond with ONLY a JSON object in this exact format:
{
  "name": "Brief artifact name",
  "description": "What this artifact displays",
  "code": "The complete React component code as a string",
  "query": "Optional Cosmos DB query to fetch the data (or null if using existing results)",
  "explanation": "Brief explanation of what was created"
}

Do not include markdown code blocks, just the raw JSON object.`
}

export function buildArtifactRefinementPrompt(
  existingArtifact: any,
  refinementRequest: string,
  sampleData?: any[]
): string {
  const sampleDataSection = sampleData && sampleData.length > 0
    ? `\n\nSample Data Structure:\n${JSON.stringify(sampleData[0], null, 2)}\n\nIMPORTANT: The data prop will be a LIST/ARRAY of sample objects like the one shown above, not a single object. Your component should handle an array of documents.`
    : ''

  return `You are modifying an existing React component artifact. Here is the current artifact:

**Current Artifact Name:** ${existingArtifact.name}
**Current Artifact Type:** ${existingArtifact.type}
**Current Description:** ${existingArtifact.description}

**Current Component Code:**
\`\`\`jsx
${existingArtifact.code}
\`\`\`
${sampleDataSection}

**User's Refinement Request:** "${refinementRequest}"

Please modify the artifact according to the user's request. You can:
- Change the layout or styling
- Add new features or remove existing ones
- Improve the visual design
- Reorganize the information display
- Fix any issues or bugs
- Make it more user-friendly

The component must still receive data via props: { data, loading, error }
Use Tailwind CSS for styling.

IMPORTANT: The component MUST be named EXACTLY "ArtifactComponent" - do not change the function name. The system requires this exact name to work.

Respond with ONLY a JSON object in this exact format:
{
  "name": "Updated artifact name (if changed)",
  "description": "Updated description",
  "code": "The complete modified React component code as a string",
  "query": "Optional Cosmos DB query (or null)",
  "explanation": "Brief explanation of what changes were made"
}

Do not include markdown code blocks, just the raw JSON object.`
}
