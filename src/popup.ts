const DOM_CONTENT_LOADED = 'DOMContentLoaded';
// Types and Interfaces
interface DOMElements {
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
}

interface NostrAccount {
  nextblock_account_id: string;
  nostr_account_id: string;
}

interface StorageData {
  confirmationData: {
    access_token: string;
  };
  nostrAccounts: NostrAccount[];
}

// API Functions
const api = {
  async login(email: string): Promise<Response> {
    return fetch('https://t-api.nextblock.app/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  async confirmLogin(code: string, loginData: any): Promise<Response> {
    return fetch('https://t-api.nextblock.app/login-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, ...loginData })
    });
  },

  async fetchAccounts(access_token: string): Promise<Response> {
    return fetch('https://t-api.nextblock.app/nostr-account', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-nextblock-authorization': access_token
      }
    });
  }
};

// UI Helpers
const ui = {
  showElement(element: HTMLElement | null) {
    if (element) element.style.display = 'block';
  },

  hideElement(element: HTMLElement | null) {
    if (element) element.style.display = 'none';
  },

  hideAllScreens(elements: DOMElements) {
    this.hideElement(elements.loginButton);
    this.hideElement(elements.loginForm);
    this.hideElement(elements.confirmationForm);
    this.hideElement(elements.loadingScreen);
    this.hideElement(elements.accountsList);
  },

  createAccountElement(account: NostrAccount): HTMLDivElement {
    const element = document.createElement('div');
    element.className = 'account-item';
    element.innerHTML = `
      <div class="account-name">${account.nextblock_account_id || 'Account'}</div>
      <div class="account-details">${account.nostr_account_id || ''}</div>
    `;
    return element;
  },

  renderAccounts(elements: DOMElements, accounts: NostrAccount[]) {
    this.hideAllScreens(elements);
    if (!elements.accountsList) return;

    elements.accountsList.innerHTML = '';
    if (elements.refreshButton) {
      elements.accountsList.appendChild(elements.refreshButton);
    }
    accounts.forEach(account => {
      if (elements.accountsList) {
        elements.accountsList.appendChild(this.createAccountElement(account));
      }
    });

    this.showElement(elements.accountsList);
  }
};

// Validation
const validation = {
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// Event Handlers
const handlers = {
  async handleLogin(elements: DOMElements, email: string) {
    try {
      const response = await api.login(email);
      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      await chrome.storage.local.set({ loginData: data });

      ui.hideAllScreens(elements);
      ui.showElement(elements.confirmationForm);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      console.log('login handled')
    }
  },

  async handleConfirmation(elements: DOMElements, code: string) {
    try {
      const { loginData } = await chrome.storage.local.get(['loginData']);
      const response = await api.confirmLogin(code, loginData);
      if (!response.ok) throw new Error('Confirmation failed');

      const data = await response.json();
      await chrome.storage.local.set({ confirmationData: data });

      ui.hideAllScreens(elements);
      ui.showElement(elements.loadingScreen);
    } catch (error) {
      console.error('Confirmation error:', error);
    }
  },

  async handleRefresh(elements: DOMElements) {
    try {
      const { confirmationData } = await chrome.storage.local.get(['confirmationData']);
      const response = await api.fetchAccounts(confirmationData.access_token);
      if (!response.ok) throw new Error('Failed to fetch accounts');

      const data = await response.json();
      await chrome.storage.local.set({ nostrAccounts: data });
    } catch (error) {
      console.error('Refresh error:', error);
    }
  }
};

// Initialize
async function initializePopup(elements: DOMElements) {
  try {
    const storage = await chrome.storage.local.get(['confirmationData', 'nostrAccounts']);

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
        handlers.handleLogin(elements, email);
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
    emailInput: document.getElementById('email') as HTMLInputElement,
    confirmButton: document.getElementById('confirm') as HTMLButtonElement,
    confirmationInput: document.getElementById('confirmation-code') as HTMLInputElement,
    loadingScreen: document.getElementById('loading-screen'),
    accountsList: document.getElementById('accounts-list'),
    refreshButton: document.getElementById('refresh')
  };

  initializePopup(elements);
}); 