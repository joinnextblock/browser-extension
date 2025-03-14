// Track connection status
let nostrConnected = false;

// Initialize Nostr connection management
function initNostr() {
    console.log('Initializing Nostr connection management');

    // Check if we already have a nostrKey in storage
    chrome.storage.local.get(['nostrKey'], (result) => {
        if (result && result.nostrKey) {
            connectToNostrRelay(result.nostrKey);
        }
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Popup received message:', message);

        switch (message.type) {
            case 'NOSTR_CONNECTED':
                console.log('Connected to Nostr relay');
                nostrConnected = true;
                // Update UI here if needed
                break;
            case 'NOSTR_DISCONNECTED':
                console.log('Disconnected from Nostr relay:', message.code, message.reason);
                nostrConnected = false;
                // Update UI here if needed
                break;
            case 'NOSTR_MESSAGE':
                // Process incoming Nostr messages
                console.log('Received message from relay:', message.data);
                // Process message data here
                break;
            case 'NOSTR_ERROR':
                console.error('Nostr relay error:', message.error);
                // Handle error here
                break;
        }
    });

    // Check current connection status
    checkNostrConnection();
}

// Connect to the Nostr relay through the background script
function connectToNostrRelay(key) {
    console.log('Connecting to Nostr relay with key:', key);
    chrome.runtime.sendMessage(
        { type: 'CONNECT_NOSTR', key: key },
        (response) => {
            if (response && response.success) {
                console.log('Connection request sent successfully');
            } else {
                console.error('Failed to send connection request');
            }
        }
    );
}

// Send a message to the relay through the background script
function sendNostrMessage(data) {
    chrome.runtime.sendMessage(
        { type: 'SEND_NOSTR_MESSAGE', data: data },
        (response) => {
            if (response && response.success) {
                console.log('Message sent successfully');
            } else {
                console.error('Failed to send message');
            }
        }
    );
}

// Disconnect from the relay through the background script
function disconnectFromNostrRelay() {
    chrome.runtime.sendMessage(
        { type: 'DISCONNECT_NOSTR' },
        (response) => {
            if (response && response.success) {
                console.log('Disconnection request sent successfully');
                nostrConnected = false;
            } else {
                console.error('Failed to send disconnection request');
            }
        }
    );
}

// Check if we're currently connected to the relay
function checkNostrConnection() {
    chrome.runtime.sendMessage(
        { type: 'CHECK_NOSTR_CONNECTION' },
        (response) => {
            if (response) {
                nostrConnected = response.connected;
                console.log('Nostr connection status:', nostrConnected ? 'Connected' : 'Disconnected');
            }
        }
    );
}

// Set up UI event handlers
function setupUI() {
    // Login button click handler
    const showLoginButton = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const accountContainer = document.getElementById('account-container');
    const mainContainer = document.getElementById('main-container');

    if (showLoginButton) {
        showLoginButton.addEventListener('click', () => {
            // Show the login form
            loginForm.style.display = 'flex';
        });
    }

    // Login form submission handler
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const privateKeyInput = document.getElementById('private-key-input');
            const privateKey = privateKeyInput.value.trim();

            if (privateKey) {
                // Save the private key to chrome.storage.local instead of localStorage
                chrome.storage.local.set({ nostrKey: privateKey }, () => {
                    console.log('Private key saved to chrome.storage.local');

                    // Hide login form and show main container
                    accountContainer.style.display = 'none';
                    mainContainer.style.display = 'block';

                    // Connect to Nostr relay
                    connectToNostrRelay(privateKey);

                    // Display the public key (this is a placeholder - you would derive the public key from the private key)
                    const publicKeyElement = document.getElementById('public-key');
                    if (publicKeyElement) {
                        publicKeyElement.textContent = 'Public key derived from private key';

                        // Enable copy button
                        const copyButton = document.getElementById('copy-pubkey');
                        if (copyButton) {
                            copyButton.disabled = false;
                        }
                    }
                });
            }
        });
    }

    // Check if we already have a nostrKey and update UI accordingly
    chrome.storage.local.get(['nostrKey'], (result) => {
        if (result && result.nostrKey && accountContainer && mainContainer) {
            accountContainer.style.display = 'none';
            mainContainer.style.display = 'block';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Nostr');
    initNostr();
    setupUI();
}); 