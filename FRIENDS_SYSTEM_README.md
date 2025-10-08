# 🎉 Système de Liste d'Amis - Guide d'Utilisation

## 📋 Vue d'ensemble

Un système de liste d'amis minimaliste a été implémenté dans votre application. Ce système permet aux utilisateurs de :
- ✅ Ajouter/retirer des amis depuis le live chat
- 👀 Voir uniquement leurs amis en ligne
- 💬 Interagir rapidement avec leurs amis depuis le profil

## 🏗️ Architecture

### Fichiers Créés

#### 1. **`src/utils/friends_manager.ts`** (Service de gestion des amis)
- Gère l'ajout/suppression d'amis
- Stocke la liste d'amis dans `localStorage` (personnel à chaque utilisateur)
- Fournit des méthodes utilitaires réutilisables
- Émet des événements pour notifier l'UI des changements

**Méthodes principales :**
```typescript
friendsManager.addFriend(username: string)      // Ajouter un ami
friendsManager.removeFriend(username: string)   // Retirer un ami
friendsManager.isFriend(username: string)       // Vérifier si ami
friendsManager.getFriends()                     // Obtenir tous les amis
friendsManager.getOnlineFriends(onlineUsers)    // Filtrer les amis en ligne
```

#### 2. **`src/components/online_friends_widget.ts`** (Widget des amis en ligne)
- Composant réutilisable pour afficher les amis en ligne
- S'intègre facilement dans n'importe quelle page
- Écoute les événements de mise à jour automatiquement
- Fournit des boutons d'action (profil, message)

### Fichiers Modifiés

#### 3. **`src/services/socket/online_users_manager.ts`**
- ✨ Ajout du bouton "+" pour ajouter des amis
- 🔄 Le bouton devient "✓" quand l'utilisateur est ami
- 📡 Émet l'événement `onlineUsersUpdated` pour notifier les autres composants

#### 4. **`src/pages/profile.ts`**
- 🎯 Initialise le widget des amis en ligne
- 📊 Affiche les amis connectés dans une sidebar
- 🔄 Met à jour automatiquement quand les amis se connectent/déconnectent

#### 5. **`index.html`**
- 📐 Restructuration du profil avec une sidebar
- 🎨 Ajout du conteneur `#profile-online-friends`
- 💪 Layout flex pour profil principal + sidebar amis

#### 6. **`src/services/socket/index.ts`**
- ➕ Ajout de la méthode `getOnlineUsers()` pour accéder aux utilisateurs en ligne

## 🎯 Fonctionnalités

### 1. Ajouter un Ami (Live Chat)

Dans le **Live Chat**, chaque utilisateur en ligne a maintenant 3 boutons :
- **`+`** : Ajouter l'utilisateur à vos amis
- **`👤`** : Voir le profil
- **`💬`** : Envoyer un message

Quand vous cliquez sur **`+`** :
- Le bouton devient **`✓`** (vert)
- L'utilisateur est ajouté à votre liste d'amis
- Il apparaîtra dans votre profil s'il est en ligne

### 2. Retirer un Ami

Si vous recliquez sur le bouton (maintenant **`✓`**) :
- L'utilisateur est retiré de votre liste d'amis
- Le bouton redevient **`+`**
- Il disparaît de votre sidebar "Online Friends"

### 3. Voir les Amis En Ligne (Profil)

Dans votre **Profil** :
- Colonne à droite : **"Online Friends"**
- Liste uniquement vos amis connectés
- Point vert 🟢 = en ligne
- 2 boutons par ami :
  - **`👤`** : Voir leur profil
  - **`💬`** : Leur envoyer un message (vous redirige vers le chat)

### 4. État Vide

Si aucun ami n'est en ligne :
- Message : "No friends online"

## 🔧 Caractéristiques Techniques

### Stockage
- **localStorage** : `user_friends_{username}`
- Format : Tableau JSON de usernames
- Personnel à chaque utilisateur (pas mutuel)

### Événements
```typescript
// Émis quand la liste d'amis change
document.dispatchEvent(new CustomEvent('friendsListUpdated', {
    detail: { friends: string[] }
}));

// Émis quand les utilisateurs en ligne changent
document.dispatchEvent(new CustomEvent('onlineUsersUpdated', {
    detail: { users: SocketUser[] }
}));
```

### Temps Réel
- ✅ Mise à jour automatique quand un ami se connecte/déconnecte
- ✅ Synchronisation avec le socket service
- ✅ Pas besoin de rafraîchir la page

## 🎨 Design

Le design réutilise les classes CSS existantes :
- `.chat-sidebar` : Pour la colonne des amis
- `.text-sm`, `.py-2`, `.px-2` : Classes utilitaires
- `.hover:bg-gray-700` : Effets de survol
- `.bg-green-500` : Point d'état en ligne

## 📝 Notes Importantes

1. **Pas de système d'acceptation/refus** : Vous pouvez ajouter n'importe qui
2. **Relation non mutuelle** : Si vous ajoutez quelqu'un, il ne vous voit pas automatiquement
3. **Uniquement les amis en ligne** : Les amis déconnectés sont invisibles
4. **Persistant** : La liste d'amis est sauvegardée même après déconnexion

## 🚀 Utilisation dans le Code

### Exemple : Vérifier si quelqu'un est ami
```typescript
import { friendsManager } from '../utils/friends_manager';

if (friendsManager.isFriend('john_doe')) {
    console.log('John is your friend!');
}
```

### Exemple : Créer un nouveau widget d'amis
```typescript
import { OnlineFriendsWidget } from '../components/online_friends_widget';

const widget = new OnlineFriendsWidget('my-container-id');
widget.updateOnlineUsers(onlineUsers);
```

## 🐛 Debugging

Pour voir la liste d'amis dans la console :
```javascript
// Dans la console du navigateur
JSON.parse(localStorage.getItem('user_friends_' + JSON.parse(sessionStorage.getItem('user')).username))
```

## ✨ Améliorations Futures Possibles

- [ ] Système de demande/acceptation d'ami
- [ ] Notifications quand un ami se connecte
- [ ] Statut personnalisé (En ligne, Absent, Ne pas déranger)
- [ ] Groupes d'amis
- [ ] Historique des interactions

---

**Date de création** : Octobre 2025  
**Status** : ✅ Fonctionnel et prêt à l'emploi
