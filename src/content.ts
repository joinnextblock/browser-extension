// content.ts - Injects the window.nostr object into web pages

// Create a script element to inject the nostr provider
const script = document.createElement('script');
script.src = chrome.runtime.getURL('nostr.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

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