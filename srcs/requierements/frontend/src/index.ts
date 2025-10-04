// src/index.ts
console.log('🔄 Loading index.ts...');

import './style.css';
import { initGame, cleanUpGame } from './game/game.js';
import { initSocket } from './socket.js';
import { initLogin } from './pages/login.js';
import { initSignup } from './pages/signup.js';
import { initProfile } from './pages/profile.js';
import { initLiveChat } from './pages/livechat.js';

console.log('✅ All imports loaded');

// Navigation
function showPage(pageId: string) {
    console.log(`📄 showPage called with: ${pageId}`);
    // Clean up game if switching away from game page
    if (pageId !== 'game') {
        console.log('🎮 Cleaning up game...');
        cleanUpGame();
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    // Show selected page
    const page = document.getElementById(pageId);
    if (page) {
        console.log(`✅ Showing page: ${pageId}`);
        page.classList.remove('hidden');
        
        // Initialize page-specific functionality
        if (pageId === 'profile') {
            console.log('👤 Re-initializing profile page...');
            initProfile();
        }
    } else {
        console.log(`❌ Page not found: ${pageId}`);
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) {
        console.log(`🎯 Setting active link for: ${pageId}`);
        activeLink.classList.add('active');
    }
}

function initNavigation() {
    console.log('🧭 Initializing navigation...');
    // Handle nav links
    document.querySelectorAll('[data-page]').forEach(link => {
        console.log('🔗 Attaching event listener to:', link);
        link.addEventListener('click', (e) => {
            console.log('🖱️ Clicked on:', link, 'Page:', link.getAttribute('data-page'));
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            if (pageId) {
                showPage(pageId);
                // Update URL hash
                window.location.hash = pageId;
            }
        });
    });

    // Handle initial page based on hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        if (hash.startsWith('profile-')) {
            // Special case for profile with username
            const username = hash.substring(8); // Remove 'profile-'
            // Set a temporary URL param for the profile page BEFORE showing the page
            sessionStorage.setItem('profileUsername', username);
            showPage('profile');
        } else if (document.getElementById(hash)) {
            console.log(`🔗 Initial page from hash: ${hash}`);
            showPage(hash);
        } else {
            console.log('🏠 Showing default page: home');
            showPage('home');
        }
    } else {
        console.log('🏠 Showing default page: home');
        showPage('home');
    }

    // Handle hash changes
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            if (hash.startsWith('profile-')) {
                // Special case for profile with username
                const username = hash.substring(8); // Remove 'profile-'
                // Set a temporary URL param for the profile page BEFORE showing the page
                sessionStorage.setItem('profileUsername', username);
                showPage('profile');
            } else if (document.getElementById(hash)) {
                console.log(`🔄 Hash changed to: ${hash}`);
                showPage(hash);
            }
        }
    });
    console.log('✅ Navigation initialized');
}

// Game initialization
function initGameSection() {
    console.log('🎮 Initializing game section...');
    const soloModeBtn = document.getElementById('solo-mode');
    const localModeBtn = document.getElementById('vs-local-mode');

    if (soloModeBtn) {
        console.log('🎯 Solo mode button found');
        soloModeBtn.addEventListener('click', () => {
            console.log('🎮 Starting solo game...');
            showPage('game');
            initGame();
        });
    } else {
        console.log('❌ Solo mode button not found');
    }

    if (localModeBtn) {
        console.log('🎯 Local mode button found');
        localModeBtn.addEventListener('click', () => {
            console.log('🎮 Starting local game...');
            showPage('game');
            initGame();
        });
    } else {
        console.log('❌ Local mode button not found');
    }
    console.log('✅ Game section initialized');
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM Content Loaded - Starting initialization...');
    initNavigation();
    initGameSection();
    console.log('🔌 Initializing socket...');
    initSocket();
    console.log('🔐 Initializing login...');
    initLogin();
    console.log('📝 Initializing signup...');
    initSignup();
    console.log('👤 Initializing profile...');
    initProfile();
    console.log('💬 Initializing live chat...');
    initLiveChat();

    // Check login state and hide login tab if authenticated
    const authToken = sessionStorage.getItem('authToken');
    const loginLink = document.querySelector('[data-page="login"]');
    if (authToken && loginLink) {
        (loginLink as HTMLElement).style.display = 'none';
    }

    console.log('🎉 All initializations complete!');
});
