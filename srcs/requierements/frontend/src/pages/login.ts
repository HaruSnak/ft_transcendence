// src/pages/login.ts

// Business logic: Perform login (modifier uniquement ici pour le backend)

// ========================= APPEL API POUR SE CONNECTER =========================
export async function performLogin(identifier: string, password: string): Promise<{ token: string; user: any }> {
	const response = await fetch('/api/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ username: identifier, password }),
	});

	if (!response.ok) {
		let errorMsg = 'Unknown error';
		try {
			const errorData = await response.json();
			errorMsg = errorData.error || JSON.stringify(errorData);
		} catch (e) {
			// ignore
		}
		throw new Error(errorMsg);
	}

	const data = await response.json();
	return { token: data.token, user: data.user };
}

// ========================= INTERFACE UTILISATEUR =========================
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

			if (!identifier || !password) {
				showMsg('Please fill in username and password', false);
				return;
			}

			try {
				const data = await performLogin(identifier, password);
				sessionStorage.removeItem('profileUsername'); // Clear any old profile view
				sessionStorage.setItem('authToken', data.token);
				sessionStorage.setItem('user', JSON.stringify(data.user));
				showMsg('Login successful!', true);
				
				// Refresh the browser to show the logged-in user
				window.location.reload();
			} catch (error: any) {
				console.error('Login error:', error);
				showMsg('Login failed: ' + (error?.message || error), false);
			}
		});
	}

	if (signupBtn) {
		signupBtn.addEventListener('click', () => {
			window.location.hash = 'signup';
		});
	}
}