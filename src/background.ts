import { SimplePool } from 'nostr-tools';
import { api } from './popup/api';
import { datastore } from './popup/datastore';

// const RELAY = 'wss://t-relay.nextblock.app';

(async () => {

  try {

  }
  catch (err) {
    console.error({ err })
  }
  finally {
    console.log('Extension installed');
  }
})()

const chrome_runtime_on_installed_handler = () => {
  console.log('Background script initialized');
}

const chrome_storage_on_changed_handler = async (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
  console.log('changes', changes)
  switch (namespace) {
    case 'local': {
      // Handle changes to confirmationData
      if (changes.post_login_confirmation_response) {
        await chrome.storage.local.remove('list_nostr_account_response');
        if (changes.post_login_confirmation_response?.newValue.data.access_token) {
          try {
            const { data: { access_token } } = changes.post_login_confirmation_response.newValue;

            const list_nostr_account_response = await api.get_list_nostr_account({ access_token }, { endpoint: 'https://t-api.nextblock.app/nostr-account' });

            console.log('Nostr accounts response:', list_nostr_account_response);

            await datastore.set_list_nostr_account_response({ list_nostr_account_response });
          } catch (error) {
            console.error('Error fetching nostr accounts:', error);
          } finally {
            console.log('handled changes', changes);
          }
        }
      }
      // Handler changes to nostrAccounts
      if (changes.list_nostr_account_response?.newValue?.data) {
        const authors = changes.list_nostr_account_response.newValue.data.map(({ nostr_account_id }: { nostr_account_id: string }) => nostr_account_id);
        console.log('authors', { authors });
        // TODO: query nextblock relay for nostr event kind 0 and 100002
        const pool = new SimplePool()

        const relays = ['wss://t-relay.nextblock.app']

        const subscription = pool.subscribeMany(
          [...relays],
          [
            {
              authors
            },
            {
              kinds: [0, 100002]
            }
          ],
          {
            onevent(event) {
              console.log('event', event)
            },
            oneose() {
              subscription.close()
              console.log('subscription closed')
            }
          }
        )
      }
      break;
    }
    default: {
      console.log('unexpected namespace', namespace);
      break;
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleMessage = async () => {
    try {
      switch (message.type) {
        case 'POST_LOGIN': {
          await datastore.set_nextblock_account_email({ nextblock_account_email: message.email });
          const post_login_response = await api.post_login({ email: message.email }, { endpoint: 'https://t-api.nextblock.app/login' });

          await chrome.storage.local.set({ post_login_response });
          sendResponse({ success: true, data: post_login_response });
          break;
        }
        case 'POST_LOGIN_CONFIRMATION': {
          const { nextblock_account_email } = await datastore.get_nextblock_account_email();
          const { post_login_response } = await datastore.get_post_login_response();
          const post_login_confirmation_response = await api.post_login_confirmation({ code: message.code, email: nextblock_account_email, session: post_login_response.data.session }, { endpoint: 'https://t-api.nextblock.app/login-confirmation' });

          await chrome.storage.local.set({ post_login_confirmation_response });
          sendResponse({ success: true, data: post_login_confirmation_response });
          break;
        }
        case 'GET_LIST_NOSTR_ACCOUNT': {
          const { post_login_confirmation_response } = await datastore.get_post_login_confirmation_response();
          const list_nostr_account_response = await api.get_list_nostr_account({ access_token: post_login_confirmation_response.data.access_token }, { endpoint: 'https://t-api.nextblock.app/nostr-account' });
          await datastore.set_list_nostr_account_response({ list_nostr_account_response });
          sendResponse({ success: true, data: list_nostr_account_response });
          break;
        }
      }
    } catch (error) {
      console.error('API error:', error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  };

  handleMessage();
  return true; // Keep the message channel open for async response
});

// This will show up in the Service Worker console
chrome.runtime.onInstalled.addListener(chrome_runtime_on_installed_handler);

// Listen for changes in storage
chrome.storage.onChanged.addListener(chrome_storage_on_changed_handler);