import { api } from '../api';
import { datastore } from '../datastore';
import { constants } from '../../constants';
import { ui } from '../ui';
import { DOMElements } from '..';

export const handlers = {
  async login_click_handler(elements: DOMElements, email: string) {
    try {
      await datastore.set_nextblock_account_email({ nextblock_account_email: email });
      const post_login_response = await api.post_login({ email }, { endpoint: `${constants.API.BASE_URL}/login` });

      await datastore.set_post_login_response({ post_login_response });

      ui.hideAllScreens(elements);
      ui.showElement(elements.confirmationForm);
    } catch (error: unknown) {
      console.error('Login error:', error);
      ui.showError(elements, error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      console.log('login handled');
    }
  },

  async confirmation_click_handler(elements: DOMElements, code: string) {
    try {
      const { nextblock_account_email } = await datastore.get_nextblock_account_email();
      const { post_login_response } = await datastore.get_post_login_response();
      const post_login_confirmation_response = await api.post_login_confirmation({ code, email: nextblock_account_email, session: post_login_response.data.session }, { endpoint: 'https://t-api.nextblock.app/login-confirmation' });

      await datastore.set_post_login_confirmation_response({ post_login_confirmation_response });

      ui.hideAllScreens(elements);
      ui.showElement(elements.loadingScreen);
    } catch (error: unknown) {
      console.error('Confirmation error:', error);
      ui.showError(elements, error instanceof Error ? error.message : 'An unknown error occurred');
    }
    finally {
      console.log('confirmation handled');
    }
  },

  async refresh_click_handler(elements: DOMElements) {
    try {
      ui.hideAllScreens(elements);
      ui.showElement(elements.loadingScreen);
      const { confirmationData } = await chrome.storage.local.get(['confirmationData']);
      const list_nostr_account_response = await api.get_list_nostr_account({ access_token: confirmationData.access_token }, { endpoint: 'https://t-api.nextblock.app/nostr-account' });

      await datastore.set_list_nostr_account_response({ list_nostr_account_response });
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      ui.hideElement(elements.loadingScreen);
    }
  },

  // Add this to handle cleanup
  async popup_close_handler() {
    try {
      // Perform any cleanup operations
      await chrome.storage.local.set({
        popup: {
          is_open: false,
        }
      });
      // Other cleanup tasks...
    } catch (error) {
      console.error('Error during popup cleanup:', error);
    } finally {
      console.log('Popup closed');
    }
  }
};