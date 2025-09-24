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

initHomePage();
initChatPage();
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
}

// Change de page et met à jour l'URL (pushState par défaut)
export function navigateTo(page: string, push = true) {
  if (push) {
    window.history.pushState(null, '', `#${page}`);
  }
  showPage(page.split('/')[0]);
  
  // Initialisation spécifique pour les pages
  const basePage = page.split('/')[0];
  
  if (basePage === 'game') {
    initGame(); // Initialise le jeu quand on arrive sur #game
  } else {
    cleanUpGame(); // Arrête le jeu si on quitte #game
  }
  
  if (basePage === 'profile') {
    initProfilePage(); // Initialise le profil quand on arrive sur #profile
  }
}

// Démarrage de l'app
window.addEventListener('DOMContentLoaded', () => {
  initNav();

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