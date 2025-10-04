// src/pages/login.ts

export function initLogin() {
    const loginForm = document.getElementById('login_form') as HTMLFormElement;
    const signupBtn = document.getElementById('button-signup');

    if (loginForm) {
        // Ajoute un conteneur pour les messages au-dessus du formulaire
        let msgDiv = document.getElementById('login-message');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.id = 'login-message';
            msgDiv.style.marginBottom = '1rem';
            loginForm.parentElement?.insertBefore(msgDiv, loginForm);
        }
        function showMsg(msg: string, ok: boolean) {
            msgDiv!.textContent = msg;
            msgDiv!.style.color = ok ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)';
            msgDiv!.style.fontWeight = 'bold';
            msgDiv!.style.textAlign = 'center';
        }
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const identifier = formData.get('identifier') as string;
            const password = formData.get('password') as string;

            showMsg('', true);
            console.log('Login form submit:', { identifier, password });

            if (!identifier || !password) {
                showMsg('Please fill in username and password', false);
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
                    sessionStorage.setItem('authToken', data.token);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    // Hide login tab immediately
                    const loginLink = document.querySelector('[data-page="login"]') as HTMLElement;
                    if (loginLink) loginLink.style.display = 'none';
                    showMsg('Login successful!', true);
                    // Check if first login and show welcome modal
                    if (!data.user.has_seen_welcome) {
                        const modal = document.getElementById('edit-profile-modal');
                        modal?.classList.add('show');
                        modal?.classList.remove('hidden');
                        // Mark as seen
                        fetch('/api/user/profile', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${data.token}`
                            },
                            body: JSON.stringify({ has_seen_welcome: true })
                        }).catch(err => console.error('Failed to update welcome status:', err));
                        // No auto-redirect; wait for user to click buttons
                    } else {
                        setTimeout(() => {
                            window.location.hash = 'profile';
                            location.reload();
                        }, 600);
                    }
                } else {
                    let errorMsg = 'Unknown error';
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || JSON.stringify(errorData);
                        console.error('Backend error:', errorData);
                    } catch (e) {
                        console.error('Error parsing backend error:', e);
                    }
                    showMsg('Login failed: ' + errorMsg, false);
                }
            } catch (error: any) {
                console.error('Login error:', error);
                showMsg('Network error: ' + (error?.message || error), false);
            }
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.hash = 'signup';
        });
    }

    // Modal event listeners
    const modal = document.getElementById('edit-profile-modal');
    const editBtn = document.getElementById('edit-profile-btn');
    const skipBtn = document.getElementById('skip-edit-btn');

    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.classList.add('hidden');
            }
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            modal?.classList.remove('show');
            modal?.classList.add('hidden');
            window.location.hash = 'profile';
            setTimeout(() => {
                const evt = new CustomEvent('openProfileEdit');
                window.dispatchEvent(evt);
            }, 100);
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            modal?.classList.remove('show');
            modal?.classList.add('hidden');
            window.location.hash = 'profile';
        });
    }
}
