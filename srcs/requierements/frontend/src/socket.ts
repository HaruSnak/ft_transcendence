// src/socket.ts
console.log('🔌 Loading socket.ts...');

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentChat: { type: 'dm', user: string } | null = null;
let myUsername = '';
let myDisplayName = '';
let messageHistory: Map<string, any[]> = new Map();
let blockedUsers: Set<string> = new Set();

export function initSocket() {
    console.log('🔌 Initializing Socket.IO connection...');
    const token = sessionStorage.getItem('authToken');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    myUsername = user.username || 'Anonymous';
    myDisplayName = user.display_name || user.username || 'Anonymous';

    // Charger la liste des utilisateurs bloqués
    loadBlockedUsers();

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
    
    // Vérifier si l'expéditeur est bloqué
    if (isUserBlocked(data.from)) {
        console.log(`🚫 Message de ${data.from} ignoré (utilisateur bloqué)`);
        // Ajouter quand même à l'historique pour quand on le débloquera
        addMessageToHistory(data);
        return;
    }
    
    // Si c'est un DM destiné à nous
    if (data.to === myUsername) {
        // Créer le channel si nécessaire
        addToDMList(data.from, data.from_display_name || data.from);
        
        // Marquer comme ayant un nouveau message si on n'est pas dans ce DM
        if (!currentChat || currentChat.user !== data.from) {
            markDMAsUnread(data.from);
        }
        
        // Afficher le message seulement si on est dans ce DM
        if (currentChat && currentChat.user === data.from) {
            showMessageInChat(data);
        }
        
        // Ajouter à l'historique
        addMessageToHistory(data);
    } else if (data.from === myUsername) {
        // C'est notre propre message envoyé, l'afficher si on est dans le bon DM
        if (currentChat && currentChat.user === data.to) {
            showMessageInChat(data);
        }
        
        // Ajouter à l'historique
        addMessageToHistory(data);
    }
}

function showMessageInChat(data: any) {
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

function addMessageToHistory(data: any) {
    const conversationKey = data.from === myUsername ? data.to : data.from;
    if (!messageHistory.has(conversationKey)) {
        messageHistory.set(conversationKey, []);
    }
    messageHistory.get(conversationKey)!.push(data);
}

function markDMAsUnread(username: string) {
    const dmList = document.getElementById('dm-list');
    if (dmList) {
        const dmDiv = dmList.querySelector(`[data-user="${username}"]`) as HTMLElement;
        if (dmDiv) {
            dmDiv.classList.add('font-bold', 'text-primary');
            // Ajouter un indicateur visuel (par exemple un point rouge)
            if (!dmDiv.querySelector('.unread-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'unread-indicator ml-1 w-2 h-2 bg-red-500 rounded-full inline-block';
                dmDiv.appendChild(indicator);
            }
        }
    }
}

function markDMAsRead(username: string) {
    const dmList = document.getElementById('dm-list');
    if (dmList) {
        const dmDiv = dmList.querySelector(`[data-user="${username}"]`) as HTMLElement;
        if (dmDiv) {
            dmDiv.classList.remove('font-bold', 'text-primary');
            const indicator = dmDiv.querySelector('.unread-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
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
    
    // Charger l'historique des messages
    const messagesDiv = document.getElementById('chat_messages');
    if (messagesDiv) {
        messagesDiv.innerHTML = '';
        const history = messageHistory.get(username) || [];
        history.forEach(message => {
            // Ne pas afficher les messages des utilisateurs bloqués
            if (!isUserBlocked(message.from)) {
                showMessageInChat(message);
            }
        });
    }
    
    // Show block button
    const blockBtn = document.getElementById('block-btn');
    if (blockBtn) {
        blockBtn.classList.remove('hidden');
        // Mettre à jour le texte selon l'état de blocage
        if (isUserBlocked(username)) {
            blockBtn.textContent = 'Unblock User';
            blockBtn.className = 'btn btn-danger btn-sm';
        } else {
            blockBtn.textContent = 'Block User';
            blockBtn.className = 'btn btn-ghost btn-sm';
        }
    }
    const inviteBtn = document.getElementById('invite-btn');
    if (inviteBtn) inviteBtn.classList.remove('hidden');
    // Enable chat input
    const chatInput = document.getElementById('chat_input') as HTMLInputElement;
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Type your message...';
    }
    const chatSendBtn = document.getElementById('chat_send_btn') as HTMLButtonElement;
    if (chatSendBtn) {
        chatSendBtn.disabled = false;
    }
    // Add to DM list
    addToDMList(username, displayName);
    // Mark as read
    markDMAsRead(username);
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
    if (!currentChat) {
        console.error('❌ Cannot send message: No chat selected');
        alert('Please select a user to start chatting first.');
        return;
    }
    if (socket) {
        socket.emit('message', {
            to: currentChat.user,
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

export function getCurrentChat() {
    return currentChat;
}

function loadBlockedUsers() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    fetch('/api/user/blocked', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            blockedUsers = new Set(data.blocked_users.map((user: any) => user.username));
            console.log('✅ Blocked users loaded:', blockedUsers);
        } else {
            console.error('❌ Failed to load blocked users:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error loading blocked users:', error);
    });
}

export function isUserBlocked(username: string): boolean {
    return blockedUsers.has(username);
}

export function blockUser(username: string) {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        console.error('❌ No auth token available');
        return;
    }

    // D'abord, obtenir l'ID de l'utilisateur à bloquer
    fetch(`/api/user/by-username/${username}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const blockedUserId = data.user.id;
            
            // Maintenant, bloquer l'utilisateur
            return fetch('/api/user/block', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ blocked_user_id: blockedUserId }),
            });
        } else {
            throw new Error('User not found');
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            blockedUsers.add(username);
            console.log(`🚫 Utilisateur ${username} bloqué`);
            
            // Masquer les messages existants de cet utilisateur
            hideMessagesFromUser(username);
        } else {
            console.error('❌ Failed to block user:', data.error);
            alert('Failed to block user: ' + data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error blocking user:', error);
        alert('Error blocking user');
    });
}

export function unblockUser(username: string) {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        console.error('❌ No auth token available');
        return;
    }

    // D'abord, obtenir l'ID de l'utilisateur à débloquer
    fetch(`/api/user/by-username/${username}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const blockedUserId = data.user.id;
            
            // Maintenant, débloquer l'utilisateur
            return fetch(`/api/user/unblock/${blockedUserId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        } else {
            throw new Error('User not found');
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            blockedUsers.delete(username);
            console.log(`✅ Utilisateur ${username} débloqué`);
            
            // Réafficher les messages de cet utilisateur si on est dans sa conversation
            if (currentChat && currentChat.user === username) {
                showMessagesFromUser(username);
            }
        } else {
            console.error('❌ Failed to unblock user:', data.error);
            alert('Failed to unblock user: ' + data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error unblocking user:', error);
        alert('Error unblocking user');
    });
}

function hideMessagesFromUser(username: string) {
    const messagesDiv = document.getElementById('chat_messages');
    if (messagesDiv) {
        const messageElements = messagesDiv.querySelectorAll('.chat-message');
        messageElements.forEach(element => {
            const messageText = element.textContent || '';
            // Vérifier si le message vient de l'utilisateur bloqué
            if (messageText.startsWith(`${username}:`) || messageText.includes(`<strong>${username}`)) {
                (element as HTMLElement).style.display = 'none';
            }
        });
    }
}

function showMessagesFromUser(username: string) {
    const messagesDiv = document.getElementById('chat_messages');
    if (messagesDiv) {
        const messageElements = messagesDiv.querySelectorAll('.chat-message');
        messageElements.forEach(element => {
            const messageText = element.textContent || '';
            // Réafficher les messages de l'utilisateur
            if (messageText.startsWith(`${username}:`) || messageText.includes(`<strong>${username}`)) {
                (element as HTMLElement).style.display = 'block';
            }
        });
    }
}
