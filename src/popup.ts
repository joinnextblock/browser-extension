// popup.ts - UI for the extension popup

// Elements
const publicKeyElement = document.getElementById('public-key') as HTMLDivElement;
const copyButton = document.getElementById('copy-pubkey') as HTMLButtonElement;
const relaysList = document.getElementById('relays-list') as HTMLUListElement;
const addRelayButton = document.getElementById('add-relay') as HTMLButtonElement;
const addRelayForm = document.getElementById('add-relay-form') as HTMLFormElement;
const relayInput = document.getElementById('relay-url') as HTMLInputElement;
const statusElement = document.getElementById('status') as HTMLDivElement;

// Storage keys
const STORAGE_KEY = 'nostr_keys';
const RELAYS_KEY = 'nostr_relays';

// Handler to show status messages
const showStatus = (message: string, isError = false) => {
    statusElement.textContent = message;
    statusElement.className = isError ? 'error' : 'success';
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = '';
    }, 3000);
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

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup);
