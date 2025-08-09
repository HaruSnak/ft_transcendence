// src/socket.ts

import { io } from 'socket.io-client';

// 1) On force la connexion vers le stub Socket.IO sur http://localhost:3000
export const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'], // Permet fallback
  timeout: 20000,
  forceNew: true  // Force une nouvelle connexion
});

// 2) Quand on se connecte
socket.on('connect', () => {
  console.log('📡 Socket.IO connecté :', socket.id);
});

// 3) Quand on reçoit un "newMessage" du serveur
// eslint-disable-next-line @typescript-eslint/no-explicit-any
socket.on('message_backend_to_frontend', (data: any) => {
  console.log('📡 message_backend_to_frontend :', data);
  // On redispatche un event global comme avant
  window.dispatchEvent(new CustomEvent('message_backend_to_frontend', { detail: data }));
});

socket.on('user_list', (data: any) => {
  console.log('📡 user_list :', data);
  // On redispatche un event global comme avant
  window.dispatchEvent(new CustomEvent('user_list', { detail: data }));
});

// 4) Utility pour envoyer un message
export function sendMessageToBackend(to, text) {
  socket.emit('message_frontend_to_backend', {
    from: socket.id,
    to: to,
    text: text,
  });
}
