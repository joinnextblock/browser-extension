import { SimplePool } from 'nostr-tools';
import { api } from './popup/api';
import { datastore } from './popup/datastore';

// const RELAY = 'wss://t-relay.nextblock.app';

(async () => {
  console.log(process.env);
  try {
    // const result = await chrome.storage.local.get('sk');
    // sk = result.sk;

    // if (!sk) {
    //   sk = generateSecretKey() // `sk` is a Uint8Array
    //   await chrome.storage.local.set({ sk});
    // }

    // let pk = getPublicKey(sk) // `pk` is a hex string

    // const web_socket = new WebSocket(RELAY);

    // web_socket.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   const [ACTION] = data;
    //   switch (ACTION) {
    //     case 'AUTH': {
    //       const [_, challenge] = data;
    //       const event = nip42.makeAuthEvent(RELAY, challenge);
    //       // const finalized_event = finalizeEvent(event, hexToUint8Array('684483f418b14dc722151f17c18b11e4419df8008b562dc649907752719bc0fc'));
    //       console.log({ event });

    //       // web_socket.send(JSON.stringify([ACTION, finalized_event]));
    //       break;
    //     }
    //     default: {
    //       break;
    //     }
    //   }
    // }

    // web_socket.onopen = () => {
    //   console.log('connected to relay')
    // }
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
// This will show up in the Service Worker console
chrome.runtime.onInstalled.addListener(chrome_runtime_on_installed_handler);

// Listen for changes in storage
chrome.storage.onChanged.addListener(chrome_storage_on_changed_handler);