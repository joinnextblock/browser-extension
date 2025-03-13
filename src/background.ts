// background.ts - Handles Nostr operations
import { generateSecretKey, getPublicKey as nostrGetPublicKey, finalizeEvent, nip04, SimplePool, type Event, type Filter } from 'nostr-tools';

// Convert hex to Uint8Array
function hexToBytes(hex: string): Uint8Array {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

interface NostrEvent {
    id?: string;
    pubkey?: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig?: string;
}

// Store the user's keys securely
const STORAGE_KEY = 'nostr_keys';
const RELAYS_KEY = 'nostr_relays';

// Global pool for nostr connections
let pool: SimplePool | null = null;
const activeRelays: Set<string> = new Set();

// Get the private key if it exists
async function getKeys(): Promise<{ privateKey: Uint8Array; publicKey: string } | null> {
    const result = await chrome.storage.local.get(STORAGE_KEY);

    if (result[STORAGE_KEY]) {
        // Convert stored hex string back to Uint8Array
        const privateKey = hexToBytes(result[STORAGE_KEY]);
        const publicKey = nostrGetPublicKey(privateKey);
        return { privateKey, publicKey };
    }

    // No private key exists
    return null;
}

// Create a new private key and store it
async function createKeys(): Promise<{ privateKey: Uint8Array; publicKey: string }> {
    // Create a new private key
    const privateKey = generateSecretKey();
    const publicKey = nostrGetPublicKey(privateKey);

    // Store private key as hex string
    const hexKey = bytesToHex(privateKey);
    await chrome.storage.local.set({ [STORAGE_KEY]: hexKey });
    return { privateKey, publicKey };
}

// Get or initialize the default relays
async function getOrCreateRelays(): Promise<Record<string, { read: boolean; write: boolean }>> {
    const result = await chrome.storage.local.get(RELAYS_KEY);

    if (result[RELAYS_KEY]) {
        return result[RELAYS_KEY];
    }

    // Default relays
    const defaultRelays = {
        'wss://relay.damus.io': { read: true, write: true },
        'wss://nostr.wine': { read: true, write: true },
        'wss://relay.nostr.band': { read: true, write: true }
    };

    await chrome.storage.local.set({ [RELAYS_KEY]: defaultRelays });
    return defaultRelays;
}

// Handle messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.type);

    if (request.type === 'nostr_connectToRelay') {
        // Handle the connection request
        connectToRelay(request.relay)
            .then(result => {
                console.log('Connection result:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('Connection error:', error);
                sendResponse({
                    success: false,
                    error: error.message || 'Unknown error occurred'
                });
            });

        // Return true to indicate we will respond asynchronously
        return true;
    }

    // Make sure to return true to indicate we will respond asynchronously
    handleMessage(request, sender)
        .then(sendResponse)
        .catch(error => {
            sendResponse({ error: error.message || 'Unknown error' });
        });

    return true;
});

// Process messages from content scripts
async function handleMessage(request: any, sender: chrome.runtime.MessageSender): Promise<any> {
    // Safety checks
    if (!request.type || !request.type.startsWith('nostr_')) {
        throw new Error('Invalid request type');
    }

    // Handle different NIP-07 operations
    switch (request.type) {
        case 'nostr_getPublicKey':
            const keys = await getKeys();
            if (!keys) {
                throw new Error('No private key found. Please create one first.');
            }
            return { data: keys.publicKey };

        case 'nostr_signEvent':
            return await signEvent(request.params.event);

        case 'nostr_getRelays':
            const relays = await getOrCreateRelays();
            return { data: relays };

        case 'nostr_nip04_encrypt':
            return await encryptMessage(request.params.pubkey, request.params.plaintext);

        case 'nostr_nip04_decrypt':
            return await decryptMessage(request.params.pubkey, request.params.ciphertext);

        case 'nostr_createKeys':
            // Only create keys if explicitly requested
            const newKeys = await createKeys();
            return { data: newKeys.publicKey };

        default:
            throw new Error(`Unsupported method: ${request.type}`);
    }
}

// Sign a Nostr event
async function signEvent(event: NostrEvent): Promise<{ data: NostrEvent }> {
    try {
        const keys = await getKeys();
        if (!keys) {
            throw new Error('No private key found. Please create one first.');
        }

        const { privateKey, publicKey } = keys;

        // Create a clean event object with required fields
        const cleanEvent: NostrEvent = {
            ...event,
            pubkey: publicKey, // Always use the user's pubkey
            created_at: event.created_at || Math.floor(Date.now() / 1000),
            tags: event.tags || [],
            content: event.content,
            kind: event.kind
        };

        // Finalize the event (compute the ID and sign it)
        const signedEvent = finalizeEvent(cleanEvent, privateKey);

        return { data: signedEvent };
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to sign event');
    }
}

// Encrypt a message using NIP-04
async function encryptMessage(pubkey: string, plaintext: string): Promise<{ data: string }> {
    try {
        const keys = await getKeys();
        if (!keys) {
            throw new Error('No private key found. Please create one first.');
        }

        const encrypted = await nip04.encrypt(keys.privateKey, pubkey, plaintext);
        return { data: encrypted };
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to encrypt message');
    }
}

// Decrypt a message using NIP-04
async function decryptMessage(pubkey: string, ciphertext: string): Promise<{ data: string }> {
    try {
        const keys = await getKeys();
        if (!keys) {
            throw new Error('No private key found. Please create one first.');
        }

        const decrypted = await nip04.decrypt(keys.privateKey, pubkey, ciphertext);
        return { data: decrypted };
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to decrypt message');
    }
}

// Function to connect to a relay
async function connectToRelay(relay: string): Promise<{ success: boolean, message: string }> {
    try {
        console.log(`Attempting to connect to relay: ${relay} at ${new Date().toISOString()}`);

        // Create a new pool if it doesn't exist
        if (!pool) {
            console.log('Creating new SimplePool for relay connections');
            pool = new SimplePool();
        }

        // Check if already connected to this relay
        if (activeRelays.has(relay)) {
            console.log(`Already connected to ${relay}`);
            return {
                success: true,
                message: `Already connected to ${relay}`
            };
        }

        // Get public key to verify connection works
        const keys = await getKeys();
        if (!keys) {
            return {
                success: false,
                message: 'No private key found. Please create one first.'
            };
        }
        const publicKey = keys.publicKey;
        console.log(`Using public key: ${publicKey}`);

        // Test direct connection to the relay first
        console.log(`Testing direct connection to ${relay}...`);

        const testConnectionStartTime = Date.now();
        const testResult = await pool.get(
            [relay],
            { kinds: [1], limit: 1 } // Just try to get a single note
        );

        const connectionTime = Date.now() - testConnectionStartTime;
        if (testResult === null) {
            console.log(`Initial connection test completed in ${connectionTime}ms but returned no data`);
        } else {
            console.log(`✅ Initial connection successful in ${connectionTime}ms, got data from relay!`);
        }

        // Use the pool to connect to the relay using subscribeMany
        const filters: Filter[] = [
            {
                kinds: [0, 1], // Metadata and text notes
                authors: [publicKey]
            }
        ];

        console.log(`Starting subscription at ${new Date().toISOString()}`);
        let receivedFirstEvent = false;

        // Create subscription to the relay
        const subscription = pool.subscribeMany(
            [relay],
            filters,
            {
                onevent(event: Event) {
                    const now = Date.now();
                    if (!receivedFirstEvent) {
                        receivedFirstEvent = true;
                        console.log(`✅ CONNECTION OPEN! First event received at ${new Date(now).toISOString()}`);
                        console.log(`Connection established and working with relay: ${relay}`);
                    }
                    console.log(`Received event from relay:`, event);
                },
                oneose() {
                    console.log(`EOSE (End of Stored Events) received at ${new Date().toISOString()}`);
                    if (!receivedFirstEvent) {
                        console.log(`Connection appears to be working, but no events matched our filter.`);
                    }
                    // Mark relay as active
                    activeRelays.add(relay);
                }
            }
        );

        console.log(`Subscription created and waiting for events...`);

        // Return success message
        return {
            success: true,
            message: `Connection request to ${relay} initiated successfully`
        };
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error connecting to relay: ${error.message}`);
            return {
                success: false,
                message: `Error connecting to relay: ${error.message}`
            };
        }
        return {
            success: false,
            message: "Unknown error occurred while connecting to relay"
        };
    }
}

// Initialize connections when the extension starts up
chrome.runtime.onStartup.addListener(async () => {
    try {
        // Check if we have keys
        const keys = await getKeys();
        if (keys) {
            // Connect to the default relay
            await connectToRelay('ws://localhost:8080');
        }
    } catch (error) {
        console.error('Error during startup:', error);
    }
}); 