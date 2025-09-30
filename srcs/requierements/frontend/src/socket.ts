// src/socket.ts
console.log('🔌 Loading socket.ts...');

// Use native WebSocket instead of Socket.IO
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export function initSocket() {
    console.log('🔌 Initializing WebSocket connection...');
    connectWebSocket();
}

function connectWebSocket() {
    console.log(`🔌 Attempting to connect to WebSocket (attempt ${reconnectAttempts + 1})...`);
    try {
        socket = new WebSocket('ws://localhost:3001/ws');

        socket.onopen = (event) => {
            console.log('✅ WebSocket connected successfully');
            reconnectAttempts = 0;
        };

        socket.onmessage = (event) => {
            console.log('📨 WebSocket message received:', event.data);
            try {
                const data = JSON.parse(event.data);
                handleMessage(data);
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        };

        socket.onclose = (event) => {
            console.log(`❌ WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
            attemptReconnect();
        };

        socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            attemptReconnect();
        };

    } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        attemptReconnect();
    }
}

function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
        setTimeout(() => {
            connectWebSocket();
        }, 2000 * reconnectAttempts); // Exponential backoff
    } else {
        console.error('Max reconnection attempts reached');
    }
}

function handleMessage(data: any) {
    console.log('📨 Handling message:', data);

    switch (data.type) {
        case 'welcome':
            console.log('👋 Welcome message received:', data.message);
            // Register with a username (you might want to get this from user auth)
            registerUser('Anonymous' + Math.floor(Math.random() * 1000));
            break;

        case 'message':
            console.log('💬 Chat message received:', data);
            displayMessage({
                username: data.from,
                content: data.text,
                timestamp: data.timestamp
            });
            break;

        case 'user_list':
            console.log('👥 User list received:', data.users);
            updateUserList(data.users);
            break;

        case 'ack':
            console.log('✅ Message acknowledged:', data);
            break;

        default:
            console.log('❓ Unknown message type:', data.type);
    }
}

function registerUser(username: string) {
    console.log(`👤 Registering user: ${username}`);
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'register',
            username: username
        }));
        console.log('✅ Registration message sent');
    } else {
        console.log('❌ Cannot register: WebSocket not connected');
    }
}

function displayMessage(data: any) {
    console.log('📝 Displaying message:', data);
    const messagesDiv = document.getElementById('chat_messages');
    if (messagesDiv) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-2';
        const timestamp = new Date(data.timestamp).toLocaleTimeString();
        messageDiv.innerHTML = `<strong>${data.username}:</strong> ${data.content} <small class="text-muted">(${timestamp})</small>`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        console.log('✅ Message displayed in chat');
    } else {
        console.log('❌ Chat messages container not found');
    }
}

function updateUserList(users: string[]) {
    console.log('👥 Updating user list:', users);
    const userListDiv = document.getElementById('user-list');
    if (userListDiv) {
        userListDiv.innerHTML = '';
        users.forEach(user => {
            if (user && user !== 'undefined') { // Filter out invalid entries
                const userDiv = document.createElement('div');
                userDiv.className = 'bg-gray-600 px-3 py-2 rounded cursor-pointer hover:bg-gray-500';
                userDiv.textContent = user;
                userDiv.addEventListener('click', () => {
                    console.log(`👆 Starting DM with: ${user}`);
                    startDM(user);
                });
                userListDiv.appendChild(userDiv);
            }
        });
        console.log('✅ User list updated');
    } else {
        console.log('❌ User list container not found');
    }
}

function startDM(targetUser: string) {
    console.log(`💬 Starting DM with: ${targetUser}`);
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'message',
            to: targetUser,
            text: 'Hello! Let\'s chat privately.'
        }));
        console.log('✅ DM message sent');
    } else {
        console.log('❌ Cannot send DM: WebSocket not connected');
    }
}

export function sendMessage(message: string, toUser?: string) {
    console.log(`📤 Sending message: "${message}" ${toUser ? `to ${toUser}` : '(general)'}`);
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'message',
            to: toUser || '',
            text: message
        }));
        console.log('✅ Message sent via WebSocket');
    } else {
        console.error('❌ Cannot send message: WebSocket not connected');
    }
}

export function joinGeneral() {
    // Since we're always connected to general chat, this is a no-op
    console.log('Already in general chat');
}
