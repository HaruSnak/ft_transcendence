/* eslint-disable no-undef */
// src/pages/room.ts
import { socket } from '../socket';
// create-room UI removed
// Initialise la page de room (liste des joueurs + démarrage)
export function initRoomPage() {
    const tpl = document.getElementById('room_player');
    const container = document.getElementById('room_players');
    const countElem = document.getElementById('room_player_count');
    const maxElem = document.getElementById('room_player_max');
    const startBtn = document.getElementById('room_start_button');
    let players = [];
    let maxPlayers = 0;
    // Listener pour réponses du serveur
    socket.on('roomData', (data) => {
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
            const clone = tpl.content.cloneNode(true);
            const el = clone.querySelector('div');
            el.classList.add('player-item');
            clone.querySelector('#room_player_name').textContent = p.name;
            container.insertBefore(clone, startBtn);
        });
        // Active le bouton Start si le nombre de joueurs atteint maxPlayers
        startBtn.disabled = players.length < maxPlayers;
    }
    // Demander initialisation de la room actuelle
    socket.emit('joinRoom', {});
}
