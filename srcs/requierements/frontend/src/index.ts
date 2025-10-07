// src/index.ts
console.log('🔄 Loading index.ts...');

import './style.css';
import { initGame, cleanUpGame, pongGame } from './game/game.js';
import { socketService } from './services/socket';
import { initLogin } from './pages/login.js';
import { initSignup } from './pages/signup.js';
import { initProfile } from './pages/profile.js';
import { initLiveChat } from './pages/livechat/index.js';

console.log('✅ All imports loaded');

let tournamentManager: any = null;

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
    const tournamentModeBtn = document.getElementById('tournament-mode');

    if (soloModeBtn) {
        console.log('🎯 Solo mode button found');
        soloModeBtn.addEventListener('click', () => {
            console.log('🎮 Starting solo game...');
            showPage('game');
            initGame('solo');
        });
    } else {
        console.log('❌ Solo mode button not found');
    }

    if (localModeBtn) {
        console.log('🎯 Local mode button found');
        localModeBtn.addEventListener('click', () => {
            console.log('🎮 Starting local game...');
            showPage('game');
            initGame('local');
        });
    } else {
        console.log('❌ Local mode button not found');
    }

    if (tournamentModeBtn) {
        console.log('🏆 Tournament mode button found');
        tournamentModeBtn.addEventListener('click', () => {
            console.log('🏆 Starting tournament setup...');
            showPage('tournament-setup');
            initTournamentSetup();
        });
    } else {
        console.log('❌ Tournament mode button not found');
    }
    console.log('✅ Game section initialized');
}

// Tournament setup
function initTournamentSetup() {
    console.log('🏆 Initializing tournament setup...');
    
    const addPlayerBtn = document.getElementById('add-player-btn');
    const newPlayerNameInput = document.getElementById('new-player-name') as HTMLInputElement;
    const playerTypeSelect = document.getElementById('player-type') as HTMLSelectElement;
    const playersList = document.getElementById('players-list');
    const playerCountSpan = document.getElementById('player-count');
    const startTournamentBtn = document.getElementById('start-tournament-btn') as HTMLButtonElement;
    const backToModesBtn = document.getElementById('back-to-modes-btn');
    
    let players: Array<{name: string, type: 'guest' | 'user'}> = [];
    
    function updatePlayersList() {
        if (!playersList || !playerCountSpan || !startTournamentBtn) return;
        
        playersList.innerHTML = '';
        playerCountSpan.textContent = players.length.toString();
        
        players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'badge badge-primary';
            playerDiv.textContent = `${player.name} (${player.type})`;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'ml-sm text-xs';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => {
                players.splice(index, 1);
                updatePlayersList();
            };
            
            playerDiv.appendChild(removeBtn);
            playersList.appendChild(playerDiv);
        });
        
        startTournamentBtn.disabled = players.length < 2 || players.length > 8;
    }
    
    if (addPlayerBtn) {
        addPlayerBtn.addEventListener('click', () => {
            const name = newPlayerNameInput?.value.trim();
            const type = playerTypeSelect?.value as 'guest' | 'user';
            
            if (name && !players.some(p => p.name === name)) {
                players.push({ name, type });
                updatePlayersList();
                if (newPlayerNameInput) newPlayerNameInput.value = '';
            }
        });
    }
    
    if (startTournamentBtn) {
        startTournamentBtn.addEventListener('click', () => {
            if (players.length >= 2 && players.length <= 8) {
                console.log('🏆 Starting tournament with players:', players);
                startTournament(players);
            }
        });
    }
    
    if (backToModesBtn) {
        backToModesBtn.addEventListener('click', () => {
            showPage('game-modes');
        });
    }
    
    // Initialize with empty list
    updatePlayersList();
    console.log('✅ Tournament setup initialized');
}

function startTournament(players: Array<{name: string, type: 'guest' | 'user'}>) {
    console.log('🏆 Starting tournament...');
    
    // Import tournament manager dynamically
    import('./game/TournamentManager.js').then(({ TournamentManager }) => {
        tournamentManager = new TournamentManager();
        
        // Add players to tournament
        players.forEach(player => {
            const success = tournamentManager.initDataPlayer(
                player.type === 'guest' ? 'Guest' : 'User',
                player.name
            );
            if (!success) {
                console.error(`Failed to add player: ${player.name}`);
            }
        });
        
        // Create matches and start tournament
        const matches = tournamentManager.createMatches();
        console.log('🏆 Tournament matches:', matches);
        
        // Switch to game page and start tournament
        showPage('game');
        initGame('tournament');
        
        // Start the tournament
        tournamentManager.startTournament(pongGame!, matches);
    }).catch(error => {
        console.error('Failed to load TournamentManager:', error);
    });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM Content Loaded - Starting initialization...');
    initNavigation();
    initGameSection();
    console.log(' Initializing login...');
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
