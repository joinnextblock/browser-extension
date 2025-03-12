// popup.ts - UI for the extension popup

// Elements
const publicKeyElement = document.getElementById('public-key') as HTMLDivElement;
const copyButton = document.getElementById('copy-pubkey') as HTMLButtonElement;
const relaysList = document.getElementById('relays-list') as HTMLUListElement;
const addRelayButton = document.getElementById('add-relay') as HTMLButtonElement;
const addRelayForm = document.getElementById('add-relay-form') as HTMLFormElement;
const relayInput = document.getElementById('relay-url') as HTMLInputElement;
const statusElement = document.getElementById('status') as HTMLDivElement;

// New account elements
const accountContainer = document.getElementById('account-container') as HTMLDivElement;
const mainContainer = document.getElementById('main-container') as HTMLDivElement;
const createAccountButton = document.getElementById('create-account') as HTMLButtonElement;
const showLoginButton = document.getElementById('show-login') as HTMLButtonElement;
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const privateKeyInput = document.getElementById('private-key-input') as HTMLInputElement;

// Storage keys
const STORAGE_KEY = 'nostr_keys';
const RELAYS_KEY = 'nostr_relays';

// Handler to show status messages
const showStatus = (message: string, isError = false) => {
    // Log to console
    if (isError) {
        console.error(message);
    } else {
        console.log(message);
    }

    // Only update UI if statusElement exists
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = isError ? 'error' : 'success';
        statusElement.style.display = 'block';

        // For debug messages we'll keep them visible longer
        const timeout = isError ? 10000 : 3000;
        setTimeout(() => {
            if (statusElement) {
                statusElement.style.display = 'none';
                statusElement.textContent = '';
                statusElement.className = '';
            }
        }, timeout);
    }
};

// Function to check if keys exist in local storage
const checkKeysExist = async (): Promise<boolean> => {
    try {
        // Direct check in local storage first
        const result = await chrome.storage.local.get(STORAGE_KEY);
        if (!result[STORAGE_KEY]) {
            showStatus("No keys found in storage", true);
            return false;
        }

        // Double check with the background script
        const response = await chrome.runtime.sendMessage({ type: 'nostr_getPublicKey' });
        if (response.error) {
            showStatus(`Error from getPublicKey: ${response.error}`, true);
            return false;
        }

        return true;
    } catch (error) {
        if (error instanceof Error) {
            showStatus(`Error checking keys: ${error.message}`, true);
        }
        return false;
    }
};

// Function to create a new account 
const createAccount = async (): Promise<void> => {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'nostr_createKeys' });

        if (response.error) {
            throw new Error(response.error);
        }

        showStatus('Account created successfully!');
        // Switch to main UI
        accountContainer.style.display = 'none';
        mainContainer.style.display = 'block';

        // Refresh the UI
        await initPopup();
    } catch (error) {
        if (error instanceof Error) {
            showStatus(`Error creating account: ${error.message}`, true);
        }
    }
};

// Function to import a private key
const importPrivateKey = async (privateKeyHex: string): Promise<void> => {
    try {
        // Basic validation
        if (!privateKeyHex || !/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
            throw new Error('Invalid private key format. Must be 64 hex characters.');
        }

        // Store the private key (would need to add a new message type in background.ts)
        await chrome.storage.local.set({ [STORAGE_KEY]: privateKeyHex });

        showStatus('Account imported successfully!');
        // Switch to main UI
        accountContainer.style.display = 'none';
        mainContainer.style.display = 'block';
        loginForm.style.display = 'none';

        // Refresh the UI
        await initPopup();
    } catch (error) {
        if (error instanceof Error) {
            showStatus(`Error importing account: ${error.message}`, true);
        }
    }
};

// Function to get the user's public key
const getPublicKey = async (): Promise<string> => {
    try {
        // Get the response from the background script
        const response = await chrome.runtime.sendMessage({ type: 'nostr_getPublicKey' });

        if (response.error) {
            throw new Error(response.error);
        }

        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            showStatus(`Error getting public key: ${error.message}`, true);
        }
        return '';
    }
};

// Function to get the user's relays
const getRelays = async (): Promise<Record<string, { read: boolean; write: boolean }>> => {
    try {
        // Get the response from the background script
        const response = await chrome.runtime.sendMessage({ type: 'nostr_getRelays' });

        if (response.error) {
            throw new Error(response.error);
        }

        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            showStatus(`Error getting relays: ${error.message}`, true);
        }
        return {};
    }
};

// Function to update the relays in storage
const updateRelays = async (relays: Record<string, { read: boolean; write: boolean }>): Promise<void> => {
    await chrome.storage.local.set({ [RELAYS_KEY]: relays });
};

// Function to render the relays list
const renderRelays = async (): Promise<void> => {
    const relays = await getRelays();

    // Clear the current list
    relaysList.innerHTML = '';

    // Add each relay to the list
    Object.entries(relays).forEach(([url, { read, write }]) => {
        const li = document.createElement('li');

        const urlSpan = document.createElement('span');
        urlSpan.textContent = url;
        li.appendChild(urlSpan);

        const permissionsSpan = document.createElement('span');
        permissionsSpan.className = 'permissions';
        permissionsSpan.textContent = `${read ? 'R' : ''}${write ? 'W' : ''}`;
        li.appendChild(permissionsSpan);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
            const updatedRelays = { ...relays };
            delete updatedRelays[url];
            await updateRelays(updatedRelays);
            renderRelays();
            showStatus(`Relay ${url} removed`);
        });
        li.appendChild(deleteButton);

        relaysList.appendChild(li);
    });
};

// Initialize the popup
const initPopup = async (): Promise<void> => {
    try {
        // Check if keys exist and display appropriate UI
        const keysExist = await checkKeysExist();

        showStatus(`Keys exist: ${keysExist}`, false);

        if (!keysExist) {
            // Show account creation UI
            accountContainer.style.display = 'flex';
            mainContainer.style.display = 'none';
            return;
        } else {
            // Show main UI
            accountContainer.style.display = 'none';
            mainContainer.style.display = 'block';
        }

        // Display public key
        const pubkey = await getPublicKey();
        if (pubkey) {
            publicKeyElement.textContent = pubkey;
            copyButton.disabled = false;
        } else {
            publicKeyElement.textContent = 'Error retrieving public key';
            copyButton.disabled = true;
        }

        // Render relays
        await renderRelays();
    } catch (error) {
        if (error instanceof Error) {
            showStatus(`Error in initPopup: ${error.message}`, true);
        }
        // If there's an error, default to showing the account container
        accountContainer.style.display = 'flex';
        mainContainer.style.display = 'none';
    }
};

// Set up event listeners
const setupEventListeners = (): void => {
    // Create account button
    createAccountButton.addEventListener('click', createAccount);

    // Show login form button
    showLoginButton.addEventListener('click', () => {
        // Hide the buttons
        createAccountButton.style.display = 'none';
        showLoginButton.style.display = 'none';

        // Show the login form
        loginForm.style.display = 'flex';
    });

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const privateKey = privateKeyInput.value.trim();
        await importPrivateKey(privateKey);
        // Clear input for security
        privateKeyInput.value = '';
    });

    // Set up copy button
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(publicKeyElement.textContent || '')
            .then(() => {
                showStatus('Public key copied to clipboard!');
            })
            .catch(err => {
                showStatus(`Failed to copy: ${err}`, true);
            });
    });

    // Set up add relay form
    addRelayButton.addEventListener('click', () => {
        addRelayForm.style.display = 'block';
    });

    addRelayForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const relayUrl = relayInput.value.trim();
        if (!relayUrl) {
            showStatus('Please enter a relay URL', true);
            return;
        }

        // Validate URL format (basic validation)
        if (!relayUrl.startsWith('wss://')) {
            showStatus('Relay URL must start with wss://', true);
            return;
        }

        try {
            // Add the new relay
            const relays = await getRelays();
            const updatedRelays = {
                ...relays,
                [relayUrl]: {
                    read: true,
                    write: true
                }
            };

            await updateRelays(updatedRelays);
            renderRelays();

            // Reset form
            relayInput.value = '';
            addRelayForm.style.display = 'none';

            showStatus(`Relay ${relayUrl} added`);
        } catch (error) {
            if (error instanceof Error) {
                showStatus(`Error adding relay: ${error.message}`, true);
            }
        }
    });
};

// Initialize the popup and set up event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Directly show the account container at startup for debugging
    accountContainer.style.display = 'flex';
    mainContainer.style.display = 'none';

    setupEventListeners();
    await initPopup();
});
