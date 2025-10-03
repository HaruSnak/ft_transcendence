// src/pages/signup.ts

export function initSignup() {
    const signupForm = document.getElementById('signup_form') as HTMLFormElement;
    const cancelBtn = document.getElementById('button-cancel-signup');

    // Ajout d'un conteneur de message si absent
    let messageDiv = document.getElementById('signup-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'signup-message';
        messageDiv.style.marginBottom = '1rem';
        if (signupForm && signupForm.parentElement) {
            signupForm.parentElement.insertBefore(messageDiv, signupForm);
        }
    }

    function showMessage(msg: string, type: 'success' | 'error') {
        if (!messageDiv) return;
        messageDiv.textContent = msg;
        messageDiv.style.color = type === 'success' ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)';
        messageDiv.style.fontWeight = 'bold';
        messageDiv.style.textAlign = 'center';
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(signupForm);
            const username = formData.get('username') as string;
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;

            if (!username || !email || !password) {
                showMessage('Please fill in all fields: username, email, and password', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                });

                if (response.ok) {
                    // const data = await response.json();
                    showMessage('Registration successful! Please log in.', 'success');
                    setTimeout(() => {
                        window.location.hash = 'login';
                    }, 1200);
                } else {
                    const errorData = await response.json();
                    showMessage(`Registration failed: ${errorData.error || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showMessage('Registration failed', 'error');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.hash = 'login';
        });
    }
}
