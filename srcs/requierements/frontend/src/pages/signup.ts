// src/pages/signup.ts

export function initSignup() {
    const signupForm = document.getElementById('signup_form') as HTMLFormElement;
    const cancelBtn = document.getElementById('button-cancel-signup');

    // Ajout d'un conteneur de message si absent
    let messageDiv = document.getElementById('signup-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'signup-message';
        messageDiv.style.marginTop = '1em';
        if (signupForm && signupForm.parentNode) {
            signupForm.parentNode.insertBefore(messageDiv, signupForm.nextSibling);
        }
    }

    function showMessage(msg: string, type: 'success' | 'error') {
        if (!messageDiv) return;
        messageDiv.textContent = msg;
        messageDiv.style.color = type === 'success' ? '#22c55e' : '#ef4444';
        messageDiv.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
        messageDiv.style.border = '1px solid ' + (type === 'success' ? '#22c55e' : '#ef4444');
        messageDiv.style.padding = '0.75em 1em';
        messageDiv.style.borderRadius = '0.5em';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.fontWeight = 'bold';
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
