// src/pages/profile_editor.ts

import { SecurityUtils } from '../../utils/SecurityUtils';
import { UserApiService } from '../../services/api/user_api_service';

/**
 * Sanitize message content to prevent XSS attacks
 */
function sanitizeMessage(msg: string): string {
    if (!msg) return '';
    // Basic XSS prevention - remove HTML tags and dangerous content
    return msg.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '');
}

export function showEditForm() {
    const mainState = document.querySelector('[data-state="main"]');
    const editState = document.querySelector('[data-state="edit"]');
    if (mainState) mainState.classList.add('hidden');
    if (editState) editState.classList.remove('hidden');
    clearEditMsg(); // Clear any previous messages
}

export function hideEditForm() {
    const mainState = document.querySelector('[data-state="main"]');
    const editState = document.querySelector('[data-state="edit"]');
    if (mainState) mainState.classList.remove('hidden');
    if (editState) editState.classList.add('hidden');
    clearEditMsg(); // Clear any previous messages
}

export async function updateProfile() {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        window.location.hash = 'login';
        return;
    }

    const editName = document.querySelector('[data-field="edit-name"]') as HTMLInputElement;
    const editEmail = document.querySelector('[data-field="edit-email"]') as HTMLInputElement;
    const editPassword = document.querySelector('[data-field="edit-password"]') as HTMLInputElement;
    const editConfirmPassword = document.querySelector('[data-field="edit-confirm-password"]') as HTMLInputElement;

    if (!editName || !editEmail) {
        showEditMsg('Erreur: champs nom et email requis.', false);
        return;
    }

    const displayName = SecurityUtils.sanitizeDisplayName(editName.value);
    const email = SecurityUtils.sanitizeText(editEmail.value);
    const password = editPassword ? editPassword.value : '';
    const confirmPassword = editConfirmPassword ? editConfirmPassword.value : '';

    if (!displayName || !email) {
        showEditMsg('Le nom d\'affichage et l\'email sont obligatoires.', false);
        return;
    }

    // Validate display name with detailed messages
    const displayNameError = SecurityUtils.validateDisplayName(displayName);
    if (displayNameError) {
        let friendlyMsg = displayNameError;
        if (displayNameError.includes('empty')) {
            friendlyMsg = 'Le nom d\'affichage ne peut pas être vide.';
        } else if (displayNameError.includes('spaces')) {
            friendlyMsg = 'Le nom d\'affichage ne peut pas contenir d\'espaces au début ou à la fin.';
        } else if (displayNameError.includes('long')) {
            friendlyMsg = 'Le nom d\'affichage est trop long (maximum 24 caractères).';
        } else if (displayNameError.includes('contain')) {
            friendlyMsg = 'Le nom d\'affichage ne peut contenir que des lettres et chiffres.';
        }
        showEditMsg(friendlyMsg, false);
        return;
    }

    // Validate email with detailed messages
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showEditMsg('Format d\'email invalide. Utilisez le format: nom@domaine.com', false);
        return;
    }

    if (email.length > 254) {
        showEditMsg('L\'email est trop long (maximum 254 caractères).', false);
        return;
    }

    // Validate password if provided
    if (password) {
        if (password.length < 8) {
            showEditMsg('Le mot de passe doit contenir au moins 8 caractères.', false);
            return;
        }
        if (password.length > 128) {
            showEditMsg('Le mot de passe est trop long (maximum 128 caractères).', false);
            return;
        }
        if (!confirmPassword) {
            showEditMsg('Veuillez confirmer votre nouveau mot de passe.', false);
            return;
        }
        if (password !== confirmPassword) {
            showEditMsg('Les mots de passe ne correspondent pas.', false);
            return;
        }
    }

    // Get current user data to check if fields changed
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const currentDisplayName = currentUser.display_name || currentUser.username || '';
    const currentEmail = currentUser.email || '';

    // Check display name availability only if it changed
    if (displayName !== currentDisplayName) {
        showEditMsg('Vérification de la disponibilité du nom...', true);
        try {
            const isAvailable = await UserApiService.checkDisplayNameAvailability(displayName);
            if (!isAvailable) {
                showEditMsg('Ce nom d\'affichage est déjà pris. Choisissez-en un autre.', false);
                return;
            }
        } catch (error) {
            console.error('Error checking display name availability:', error);
            showEditMsg('Erreur réseau lors de la vérification du nom. Réessayez.', false);
            return;
        }
    }

    // Check email availability only if it changed
    if (email !== currentEmail) {
        showEditMsg('Vérification de la disponibilité de l\'email...', true);
        try {
            const isAvailable = await UserApiService.checkEmailAvailability(email);
            if (!isAvailable) {
                showEditMsg('Cet email est déjà utilisé par un autre compte.', false);
                return;
            }
        } catch (error) {
            console.error('Error checking email availability:', error);
            showEditMsg('Erreur réseau lors de la vérification de l\'email. Réessayez.', false);
            return;
        }
    }

    showEditMsg('Mise à jour en cours...', true);

    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                display_name: displayName,
                email: email,
                ...(password && { password: password }),
            }),
        });

        if (response.ok) {
            const data = await response.json();
            // Update session user data
            sessionStorage.setItem('user', JSON.stringify(data.user));
            showEditMsg('Profil mis à jour avec succès!', true);
            // Reload profile to reflect changes
            setTimeout(() => {
                import('./profile_loader.js').then(({ loadProfile }) => {
                    loadProfile();
                });
            }, 1000);
        } else {
            let errorMsg = 'Erreur lors de la mise à jour.';
            try {
                const errorData = await response.json();
                const rawError = errorData.error || errorData.message || 'Erreur inconnue du serveur';
                errorMsg = sanitizeMessage(rawError);
            } catch (e) {
                console.error('Profile update: error parsing backend error:', e);
            }

            // Provide specific error messages based on status
            if (response.status === 400) {
                errorMsg = 'Données invalides. Vérifiez vos informations.';
            } else if (response.status === 401) {
                errorMsg = 'Session expirée. Veuillez vous reconnecter.';
            } else if (response.status === 403) {
                errorMsg = 'Accès refusé. Vous n\'avez pas les permissions.';
            } else if (response.status === 409) {
                errorMsg = 'Conflit: ces informations sont déjà utilisées.';
            } else if (response.status === 422) {
                errorMsg = 'Données invalides ou incomplètes.';
            } else if (response.status >= 500) {
                errorMsg = 'Erreur serveur. Réessayez plus tard.';
            }

            showEditMsg(`Erreur mise à jour: ${errorMsg}`, false);
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showEditMsg('Erreur réseau. Vérifiez votre connexion internet et réessayez.', false);
    }
}

export async function uploadAvatar() {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        showEditMsg('Session expirée. Veuillez vous reconnecter.', false);
        return;
    }

    const fileInput = document.querySelector('[data-field="edit-avatar"]') as HTMLInputElement;
    if (!fileInput) {
        showEditMsg('Erreur: champ avatar introuvable.', false);
        return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
        showEditMsg('Veuillez sélectionner un fichier image.', false);
        return;
    }

    const file = fileInput.files[0];

    // Validate file exists
    if (!file) {
        showEditMsg('Erreur: fichier non valide.', false);
        return;
    }

    // Validate file type with detailed message
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!file.type.startsWith('image/')) {
        showEditMsg('Format non supporté. Utilisez JPEG, PNG, GIF ou WebP uniquement.', false);
        return;
    }

    if (!allowedTypes.includes(file.type.toLowerCase())) {
        showEditMsg('Format d\'image non supporté. Formats acceptés: JPEG, PNG, GIF, WebP.', false);
        return;
    }

    // Validate file size with detailed message
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size === 0) {
        showEditMsg('Le fichier est vide. Sélectionnez une image valide.', false);
        return;
    }

    if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        showEditMsg(`Fichier trop volumineux (${sizeMB}MB). Taille maximale: 5MB.`, false);
        return;
    }

    // Validate minimum size (prevent 1x1 pixel images)
    if (file.size < 1024) { // Less than 1KB
        showEditMsg('L\'image est trop petite. Utilisez une image de meilleure qualité.', false);
        return;
    }

    showEditMsg('Téléchargement de l\'avatar en cours...', true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            // Update avatar in UI
            const avatarImg = document.querySelector('[data-field="avatar"]') as HTMLImageElement;
            if (avatarImg && data.avatar_url) {
                avatarImg.src = data.avatar_url;
            }
            // Update session user data
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            user.avatar_url = data.avatar_url;
            sessionStorage.setItem('user', JSON.stringify(user));
            showEditMsg('Avatar mis à jour avec succès !', true);
        } else {
            let errorMsg = 'Erreur lors du téléchargement.';
            try {
                const errorData = await response.json();
                const rawError = errorData.error || errorData.message || 'Erreur inconnue';
                errorMsg = sanitizeMessage(rawError);
            } catch (e) {
                console.error('Avatar upload: error parsing backend error:', e);
            }

            // Provide more specific error messages based on status
            if (response.status === 413) {
                errorMsg = 'Fichier trop volumineux pour le serveur.';
            } else if (response.status === 415) {
                errorMsg = 'Format d\'image non supporté par le serveur.';
            } else if (response.status === 401) {
                errorMsg = 'Session expirée. Veuillez vous reconnecter.';
            } else if (response.status === 403) {
                errorMsg = 'Accès refusé. Vérifiez vos permissions.';
            }

            showEditMsg(`Erreur avatar: ${errorMsg}`, false);
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        showEditMsg('Erreur réseau lors du téléchargement. Vérifiez votre connexion.', false);
    }
}

function showEditMsg(msg: string, isSuccess: boolean = false) {
    const msgDiv = document.getElementById('edit-message');
    if (!msgDiv) {
        console.error('edit-message element not found');
        return;
    }

    // If message is empty, hide the div
    if (!msg.trim()) {
        msgDiv.classList.add('hidden');
        msgDiv.textContent = '';
        return;
    }

    // Sanitize the message to prevent XSS
    const safeMsg = sanitizeMessage(msg);

    msgDiv.textContent = safeMsg;
    msgDiv.style.color = isSuccess ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)';
    msgDiv.style.fontSize = '0.875rem'; // Smaller font size
    msgDiv.style.fontWeight = '500'; // Less bold
    msgDiv.style.padding = '0.375rem 0.5rem'; // Smaller padding
    msgDiv.style.borderRadius = '0.375rem';
    msgDiv.style.marginBottom = '0.75rem'; // Smaller margin
    msgDiv.style.border = isSuccess ? '1px solid #22c55e' : '1px solid #ef4444';
    msgDiv.style.backgroundColor = isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    // Limit message height and add scroll for long messages
    msgDiv.style.maxHeight = '120px';
    msgDiv.style.overflowY = 'auto';
    msgDiv.style.wordWrap = 'break-word';
    msgDiv.style.whiteSpace = 'pre-wrap';

    // Make sure it's visible
    msgDiv.classList.remove('hidden');

    // Auto-hide messages after appropriate time
    const timeout = isSuccess ? 5000 : 10000; // 5s for success, 10s for errors
    setTimeout(() => {
        if (msgDiv.textContent === safeMsg) {
            msgDiv.classList.add('hidden');
        }
    }, timeout);

    // Scroll to message if it's an error
    if (!isSuccess) {
        msgDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

export function clearEditMsg() {
    const msgDiv = document.getElementById('edit-message');
    if (msgDiv) {
        msgDiv.classList.add('hidden');
        msgDiv.textContent = '';
    }
}