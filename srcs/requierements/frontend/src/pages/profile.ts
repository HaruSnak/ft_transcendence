/* eslint-disable no-undef */
// src/pages/profile.ts

// Business logic: Fetch user profile (modifier uniquement ici pour le backend)
export async function fetchUserProfile(id?: string): Promise<Profile> {
  const url = id
    ? `/api/user/${id}`
    : '/api/user/me';
  const res = await fetch(url, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.statusText}`);
  }
  return await res.json();
}

// element du profil
function renderProfile(container: HTMLElement, user: Profile) {
  container.innerHTML = `
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

  try {
    const id = window.location.hash.split('/')[1] || null;
    const profile: Profile = await fetchUserProfile(id);

    // affiche le profil
    renderProfile(container, profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    // TODO: Handle error, perhaps show error message
  }
}
