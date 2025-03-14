// WebSocket connection instance
let socket = null;

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    const command = event.data;

    switch (command.type) {
        case 'CONNECT':
            connectToRelay(command.key);
            break;
        case 'DISCONNECT':
            disconnectFromRelay();
            break;
        case 'SEND':
            sendMessage(command.data);
            break;
        default:
            console.error('Unknown command:', command.type);
    }
});

// Establish connection to the Nostr relay
function connectToRelay(nostrKey) {
    if (socket) {
        self.postMessage({ type: 'INFO', message: 'Already connected' });
        return;
    }

    try {
        socket = new WebSocket('wss://t-relay.nextblock.app');

        socket.addEventListener('open', (event) => {
            self.postMessage({ type: 'CONNECTED' });

            // You can perform initial auth here if needed
            // sendMessage({ type: 'AUTH', key: nostrKey });
        });

        socket.addEventListener('message', (event) => {
            self.postMessage({
                type: 'MESSAGE',
                data: JSON.parse(event.data)
            });
        });

        socket.addEventListener('error', (error) => {
            self.postMessage({
                type: 'ERROR',
                message: 'WebSocket error'
            });
        });

        socket.addEventListener('close', (event) => {
            socket = null;
            self.postMessage({
                type: 'DISCONNECTED',
                code: event.code,
                reason: event.reason
            });
        });

    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            message: 'Failed to connect: ' + error.message
        });
    }
}

// Send a message to the relay
function sendMessage(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    } else {
        self.postMessage({
            type: 'ERROR',
            message: 'Cannot send message: not connected'
        });
    }
}

// Close the connection
function disconnectFromRelay() {
    if (socket) {
        socket.close();
        socket = null;
        self.postMessage({ type: 'DISCONNECTED', code: 1000, reason: 'User disconnected' });
    }
} 