/* eslint-disable no-undef */
// src/pages/login.ts
export function initLoginPage() {
    console.log('Login');
    // Récup le formulaire de login et reset les input (champs)
    const form = document.getElementById('login_form');
    // form.reset();
    // Bouton vers la page de creat account
    const button_Signup = document.getElementById('button-signup');
    button_Signup?.addEventListener('click', () => {
        window.location.hash = '#signup';
    });
    form.onsubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const identifier = formData.get('identifier');
        const password = formData.get('password');
        // Validation côté client
        if (!identifier || identifier.trim().length === 0) {
            alert('Veuillez entrer un identifiant (nom d\'utilisateur ou email).');
            return;
        }
        if (!password || password.length < 6) {
            alert('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        try {
            const response = await fetch('https://localhost:8443/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier, password }),
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Login failed');
            }
            const result = await response.json();
            console.log('Login successful:', result);
            // Redirection ou autre action après le login réussi
            window.location.hash = '#live-chat';
        }
        catch (error) {
            console.error('Error during login:', error);
        }
    };
}
