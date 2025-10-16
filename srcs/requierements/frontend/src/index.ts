// src/index.ts

import './style.css';

// Imports des pages (version de votre collègue pour tout sauf le game)
import { initLogin } from './pages/login.js';
import { initSignup } from './pages/signup.js';
import { initProfile } from './pages/profile/index.js';
import { initLiveChat } from './pages/livechat/index.js';

// Import du game (VOTRE version)
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

// Affiche la page demandée et cache les autres (simplifié)
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

// Navigation - VOTRE VERSION (garde la logique du game propre)
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
  if (hash) {
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
    if (hash) {
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

// Change de page - HYBRID: votre logique game + sa logique navigation
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
  
  // VOTRE LOGIQUE: Clean up game si on quitte la page game
  if (page !== 'game') {
    cleanUpGame();
  }
  
  showPage(page);
  
  // VOTRE LOGIQUE: Initialisation spécifique pour le jeu
  if (page === 'game') {
    // Utiliser setTimeout pour s'assurer que le DOM est complètement chargé
    setTimeout(() => {
      initGame();
    }, 50); // 50ms devrait être suffisant pour que le DOM soit mis à jour
  }
}

// Démarrage de l'app
window.addEventListener('DOMContentLoaded', () => {
  // Initialize pages (version de votre collègue)
  initLogin();
  initSignup();
  initProfile();
  initLiveChat();

  // Initialize navigation
  initNavigation();

  // Check login state and hide login tab if authenticated
  const authToken = sessionStorage.getItem('authToken');
  const loginLink = document.querySelector('.nav-links [data-page="login"]');
  if (authToken && loginLink) {
    (loginLink as HTMLElement).style.display = 'none';
  }
});

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
