// nostr.ts - Implements the window.nostr interface according to NIP-07 spec

interface Nostr {
    getPublicKey(): Promise<string>;
    signEvent(event: NostrEvent): Promise<NostrEvent>;
    getRelays(): Promise<Record<string, { read: boolean; write: boolean }>>;
    nip04: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
    };
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

// Log initialization
console.log('Nostr provider script loaded');

// Generate a unique ID for each request
const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15);
};

// Send a message to the content script and wait for a response
const sendMessage = async (type: string, params: any = {}): Promise<any> => {
    console.log(`Sending message: ${type}`, params);

    return new Promise((resolve, reject) => {
        const id = generateId();

        const listener = (event: MessageEvent) => {
            if (
                event.source === window &&
                event.data &&
                event.data.type === `${type}_response` &&
                event.data.id === id
            ) {
                window.removeEventListener('message', listener);
                console.log(`Received response for ${type}:`, event.data);

                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data.data);
                }
            }
        };

        window.addEventListener('message', listener);

        window.postMessage(
            {
                type,
                id,
                params
            },
            '*'
        );

        // Add a timeout to prevent hanging promises
        setTimeout(() => {
            window.removeEventListener('message', listener);
            console.error(`Request timed out: ${type}`);
            reject(new Error(`Request timed out: ${type}`));
        }, 10000); // 10 second timeout
    });
};

// Implement the window.nostr object
const nostr: Nostr = {
    async getPublicKey(): Promise<string> {
        console.log('nostr.getPublicKey called');
        return sendMessage('nostr_getPublicKey');
    },

    async signEvent(event: NostrEvent): Promise<NostrEvent> {
        console.log('nostr.signEvent called', event);
        return sendMessage('nostr_signEvent', { event });
    },

    async getRelays(): Promise<Record<string, { read: boolean; write: boolean }>> {
        console.log('nostr.getRelays called');
        return sendMessage('nostr_getRelays');
    },

    nip04: {
        async encrypt(pubkey: string, plaintext: string): Promise<string> {
            console.log('nostr.nip04.encrypt called', { pubkey, plaintext: '[REDACTED]' });
            return sendMessage('nostr_nip04_encrypt', { pubkey, plaintext });
        },

        async decrypt(pubkey: string, ciphertext: string): Promise<string> {
            console.log('nostr.nip04.decrypt called', { pubkey, ciphertext: '[REDACTED]' });
            return sendMessage('nostr_nip04_decrypt', { pubkey, ciphertext });
        }
    }
};

// Inject the nostr object into the window
try {
    console.log('Injecting window.nostr object...');

    // Check if nostr is already defined
    if ((window as any).nostr) {
        console.warn('window.nostr is already defined! Overwriting existing implementation.');
    }

    (window as any).nostr = nostr;
    console.log('window.nostr object successfully injected!', { nostr });

    // Let the content script know that the nostr object has been injected
    window.dispatchEvent(new Event('nostr:injected'));

    // Add a test function to the window for debugging
    (window as any).testNostr = async () => {
        try {
            const pubkey = await nostr.getPublicKey();
            console.log('Test successful! Public key:', pubkey);
            return pubkey;
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        }
    };

    console.log('You can test the nostr connection by running window.testNostr() in the console');
} catch (error) {
    console.error('Failed to inject window.nostr object:', error);
} 