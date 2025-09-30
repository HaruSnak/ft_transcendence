// src/pages/login.ts

export function initLogin() {
    const loginForm = document.getElementById('login_form') as HTMLFormElement;
    const signupBtn = document.getElementById('button-signup');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const identifier = formData.get('identifier') as string;
            const password = formData.get('password') as string;

            try {
                const response = await fetch('http://localhost:3004/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username: identifier, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    // Store token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    // Redirect to profile
                    window.location.hash = 'profile';
                } else {
                    alert('Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed');
            }
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.hash = 'signup';
        });
    }
}
