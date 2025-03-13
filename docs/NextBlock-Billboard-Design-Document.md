# NextBlock Billboard - High-Level Design Document

## 1. Executive Summary

NextBlock Billboard is a browser extension that integrates with the Nostr protocol, allowing users to participate in the attention marketplace while browsing the web. The extension allows users to do the following:
1. create or import Nostr accounts
2. NIP-07 implementation
3. connect to the nextblock relay with nip42 auth
4. listen for ["BITCOIN"] type nostr events from the relay 
5. queries and displays the latest kind 99999 event

## 2. System Architecture

### 2.1 Overview

The extension follows a modular architecture consisting of:

1. **Popup Interface**: The user-facing UI for managing Nostr accounts and interactions
2. **Background Service Worker**: Core functionality that manages Nostr operations, key management, and relay connections
3. **Content Script**: Injects the Nostr provider into web pages
4. **Nostr Provider**: Implements the window.nostr interface according to NIP-07 specification

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  NextBlock Billboard Extension               │
│                                                             │
│  ┌─────────────┐       ┌──────────────────────────────┐     │
│  │   Popup UI  │◄─────►│  Background Service Worker   │     │
│  └─────────────┘       └──────────────────────────────┘     │
│         ▲                           ▲                       │
│         │                           │                       │
│         │                           │                       │
│         │                           ▼                       │
│         │               ┌──────────────────────────────┐    │
│         └───────────────┤      Content Script          │    │
│                         └──────────────────────────────┘    │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       ▼
                         ┌──────────────────────────────┐
                         │       Web Page               │
                         │  ┌─────────────────────┐     │
                         │  │   window.nostr      │     │
                         │  │   (NIP-07 API)      │     │
                         │  └─────────────────────┘     │
                         └──────────────────────────────┘
```

## 3. Component Details

### 3.1 Popup Interface (popup.html, popup.ts)

- **Purpose**: Provides the user-facing interface for managing Nostr accounts and displaying promoted content.
- **Key Functions**:
  - Account creation and private key import
  - Display of kind 0 event profile name
  - Connection to the NextBlock relay with NIP-42 authentication
  - Display of promoted notes from ["BITCOIN"] type events
  - Retrieval and display of the latest kind 99999 event

### 3.2 Background Service Worker (background.ts)

- **Purpose**: Handles core Nostr functionality and messaging between components.
- **Key Functions**:
  - Key management (generation, storage, retrieval)
  - Event signing
  - Message encryption/decryption (NIP-04)
  - Relay connection management with NIP-42 authentication
  - Subscription to ["BITCOIN"] type events
  - Retrieval of kind 99999 events
  - Message handling and routing

### 3.3 Content Script (content.ts)

- **Purpose**: Injects the Nostr provider script into web pages.
- **Key Functions**:
  - Script injection
  - Message forwarding between web pages and background service
  - NIP-07 implementation for web applications

### 3.4 Nostr Provider (nostr.ts)

- **Purpose**: Implements the window.nostr interface according to NIP-07 specification.
- **Key Functions**:
  - Exposes getPublicKey(), signEvent(), getRelays() methods
  - Implements NIP-04 encryption/decryption
  - Communicates with the extension via message passing

## 4. Data Flow

1. **Account Creation/Import**:
   - User interacts with popup UI
   - Background service creates or imports keys
   - Keys are securely stored in local storage

2. **Relay Connection**:
   - Background service establishes WebSocket connection to NextBlock relay
   - Implements NIP-42 authentication for secure connection
   - Manages connection lifecycle and message handling

3. **Event Subscription and Display**:
   - Service worker subscribes to ["BITCOIN"] type events from the relay
   - Queries the latest kind 99999 event
   - Retrieves and processes these events for display in the popup interface

4. **Web Page Integration**:
   - Content script injects nostr.ts into web pages
   - Web applications access window.nostr interface (NIP-07)
   - Requests are forwarded to background service
   - Results are returned to web applications

## 5. Security Considerations

- Private keys are securely stored in Chrome's local storage
- NIP-42 authentication for secure relay connections
- NIP-04 encryption for secure message exchange
- Content Security Policy to prevent XSS attacks
- Message validation between components

## 6. Extension Permissions

- **storage**: For storing Nostr keys
- **activeTab**: To access the current tab
- **tabs**: To interact with browser tabs
- **notifications**: For user notifications
- **webRequest**: For managing relay connections

## 7. Future Enhancements

- Enhanced relay management with multiple relay support
- UI improvements for better user experience
- Additional NIP implementations
- Integration with more Nostr clients and services
- Analytics for attention marketplace metrics
- Support for additional event types beyond ["BITCOIN"] events

## 8. Technical Specifications

- **Technologies**:
  - TypeScript
  - WebSocket for relay connections
  - Chrome Extension Manifest V3
  - Nostr Protocol (NIP-01, NIP-07, NIP-04, NIP-42)

- **Build System**:
  - Webpack for bundling
  - npm for package management

## 9. Conclusion

NextBlock Billboard provides a seamless bridge between web browsers and the Nostr protocol, enabling users to participate in the attention marketplace while browsing. The extension implements NIP-07 for web compatibility and uses NIP-42 for secure relay authentication. It specifically focuses on ["BITCOIN"] type events and kind 99999 events to provide relevant content to users. The modular architecture ensures maintainability and extensibility, while adhering to security best practices. 