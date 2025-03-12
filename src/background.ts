// background.ts - Handles Nostr operations
import { generateSecretKey, getPublicKey, getEventHash, finalizeEvent, nip04 } from 'nostr-tools';

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

// Get the private key if it exists
async function getKeys(): Promise<{ privateKey: Uint8Array; publicKey: string } | null> {
    const result = await chrome.storage.local.get(STORAGE_KEY);

    if (result[STORAGE_KEY]) {
        // Convert stored hex string back to Uint8Array
        const privateKey = hexToBytes(result[STORAGE_KEY]);
        const publicKey = getPublicKey(privateKey);
        return { privateKey, publicKey };
    }

    // No private key exists
    return null;
}

// Create a new private key and store it
async function createKeys(): Promise<{ privateKey: Uint8Array; publicKey: string }> {
    // Create a new private key
    const privateKey = generateSecretKey();
    const publicKey = getPublicKey(privateKey);

    // Store private key as hex string
    await chrome.storage.local.set({ [STORAGE_KEY]: bytesToHex(privateKey) });
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