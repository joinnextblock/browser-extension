// Type definition for custom message
interface Message {
  type: string;
  payload: object;
}

// Example of content script with TypeScript
function injectContent(): void {
  const element = document.createElement('div');
  element.innerHTML = 'Injected by Chrome Extension';
  document.body.appendChild(element);
}

// Type-safe message sending
chrome.runtime.sendMessage<Message>(
  { type: 'GET_DATA', payload: {} },
  (response: Message) => {
    console.log(response);
  }
);

injectContent(); 