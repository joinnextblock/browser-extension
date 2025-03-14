// WebSocket connection instance
let socket = null;

// Default relays configuration
const defaultRelays = {
    'wss://t-relay.nextblock.app': { read: true, write: true }
};

// Cache for user public key
let cachedPublicKey = null;

// Store the latest auth challenge for each relay
const storedChallenges = new Map();

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received message:', message);

    // Handle regular extension messages
    if (message.type === 'CONNECT_NOSTR') {
        connectToNostrRelay(message.key);
        sendResponse({ success: true });
    }
    else if (message.type === 'DISCONNECT_NOSTR') {
        disconnectFromNostrRelay();
        sendResponse({ success: true });
    }
    else if (message.type === 'SEND_NOSTR_MESSAGE') {
        sendNostrMessage(message.data);
        sendResponse({ success: true });
    }
    else if (message.type === 'CHECK_NOSTR_CONNECTION') {
        sendResponse({ connected: socket !== null && socket.readyState === WebSocket.OPEN });
    }
    else if (message.type === 'AUTHENTICATE_RELAY') {
        // Handle manual authentication request
        manualAuthenticate(message.relayURL || 'wss://t-relay.nextblock.app')
            .then(success => {
                sendResponse({ success });
            })
            .catch(error => {
                console.error('Authentication error:', error);
                sendResponse({ success: false, error: error.message });
            });
    }
    else if (message.type === 'GET_STORED_CHALLENGES') {
        // Return all stored challenges that need authentication
        const challenges = Array.from(storedChallenges.keys()).map(relay => ({
            relay,
            challenge: storedChallenges.get(relay)
        }));
        sendResponse({ challenges });
    }
    // Handle NIP-07 requests from content script
    else if (message.type === 'NIP07_REQUEST') {
        handleNip07Request(message, sender)
            .then(result => {
                sendResponse(result);
            })
            .catch(error => {
                console.error('Error handling NIP-07 request:', error);
                sendResponse({
                    error: {
                        code: -1,
                        message: error.message || 'Unknown error'
                    }
                });
            });
    }
    else {
        console.error('Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    // Return true to indicate we'll respond asynchronously
    return true;
});

// Handle NIP-07 requests
async function handleNip07Request(message, sender) {
    console.log('Handling NIP-07 request:', message);

    // Validate origin
    // TODO: Add origin validation and permissions checks here

    const { method, payload, id, origin } = message;

    try {
        // Check if we have a private key
        const privateKey = await getPrivateKey();
        if (!privateKey) {
            return {
                error: {
                    code: 4,
                    message: 'No private key available. Please login first.'
                }
            };
        }

        let result;

        switch (method) {
            case 'getPublicKey':
                result = await getPublicKeyFromPrivate(privateKey);
                break;

            case 'signEvent':
                result = await signEventWithPrivateKey(privateKey, payload);
                break;

            case 'getRelays':
                result = await getConfiguredRelays();
                break;

            case 'nip04.encrypt':
                result = await encryptNip04Message(privateKey, payload.pubkey, payload.plaintext);
                break;

            case 'nip04.decrypt':
                result = await decryptNip04Message(privateKey, payload.pubkey, payload.ciphertext);
                break;

            default:
                return {
                    error: {
                        code: 3,
                        message: `Method not supported: ${method}`
                    }
                };
        }

        return { result };

    } catch (error) {
        console.error(`Error handling ${method}:`, error);
        return {
            error: {
                code: 2,
                message: error.message || `Error handling ${method}`
            }
        };
    }
}

// Get private key from storage
async function getPrivateKey() {
    return new Promise((resolve, reject) => {
        try {
            // In background scripts, localStorage is not available
            // Only use chrome.storage.local for background scripts
            chrome.storage.local.get(['nostrKey'], (result) => {
                if (result && result.nostrKey) {
                    resolve(result.nostrKey);
                } else {
                    resolve(null);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Get public key from private key
// TODO: Replace with actual cryptographic derivation
async function getPublicKeyFromPrivate(privateKey) {
    // Placeholder - implement actual derivation
    if (cachedPublicKey) return cachedPublicKey;

    // This is a placeholder - you should use a proper Nostr library
    // to derive the public key from the private key
    cachedPublicKey = 'placeholder_public_key_hex';

    return cachedPublicKey;
}

// Sign an event with private key
// TODO: Replace with actual cryptographic signing
async function signEventWithPrivateKey(privateKey, event) {
    // Placeholder - implement actual signing

    // Create a copy of the event
    const signedEvent = { ...event };

    // Add required fields
    if (!signedEvent.created_at) {
        signedEvent.created_at = Math.floor(Date.now() / 1000);
    }

    // Get the public key
    const pubkey = await getPublicKeyFromPrivate(privateKey);
    signedEvent.pubkey = pubkey;

    // In a real implementation, you would:
    // 1. Serialize the event
    // 2. Create a SHA-256 hash
    // 3. Sign the hash with the private key
    // 4. Add the signature to the event

    signedEvent.id = 'placeholder_event_id';
    signedEvent.sig = 'placeholder_signature';

    return signedEvent;
}

// Get configured relays
async function getConfiguredRelays() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['nostrRelays'], (result) => {
            if (result && result.nostrRelays) {
                resolve(result.nostrRelays);
            } else {
                // Return default relays if none configured
                resolve(defaultRelays);
            }
        });
    });
}

// Encrypt a message using NIP-04
// TODO: Replace with actual encryption
async function encryptNip04Message(privateKey, pubkey, plaintext) {
    // Placeholder - implement actual NIP-04 encryption
    return `encrypted_${plaintext}`;
}

// Decrypt a message using NIP-04
// TODO: Replace with actual decryption
async function decryptNip04Message(privateKey, pubkey, ciphertext) {
    // Placeholder - implement actual NIP-04 decryption
    if (ciphertext.startsWith('encrypted_')) {
        return ciphertext.substring(10);
    }
    return 'decrypted_message';
}

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
    // Check for existing nostrKey in storage and connect if available
    chrome.storage.local.get(['nostrKey'], (result) => {
        if (result.nostrKey) {
            connectToNostrRelay(result.nostrKey);
        }
    });
});

// Listen for changes to storage
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.nostrKey) {
        console.log('nostrKey changed in storage');

        if (changes.nostrKey.newValue) {
            // Key was added or updated
            connectToNostrRelay(changes.nostrKey.newValue);
        } else {
            // Key was removed
            disconnectFromNostrRelay();
        }
    }
});

// Establish connection to the Nostr relay
function connectToNostrRelay(nostrKey) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('Already connected to Nostr relay');
        return;
    }

    try {
        console.log('Connecting to Nostr relay...');
        socket = new WebSocket('wss://t-relay.nextblock.app');

        socket.addEventListener('open', (event) => {
            console.log('Connected to Nostr relay');
            // Notify any listening content scripts or popup
            chrome.runtime.sendMessage({ type: 'NOSTR_CONNECTED' });

            // You can perform initial auth here if needed
            // sendNostrMessage({ type: 'AUTH', key: nostrKey });
        });

        socket.addEventListener('message', async (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message from Nostr relay:', data);

            // Handle AUTH message according to NIP-42
            if (Array.isArray(data) && data[0] === 'AUTH') {
                await handleAuthChallenge(data);
            } else {
                // Forward the message to any listening content scripts or popup
                chrome.runtime.sendMessage({
                    type: 'NOSTR_MESSAGE',
                    data: data
                });
            }
        });

        socket.addEventListener('error', (error) => {
            console.error('Nostr relay error:', error);
            chrome.runtime.sendMessage({
                type: 'NOSTR_ERROR',
                error: 'WebSocket error'
            });
        });

        socket.addEventListener('close', (event) => {
            console.log('Disconnected from Nostr relay:', event.code, event.reason);
            socket = null;

            chrome.runtime.sendMessage({
                type: 'NOSTR_DISCONNECTED',
                code: event.code,
                reason: event.reason
            });
        });

    } catch (error) {
        console.error('Failed to connect to Nostr relay:', error);
        chrome.runtime.sendMessage({
            type: 'NOSTR_ERROR',
            error: 'Failed to connect: ' + error.message
        });
    }
}

// Authenticate to a relay using NIP-42
async function authenticateToRelay(relayURL, challenge, privateKey) {
    try {
        console.log(`Authenticating to relay ${relayURL} with challenge ${challenge}`);

        // Get the public key from private key
        const pubkey = await getPublicKeyFromPrivate(privateKey);

        // Create an AUTH event according to NIP-42
        // https://github.com/nostr-protocol/nips/blob/master/42.md
        const authEvent = {
            kind: 22242,  // NIP-42 AUTH event kind
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["relay", relayURL],
                ["challenge", challenge]
            ],
            content: ""
        };

        // Sign the event
        const signedEvent = await signEventWithPrivateKey(privateKey, authEvent);

        // Send the AUTH event to the relay
        if (socket && socket.readyState === WebSocket.OPEN) {
            const authMessage = ["AUTH", signedEvent];
            socket.send(JSON.stringify(authMessage));
            console.log('AUTH response sent:', authMessage);

            // Remove the challenge from stored challenges since we've handled it
            storedChallenges.delete(relayURL);

            return true;
        } else {
            console.error('Cannot authenticate: WebSocket is not connected');
            throw new Error('WebSocket is not connected');
        }
    } catch (error) {
        console.error('Error in authenticateToRelay:', error);
        throw error;
    }
}

// Handle manual authentication request from UI
async function manualAuthenticate(relayURL) {
    try {
        const challenge = storedChallenges.get(relayURL);
        if (!challenge) {
            console.error('No stored challenge for relay:', relayURL);
            return false;
        }

        const privateKey = await getPrivateKey();
        if (!privateKey) {
            console.error('No private key available for authentication');
            return false;
        }

        return await authenticateToRelay(relayURL, challenge, privateKey);
    } catch (error) {
        console.error('Error in manual authentication:', error);
        return false;
    }
}

// Handle AUTH challenge from relay (NIP-42)
async function handleAuthChallenge(authMessage) {
    try {
        // Check if the message is properly formatted
        if (authMessage.length < 2 || typeof authMessage[1] !== 'string') {
            console.error('Invalid AUTH message format:', authMessage);
            return;
        }

        const challenge = authMessage[1];

        // Optional relay URL in the authMessage[2]
        const relayURL = authMessage.length > 2 ? authMessage[2] : 'wss://t-relay.nextblock.app';

        // Store the challenge for this relay
        storedChallenges.set(relayURL, challenge);

        // Get private key
        const privateKey = await getPrivateKey();
        if (!privateKey) {
            console.log('No private key available to sign AUTH response - challenge stored for later authentication');

            // Notify UI that authentication needs user action
            chrome.runtime.sendMessage({
                type: 'NOSTR_AUTH_NEEDED',
                relay: relayURL,
                message: 'Authentication required but no private key available'
            });
            return;
        }

        // If we have a private key, proceed with authentication
        await authenticateToRelay(relayURL, challenge, privateKey);
    } catch (error) {
        console.error('Error handling AUTH challenge:', error);
        chrome.runtime.sendMessage({
            type: 'NOSTR_ERROR',
            error: 'AUTH failed: ' + error.message
        });
    }
}

// Send a message to the relay
function sendNostrMessage(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
        return true;
    } else {
        console.error('Cannot send message: not connected to Nostr relay');
        chrome.runtime.sendMessage({
            type: 'NOSTR_ERROR',
            error: 'Cannot send message: not connected'
        });
        return false;
    }
}

// Close the connection
function disconnectFromNostrRelay() {
    if (socket) {
        console.log('Disconnecting from Nostr relay');
        socket.close();
        socket = null;
    }
} 