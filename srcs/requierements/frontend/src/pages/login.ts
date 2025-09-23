/* eslint-disable no-undef */
// src/pages/login.ts
export function initLoginPage() {
  console.log('Login');
  // Récup le formulaire de login et reset les input (champs)
  const form = document.getElementById('login_form') as HTMLFormElement;
  // form.reset();

  // Fonction pour afficher les messages d'erreur
  function showMessage(message: string, isError = true) {
    // Supprimer l'ancien message s'il existe
    const existingMessage = document.querySelector('.login-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Créer le nouveau message
    const messageDiv = document.createElement('div');
    messageDiv.className = `login-message p-3 mb-4 rounded text-center ${
      isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`;
    messageDiv.textContent = message;

    // Insérer le message avant le formulaire
    form.parentNode?.insertBefore(messageDiv, form);

    // Supprimer le message après 5 secondes
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  // Bouton vers la page de creat account
  const button_Signup = document.getElementById('button-signup');
  button_Signup?.addEventListener('click', () => {
    window.location.hash = '#signup';
  });

  form.onsubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    
    // Désactiver le bouton pendant la requête
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitButton.textContent || 'Login';
    submitButton.disabled = true;
    submitButton.textContent = 'Connexion...';

    const formData = new FormData(form);
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    // Validation basique côté client
    if (!identifier || !password) {
      showMessage('Veuillez remplir tous les champs');
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      return;
    }

    try {
      console.log('Tentative de connexion pour:', identifier);
      
      const response = await fetch('http://localhost:3003/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: identifier, password }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      console.log('Login successful:', result);
      
      // Sauvegarder le token si fourni
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }

      showMessage('Connexion réussie ! Redirection...', false);
      
      // Redirection après un court délai
      setTimeout(() => {
        window.location.hash = '#live-chat';
      }, 1500);

    } catch (error: any) {
      console.error('Error during login:', error);
      
      // Messages d'erreur spécifiques
      let errorMessage = 'Erreur de connexion';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que les services sont démarrés.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
      } else if (error.message.includes('404')) {
        errorMessage = 'Service d\'authentification non trouvé';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showMessage(errorMessage);
    } finally {
      // Réactiver le bouton
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  };
}
