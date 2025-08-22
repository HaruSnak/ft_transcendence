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
        try {
            const response = await fetch('http://localhost:3000/api/v1/auth/login', {
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
