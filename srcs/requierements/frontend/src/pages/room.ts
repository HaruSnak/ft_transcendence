/* eslint-disable no-undef */
// src/pages/room.ts

import { socket } from '../socket';

// Interface pour un joueur
interface RoomPlayer {
  name: string;
}

// Initialise la page de création de room
export function initCreateRoomPage() {
  const form = document.getElementById('create_room_form') as HTMLFormElement;
  form.onsubmit = (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const roomName = (data.get('room_name') as string).trim();
    const maxPlayers = Number(data.get('max_players'));
    if (!roomName) return;

    // Émettre un événement socket pour créer la room
    socket.emit('createRoom', { roomName, maxPlayers });

    // Naviguer vers la page room
    window.location.hash = '#room';
  };
}

// Initialise la page de room (liste des joueurs + démarrage)
export function initRoomPage() {
  const tpl = document.getElementById('room_player') as HTMLTemplateElement;
  const container = document.getElementById('room_players') as HTMLDivElement;
  const countElem = document.getElementById('room_player_count') as HTMLElement;
  const maxElem = document.getElementById('room_player_max') as HTMLElement;
  const startBtn = document.getElementById('room_start_button') as HTMLButtonElement;

  let players: RoomPlayer[] = [];
  let maxPlayers = 0;

  // Listener pour réponses du serveur
  socket.on('roomData', (data: { players: RoomPlayer[]; maxPlayers: number }) => {
    players = data.players;
    maxPlayers = data.maxPlayers;
    render();
  });

  // Click sur Start game
  startBtn.onclick = () => {
    socket.emit('startRoom', {});
  };

  function render() {
    // Met à jour le compteur
    countElem.textContent = String(players.length);
    maxElem.textContent = String(maxPlayers);

    // Vide et reconstruit la liste
    container.querySelectorAll('.player-item').forEach((el) => el.remove());
    players.forEach((p) => {
      const clone = tpl.content.cloneNode(true) as HTMLElement;
      const el = clone.querySelector('div')!;
      el.classList.add('player-item');
      (clone.querySelector('#room_player_name') as HTMLElement).textContent = p.name;
      container.insertBefore(clone, startBtn);
    });

    // Active le bouton Start si le nombre de joueurs atteint maxPlayers
    startBtn.disabled = players.length < maxPlayers;
  }

  // Demander initialisation de la room actuelle
  socket.emit('joinRoom', {});
}
