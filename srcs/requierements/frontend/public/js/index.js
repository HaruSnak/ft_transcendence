// src/index.ts
//import './style.css';
import { initHomePage } from './pages/home.js';
import { initChatPage } from './pages/livechat.js';
import { initLoginPage } from './pages/login.js';
import { initSignupPage } from './pages/signup.js';
import { initGame, cleanupGame } from './game/game.js';
// Toutes les pages de l’app
const pages = [
    'home',
    'game',
    'live-chat',
    'board',
    'room',
    'create_room',
    'login',
    'signup',
    'profile',
];
// Affiche la page demandée et cache les autres
function showPage(page) {
    pages.forEach((p) => {
        document.getElementById(p).classList.toggle('hidden', p !== page);
    });
}
initHomePage();
initChatPage();
//loadBoardPage();
//initRoomPage();
//initCreateRoomPage();
initLoginPage();
initSignupPage();
/*
  // For the profile page, it's either #profile or #profile/:id
  const profileRegex = /^profile(\/[a-zA-Z0-9]+)?$/;
  if (page === 'profile' || profileRegex.test(page)) {
    console.log('Initializing profile page');
    return initProfilePage();
  }
}
*/
// Lie les clics de la navbar
function initNav() {
    const links = document.querySelectorAll('[data-page]');
    links.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.page;
            navigateTo(target);
        });
    });
    // Support du back/forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.slice(1);
        if (pages.includes(hash)) {
            navigateTo(hash, false);
        }
    });
}
// Change de page et met à jour l’URL (pushState par défaut)
export function navigateTo(page, push = true) {
    if (push) {
        window.history.pushState(null, '', `#${page}`);
    }
    showPage(page.split('/')[0]);
    // Initialisation spécifique pour la page game
    if (page.split('/')[0] === 'game') {
        initGame(); // Initialise le jeu quand on arrive sur #game
    }
    else {
        cleanupGame(); // Arrête le jeu si on quitte #game
    }
    //initPage(page);
}
// Démarrage de l’app
window.addEventListener('DOMContentLoaded', () => {
    initNav();
    // Page initiale selon le hash ou home
    const hash = window.location.hash.substring(1);
    const first = hash !== '' ? hash : 'home';
    navigateTo(first);
});
// Remplace window.startPong
window.startPong = () => {
    const startButton = document.getElementById('startGameButton');
    if (startButton) {
        startButton.click(); // Simule un clic sur le bouton Start Game
    }
    else {
        console.log('Bouton Start Game non trouvé');
    }
};
