// src/pages/signup.ts

export function initSignup() {
    const signupForm = document.getElementById('signup_form') as HTMLFormElement;
    const cancelBtn = document.getElementById('button-cancel-signup');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(signupForm);
            const username = formData.get('username') as string;
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;

            if (!username || !email || !password) {
                alert('Please fill in all fields: username, email, and password');
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
                    const data = await response.json();
                    // Registration successful, redirect to login
                    alert('Registration successful! Please log in.');
                    window.location.hash = 'login';
                } else {
                    const errorData = await response.json();
                    alert(`Registration failed: ${errorData.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.hash = 'login';
        });
    }
}
