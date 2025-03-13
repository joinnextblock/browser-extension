// content.ts - Injects the window.nostr object into web pages

// Method 1: Inject the script element
const injectScript = () => {
    try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('dist/nostr.js');
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
        console.log('Nostr script injected successfully');
    } catch (error) {
        console.error('Failed to inject Nostr script:', error);
    }
};

// Method 2: Alternative approach - inject the script content directly
const injectScriptContent = async () => {
    try {
        // Fetch the script content
        const response = await fetch(chrome.runtime.getURL('dist/nostr.js'));
        const scriptContent = await response.text();

        // Create a script element with the content
        const script = document.createElement('script');
        script.textContent = scriptContent;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
        console.log('Nostr script content injected successfully');
    } catch (error) {
        console.error('Failed to inject Nostr script content:', error);
    }
};

// Try both methods to ensure at least one works
injectScript();
// If the first method fails, try the second one after a short delay
setTimeout(injectScriptContent, 500);

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