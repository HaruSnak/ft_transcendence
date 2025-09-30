// src/pages/signup.ts

export function initSignupPage() {
  console.log('Signup page');

  const form = document.getElementById('signup_form') as HTMLFormElement | null;
  form?.reset();

  // Fonction pour afficher les messages d'erreur/succès
  function showMessage(message: string, isError = true) {
    // Supprimer l'ancien message s'il existe
    const existingMessage = document.querySelector('.signup-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Créer le nouveau message
    const messageDiv = document.createElement('div');
    messageDiv.className = `signup-message p-3 mb-4 rounded text-center ${
      isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`;
    messageDiv.textContent = message;

    // Insérer le message avant le formulaire
    form?.parentNode?.insertBefore(messageDiv, form);

    // Supprimer le message après 5 secondes
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Désactiver le bouton pendant la requête
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitButton.textContent || 'Create account';
    submitButton.disabled = true;
    submitButton.textContent = 'Création en cours...';
    
  // Récupère les valeurs
  const username = (document.getElementById('su_username') as HTMLInputElement).value.trim();
  const display_name = (document.getElementById('su_pseudo') as HTMLInputElement)?.value.trim();
  const email = (document.getElementById('su_email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('su_password') as HTMLInputElement).value;
  const avatar_url = (document.getElementById('su_avatar') as HTMLInputElement)?.value.trim();

    // Validation basique côté client
    if (!username || !email || !password) {
      showMessage('Veuillez remplir tous les champs');
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      return;
    }

    if (password.length < 6) {
      showMessage('Le mot de passe doit contenir au moins 6 caractères');
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      return;
    }

    console.log('Create Account:', { username, display_name, email, avatar_url });
    try {
      // Prépare le corps de la requête
      const payload: any = { username, email, password };
      if (display_name) payload.display_name = display_name;
      if (avatar_url) payload.avatar_url = avatar_url;

      const response = await fetch('http://localhost:3003/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      console.log('Registration successful:', result);
      showMessage('Compte créé avec succès ! Redirection vers la connexion...', false);
      // Redirection vers le login après succès
      setTimeout(() => {
        window.location.hash = '#login';
      }, 2000);
    } catch (error: any) {
      console.error('Error during registration:', error);
      // Messages d'erreur spécifiques
      let errorMessage = 'Erreur lors de la création du compte';
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que les services sont démarrés.';
      } else if (error.message.includes('already exists')) {
        errorMessage = 'Ce nom d\'utilisateur ou cet email est déjà utilisé';
      } else if (error.message.includes('invalid email')) {
        errorMessage = 'Adresse email invalide';
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage);
    } finally {
      // Réactiver le bouton
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  // Retour au login si annulation
  document.getElementById('button-cancel-signup')?.addEventListener('click', () => {
    window.location.hash = '#login';
  });
}
