# NextBlock Billboard - Relay Connection Module
## Low-Level Design Document

### 1. Overview
The Relay Connection module manages WebSocket connections to Nostr relays, specifically the NextBlock relay, handling authentication, message parsing, subscription management, and event distribution to other components.

### 2. Dependencies
- WebSocket API
- Nostr protocol libraries
- Account Management module
- Event Processing module

### 3. Data Structures

#### 3.1 Relay Configuration
```typescript
interface RelayConfig {
  url: string;              // Relay WebSocket URL
  read: boolean;            // Whether to read from this relay
  write: boolean;           // Whether to write to this relay
  authRequired: boolean;    // Whether NIP-42 auth is required
  lastConnected?: number;   // Timestamp of last successful connection
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  error?: string;           // Last error message if status is 'error'
}
```

#### 3.2 Subscription
```typescript
interface NostrSubscription {
  id: string;               // Subscription ID
  filters: NostrFilter[];   // Nostr filters for the subscription
  eventCallback: (event: NostrEvent) => void;  // Callback for matching events
  eoseCallback?: () => void;  // End of stored events callback
  active: boolean;          // Whether subscription is active
  createdAt: number;        // Timestamp when subscription was created
}

interface NostrFilter {
  ids?: string[];           // Event ids
  authors?: string[];       // Event authors
  kinds?: number[];         // Event kinds
  '#e'?: string[];          // Event references
  '#p'?: string[];          // Profile references
  '#t'?: string[];          // Tag references (like ["BITCOIN"])
  since?: number;           // Events since timestamp
  until?: number;           // Events until timestamp
  limit?: number;           // Limit number of events
}
```

#### 3.3 Nostr Event
```typescript
interface NostrEvent {
  id: string;               // Event ID (hash of the serialized event data)
  pubkey: string;           // Publisher's public key
  created_at: number;       // Unix timestamp in seconds
  kind: number;             // Event kind (0=metadata, 1=text note, etc.)
  tags: string[][];         // Array of tags
  content: string;          // Content (depends on kind)
  sig: string;              // Signature of the event data
}
```

### 4. Component Interface

#### 4.1 Public Methods
```typescript
// Connect to the NextBlock relay with NIP-42 auth
async function connectToRelay(): Promise<boolean>;

// Disconnect from relay
async function disconnectFromRelay(): Promise<void>;

// Get relay connection status
function getRelayStatus(): RelayConfig;

// Subscribe to a specific filter
function subscribe(filters: NostrFilter[], 
                  eventCallback: (event: NostrEvent) => void, 
                  eoseCallback?: () => void): string;

// Unsubscribe from a subscription
function unsubscribe(subscriptionId: string): boolean;

// Send an event to the relay
async function publishEvent(event: NostrEvent): Promise<boolean>;

// Subscribe specifically to Bitcoin events
function subscribeToBitcoinEvents(callback: (event: NostrEvent) => void): string;

// Query latest kind 99999 event
async function queryLatestKind99999Event(): Promise<NostrEvent | null>;
```

### 5. Implementation Details

#### 5.1 Connection Management
- Implement exponential backoff for reconnection attempts
- Handle WebSocket events (open, close, error, message)
- Implement NIP-42 authentication flow:
  1. Receive auth challenge from relay
  2. Sign challenge with user's private key
  3. Send signed challenge back to relay
  4. Verify successful authentication

#### 5.2 Message Processing
- Parse incoming WebSocket messages according to Nostr protocol
- Route events to appropriate subscription callbacks
- Handle subscription lifecycle (create, maintain, close)
- Process and queue outgoing messages

#### 5.3 Error Handling
- Connection failures
- Authentication failures
- Malformed messages
- Relay timeouts

### 6. Connection Flow Diagrams

#### 6.1 NIP-42 Authentication Flow
```
Connect to Relay →
Receive AUTH Challenge Message →
Extract Challenge String →
Create AUTH Event with Challenge →
Sign AUTH Event with User's Private Key →
Send AUTH Event to Relay →
Receive AUTH Success/Failure Response →
Update Connection Status
```

#### 6.2 Subscription Flow
```
Create Subscription Object with Filters →
Generate Unique Subscription ID →
Send REQ Message to Relay →
Process Incoming EVENT Messages →
Check Against Subscription Filters →
Call Event Callback for Matching Events →
Process EOSE Message →
Call EOSE Callback if Provided
```

### 7. Integration Points

#### 7.1 Integration with Background Service
- Provides event stream to background service
- Receives publish requests from background service

#### 7.2 Integration with Account Management
- Uses active account for NIP-42 authentication
- Receives account change notifications

#### 7.3 Integration with Popup UI
- Provides connection status for display
- Receives manual connection requests

### 8. Testing Considerations
- Test reconnection logic
- Test NIP-42 authentication flow
- Test subscription management
- Test event filtering
- Test WebSocket error handling

### 9. Security Considerations
- Validate relay responses before processing
- Implement timeout for authentication attempts
- Verify event signatures when appropriate
- Handle potentially malicious relay responses

### 10. Future Enhancements
- Support for multiple relays
- Relay prioritization
- Advanced filtering capabilities
- Connection quality metrics
- Fallback relays for high availability 