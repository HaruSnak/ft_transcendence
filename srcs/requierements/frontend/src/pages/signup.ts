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

            try {
                const response = await fetch('http://localhost:3004/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    // Store token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    // Redirect to profile
                    window.location.hash = 'profile';
                } else {
                    alert('Registration failed');
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
