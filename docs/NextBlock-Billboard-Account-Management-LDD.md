# NextBlock Billboard - Account Management Module
## Low-Level Design Document

### 1. Overview
The Account Management module handles all Nostr key operations, including generation, import, storage, and retrieval. It serves as the foundation for user identity within the extension.

### 2. Dependencies
- Browser Storage API
- Cryptography libraries (for key generation)
- Nostr protocol libraries

### 3. Data Structures

#### 3.1 User Account
```typescript
interface UserAccount {
  privateKey: string;       // Hex-encoded private key
  publicKey: string;        // Hex-encoded public key
  name?: string;            // Optional display name from kind 0 event
  picture?: string;         // Optional profile picture URL from kind 0 event
  created: number;          // Timestamp of account creation
  lastUsed: number;         // Timestamp of last account usage
}
```

#### 3.2 Storage Schema
```typescript
interface AccountStorage {
  activeAccount: string;    // Public key of active account
  accounts: {               // Map of public keys to UserAccount objects
    [publicKey: string]: UserAccount;
  };
}
```

### 4. Component Interface

#### 4.1 Public Methods
```typescript
// Generate a new Nostr keypair
async function generateNewAccount(name?: string): Promise<UserAccount>;

// Import an existing private key
async function importAccount(privateKey: string, name?: string): Promise<UserAccount>;

// Get the active account
async function getActiveAccount(): Promise<UserAccount | null>;

// Set the active account
async function setActiveAccount(publicKey: string): Promise<boolean>;

// Delete an account
async function deleteAccount(publicKey: string): Promise<boolean>;

// Get all accounts
async function getAllAccounts(): Promise<UserAccount[]>;

// Update account metadata (from kind 0 events)
async function updateAccountMetadata(publicKey: string, metadata: any): Promise<UserAccount>;
```

### 5. Implementation Details

#### 5.1 Key Generation
- Use secure cryptographic libraries to generate Nostr keypairs
- Default to 32-byte private keys (schnorr/secp256k1)
- Implement entropy collection for better randomness

#### 5.2 Storage Security
- Never store private keys in plaintext
- Encrypt private keys before storage
- Use browser extension secure storage
- Implement optional encryption with user password

#### 5.3 Error Handling
- Invalid private key during import
- Storage failures
- Account not found
- Duplicate account import

### 6. User Flow Diagrams

#### 6.1 Account Creation Flow
```
User selects "Create Account" → 
Generate Key Pair → 
Encrypt Private Key → 
Store in Browser Storage → 
Set as Active Account → 
Display Public Key to User
```

#### 6.2 Account Import Flow
```
User provides Private Key → 
Validate Key Format → 
Derive Public Key → 
Check for Existing Account → 
Encrypt and Store → 
Set as Active Account
```

### 7. Integration Points

#### 7.1 Integration with Background Service
- Pass active account information for relay connections
- Provide signing capabilities for outgoing events

#### 7.2 Integration with Popup UI
- Display account information
- Handle user interactions for account management

#### 7.3 Integration with Nostr Provider
- Provide account information for NIP-07 interface
- Sign events when requested by web applications

### 8. Testing Considerations
- Test key generation entropy
- Test private key import validation
- Test storage encryption/decryption
- Test account switching
- Test persistence across browser sessions

### 9. Security Considerations
- Implement safeguards against unauthorized private key access
- Add confirmation for high-risk operations (deleting accounts, exporting keys)
- Consider adding timeout for authentication

### 10. Future Enhancements
- Support for hardware wallet integration
- Multi-account profile management
- Backup and recovery mechanisms
- Advanced encryption options 