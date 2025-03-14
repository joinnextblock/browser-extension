/**
 * NextBlock Billboard - NIP-07 Provider
 * Implements the window.nostr interface according to NIP-07 specification
 */

(function () {
    'use strict';

    // Generate a random string for message ID
    function generateId() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

    // Keep track of pending promises
    const pendingRequests = new Map();

    // Send message to content script and return a promise
    function sendMessage(type, payload) {
        return new Promise((resolve, reject) => {
            const id = generateId();

            // Set timeout for request
            const timeoutId = setTimeout(() => {
                if (pendingRequests.has(id)) {
                    pendingRequests.delete(id);
                    reject(new Error('Request timed out'));
                }
            }, 30000); // 30 seconds timeout

            // Store promise callbacks
            pendingRequests.set(id, {
                resolve,
                reject,
                timeoutId
            });

            // Send message to content script
            window.postMessage({
                target: 'nextblock-nostr-provider',
                type,
                payload,
                id
            }, '*');
        });
    }

    // Handle responses from content script
    window.addEventListener('message', function (event) {
        // Only accept messages from the same window
        if (event.source !== window) return;

        const data = event.data;

        // Check if this is a response for the provider
        if (!data || data.target !== 'nextblock-nostr-page') return;

        // Handle broadcasts (no ID, just notifications)
        if (data.type === 'broadcast') {
            console.log('[NextBlock Provider] Broadcast received:', data.payload);
            // You could dispatch custom events here for page to listen to
            return;
        }

        // Handle regular responses
        const id = data.id;
        if (!id || !pendingRequests.has(id)) return;

        const { resolve, reject, timeoutId } = pendingRequests.get(id);
        pendingRequests.delete(id);
        clearTimeout(timeoutId);

        if (data.error) {
            reject(new Error(data.error.message || 'Unknown error'));
        } else {
            resolve(data.result);
        }
    });

    // Main NIP-07 provider implementation
    const nostr = {
        /**
         * Get user's public key
         * @returns {Promise<string>} Public key in hex format
         */
        getPublicKey: async function () {
            return sendMessage('getPublicKey');
        },

        /**
         * Sign an event with user's private key
         * @param {Object} event - Unsigned event object
         * @returns {Promise<Object>} Signed event object
         */
        signEvent: async function (event) {
            if (!event || typeof event !== 'object') {
                throw new Error('Invalid event');
            }

            // Validate required event fields
            if (typeof event.kind !== 'number' ||
                !Array.isArray(event.tags) ||
                typeof event.content !== 'string') {
                throw new Error('Invalid event: missing required fields');
            }

            return sendMessage('signEvent', event);
        },

        /**
         * Get relays configured by user
         * @returns {Promise<Object>} Object with relay URLs as keys and policies as values
         */
        getRelays: async function () {
            return sendMessage('getRelays');
        },

        /**
         * NIP-04 encryption methods
         */
        nip04: {
            /**
             * Encrypt a message for a recipient
             * @param {string} pubkey - Recipient's public key
             * @param {string} plaintext - Plain text message
             * @returns {Promise<string>} Encrypted message
             */
            encrypt: async function (pubkey, plaintext) {
                if (!pubkey || typeof pubkey !== 'string') {
                    throw new Error('Invalid pubkey');
                }

                if (typeof plaintext !== 'string') {
                    throw new Error('Invalid plaintext');
                }

                return sendMessage('nip04.encrypt', { pubkey, plaintext });
            },

            /**
             * Decrypt a message from a sender
             * @param {string} pubkey - Sender's public key
             * @param {string} ciphertext - Encrypted message
             * @returns {Promise<string>} Decrypted message
             */
            decrypt: async function (pubkey, ciphertext) {
                if (!pubkey || typeof pubkey !== 'string') {
                    throw new Error('Invalid pubkey');
                }

                if (typeof ciphertext !== 'string') {
                    throw new Error('Invalid ciphertext');
                }

                return sendMessage('nip04.decrypt', { pubkey, ciphertext });
            }
        }
    };

    // Expose the provider to the window
    window.nostr = nostr;

    console.log('[NextBlock] NIP-07 provider initialized');
})(); 