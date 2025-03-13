// content.ts - Injects the window.nostr object into web pages

// Inject the script element - safer method that complies with CSP
const injectScript = () => {
    try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('dist/nostr.js');
        script.onload = () => {
            console.log('Nostr script loaded successfully');
            // Don't remove the script immediately to ensure it executes fully
            setTimeout(() => script.remove(), 1000);
        };
        script.onerror = (error) => {
            console.error('Error loading Nostr script:', error);
        };
        (document.head || document.documentElement).appendChild(script);
        console.log('Nostr script injection attempted');
    } catch (error) {
        console.error('Failed to inject Nostr script:', error);
    }
};

// Inject the script as soon as possible
if (document.documentElement) {
    injectScript();
} else {
    // If document isn't ready yet, wait for it
    document.addEventListener('DOMContentLoaded', injectScript);
}

// Listen for messages from the injected script and forward them to the background script
window.addEventListener('message', async (event) => {
    if (event.source !== window || !event.data.type || !event.data.type.startsWith('nostr_')) {
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage(event.data);
        window.postMessage(
            {
                type: `${event.data.type}_response`,
                id: event.data.id,
                data: response.data,
                error: response.error
            },
            '*'
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        window.postMessage(
            {
                type: `${event.data.type}_response`,
                id: event.data.id,
                error: errorMessage
            },
            '*'
        );
    }
}); 