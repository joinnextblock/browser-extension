import pino, { Logger } from 'pino';
import { nip42, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
const logger = pino({
  name: 'browser-extension',
  level: 'info'
});

const RELAY = 'wss://t-relay.nextblock.app';

// Add this helper function
function hexToUint8Array(hexString: string): Uint8Array {
  hexString = hexString.replace('0x', '');
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.slice(i, i + 2), 16);
  }
  return bytes;
}

(async () => {
  // let sk: Uint8Array<ArrayBufferLike>;

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
    logger.error({ err })
  }
  finally {
    console.log('Extension installed');
    console.log('Extension installed');
  }
})()

// This will show up in the Service Worker console
chrome.runtime.onInstalled.addListener(() => {
  console.log('Background script initialized');
});

// Listen for changes in storage
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.confirmationData) {
    console.log('changes.confirmationData', changes.confirmationData)
    try {
      const response = await fetch('https://t-api.nextblock.app/nostr-account', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Include any necessary auth headers from confirmationData
          'x-nextblock-authorization': changes.confirmationData.newValue.access_token // adjust according to your token structure
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
});