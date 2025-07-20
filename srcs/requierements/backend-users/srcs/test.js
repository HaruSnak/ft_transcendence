const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware basique
app.use(express.json());

// Routes de test
app.get('/health', (req, res) => {
  console.log('Health check appelé');
  res.json({ 
    status: 'OK', 
    service: 'backend-users',
    timestamp: new Date().toISOString()
  });
});

app.get('/users', (req, res) => {
  console.log('Route /users appelée');
  res.json({ 
    message: 'Liste des utilisateurs',
    users: ['user1', 'user2', 'user3']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Users démarré sur le port ${PORT}`);
});