// src/pages/profile_match_history.ts

export async function loadMatchHistory() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch('/api/user/match-history', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            displayMatchHistory(data.matches || []);
        } else {
            console.error('Failed to load match history:', response.status);
        }
    } catch (error) {
        console.error('Error loading match history:', error);
    }
}

function displayMatchHistory(matches: any[]) {
    const container = document.getElementById('match-history');
    if (!container) return;

    container.innerHTML = '';

    if (matches.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">Aucun match joué pour le moment.</p>';
        return;
    }

    matches.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'bg-gray-800 p-4 rounded-lg mb-4';

        const date = new Date(match.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const result = match.winner_id === match.player1_id ? 'Victoire' : 'Défaite';
        const opponent = match.winner_id === match.player1_id ? match.player2_username : match.player1_username;
        const score = `${match.player1_score}-${match.player2_score}`;

        matchDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-semibold">${result} contre ${opponent}</p>
                    <p class="text-sm text-gray-400">${date}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-lg">${score}</p>
                </div>
            </div>
        `;

        container.appendChild(matchDiv);
    });
}