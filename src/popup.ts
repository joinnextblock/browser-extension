// popup.ts - UI for the extension popup

// Import needed modules from nostr-tools
import { nip19, SimplePool, type Event, type Filter } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

// Elements
const publicKeyElement = document.getElementById('public-key') as HTMLDivElement;
const copyButton = document.getElementById('copy-pubkey') as HTMLButtonElement;

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

// The nextblock relay endpoint
const NEXTBLOCK_RELAY = 'ws://localhost:8080';

// Function to check if keys exist in local storage
const checkKeysExist = async (): Promise<boolean> => {
  try {
    // Direct check in local storage first
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (!result[STORAGE_KEY]) {
      console.error("No keys found in storage");
      return false;
    }

    // Double check with the background script
    const response = await chrome.runtime.sendMessage({ type: 'nostr_getPublicKey' });
    if (response.error) {
      console.error(`Error from getPublicKey: ${response.error}`);
      return false;
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error checking keys: ${error.message}`);
    }
    return false;
  }
};

// Function to request background script to connect to NextBlock relay
const connectToNextBlockRelay = async (): Promise<void> => {
  try {
    console.log(`Requesting background script to connect to relay: ${NEXTBLOCK_RELAY} at ${new Date().toISOString()}`);

    const response = await chrome.runtime.sendMessage({
      type: 'nostr_connectToRelay',
      relay: NEXTBLOCK_RELAY
    });

    if (response.error) {
      console.error(`Error from background script: ${response.error}`);
    } else {
      console.log(`Background script reports: ${response.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error requesting relay connection: ${error.message}`);
    }
  }
};

// Function to create a new account 
const createAccount = async (): Promise<void> => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'nostr_createKeys' });

    if (response.error) {
      throw new Error(response.error);
    }

    console.log('Account created successfully!');
    // Switch to main UI
    accountContainer.style.display = 'none';
    mainContainer.style.display = 'block';

    // Refresh the UI
    await initPopup();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error creating account: ${error.message}`);
    }
  }
};

// Function to import a private key
const importPrivateKey = async (privateKey: string): Promise<void> => {
  try {
    let privateKeyHex: string;

    // Check if it's an nsec format (starts with nsec1)
    if (privateKey.startsWith('nsec1')) {
      try {
        // Decode the nsec format to get the hex
        const decoded = nip19.decode(privateKey);
        if (decoded.type !== 'nsec') {
          throw new Error('Invalid nsec format.');
        }
        privateKeyHex = bytesToHex(decoded.data);
      } catch (error) {
        throw new Error('Failed to decode nsec format. Please check your private key.');
      }
    } else {
      // Assume it's a hex format
      privateKeyHex = privateKey;
      // Basic validation for hex format
      if (!privateKeyHex || !/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
        throw new Error('Invalid private key format. Must be 64 hex characters or nsec format.');
      }
    }

    // Store the private key as hex
    await chrome.storage.local.set({ [STORAGE_KEY]: privateKeyHex });

    console.log('Account imported successfully!');
    // Switch to main UI
    accountContainer.style.display = 'none';
    mainContainer.style.display = 'block';
    loginForm.style.display = 'none';

    // Refresh the UI
    await initPopup();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error importing account: ${error.message}`);
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
      console.error(`Error getting public key: ${error.message}`);
    }
    return '';
  }
};

// Function to get the user's relays - kept for compatibility with background script
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
      console.error(`Error getting relays: ${error.message}`);
    }
    return {};
  }
};

// Initialize the popup
const initPopup = async (): Promise<void> => {
  try {
    // Check if keys exist and display appropriate UI
    const keysExist = await checkKeysExist();

    console.log(`Keys exist: ${keysExist}`);

    if (!keysExist) {
      // Show account creation UI
      accountContainer.style.display = 'flex';
      mainContainer.style.display = 'none';
      return;
    } else {
      // Show main UI
      accountContainer.style.display = 'none';
      mainContainer.style.display = 'block';

      // Connect to NextBlock relay when keys are detected
      await connectToNextBlockRelay();
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
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in initPopup: ${error.message}`);
    }
    // If there's an error, default to showing the account container
    accountContainer.style.display = 'flex';
    mainContainer.style.display = 'none';
  }
};

// Set up event listeners
const setupEventListeners = (): void => {
  // Create account button
  createAccountButton.addEventListener('click', async () => {
    await createAccount();
    // Connect to NextBlock relay after account creation
    if (await checkKeysExist()) {
      await connectToNextBlockRelay();
    }
  });

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

    // Connect to NextBlock relay after login
    if (await checkKeysExist()) {
      await connectToNextBlockRelay();
    }
  });

  // Set up copy button
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(publicKeyElement.textContent || '')
      .then(() => {
        console.log('Public key copied to clipboard!');
      })
      .catch(err => {
        console.error(`Failed to copy: ${err}`);
      });
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
