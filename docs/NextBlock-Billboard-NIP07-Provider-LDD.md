# NextBlock Billboard - NIP-07 Provider Module
## Low-Level Design Document

### 1. Overview
The NIP-07 Provider module implements the window.nostr interface according to the NIP-07 specification, allowing web applications to interact with the extension for Nostr operations like retrieving public keys, signing events, and managing encrypted communications.

### 2. Dependencies
- Content Script module
- Background Service Worker
- Account Management module
- Message passing API

### 3. Data Structures

#### 3.1 NIP-07 Interface
```typescript
interface NostrProvider {
  getPublicKey(): Promise<string>;
  signEvent(event: UnsignedEvent): Promise<NostrEvent>;
  getRelays(): Promise<{ [url: string]: RelayPolicy }>;
  nip04: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

interface UnsignedEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

interface RelayPolicy {
  read: boolean;
  write: boolean;
}
```

#### 3.2 Message Format
```typescript
interface ProviderMessage {
  type: 'getPublicKey' | 'signEvent' | 'getRelays' | 'nip04.encrypt' | 'nip04.decrypt';
  payload?: any;
  id: string;  // Unique message ID for response matching
}

interface ProviderResponse {
  id: string;  // Matching the request ID
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}
```

### 4. Component Interface

#### 4.1 Exposed Methods
```typescript
// Get the public key of the active account
async function getPublicKey(): Promise<string>;

// Sign an event with the active account's private key
async function signEvent(event: UnsignedEvent): Promise<NostrEvent>;

// Get relay information
async function getRelays(): Promise<{ [url: string]: RelayPolicy }>;

// NIP-04 encrypt a message for a recipient
async function encrypt(pubkey: string, plaintext: string): Promise<string>;

// NIP-04 decrypt a message from a sender
async function decrypt(pubkey: string, ciphertext: string): Promise<string>;
```

### 5. Implementation Details

#### 5.1 Initialization
- Create a script element that exposes window.nostr
- Initialize message handlers for communication with content script
- Establish communication channel with extension background service

#### 5.2 Method Implementation
- Implement each NIP-07 method to communicate with background service
- Handle promise resolution and error cases
- Apply appropriate timeouts for operations
- Maintain state for pending requests

#### 5.3 Error Handling
- User rejection of signing requests
- Missing permissions
- Connection failures to background service
- Invalid event formats
- Encryption/decryption failures

### 6. Process Flow Diagrams

#### 6.1 Event Signing Flow
```
Web App calls window.nostr.signEvent() →
Provider creates message with event data →
Message sent to content script →
Content script forwards to background service →
Background service verifies request →
(Optional) User prompted for approval →
Background service signs with private key →
Signed event returned through chain →
Promise resolves with signed event
```

#### 6.2 NIP-04 Encryption Flow
```
Web App calls window.nostr.nip04.encrypt() →
Provider creates encryption request message →
Message sent to content script →
Content script forwards to background service →
Background service performs NIP-04 encryption →
Encrypted result returned through chain →
Promise resolves with encrypted string
```

### 7. Integration Points

#### 7.1 Integration with Content Script
- Receive messages from injected provider
- Forward messages to background service
- Return responses to injected provider

#### 7.2 Integration with Background Service
- Process NIP-07 method requests
- Access account management for keys
- Perform cryptographic operations
- Return results to content script

#### 7.3 Integration with Web Applications
- Expose standard window.nostr interface
- Handle permissions and user consent
- Maintain compatibility with Nostr web apps

### 8. Testing Considerations
- Test with popular Nostr web applications
- Test compatibility with NIP-07 specification
- Test with malformed requests
- Test performance under load
- Test error handling and recovery

### 9. Security Considerations
- Implement request origin validation
- Add user prompts for sensitive operations (signing)
- Sanitize input from web applications
- Prevent unauthorized cross-origin access
- Implement timeouts for operations

### 10. Future Enhancements
- Support for additional NIPs
- Custom permissions per website
- User-friendly signing confirmations
- Developer tools for debugging
- Performance optimizations 