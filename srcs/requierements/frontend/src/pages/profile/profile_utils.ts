// src/pages/profile_utils.ts

export async function logout() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        // Clear session regardless of response
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('profileUsername');

        if (response.ok) {
            window.location.hash = 'login';
        } else {
            console.error('Logout failed:', response.status);
            window.location.hash = 'login'; // Still redirect
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Clear session and redirect anyway
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('profileUsername');
        window.location.hash = 'login';
    }
}

export async function deleteUser() {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        alert('Session expirée. Veuillez vous reconnecter.');
        window.location.hash = 'login';
        return;
    }

    const confirmed = confirm('⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer définitivement votre compte.\n\nCette action est IRRÉVERSIBLE et entraînera :\n• La perte de toutes vos données\n• La suppression de votre historique de parties\n• L\'impossibilité de récupérer votre compte\n\nÊtes-vous absolument sûr de vouloir continuer ?');

    if (!confirmed) {
        return;
    }

    // Double confirmation pour éviter les accidents
    const doubleConfirmed = confirm('DERNIÈRE CONFIRMATION\n\nTapez "SUPPRIMER" pour confirmer la suppression définitive de votre compte :');

    if (!doubleConfirmed) {
        return;
    }

    try {
        const response = await fetch('/api/user/profile', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            // Clear session
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('profileUsername');

            alert('✅ Compte supprimé avec succès.\n\nVous allez être redirigé vers la page de connexion.');
            window.location.hash = 'login';
        } else {
            let errorMsg = 'Erreur lors de la suppression du compte.';
            try {
                const errorData = await response.json();
                const rawError = errorData.error || errorData.message || 'Erreur inconnue';
                // Basic sanitization
                errorMsg = rawError.replace(/<[^>]*>/g, '').substring(0, 200);
            } catch (e) {
                console.error('Delete user: error parsing backend error:', e);
            }

            if (response.status === 401) {
                errorMsg = 'Session expirée. Veuillez vous reconnecter.';
            } else if (response.status === 403) {
                errorMsg = 'Accès refusé. Vous ne pouvez pas supprimer ce compte.';
            }

            alert(`❌ Erreur suppression: ${errorMsg}`);
        }
    } catch (error) {
        console.error('Delete user error:', error);
        alert('❌ Erreur réseau lors de la suppression.\n\nVérifiez votre connexion internet et réessayez.');
    }
}