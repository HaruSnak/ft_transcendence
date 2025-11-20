// src/pages/signup.ts

// Business logic: Perform registration

// ========================= APPEL API POUR CREER UN COMPTE =========================
export async function performRegistration(username: string, display_name: string, email: string, password: string): Promise<void> {
	const response = await fetch('/api/auth/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ username, display_name, email, password }),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Unknown error');
	}

	// Registration successful, no data needed
}

// ========================= INTERFACE UTILISATEUR =========================
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
			const display_name = formData.get('display_name') as string;
			const email = formData.get('email') as string;
			const password = formData.get('password') as string;

			if (!username || !display_name || !email || !password) {
				showMessage('Please fill in all fields: username, display name, email, and password', 'error');
				return;
			}

			try {
				await performRegistration(username, display_name, email, password);
				showMessage('Registration successful! Please log in.', 'success');
				setTimeout(() => {
					window.location.hash = 'login';
				}, 1200);
			} catch (error: any) {
				console.error('Registration error:', error);
				showMessage(`Registration failed: ${error.message || 'Unknown error'}`, 'error');
			}
		});
	}

	if (cancelBtn) {
		cancelBtn.addEventListener('click', () => {
			window.location.hash = 'login';
		});
	}
}
