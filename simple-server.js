const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Diamond App Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/api/students', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nom: 'Dupont', prenom: 'Emma', niveau: 'CP' },
      { id: 2, nom: 'Martin', prenom: 'Lucas', niveau: 'CE1' },
      { id: 3, nom: 'Bernard', prenom: 'Léa', niveau: 'CE2' }
    ]
  });
});

app.get('/api/exercises', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, titre: 'Addition simple', niveau: 'CP', matiere: 'mathematiques' },
      { id: 2, titre: 'Lecture de mots', niveau: 'CP', matiere: 'francais' },
      { id: 3, titre: 'Fractions', niveau: 'CE2', matiere: 'mathematiques' }
    ]
  });
});

app.get('/api/competences', (req, res) => {
  res.json({
    success: true,
    data: [
      { code: 'CP.MA.N1.1', titre: 'Compter jusqu\'à 10', niveau: 'CP' },
      { code: 'CE1.FR.L1.1', titre: 'Identifier des mots', niveau: 'CE1' },
      { code: 'CE2.MA.N.FR.01', titre: 'Fractions de longueur', niveau: 'CE2' }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Diamond App Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Students API: http://localhost:${PORT}/api/students`);
  console.log(`📚 Exercises API: http://localhost:${PORT}/api/exercises`);
  console.log(`🎯 Competences API: http://localhost:${PORT}/api/competences`);
});

