// src/socket.ts
console.log('🔌 Loading socket.ts...');

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentChat: 'general' | { type: 'dm', user: string } = 'general';
let myUsername = '';
let myDisplayName = '';

export function initSocket() {
    console.log('🔌 Initializing Socket.IO connection...');
    const token = sessionStorage.getItem('authToken');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    myUsername = user.username || 'Anonymous';
    myDisplayName = user.display_name || user.username || 'Anonymous';

    socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        socket?.emit('register', { username: myUsername, display_name: myDisplayName });
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
    });

    socket.on('welcome', (data) => {
        console.log('👋 Welcome:', data.message);
    });

    socket.on('message', (data) => {
        console.log('💬 Message received:', data);
        displayMessage(data);
    });

    socket.on('user_list', (data) => {
        console.log('👥 User list:', data.users);
        updateUserList(data.users);
    });

    socket.on('ack', (data) => {
        console.log('✅ Ack:', data);
    });
}

function displayMessage(data: any) {
    console.log('📝 Displaying message:', data);
    const messagesDiv = document.getElementById('chat_messages');
    if (messagesDiv) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';

        const isOwn = data.from === myUsername;
        messageDiv.classList.add(isOwn ? 'own' : 'other');

        const timestamp = new Date(data.timestamp).toLocaleTimeString();
        messageDiv.innerHTML = `<strong>${data.from_display_name || data.from}:</strong> ${data.text} <small>(${timestamp})</small>`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        console.log('✅ Message displayed in chat');
    } else {
        console.log('❌ Chat messages container not found');
    }
}

function updateUserList(users: any[]) {
    console.log('👥 Updating user list:', users);
    const userListDiv = document.getElementById('user-list');
    if (userListDiv) {
        userListDiv.innerHTML = '';
        users.forEach(user => {
            if (user.username !== myUsername) {
                const userDiv = document.createElement('div');
                userDiv.className = 'text-sm py-1 px-2 rounded cursor-pointer hover:bg-gray-600';
                userDiv.textContent = user.display_name || user.username;
                userDiv.addEventListener('click', () => {
                    startDM(user.username, user.display_name || user.username);
                });
                userListDiv.appendChild(userDiv);
            }
        });
        console.log('✅ User list updated');
    } else {
        console.log('❌ User list container not found');
    }
}

function startDM(username: string, displayName: string) {
    console.log(`💬 Starting DM with: ${username}`);
    currentChat = { type: 'dm', user: username };
    updateChatHeader(`DM with ${displayName}`);
    // Clear messages or show DM history (for now, clear)
    const messagesDiv = document.getElementById('chat_messages');
    if (messagesDiv) messagesDiv.innerHTML = '';
    // Show block button
    const blockBtn = document.getElementById('block-btn');
    if (blockBtn) blockBtn.classList.remove('hidden');
    const inviteBtn = document.getElementById('invite-btn');
    if (inviteBtn) inviteBtn.classList.remove('hidden');
    // Add to DM list
    addToDMList(username, displayName);
}

function addToDMList(username: string, displayName: string) {
    const dmList = document.getElementById('dm-list');
    if (dmList) {
        // Check if already exists
        const existing = dmList.querySelector(`[data-user="${username}"]`);
        if (!existing) {
            const dmDiv = document.createElement('div');
            dmDiv.className = 'text-sm py-1 px-2 rounded cursor-pointer hover:bg-gray-600';
            dmDiv.textContent = displayName;
            dmDiv.setAttribute('data-user', username);
            dmDiv.addEventListener('click', () => {
                startDM(username, displayName);
            });
            dmList.appendChild(dmDiv);
        }
    }
}

function updateChatHeader(title: string) {
    const header = document.getElementById('chat-title');
    if (header) header.textContent = title;
}

export function sendMessage(message: string) {
    console.log(`📤 Sending message: "${message}"`);
    if (socket) {
        socket.emit('message', {
            to: currentChat === 'general' ? '' : currentChat.user,
            text: message
        });
        console.log('✅ Message sent via Socket.IO');
    } else {
        console.error('❌ Cannot send message: Socket not connected');
    }
}

export function updateMyProfile(newUser: any) {
    myUsername = newUser.username || myUsername;
    myDisplayName = newUser.display_name || myDisplayName;
    if (socket) {
        socket.emit('register', { username: myUsername, display_name: myDisplayName });
        console.log('✅ Profile updated on socket:', myUsername, myDisplayName);
    }
}

export function joinGeneral() {
    console.log('💬 Joining general chat');
    currentChat = 'general';
    updateChatHeader('General Chat');
    // Clear messages or show general history (for now, clear)
    const messagesDiv = document.getElementById('chat_messages');
    if (messagesDiv) messagesDiv.innerHTML = '';
    // Hide block and invite buttons
    const blockBtn = document.getElementById('block-btn');
    if (blockBtn) blockBtn.classList.add('hidden');
    const inviteBtn = document.getElementById('invite-btn');
    if (inviteBtn) inviteBtn.classList.add('hidden');
}
