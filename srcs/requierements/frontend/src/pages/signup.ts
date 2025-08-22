// src/pages/signup.ts

export function initSignupPage() {
  console.log('Signup page');

  const form = document.getElementById('signup_form') as HTMLFormElement | null;
  form?.reset();

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Récupère les valeurs
    const username = (document.getElementById('su_username') as HTMLInputElement).value.trim(); // memo perso, trim pour supprimer les espaces inutiles
    const email = (document.getElementById('su_email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('su_password') as HTMLInputElement).value;

    console.log('Create Account:', { username, email });
    // Si ca marche, redirige vers le login
    window.location.hash = '#login';
  });

  // Retour au login si annulation
  document.getElementById('button-cancel-signup')?.addEventListener('click', () => {
    window.location.hash = '#login';
  });
}
