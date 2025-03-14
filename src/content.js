/**
 * Content script for the NextBlock Billboard extension
 * Injects the NIP-07 provider into web pages
 */

// Function to inject the NIP-07 provider script
function injectNostrProvider() {
    try {
        // Create script element to inject the provider
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('dist/nostr.js');
        script.type = 'text/javascript';
        script.onload = function () {
            this.remove(); // Remove the script element after loading
        };

        // Insert script into the page
        (document.head || document.documentElement).appendChild(script);
        console.log('[NextBlock] NIP-07 provider injected');
    } catch (error) {
        console.error('[NextBlock] Failed to inject NIP-07 provider:', error);
    }
}

// Setup message handlers for communication with the injected provider
function setupMessageHandlers() {
    // Listen for messages from the web page
    window.addEventListener('message', async (event) => {
        // Only accept messages from the same window
        if (event.source !== window) return;

        // Filter for NIP-07 provider messages
        if (!event.data || !event.data.target || event.data.target !== 'nextblock-nostr-provider') return;

        try {
            console.log('[NextBlock] Received message from page:', event.data);
            const { type, payload, id } = event.data;

            // Forward the request to the background script
            const response = await chrome.runtime.sendMessage({
                type: 'NIP07_REQUEST',
                method: type,
                payload,
                origin: event.origin,
                id
            });

            // Send the response back to the web page
            window.postMessage({
                target: 'nextblock-nostr-page',
                id,
                result: response.result,
                error: response.error
            }, '*');

        } catch (error) {
            console.error('[NextBlock] Error processing NIP-07 request:', error);

            // Send error response back to the web page
            if (event.data.id) {
                window.postMessage({
                    target: 'nextblock-nostr-page',
                    id: event.data.id,
                    error: {
                        code: -1,
                        message: error.message || 'Unknown error'
                    }
                }, '*');
            }
        }
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.target === 'content-script' && message.type === 'NIP07_BROADCAST') {
            // Forward broadcasts from the background script to the web page
            window.postMessage({
                target: 'nextblock-nostr-page',
                type: 'broadcast',
                payload: message.payload
            }, '*');
        }
        return false; // Don't keep the channel open
    });
}

// Initialize the content script
function initialize() {
    console.log('[NextBlock] Content script loaded');
    injectNostrProvider();
    setupMessageHandlers();
}

// Run initialization
initialize(); 