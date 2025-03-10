import { api } from './api';
import { ui } from './ui';
import { handlers } from './handlers';

const DOM_CONTENT_LOADED = 'DOMContentLoaded';
// Types and Interfaces
export type DOMElements = {
  loginButton: HTMLElement | null;
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
    const storage = await chrome.storage.local.get(['confirmationData', 'list_nostr_account']);

    if (storage.confirmationData && storage.nostrAccounts?.data) {
      ui.renderAccounts(elements, storage.nostrAccounts.data);
    } else {
      ui.showElement(elements.loginButton);
    }

    // Event Listeners
    elements.loginButton?.addEventListener('click', () => {
      ui.hideElement(elements.loginButton);
      ui.showElement(elements.loginForm);
    });

    elements.submitButton?.addEventListener('click', () => {
      const email = elements.emailInput?.value;
      if (email && validation.isValidEmail(email)) {
        handlers.login_click_handler(elements, email);
      }
    });

    elements.confirmButton?.addEventListener('click', () => {
      const code = elements.confirmationInput?.value;
      if (code) {
        handlers.handleConfirmation(elements, code);
      }
    });

    elements.refreshButton?.addEventListener('click', () => {
      handlers.handleRefresh(elements);
    });

    // Storage change listener
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.nostrAccounts?.newValue?.data) {
        ui.renderAccounts(elements, changes.nostrAccounts.newValue.data);
      }
    });

  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Entry Point
document.addEventListener(DOM_CONTENT_LOADED, () => {
  const elements: DOMElements = {
    loginButton: document.getElementById('login'),
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

  initializePopup(elements);
}); 