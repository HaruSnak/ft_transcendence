// src/index.ts

//import './style.css';

import { initHomePage } from './pages/home.js';
import { initChatPage } from './pages/livechat.js';
// room page removed
import { initLoginPage } from './pages/login.js';
import { initSignupPage } from './pages/signup.js';
import { initProfilePage } from './pages/profile.js';
import { initGame, cleanUpGame } from './game/game.js';

// Expose startPong() au window
declare global {
  interface Window {
    startPong: () => void;
  }
}
export {}; // Force le mode module TS

// Toutes les pages de l'app
const pages = [
  'home',
  'game',
  'live-chat',
  'login',
  'signup',
  'profile',
] as const;
type Page = (typeof pages)[number];

// Affiche la page demandée et cache les autres
function showPage(page: string) {
  pages.forEach((p) => {
    document.getElementById(p)!.classList.toggle('hidden', p !== page);
  });
}

// Vérifie si l'utilisateur est connecté
function isLoggedIn(): boolean {
  return !!localStorage.getItem('authToken');
}

// Met à jour la visibilité des boutons de navigation selon l'état de connexion
function updateNavVisibility() {
  const loggedIn = isLoggedIn();
  const liveChatBtn = document.querySelector('[data-page="live-chat"]') as HTMLElement;
  if (liveChatBtn) {
    liveChatBtn.style.display = loggedIn ? 'inline-block' : 'none';
  }
  const profileBtn = document.querySelector('[data-page="profile"]') as HTMLElement;
  if (profileBtn) {
    profileBtn.style.display = loggedIn ? 'inline-block' : 'none';
  }
  // Masquer le bouton LiveChat sur la page home si non connecté
  const homeLiveChatBtn = document.querySelector('#home [data-page="live-chat"]') as HTMLElement;
  if (homeLiveChatBtn) {
    homeLiveChatBtn.style.display = loggedIn ? 'inline-block' : 'none';
  }
}

initHomePage();
//initChatPage(); // Removed, called on navigate
//loadBoardPage();
//initRoomPage();
//initCreateRoomPage();
initLoginPage();
initSignupPage();

// Lie les clics de la navbar
function initNav() {
  const links = document.querySelectorAll<HTMLElement>('[data-page]');
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.page as Page;
      navigateTo(target);
    });
  });

  // Support du back/forward
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.slice(1) as Page;
    if (pages.includes(hash)) {
      navigateTo(hash, false);
    }
  });

  updateNavVisibility();
}

// Change de page et met à jour l'URL (pushState par défaut)
export function navigateTo(page: string, push = true) {
  // Vérifier l'authentification pour les pages protégées avant d'afficher
  const basePage = page.split('/')[0];
  if (basePage === 'live-chat' && !isLoggedIn()) {
    navigateTo('login', false);
    return;
  }
  
  if (push) {
    window.history.pushState(null, '', `#${page}`);
  }
  showPage(page.split('/')[0]);
  
  // Initialisation spécifique pour les pages
  if (basePage === 'game') {
    initGame(); // Initialise le jeu quand on arrive sur #game
  } else {
    cleanUpGame(); // Arrête le jeu si on quitte #game
  }
  
  if (basePage === 'profile') {
    initProfilePage(); // Initialise le profil quand on arrive sur #profile
  }
  
  if (basePage === 'live-chat') {
    initChatPage(); // Initialise le chat quand on arrive sur #live-chat
  }
}

// Démarrage de l'app
window.addEventListener('DOMContentLoaded', () => {
  initNav();

  // Écouter les changements d'état d'authentification
  window.addEventListener('authStateChanged', updateNavVisibility);

  // Page initiale selon le hash ou home
  const hash = window.location.hash.substring(1);
  const first = hash !== '' ? hash : 'home';
  navigateTo(first);
});

// Remplace window.startPong
window.startPong = () => {
  const startButton = document.getElementById('startGameButton') as HTMLButtonElement;
  if (startButton) {
    startButton.click(); // Simule un clic sur le bouton Start Game
  } else {
    console.log('Bouton Start Game non trouvé');
  }
};