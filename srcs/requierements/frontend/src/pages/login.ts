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

            console.log('Login form submit:', { identifier, password });

            if (!identifier || !password) {
                alert('Please fill in username and password');
                return;
            }

            try {
                let response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username: identifier, password }),
                });
                console.log('POST /api/auth/login payload:', { username: identifier, password });
                console.log('POST /api/auth/login response status:', response.status);

                if (!response.ok) {
                    // Try GET as fallback if POST fails (for debugging)
                    response = await fetch(`/api/auth/login?username=${encodeURIComponent(identifier)}&password=${encodeURIComponent(password)}`);
                }

                if (response.ok) {
                    const data = await response.json();
                    console.log('Login success response:', data);
                    alert('Login successful!');
                    sessionStorage.setItem('authToken', data.token);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    window.location.hash = 'profile';
                    // Forcer le rechargement de la page profil pour éviter les soucis de cache
                    setTimeout(() => location.reload(), 200);
                } else {
                    let errorMsg = 'Unknown error';
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || JSON.stringify(errorData);
                        console.error('Backend error:', errorData);
                    } catch (e) {
                        console.error('Error parsing backend error:', e);
                    }
                    alert(`Login failed: ${errorMsg}`);
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
