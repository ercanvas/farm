const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = 3000;

// Store connected users
const users = new Map();

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    let username = null;

    // Handle messages from client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'setUsername':
                    if (!data.username || data.username.trim() === '') {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Username cannot be empty'
                        }));
                        return;
                    }
                    
                    // Check if username is already taken
                    if (users.has(data.username)) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Username already taken'
                        }));
                        return;
                    }
                    
                    username = data.username.trim();
                    users.set(username, {
                        ws,
                        money: 5, // Starting money
                        lastTransfer: 0
                    });
                    
                    // Notify user
                    ws.send(JSON.stringify({
                        type: 'userData',
                        username,
                        money: users.get(username).money
                    }));
                    
                    // Notify all users of new connection
                    broadcastUserList();
                    break;
                    
                case 'sendMoney':
                    if (!username) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'You must set a username first'
                        }));
                        return;
                    }
                    
                    const sender = users.get(username);
                    const recipient = users.get(data.recipient);
                    
                    // Validate transfer
                    if (!recipient) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Recipient not found'
                        }));
                        return;
                    }
                    
                    if (username === data.recipient) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Cannot send money to yourself'
                        }));
                        return;
                    }
                    
                    const amount = parseFloat(data.amount);
                    if (isNaN(amount) || amount <= 0) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid amount'
                        }));
                        return;
                    }
                    
                    if (sender.money < amount) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Insufficient funds'
                        }));
                        return;
                    }
                    
                    // Perform transfer
                    sender.money -= amount;
                    recipient.money += amount;
                    sender.lastTransfer = Date.now();
                    
                    // Update both users
                    ws.send(JSON.stringify({
                        type: 'userData',
                        username,
                        money: sender.money
                    }));
                    
                    recipient.ws.send(JSON.stringify({
                        type: 'userData',
                        username: data.recipient,
                        money: recipient.money
                    }));
                    
                    // Notify both users
                    ws.send(JSON.stringify({
                        type: 'notification',
                        message: `You sent $${amount} to ${data.recipient}`
                    }));
                    
                    recipient.ws.send(JSON.stringify({
                        type: 'notification',
                        message: `You received $${amount} from ${username}`
                    }));
                    
                    // Update user list for everyone
                    broadcastUserList();
                    break;
                    
                case 'getUserList':
                    if (!username) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'You must set a username first'
                        }));
                        return;
                    }
                    broadcastUserList();
                    break;
            }
        } catch (err) {
            console.error('Error processing message:', err);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        if (username) {
            users.delete(username);
            broadcastUserList();
        }
    });
    
    // Handle errors
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        if (username) {
            users.delete(username);
            broadcastUserList();
        }
    });
});

// Broadcast current user list to all connected clients
function broadcastUserList() {
    const userList = Array.from(users.entries()).map(([name, data]) => ({
        username: name,
        money: data.money
    }));
    
    const message = JSON.stringify({
        type: 'userList',
        users: userList
    });
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`WebSocket server is running on ws://localhost:${port}`);
});