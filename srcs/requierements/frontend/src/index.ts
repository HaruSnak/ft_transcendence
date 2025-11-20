// src/index.ts

import './style.css';

// Imports des pages
import { initLogin } from './pages/login.js';
import { initSignup } from './pages/signup.js';
import { initProfile } from './pages/profile/index.js';
import { initLiveChat } from './pages/livechat/index.js';

// Import du game
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
  'game',
  'live-chat',
  'login',
  'signup',
  'profile',
] as const;
type Page = (typeof pages)[number];

// Affiche la page demandée et cache les autres
function showPage(pageId: string) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });

  // Show selected page
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.remove('hidden');
    
    // Initialize page-specific functionality
    if (pageId === 'profile') {
      initProfile();
    }
  }

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`[data-page="${pageId}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

// Navigation
function initNavigation() {
  // Handle nav links
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.getAttribute('data-page');
      if (pageId) {
        navigateTo(pageId);
      }
    });
  });

  // Handle initial page based on hash
  const hash = window.location.hash.substring(1);
  const authToken = sessionStorage.getItem('authToken');
  if (hash === 'login' && authToken) {
    navigateTo('profile', false);
  } else if (hash) {
    if (hash.startsWith('profile-')) {
      const username = hash.substring(8);
      sessionStorage.setItem('profileUsername', username);
      navigateTo('profile', false);
    } else if (pages.includes(hash as Page)) {
      navigateTo(hash, false);
    } else {
      navigateTo('game', false);
    }
  } else {
    navigateTo('game', false);
  }

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    const authToken = sessionStorage.getItem('authToken');
    if (hash === 'login' && authToken) {
      navigateTo('profile', false);
    } else if (hash) {
      if (hash.startsWith('profile-')) {
        const username = hash.substring(8);
        sessionStorage.setItem('profileUsername', username);
        navigateTo('profile', false);
      } else if (pages.includes(hash as Page)) {
        navigateTo(hash, false);
      }
    }
  });
}

// Change de page - check si login
export function navigateTo(page: string, push = true) {
  // Check access for protected pages
  if (page === 'profile' || page === 'live-chat') {
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
      navigateTo('login', push);
      return;
    }
  }

  if (push) {
    window.location.hash = page;
  }
  
  // Clean up game si on quitte la page game
  if (page !== 'game') {
    cleanUpGame();
  }
  
  showPage(page);
  
  // Initialisation spécifique pour le jeu
  if (page === 'game') {
    // Utiliser setTimeout pour s'assurer que le DOM est complètement chargé
    setTimeout(() => {
      initGame();
    }, 50); // attente pour etre certain que le DOM a charger
  }

  // Mettre à jour la navbar après changement de page
  updateNavbar();
}

// Démarrage de l'app
window.addEventListener('DOMContentLoaded', () => {
  // Initialize pages
  initLogin();
  initSignup();
  initProfile();
  initLiveChat();

  // Initialize navigation
  initNavigation();

  // Check login state and hide login tab if authenticated
  updateNavbar();
});

// Fonction pour mettre à jour la navbar selon l'état de connexion
export function updateNavbar() {
  const authToken = sessionStorage.getItem('authToken');
  const loginLink = document.querySelector('.nav-links [data-page="login"]');
  if (authToken && loginLink) {
    (loginLink as HTMLElement).style.display = 'none';
  } else if (loginLink) {
    (loginLink as HTMLElement).style.display = '';
  }
}

// Remplace window.startPong
window.startPong = () => {
  const startButton = document.getElementById('startGameButton') as HTMLButtonElement;
  if (startButton) {
    startButton.click(); // Simule un clic sur le bouton Start Game
  }
  else {
    console.log('Bouton Start Game non trouvé');
  }
};
