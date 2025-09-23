/* eslint-disable no-undef */
// src/pages/profile.ts

interface UserProfile {
  id: number;
  username: string;
  display_name: string;
  email?: string;
  avatar_url?: string;
  is_online: boolean;
  wins: number;
  losses: number;
  games_played: number;
}

// Profil de secours si l'API ne répond pas
const DEMO_PROFILE: UserProfile = {
  id: 0,
  avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=User42',
  username: 'User42',
  display_name: 'User42',
  is_online: false,
  wins: 8,
  losses: 3,
  games_played: 11,
};

// Récupère le profil depuis l'API ou renvoie le mode démo
async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token');
    
    const res = await fetch('http://localhost:3003/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    
    const data = await res.json();
    return data.user;
  } catch {
    return DEMO_PROFILE;
  }
}

// element du profil
function renderProfile(container: HTMLElement, user: Profile, isDemo: boolean) {
  container.innerHTML = `
    ${
      isDemo
        ? `<div class="text-center text-yellow-500 mb-4">
      Mode démo : Backend non disponible
    </div>`
        : ''
    }
    <div class="bg-gray-800 rounded-2xl shadow-xl p-10 flex flex-col items-center gap-8 max-w-md mx-auto">
      <h2 class="text-3xl font-bold text-white">${user.display_name}</h2>
      <img src="${user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}" alt="Avatar"
           class="w-32 h-32 rounded-full border-4 border-blue-500 shadow mb-4" />

      <div class="flex gap-6">
        <!-- Victoires en vert -->
        <div class="text-center">
          <div class="text-lg font-bold text-green-400">${user.wins}</div>
          <div class="text-gray-400">Victoires</div>
        </div>
        <!-- Défaites en rouge -->
        <div class="text-center">
          <div class="text-lg font-bold text-red-400">${user.losses}</div>
          <div class="text-gray-400">Défaites</div>
        </div>
        <!-- Matchs neutre -->
        <div class="text-center">
          <div class="text-lg font-bold text-white">${user.games_played}</div>
          <div class="text-gray-400">Matchs</div>
        </div>
      </div>

      <button id="dm-button"
              class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-2 rounded">
        💬 Discuter
      </button>
    </div>
  `;

  // clic sur le bouton Discuter depuis le profil
  container.querySelector('#dm-button')?.addEventListener('click', () => {
    localStorage.setItem('dmTarget', user.id.toString());
    window.location.hash = '#live-chat';
  });
}

type Profile = UserProfile;

// Point d'entrée pour la page Profil
export async function initProfilePage() {
  // Récupère le container
  const container = document.getElementById('profile-container');
  if (!container) return;
  console.log('Initializing profile page');

  // Récupérer le profil utilisateur connecté
  const profile = await fetchUserProfile();
  const isDemo = profile === DEMO_PROFILE;
  
  // affiche le profil
  renderProfile(container, profile, isDemo);
}
