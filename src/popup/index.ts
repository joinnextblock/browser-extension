import { ui } from './ui';
import { handlers } from './handlers';
import { api, GetListNostrAccountResponse, NostrAccountRecord, PostLoginResponse } from './api';
import { datastore } from './datastore';

const DOM_CONTENT_LOADED = 'DOMContentLoaded';

// Types and Interfaces
export type DOMElements = {
  login_button: HTMLElement | null;
  loginForm: HTMLElement | null;
  confirmationForm: HTMLElement | null;
  submitButton: HTMLButtonElement | null;
  emailInput: HTMLInputElement | null;
  confirmButton: HTMLButtonElement | null;
  confirmationInput: HTMLInputElement | null;
  loadingScreen: HTMLElement | null;
  accountsList: HTMLElement | null;
  refreshButton: HTMLElement | null;
  errorScreen: HTMLElement | null;
  errorMessage: HTMLElement | null;
  errorRetry: HTMLElement | null;
}

export type StorageChanges = {
  list_nostr_account_response?: {
    newValue?: GetListNostrAccountResponse
    oldValue?: GetListNostrAccountResponse
  };
  post_login_confirmation_response?: {
    newValue?: {
      data: {
        access_token: string;
      }
    };
    oldValue?: {
      data: {
        access_token: string;
      }
    };
  };
  post_login_response?: {
    newValue?: PostLoginResponse;
    oldValue?: PostLoginResponse;
  };
}

const initializeStorageChangeHandler = (elements: DOMElements) => {
  chrome.storage.onChanged.addListener((changes: StorageChanges, namespace) => {
    if (namespace === 'local') {
      console.log('Storage changes:', changes);

      // Handle list_nostr_account_response updates
      if (changes.list_nostr_account_response?.newValue) {
        ui.renderAccounts(elements, changes.list_nostr_account_response.newValue);
      }

      // Handle confirmationData updates
      if (changes.post_login_confirmation_response?.newValue) {
        ui.hideAllScreens(elements);
        ui.showElement(elements.loadingScreen);
      }

      // Handle loginData updates
      if (changes.post_login_response?.newValue) {
        ui.hideAllScreens(elements);
        ui.showElement(elements.confirmationForm);
      }
    }
  });
};

// Validation
const validation = {
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// Initialize
async function initializePopup(elements: DOMElements) {
  try {
    const { list_nostr_account_response } = await datastore.get_list_nostr_account_response();
    const { list_nostr_event_response } = await datastore.get_list_nostr_event_response();
    if (list_nostr_account_response) {
      ui.renderAccounts(elements, list_nostr_account_response);
    } else {
      ui.showElement(elements.login_button);
    }


  } catch (error) {
    console.error('Initialization error:', error);
  } finally {
    console.log('Popup initialized');
  }
}

async function initializeEventListeners(elements: DOMElements) {
  // Event Listeners
  elements.login_button?.addEventListener('click', () => {
    ui.hideElement(elements.login_button);
    ui.showElement(elements.loginForm);
  });

  elements.submitButton?.addEventListener('click', () => {
    const email = elements.emailInput?.value;
    if (email && validation.isValidEmail(email)) {
      handlers.login_click_handler(elements, email);
    } else {
      console.log('Invalid email');
    }
  });

  elements.confirmButton?.addEventListener('click', () => {
    const code = elements.confirmationInput?.value;
    if (code) {
      handlers.confirmation_click_handler(elements, code);
    } else {
      console.log('No code provided');
    }
  });

  elements.refreshButton?.addEventListener('click', () => {
    handlers.refresh_click_handler(elements);
  });
}


// Entry Point
document.addEventListener(DOM_CONTENT_LOADED, () => {
  const elements: DOMElements = {
    login_button: document.getElementById('login'),
    loginForm: document.getElementById('login-form'),
    confirmationForm: document.getElementById('confirmation-form'),
    submitButton: document.getElementById('submit') as HTMLButtonElement,
    errorScreen: document.getElementById('error-screen'),
    errorMessage: document.getElementById('error-message'),
    errorRetry: document.getElementById('error-retry'),
    emailInput: document.getElementById('email') as HTMLInputElement,
    confirmButton: document.getElementById('confirm') as HTMLButtonElement,
    confirmationInput: document.getElementById('confirmation-code') as HTMLInputElement,
    loadingScreen: document.getElementById('loading-screen'),
    accountsList: document.getElementById('accounts-list'),
    refreshButton: document.getElementById('refresh')
  };

  // Add unload listener
  window.addEventListener('unload', handlers.popup_close_handler);

  initializePopup(elements);
  initializeEventListeners(elements);
  initializeStorageChangeHandler(elements);
}); 