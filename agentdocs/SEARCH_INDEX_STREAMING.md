# Search Index Streaming Improvements

## Problem
The search index build was:
- Processing all accounts sequentially in a single request
- No progress feedback until completion
- Timing out or failing on large subscriptions
- No visibility when errors occurred

## Solution
Implemented **streaming response** with incremental processing:

### Backend Changes (`/api/search-index/build`)

1. **Streaming Response**
   - Uses `ReadableStream` with NDJSON format (newline-delimited JSON)
   - Sends progress updates as each account is processed
   - Returns multiple message types during the build

2. **Message Types**
   ```typescript
   {type: 'start', message: 'Starting...'}
   {type: 'progress', message: '...', accountsProcessed: 2, totalAccounts: 10, ...}
   {type: 'error', message: '...', continuable: true}
   {type: 'complete', success: true, data: {...}, progress: {...}}
   ```

3. **Error Handling**
   - Errors per account/database are logged but don't stop the build
   - Continuable errors are tracked and reported
   - Build continues with remaining accounts even if one fails

### Frontend Changes (`/settings`)

1. **Stream Reading**
   - Reads response body as a stream
   - Processes NDJSON line-by-line as data arrives
   - Updates UI in real-time

2. **Live Progress Display**
   - Shows current account being processed
   - Displays progress bar (X / Y accounts)
   - Updates database and container counts as discovered
   - Lists errors as they occur

3. **Visual Feedback**
   - Blue background while building
   - Green background when complete
   - Progress bar with percentage
   - Live status messages

## Benefits

✅ **Real-time feedback**: See progress as it happens
✅ **Better error handling**: Individual failures don't stop entire build
✅ **No timeouts**: Can handle large subscriptions
✅ **User confidence**: Clear indication of what's happening
✅ **Debugging**: Errors are visible immediately, not just at the end

## Example Progress Flow

```
Starting search index build...
↓
Found 10 accounts
↓
Processing account 1/10: account-prod-westus
↓
Completed account-prod-westus: 5 databases, 23 containers
↓
Processing account 2/10: account-dev-eastus
↓
[Error] Failed to fetch containers for account-dev-eastus/db1: Forbidden
↓
Completed account-dev-eastus: 3 databases, 15 containers
↓
... (continues for all accounts)
↓
Build complete!
Processed 10 accounts
Found 42 databases
Found 180 containers
2 errors occurred
```

## Technical Implementation

### Backend (Streaming)
```typescript
const stream = new ReadableStream({
  async start(controller) {
    // Send progress messages
    controller.enqueue(encoder.encode(JSON.stringify({
      type: 'progress',
      message: 'Processing account 1/10...'
    }) + '\n'))

    // Continue processing...

    controller.close()
  }
})

return new Response(stream, {
  headers: {
    'Content-Type': 'application/x-ndjson',
    'Cache-Control': 'no-cache',
  },
})
```

### Frontend (Stream Reading)
```typescript
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const text = decoder.decode(value)
  const messages = text.split('\n').filter(Boolean)

  for (const line of messages) {
    const message = JSON.parse(line)
    // Update UI based on message type
  }
}
```

## UI Improvements

### While Building
- Status message: "Processing account 2/10: account-name"
- Progress bar showing completion percentage
- Live counters for databases and containers found
- Blue background with border

### When Complete
- "Build Complete!" message
- Final statistics (accounts, databases, containers)
- Green background with border
- Expandable error list if any occurred

### Error Display
- Errors shown as expandable details
- Red text with full error messages
- Build continues even with errors
- All errors collected and shown at the end

## Performance

- **No blocking**: UI remains responsive during build
- **Memory efficient**: Processes one account at a time
- **No timeouts**: Can handle any subscription size
- **Incremental save**: Data saved only at the end (could be further optimized)

## Files Changed

- `app/api/search-index/build/route.ts` - Streaming backend
- `app/settings/page.tsx` - Stream reading and live progress display
