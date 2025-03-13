# NextBlock Billboard - Event Processing Module
## Low-Level Design Document

### 1. Overview
The Event Processing module handles Nostr event operations, including subscription management, event filtering, and processing for displaying Bitcoin-related events and kind 99999 events in the extension UI.

### 2. Dependencies
- Relay Connection module
- Account Management module
- Storage API

### 3. Data Structures

#### 3.1 Processed Event
```typescript
interface ProcessedEvent {
  id: string;               // Original event ID
  pubkey: string;           // Publisher's public key
  created_at: number;       // Unix timestamp in seconds
  kind: number;             // Event kind
  tags: string[][];         // Array of tags
  content: string;          // Content
  sig: string;              // Signature
  
  // Enhanced fields after processing
  authorName?: string;      // Author's display name (from metadata)
  authorPicture?: string;   // Author's profile picture (from metadata)
  formattedDate?: string;   // Human-readable date
  parsed?: any;             // Parsed content (if applicable)
  references?: {            // Resolved references
    events: Map<string, NostrEvent>;
    profiles: Map<string, ProfileMetadata>;
  };
}

interface ProfileMetadata {
  pubkey: string;
  name?: string;
  displayName?: string;
  picture?: string;
  about?: string;
  website?: string;
  nip05?: string;
}
```

#### 3.2 Event Cache
```typescript
interface EventCache {
  events: Map<string, NostrEvent>;  // Map of event ID to event
  profiles: Map<string, ProfileMetadata>;  // Map of pubkey to profile
  lastFetched: number;    // Timestamp of last fetch
  expiresAt: number;      // Expiration timestamp
}
```

### 4. Component Interface

#### 4.1 Public Methods
```typescript
// Subscribe to Bitcoin-tagged events
function subscribeToBitcoinEvents(callback: (events: ProcessedEvent[]) => void): string;

// Query and process latest kind 99999 event
async function getLatestKind99999Event(): Promise<ProcessedEvent | null>;

// Process an event (enrich with metadata, etc.)
async function processEvent(event: NostrEvent): Promise<ProcessedEvent>;

// Get profile metadata for a pubkey
async function getProfileMetadata(pubkey: string): Promise<ProfileMetadata | null>;

// Parse event content based on kind
function parseEventContent(event: NostrEvent): any;

// Save events to cache
function cacheEvents(events: NostrEvent[]): void;

// Clear event cache
function clearEventCache(): void;
```

### 5. Implementation Details

#### 5.1 Event Subscription
- Create specialized subscriptions for Bitcoin-tagged events
- Maintain active subscriptions
- Handle event deduplication
- Implement timeout and retry logic for subscriptions

#### 5.2 Event Processing Pipeline
- Receive events from relay subscriptions
- Validate event structure and signature
- Enrich events with profile metadata
- Parse content based on event kind
- Resolve references to other events and profiles
- Format dates and other display fields
- Cache processed events

#### 5.3 Event Filtering
- Filter events by tags (specifically ["BITCOIN"])
- Filter events by kind (99999)
- Apply content filters if needed
- Sort events by timestamp or other criteria

#### 5.4 Error Handling
- Invalid event formats
- Missing referenced events
- Failed metadata lookups
- Subscription failures

### 6. Process Flow Diagrams

#### 6.1 Bitcoin Event Subscription Flow
```
Call subscribeToBitcoinEvents() →
Create Filter with #t:["BITCOIN"] →
Register Subscription with Relay Connection →
Receive Events from Relay →
Process Events (metadata, parsing) →
Cache Processed Events →
Call User-Provided Callback with Events →
Update UI with New Events
```

#### 6.2 Kind 99999 Event Query Flow
```
Call getLatestKind99999Event() →
Create Filter with kind:99999, limit:1 →
Send One-Time Query to Relay →
Wait for Response →
Process Received Event →
Enrich with Metadata →
Parse Event Content →
Cache Result →
Return Processed Event to Caller
```

### 7. Integration Points

#### 7.1 Integration with Relay Connection
- Utilize subscribe/unsubscribe methods
- Handle relay connection status changes
- Process incoming events from relay

#### 7.2 Integration with Popup UI
- Provide processed events for display
- Handle UI-triggered actions on events
- Update event display when new data arrives

#### 7.3 Integration with Background Service
- Maintain event subscriptions in background
- Persist cached events between sessions
- Trigger UI updates when new events arrive

### 8. Testing Considerations
- Test event processing pipeline with diverse inputs
- Test handling of malformed events
- Test cache management and expiration
- Test subscription management
- Test profile metadata resolution
- Test performance with high event volumes

### 9. Security Considerations
- Validate event signatures where appropriate
- Sanitize content before parsing/rendering
- Implement content filtering for malicious content
- Handle potentially large volumes of events
- Protect against denial-of-service through excessive events

### 10. Future Enhancements
- Advanced content parsing (markdown, rich text)
- Media attachment handling
- Event relationship visualization
- Real-time updates for referenced content
- Intelligent caching strategies
- Support for additional event kinds 