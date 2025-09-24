/* eslint-disable no-undef */
// src/pages/profile.ts

interface UserProfile {
  id: number;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  is_online: boolean;
  wins: number;
  losses: number;
  games_played: number;
  matchHistory: Array<{
    type: string;
    date: string;
    result: 'win' | 'lose';
  }>;
}

// Fonction pour afficher les messages d'erreur/succès
function showMessage(message: string, isError = true) {
  // Supprimer l'ancien message s'il existe
  const existingMessage = document.querySelector('.profile-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Créer le nouveau message
  const messageDiv = document.createElement('div');
  messageDiv.className = `profile-message p-3 mb-4 rounded text-center ${
    isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
  }`;
  messageDiv.textContent = message;

  // Insérer le message au début du container
  const container = document.getElementById('profile-container');
  container?.insertAdjacentElement('afterbegin', messageDiv);

  // Supprimer le message après 5 secondes
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// Fonction pour mettre à jour le profil
async function updateProfile(updates: { avatar_url?: string; display_name?: string; username?: string; email?: string; password?: string }): Promise<boolean> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Non connecté');
    }

    const response = await fetch('http://localhost:3003/api/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Erreur ${response.status}`);
    }

    return true;
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour:', error);
    showMessage(error.message);
    return false;
  }
}

// Fonction pour supprimer le compte
async function deleteAccount(): Promise<boolean> {
  const confirmDelete = confirm(
    '⚠️ ATTENTION ⚠️\n\n' +
    'Êtes-vous sûr de vouloir supprimer définitivement votre compte ?\n' +
    'Cette action est irréversible et supprimera :\n' +
    '• Votre profil et toutes vos données\n' +
    '• Votre historique de jeu\n' +
    '• Vos statistiques\n\n' +
    'Tapez "SUPPRIMER" pour confirmer'
  );

  if (!confirmDelete) return false;

  const finalConfirm = prompt('Tapez "SUPPRIMER" en majuscules pour confirmer la suppression :');
  
  if (finalConfirm !== 'SUPPRIMER') {
    showMessage('Suppression annulée', false);
    return false;
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Non connecté');
    }

    // Note: Il faudra ajouter cette route dans votre API
    const response = await fetch('http://localhost:3003/api/user/profile', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      showMessage('Compte supprimé avec succès', false);
      localStorage.removeItem('authToken');
      setTimeout(() => {
        window.location.hash = '#home';
      }, 2000);
      return true;
    } else {
      throw new Error('Erreur lors de la suppression');
    }
  } catch (error: any) {
    showMessage('Erreur : ' + error.message);
    return false;
  }
}

// Fonction pour se déconnecter
async function logout() {
  try {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Appel à l'API pour invalider le token côté serveur
      await fetch('http://localhost:3003/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    
    // Supprimer le token côté client
    localStorage.removeItem('authToken');
    
    showMessage('Déconnexion réussie', false);
    
    setTimeout(() => {
      window.location.hash = '#home';
    }, 1500);
    
  } catch (error) {
    // Même si l'API échoue, on supprime le token local
    localStorage.removeItem('authToken');
    showMessage('Déconnexion réussie', false);
    setTimeout(() => {
      window.location.hash = '#home';
    }, 1500);
  }
}
async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token');
    
    const res = await fetch('http://localhost:3003/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    
    const data = await res.json();
    const profile = data.user;
    // Ensure matchHistory exists
    if (!profile.matchHistory) {
      profile.matchHistory = [];
    }
    return profile;
  } catch {
    return null;
  }
}

// element du profil
function renderProfile(container: HTMLElement, user: Profile, isDemo: boolean) {
  container.innerHTML = `
    <div class="bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-10 flex flex-col items-center gap-6 sm:gap-8 max-w-sm sm:max-w-md mx-auto">
      <div class="text-center">
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">${user.display_name}</h2>
        <p class="text-xs sm:text-sm text-gray-400">${user.username} • ${user.email}</p>
      </div>
      
      <img src="${user.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjNGI1NTYzIi8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXZhdGFyPC90ZXh0Pgo8L3N2Zz4K'}" alt="Avatar"
           class="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-blue-500 shadow mb-4" />

      <div class="flex gap-2 flex-wrap justify-center">
        <button id="edit-profile-btn" 
                class="px-3 py-2 sm:px-4 text-white text-xs sm:text-sm rounded transition bg-blue-500 hover:bg-blue-600">
          ✏️ Modifier profil
        </button>
        <button id="logout-btn" 
                class="px-3 py-2 sm:px-4 text-white text-xs sm:text-sm rounded transition bg-yellow-500 hover:bg-yellow-600">
          🚪 Déconnexion
        </button>
      </div>

      <div class="flex gap-4 sm:gap-6">
        <!-- Victoires en vert -->
        <div class="text-center">
          <div class="text-lg sm:text-lg font-bold text-green-400">${user.wins}</div>
          <div class="text-gray-400 text-xs sm:text-sm">Victoires</div>
        </div>
        <!-- Défaites en rouge -->
        <div class="text-center">
          <div class="text-lg sm:text-lg font-bold text-red-400">${user.losses}</div>
          <div class="text-gray-400 text-xs sm:text-sm">Défaites</div>
        </div>
        <!-- Matchs neutre -->
        <div class="text-center">
          <div class="text-lg sm:text-lg font-bold text-white">${user.games_played}</div>
          <div class="text-gray-400 text-xs sm:text-sm">Matchs</div>
        </div>
      </div>

      <div class="w-full">
        <h3 class="text-lg sm:text-xl font-bold text-white mb-4">Historique des matchs</h3>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          ${user.matchHistory.map(match => `
            <div class="flex justify-between items-center bg-gray-700 p-2 sm:p-3 rounded text-sm">
              <div>
                <div class="text-white font-medium text-xs sm:text-sm">${match.type}</div>
                <div class="text-gray-400 text-xs">${match.date}</div>
              </div>
              <div class="text-lg ${match.result === 'win' ? 'text-green-400' : 'text-red-400'}">
                ${match.result === 'win' ? '🏆' : '❌'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <button id="dm-button"
              class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 sm:px-8 py-2 rounded text-sm sm:text-base">
        💬 Discuter
      </button>
    </div>

    <!-- Modal d'édition (caché par défaut) -->
    <div id="edit-modal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 hidden flex">
      <div class="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-4">
        <h3 class="text-lg sm:text-xl font-bold text-white mb-4">Modifier le profil</h3>
        
        <div class="mb-4">
          <label class="block text-gray-300 mb-2 text-sm">Avatar URL</label>
          <input id="new-avatar" 
                 type="text" 
                 value="${user.avatar_url || ''}"
                 class="w-full p-2 sm:p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 text-sm">
        </div>

        <div class="mb-4">
          <label class="block text-gray-300 mb-2 text-sm">Pseudo (Display Name)</label>
          <input id="new-display-name" 
                 type="text" 
                 value="${user.display_name}"
                 class="w-full p-2 sm:p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 text-sm">
        </div>

        <div class="mb-4">
          <label class="block text-gray-300 mb-2 text-sm">Nom d'utilisateur (Login)</label>
          <input id="new-username" 
                 type="text" 
                 value="${user.username}"
                 class="w-full p-2 sm:p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 text-sm">
        </div>

        <div class="mb-4">
          <label class="block text-gray-300 mb-2 text-sm">Email</label>
          <input id="new-email" 
                 type="email" 
                 value="${user.email}"
                 class="w-full p-2 sm:p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 text-sm">
        </div>

        <div class="mb-4">
          <label class="block text-gray-300 mb-2 text-sm">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
          <input id="new-password" 
                 type="password" 
                 class="w-full p-2 sm:p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 text-sm">
        </div>

        <div class="flex gap-2 sm:gap-3 mb-4 flex-col sm:flex-row">
          <button id="save-profile-btn" 
                  class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded transition text-sm">
            💾 Sauvegarder
          </button>
          <button id="cancel-edit-btn" 
                  class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded transition text-sm">
            ❌ Annuler
          </button>
        </div>

        <button id="delete-account-btn" 
                class="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition text-sm">
          🗑️ Supprimer le compte
        </button>
      </div>
    </div>
  `;

  // Événements pour l'édition du profil
  container.querySelector('#edit-profile-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('edit-modal');
    modal?.classList.remove('hidden');
  });

  // Fermer le modal
  container.querySelector('#cancel-edit-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('edit-modal');
    modal?.classList.add('hidden');
  });

  // Sauvegarder les modifications
  container.querySelector('#save-profile-btn')?.addEventListener('click', async () => {
    const newAvatarInput = document.getElementById('new-avatar') as HTMLInputElement;
    const newDisplayNameInput = document.getElementById('new-display-name') as HTMLInputElement;
    const newUsernameInput = document.getElementById('new-username') as HTMLInputElement;
    const newEmailInput = document.getElementById('new-email') as HTMLInputElement;
    const newPasswordInput = document.getElementById('new-password') as HTMLInputElement;

    const updates: any = {};

    const newAvatar = newAvatarInput.value.trim();
    if (newAvatar !== (user.avatar_url || '')) updates.avatar_url = newAvatar;

    const newDisplayName = newDisplayNameInput.value.trim();
    if (newDisplayName && newDisplayName !== user.display_name) updates.display_name = newDisplayName;

    const newUsername = newUsernameInput.value.trim();
    if (newUsername && newUsername !== user.username) updates.username = newUsername;

    const newEmail = newEmailInput.value.trim();
    if (newEmail && newEmail !== user.email) updates.email = newEmail;

    const newPassword = newPasswordInput.value.trim();
    if (newPassword) updates.password = newPassword;

    if (Object.keys(updates).length === 0) {
      showMessage('Aucun changement détecté', false);
      const modal = document.getElementById('edit-modal');
      modal?.classList.add('hidden');
      return;
    }

    const success = await updateProfile(updates);
    if (success) {
      showMessage('Profil mis à jour avec succès !', false);
      const modal = document.getElementById('edit-modal');
      modal?.classList.add('hidden');
      
      // Recharger le profil après 2 secondes
      setTimeout(() => {
        initProfilePage();
      }, 2000);
    }
  });

  // Déconnexion
  container.querySelector('#logout-btn')?.addEventListener('click', logout);

  // Suppression du compte
  container.querySelector('#delete-account-btn')?.addEventListener('click', deleteAccount);

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
  if (!profile) {
    container.innerHTML = `
      <div class="text-center text-red-500 mb-4">
        Erreur : Impossible de charger le profil. Veuillez vous reconnecter.
      </div>
      <div class="text-center">
        <button onclick="window.location.hash = '#login'" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Se connecter
        </button>
      </div>
    `;
    return;
  }
  
  // affiche le profil
  renderProfile(container, profile, false);
}
