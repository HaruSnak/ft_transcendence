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
async function updateProfile(newUsername: string): Promise<boolean> {
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
      body: JSON.stringify({ 
        username: newUsername.trim(),
        display_name: newUsername.trim()
      }),
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
      
      ${!isDemo ? `
        <div class="flex gap-2">
          <button id="edit-profile-btn" 
                  class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition">
            ✏️ Modifier profil
          </button>
          <button id="logout-btn" 
                  class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded transition">
            🚪 Déconnexion
          </button>
          <button id="delete-account-btn" 
                  class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition">
            🗑️ Supprimer compte
          </button>
        </div>
      ` : ''}
      
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

    <!-- Modal d'édition (caché par défaut) -->
    <div id="edit-modal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 hidden">
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-white mb-4">Modifier le profil</h3>
        
        <div class="mb-4">
          <label class="block text-gray-300 mb-2">Nom d'utilisateur</label>
          <input id="new-username" 
                 type="text" 
                 value="${user.username}"
                 class="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500">
        </div>
        
        <div class="flex gap-3">
          <button id="save-profile-btn" 
                  class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded transition">
            💾 Sauvegarder
          </button>
          <button id="cancel-edit-btn" 
                  class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded transition">
            ❌ Annuler
          </button>
        </div>
      </div>
    </div>
  `;

  if (!isDemo) {
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
      const newUsernameInput = document.getElementById('new-username') as HTMLInputElement;
      const newUsername = newUsernameInput.value.trim();
      
      if (!newUsername) {
        showMessage('Le nom d\'utilisateur ne peut pas être vide');
        return;
      }

      if (newUsername === user.username) {
        showMessage('Aucun changement détecté', false);
        const modal = document.getElementById('edit-modal');
        modal?.classList.add('hidden');
        return;
      }

      const success = await updateProfile(newUsername);
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
  }

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
