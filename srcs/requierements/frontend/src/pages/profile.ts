/* eslint-disable no-undef */
// src/pages/profile.ts

interface UserProfile {
  avatarUrl: string;
  username: string;
  ranking: number;
  wins: number;
  losses: number;
  matches: number;
}

// Profil de secours si l'API ne répond pas
const DEMO_PROFILE: UserProfile = {
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=User42',
  username: 'User42',
  ranking: 12,
  wins: 8,
  losses: 3,
  matches: 11,
};

// Récupère le profil depuis l'API ou renvoie le mode démo
async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error();
    return await res.json();
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
      <h2 class="text-3xl font-bold text-white">${user.displayName}</h2>
      <img src="${user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.displayName}`}" alt="Avatar"
           class="w-32 h-32 rounded-full border-4 border-blue-500 shadow mb-4" />

      <div class="flex gap-6">
        <!-- Victoires en vert -->
        <div class="text-center">
          <div class="text-lg font-bold text-green-400">${0}</div>
          <div class="text-gray-400">Victoires</div>
        </div>
        <!-- Défaites en rouge -->
        <div class="text-center">
          <div class="text-lg font-bold text-red-400">${0}</div>
          <div class="text-gray-400">Défaites</div>
        </div>
        <!-- Matchs neutre -->
        <div class="text-center">
          <div class="text-lg font-bold text-white">${0}</div>
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
    localStorage.setItem('dmTarget', user.id);
    window.location.hash = '#live-chat';
  });
}

type Profile = {
  id: string;
  authUserId: string;
  avatar: string | null;
  displayName: string;
  lastActivity: string;
};

// Point d'entrée pour la page Profil
export async function initProfilePage() {
  // Récupère le container
  const container = document.getElementById('profile-container');
  if (!container) return;
  console.log('Initializing profile page');

  const id = window.location.hash.split('/')[1] || null;
  const url = id
    ? `/api/user/${id}`
    : '/api/user/me';
  const res = await fetch(url, {
    credentials: 'include',
  });
  if (!res.ok) {
    // TODO: Redirect to error page
    console.error('Failed to fetch profile:', res.statusText);
    return;
  }
  const profile: Profile = await res.json();

  // affiche le profil
  renderProfile(container, profile, false);
}
