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

// Generate a unique ID for each request
const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15);
};

// Send a message to the content script and wait for a response
const sendMessage = async (type: string, params: any = {}): Promise<any> => {
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
            reject(new Error(`Request timed out: ${type}`));
        }, 10000); // 10 second timeout
    });
};

// Implement the window.nostr object
const nostr: Nostr = {
    async getPublicKey(): Promise<string> {
        return sendMessage('nostr_getPublicKey');
    },

    async signEvent(event: NostrEvent): Promise<NostrEvent> {
        return sendMessage('nostr_signEvent', { event });
    },

    async getRelays(): Promise<Record<string, { read: boolean; write: boolean }>> {
        return sendMessage('nostr_getRelays');
    },

    nip04: {
        async encrypt(pubkey: string, plaintext: string): Promise<string> {
            return sendMessage('nostr_nip04_encrypt', { pubkey, plaintext });
        },

        async decrypt(pubkey: string, ciphertext: string): Promise<string> {
            return sendMessage('nostr_nip04_decrypt', { pubkey, ciphertext });
        }
    }
};

// Inject the nostr object into the window
try {
    console.log('Injecting window.nostr object...');
    (window as any).nostr = nostr;
    console.log('window.nostr object successfully injected!');

    // Let the content script know that the nostr object has been injected
    window.dispatchEvent(new Event('nostr:injected'));
} catch (error) {
    console.error('Failed to inject window.nostr object:', error);
} 