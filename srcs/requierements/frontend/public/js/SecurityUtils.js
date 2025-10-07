/*		CODE ERREUR VALIDATE USERNAME
    -1: Username trop court ou trop long (minimum 3 caractères et maximum 10 caractères)
    -2: Username ne peut contenir que des lettres et chiffres
    -3: Username interdit
*/
/*		CODE ERREUR VALIDATE EMAIL
    -1: Username trop court ou trop long (minimum 3 caractères et maximum 10 caractères)
    -2: @ manquant dans l'email
    -3: . manquant dans l'extension de l'email
    -4: Un seul @ autorisé dans l'email
    -5: Format d'email invalide
    -6: Domaine invalide
    -7: Extension de domaine invalide
*/
export class SecurityUtils {
    constructor() {
    }
    // Fonction qui sert a analyser chaque username en arg afin d'etablir des protocoles de securites
    // afin d'eviter toutes attques XXS/autres via les inputs.
    validateUsername(username) {
        if (username.length < 3 || username.length > 10)
            return (-1);
        if (!SecurityUtils.USERNAME_REGEX.test(username))
            return (-2);
        // Vérification exacte
        if (SecurityUtils.BLACKLISTED_WORDS.includes(username.toLowerCase()))
            return (-3);
        return (0);
    }
    // Fonction qui utilise les RegExp afin de scan l'email bout par bout afin de filtrer
    // tout caracteres speciaux qui pourrait faire une attaque XXS
    validateEmail(mail) {
        if (mail.length < 6 || mail.length > 100)
            return (-1);
        // Vérifie que l'extension (après le dernier .) fait entre 2-6 caractères
        // lastIndexOf('.') donne la position du début de l'extension
        // La distance jusqu'à la fin = longueur de l'extension
        const dotExtension = mail.lastIndexOf('.');
        if (mail.includes('@') && (dotExtension >= 2 && dotExtension <= 6)) {
            const local = mail.split('@');
            if (local.length > 2)
                return (-4);
            if (!SecurityUtils.EMAIL_LOCAL_REGEX.test(local[0]))
                return (-5);
            const domain = local[1].split('.');
            if (domain.length === 1) // a delete ?
                return (-3);
            for (let i = 0; i < domain.length - 1; i++) {
                if (!SecurityUtils.EMAIL_DOMAIN_REGEX.test(domain[i]))
                    return (-6);
            }
            if (!SecurityUtils.EMAIL_EXTENSION_REGEX.test(domain[domain.length - 1]))
                return (-7);
        }
        else {
            if (!(dotExtension >= 2 && dotExtension <= 6))
                return (-2);
            return (-3);
        }
        return (0);
    }
}
SecurityUtils.BLACKLISTED_WORDS = [
    'admin', 'administrator', 'root', 'system', 'bot', 'cpu',
    'moderator', 'mod', 'staff', 'support', 'owner', 'master',
    'player', 'user', 'guest', 'anonymous', 'test', 'demo',
    'winner', 'loser', 'champion', 'tournament', 'game'
];
SecurityUtils.USERNAME_REGEX = /^[a-zA-Z0-9]{3,10}$/;
SecurityUtils.EMAIL_LOCAL_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/;
SecurityUtils.EMAIL_DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
SecurityUtils.EMAIL_EXTENSION_REGEX = /^[a-zA-Z]{2,6}$/;
