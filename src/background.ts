import { SimplePool } from 'nostr-tools';

const RELAY = 'wss://t-relay.nextblock.app';

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

const chrome_storage_on_changed_handler = async (changes: any, namespace: any) => {
  console.log('changes', changes)
  switch (namespace) {
    case 'local': {
      // Handler changes to confirmationData
      if (changes.confirmationData.newValue) {
        console.log('changes.confirmationData', changes.confirmationData)

        await chrome.storage.local.remove('nostrAccounts');
        if (changes.confirmationData.newValue.access_token) {
          try {
            const { access_token } = changes.confirmationData.newValue;

            const response = await fetch('https://t-api.nextblock.app/nostr-account', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                // Include any necessary auth headers from confirmationData
                'x-nextblock-authorization': access_token // adjust according to your token structure
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Nostr accounts response:', data);

            // Save the nostr accounts data to storage
            await chrome.storage.local.set({ nostrAccounts: data.data });

          } catch (error) {
            console.error('Error fetching nostr accounts:', error);
          }
        }
      }
      // Handler changes to nostrAccounts
      if (changes.nostrAccounts.newValue) {
        const authors = changes.nostrAccounts.newValue.map(({ nostr_account_id }: any) => nostr_account_id);
        console.log('authors', authors);
        // TODO: query nextblock relay for nostr event kind 0 and 100002
        const pool = new SimplePool()

        let relays = ['wss://t-relay.nextblock.app']

        let h = pool.subscribeMany(
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
              h.close()
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