import { ui } from './ui';
import { handlers } from './handlers';
import { api } from './api';
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

// Validation
const validation = {
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// Initialize
async function initializePopup(elements: DOMElements) {
  try {
    // ui.hideAllScreens(elements);

    const { list_nostr_account_response, post_login_confirmation_response } = await chrome.storage.local.get(['post_loging_confirmation_response', 'list_nostr_account_response']);

    console.log('list_nostr_account_response', list_nostr_account_response);
    console.log('post_login_confirmation_response', post_login_confirmation_response);

    initializeEventListeners(elements);

    // if (post_login_confirmation_response) {
    //   ui.showElement(elements.loadingScreen);
    //   console.log('post_login_confirmation_response', post_login_confirmation_response);
    //   if (list_nostr_account_response) {
    //     ui.renderAccounts(elements, list_nostr_account_response);
    //   } else {
    //     const { data: { access_token } } = post_login_confirmation_response;
    //     const list_nostr_account_response = await api.get_list_nostr_account({ access_token }, { endpoint: 'https://t-api.nextblock.app/nostr-account' });
    //     await datastore.set_list_nostr_account_response({ list_nostr_account_response });
    //     ui.renderAccounts(elements, list_nostr_account_response);
    //   }
    //   ui.hideElement(elements.loadingScreen);
    // }

    // // if (post_login_confirmation_response && list_nostr_account_response) {
    // //   ui.renderAccounts(elements, post_login_confirmation_response);
    // // } else {
    // //   ui.showElement(elements.loginButton);
    // // }



    // // Storage change listener
    // chrome.storage.onChanged.addListener((changes, namespace) => {
    //   if (namespace === 'local' && changes.nostrAccounts?.newValue?.data) {
    //     ui.renderAccounts(elements, changes.nostrAccounts.newValue.data);
    //   }
    // });

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
}); 