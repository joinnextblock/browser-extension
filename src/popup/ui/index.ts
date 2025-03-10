import { DOMElements } from "..";
import { GetListNostrAccountResponse, NostrAccountRecord } from "../api";

export const ui = {
  showElement(element: HTMLElement | null) {
    if (element) element.style.display = 'block';
  },

  hideElement(element: HTMLElement | null) {
    if (element) element.style.display = 'none';
  },

  hideAllScreens(elements: DOMElements) {
    this.hideElement(elements.login_button);
    this.hideElement(elements.loginForm);
    this.hideElement(elements.confirmationForm);
    this.hideElement(elements.loadingScreen);
    this.hideElement(elements.accountsList);
    this.hideElement(elements.errorScreen);
  },

  createAccountElement(nostr_account: NostrAccountRecord): HTMLDivElement {
    const element = document.createElement('div');
    element.className = 'account-item';
    element.innerHTML = `
      <div class="account-name">${nostr_account.nostr_account_id || '{nostr_account_id}'}</div>
    `;
    return element;
  },

  renderAccounts(elements: DOMElements, list_nostr_account_response: GetListNostrAccountResponse) {
    this.hideAllScreens(elements);
    if (!elements.accountsList) return;

    elements.accountsList.innerHTML = '';
    if (elements.refreshButton) {
      elements.accountsList.appendChild(elements.refreshButton);
    }
    const { data: list_nostr_account } = list_nostr_account_response;

    list_nostr_account.forEach(account => {
      if (elements.accountsList) {
        elements.accountsList.appendChild(this.createAccountElement(account));
      }
    });

    this.showElement(elements.accountsList);
  },

  showError(elements: DOMElements, message: string) {
    this.hideAllScreens(elements);
    if (elements.errorScreen && elements.errorMessage) {
      elements.errorMessage.textContent = message;
      elements.errorScreen.style.display = 'block';
    }
  }
};